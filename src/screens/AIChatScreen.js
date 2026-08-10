import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Alert,
  Modal,
  Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme/colors';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { SparkleIcon } from '../components/Icons';
import { ClockIcon, PlusIcon, TrashIcon } from '../components/IconsExtra';
import { sendChatMessage } from '../services/chatService';
import AnimatedText from '../components/AnimatedText';
import { getNetworkStatus } from '../services/networkService';

// v2 prevents previously cached, pre-citation-validation answers from being
// shown after the live-source backend migration. Other app storage is untouched.
const SESSIONS_KEY = '@ai_chat_sessions_v2';
const MSG_KEY_PREFIX = '@ai_chat_msgs_v2_';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: 'Selamün Aleyküm. Ben Huzur AI. Size İslam ve Kur\'an hakkında nasıl yardımcı olabilirim?',
  sources: [
    { type: 'info', title: 'Kur\'an-ı Kerim', citation: 'Diyanet Meali' },
    { type: 'info', title: 'Sahih Hadisler', citation: 'Kütüb-i Sitte' },
    { type: 'info', title: 'Temel İlmihal', citation: 'Diyanet İlmihali' }
  ]
};

export default function AIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  // Chat State
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]); // [{id, title, date}]
  
  // UI State
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Düşünüyor...');
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  // Save messages whenever they change, if we have a session
  useEffect(() => {
    if (isInitialLoadDone && currentSessionId) {
      saveMessages(currentSessionId, messages);
    }
  }, [messages, isInitialLoadDone, currentSessionId]);

  // Loading animation cycle
  useEffect(() => {
    let interval;
    if (isLoading) {
      const loadingMessages = [
        'Düşünüyor...',
        'Kur\'an meali taranıyor...',
        'Sahih kaynaklar inceleniyor...',
        'Cevap derleniyor...',
        'Son rütuşlar yapılıyor...'
      ];
      let i = 0;
      setLoadingText(loadingMessages[0]);
      interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingText(loadingMessages[i]);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const loadSessions = async () => {
    try {
      const storedSessions = await AsyncStorage.getItem(SESSIONS_KEY);
      if (storedSessions) {
        const parsed = JSON.parse(storedSessions);
        setSessions(parsed);
      }
      setIsInitialLoadDone(true);
    } catch (e) {
      console.warn('Oturumlar yüklenemedi:', e);
      setIsInitialLoadDone(true);
    }
  };

  const loadChat = async (sessionId) => {
    try {
      const storedMsgs = await AsyncStorage.getItem(MSG_KEY_PREFIX + sessionId);
      if (storedMsgs) {
        const parsed = JSON.parse(storedMsgs);
        // disable animations for old messages
        const loadedMessages = parsed.map(m => ({ ...m, isNew: false }));
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
      }
    } catch (e) {
      console.warn('Mesajlar yüklenemedi:', e);
    } finally {
      setIsInitialLoadDone(true);
      setModalVisible(false);
    }
  };

  const saveMessages = async (sessionId, msgs) => {
    try {
      const msgsToSave = msgs.filter(m => m.role !== 'error');
      await AsyncStorage.setItem(MSG_KEY_PREFIX + sessionId, JSON.stringify(msgsToSave));
    } catch (e) {
      console.warn('Mesajlar kaydedilemedi:', e);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setModalVisible(false);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const question = inputValue.trim();
    setInputValue('');
    Keyboard.dismiss();

    const userMessageId = Date.now().toString();
    const newUserMsg = { id: userMessageId, role: 'user', text: question };
    
    // Check if this is the first real message in a new session
    let activeSessionId = currentSessionId;
    let newMessages = [...messages, newUserMsg];
    
    setMessages(newMessages);
    setIsLoading(true);

    if (!activeSessionId) {
      // Create new session
      activeSessionId = 'session_' + Date.now();
      const newSession = {
        id: activeSessionId,
        title: question.substring(0, 30) + (question.length > 30 ? '...' : ''),
        date: new Date().toISOString()
      };
      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      setCurrentSessionId(activeSessionId);
      
      try {
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
      } catch (e) {}
    }

    try {
      if (!getNetworkStatus()) {
        throw new Error('İnternet bağlantınız yok. Lütfen kontrol edin.');
      }

      const history = messages
        .filter(message => message.role === 'user' || message.role === 'assistant')
        .slice(-6)
        .map(message => ({
          role: message.role,
          content: message.text,
        }));
      const response = await sendChatMessage(question, { history });

      if (response && response.success) {
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: response.answer,
          sources: response.sources || [],
          isNew: true,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(response?.error || 'Yanıt alınamadı.');
      }
    } catch (error) {
      const errorMsg = {
        id: (Date.now() + 2).toString(),
        role: 'error',
        text: error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.',
        originalQuestion: question,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (sessionId) => {
    Alert.alert(
      "Sohbeti Sil",
      "Bu sohbet kalıcı olarak silinecek. Onaylıyor musunuz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: async () => {
            const updatedSessions = sessions.filter(s => s.id !== sessionId);
            setSessions(updatedSessions);
            await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
            await AsyncStorage.removeItem(MSG_KEY_PREFIX + sessionId);
            
            if (currentSessionId === sessionId) {
              startNewChat();
            }
          }
        }
      ]
    );
  };

  const handleRetry = (question) => {
    setInputValue(question);
    setMessages(prev => prev.filter(m => m.role !== 'error'));
  };

  const markMessageAsOld = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isNew: false } : m));
  };

  const renderMessage = (msg) => {
    const isUser = msg.role === 'user';
    const isError = msg.role === 'error';

    return (
      <View key={msg.id} style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
        {!isUser && !isError && (
          <View style={styles.assistantAvatar}>
            <SparkleIcon size={14} color={Colors.emerald} />
          </View>
        )}

        <View style={[
          styles.messageBubble, 
          isUser ? styles.userBubble : isError ? styles.errorBubble : styles.assistantBubble
        ]}>
          {isError ? (
             <View>
               <Text style={styles.errorText}>{msg.text}</Text>
               <TouchableOpacity onPress={() => handleRetry(msg.originalQuestion)} style={styles.retryButton}>
                 <Text style={styles.retryText}>Tekrar Dene</Text>
               </TouchableOpacity>
             </View>
          ) : (
            <>
              {msg.role === 'assistant' && msg.isNew ? (
                <AnimatedText 
                  text={msg.text} 
                  style={styles.assistantText} 
                  delay={15} 
                  onComplete={() => markMessageAsOld(msg.id)} 
                />
              ) : (
                <View>
                  {msg.text.split('[SEPARATOR]').map((part, index, arr) => (
                    <React.Fragment key={index}>
                      <Text style={isUser ? styles.userText : styles.assistantText}>{part.trim()}</Text>
                      {index < arr.length - 1 && (
                        <View style={{ height: 1, backgroundColor: '#10b981', marginVertical: 14, width: '100%' }} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              )}
            </>
          )}

          {msg.sources && msg.sources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <View style={styles.sourcesDivider} />
              <Text style={styles.sourcesTitle}>Kaynaklar</Text>
              <View style={styles.sourcesList}>
                {msg.sources.map((src, idx) => (
                  <Text key={idx} style={styles.sourceTextItem}>
                    {src.type === 'quran_verse' ? '📖' : '📚'} {src.title}{src.citation ? ` - ${src.citation}` : ''}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer gradient={true}>
      <Header
        title="AI Asistan"
        onBack={() => navigation.goBack()}
        centerContent={
          <View style={styles.headerCenter}>
            <SparkleIcon size={18} color={Colors.emerald} />
            <Text style={styles.headerTitle}>AI Asistan</Text>
          </View>
        }
        rightActions={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.headerBtn}>
              <ClockIcon size={22} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={startNewChat} style={styles.headerBtn}>
              <PlusIcon size={22} color={Colors.emerald} />
            </TouchableOpacity>
          </View>
        }
      />

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessage)}

          {isLoading && (
            <View style={[styles.messageRow, styles.messageRowAssistant]}>
              <View style={styles.assistantAvatar}>
                <SparkleIcon size={14} color={Colors.emerald} />
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
                 <ActivityIndicator size="small" color={Colors.emerald} />
                 <Text style={styles.typingText}>{loadingText}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <LinearGradient
            colors={['rgba(20,20,20,0.95)', 'rgba(10,10,10,0.98)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.inputBorder} />
          
          <TextInput
            style={styles.textInput}
            placeholder="İslam, Kur'an veya Namaz hakkında sorun..."
            placeholderTextColor={Colors.textMuted}
            value={inputValue}
            onChangeText={setInputValue}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputValue.trim() || isLoading) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputValue.trim() || isLoading}
          >
            <SparkleIcon size={16} color={(!inputValue.trim() || isLoading) ? Colors.textMuted : Colors.emeraldBright} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sohbet Geçmişi</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <TouchableOpacity style={styles.newChatModalBtn} onPress={startNewChat}>
                <PlusIcon size={20} color={Colors.emerald} />
                <Text style={styles.newChatModalText}>Yeni Sohbet Başlat</Text>
              </TouchableOpacity>

              {sessions.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>Henüz kayıtlı bir sohbetiniz yok.</Text>
                </View>
              ) : (
                sessions.map(session => {
                  const isActive = currentSessionId === session.id;
                  return (
                    <TouchableOpacity
                      key={session.id}
                      style={[styles.sessionItem, isActive && styles.sessionItemActive]}
                      onPress={() => loadChat(session.id)}
                    >
                      <View style={styles.sessionItemLeft}>
                        <Text style={[styles.sessionTitle, isActive && styles.sessionTitleActive]} numberOfLines={1}>
                          {session.title}
                        </Text>
                        <Text style={styles.sessionDate}>
                          {new Date(session.date).toLocaleDateString('tr-TR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      
                      <TouchableOpacity onPress={() => deleteSession(session.id)} style={styles.deleteSessionBtn}>
                        <TrashIcon size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerBtn: {
    padding: 6,
  },
  keyboardView: {
    flex: 1,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.emeraldMuted,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: Spacing.base,
    borderRadius: Radius.xl,
    ...Shadows.sm,
  },
  userBubble: {
    backgroundColor: Colors.emeraldDeep,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderBottomLeftRadius: 4,
  },
  userText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
  },
  assistantText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '600',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  typingText: {
    fontSize: 13,
    color: Colors.emerald,
    fontWeight: '500',
  },
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 12,
  },
  sourcesDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  sourcesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sourcesList: {
    flexDirection: 'column',
    gap: 6,
  },
  sourceTextItem: {
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bgSecondary,
  },
  inputBorder: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.bgSurface,
    borderColor: Colors.borderSubtle,
  },
  
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#0a100d',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    minHeight: '60%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.md,
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalScroll: {
    padding: Spacing.xl,
    paddingTop: 16,
  },
  newChatModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 8,
  },
  newChatModalText: {
    color: Colors.emerald,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  sessionItemActive: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    marginLeft: -12,
    marginRight: -12,
  },
  sessionItemLeft: {
    flex: 1,
    paddingRight: 16,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  sessionTitleActive: {
    color: Colors.emerald,
    fontWeight: '700',
  },
  sessionDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  deleteSessionBtn: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: Radius.md,
  }
});
