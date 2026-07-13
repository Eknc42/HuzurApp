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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme/colors';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { SparkleIcon, CrescentIcon } from '../components/Icons';
import { sendChatMessage } from '../services/chatService';
import { getSurahById } from '../data/surahs';
import AnimatedText from '../components/AnimatedText';
import { getNetworkStatus } from '../services/networkService';

export default function AIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Selamün Aleyküm. Ben Huzur AI. Size İslam ve Kur\'an hakkında nasıl yardımcı olabilirim?',
      sources: [
        { type: 'info', title: 'Kur\'an-ı Kerim', citation: 'Diyanet Meali' },
        { type: 'info', title: 'Sahih Hadisler', citation: 'Kütüb-i Sitte' },
        { type: 'info', title: 'Temel İlmihal', citation: 'Diyanet İlmihali' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const question = inputValue.trim();
    setInputValue('');
    Keyboard.dismiss();

    const userMessageId = Date.now().toString();
    const newUserMsg = { id: userMessageId, role: 'user', text: question };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      if (!getNetworkStatus()) {
        throw new Error('İnternet bağlantınız yok. Lütfen kontrol edin.');
      }

      const response = await sendChatMessage(question);

      if (response && response.success) {
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: response.answer,
          sources: response.sources || [],
          isNew: true, // Used for typing animation flag
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error('Yanıt alınamadı.');
      }
    } catch (error) {
      const errorMsg = {
        id: (Date.now() + 2).toString(),
        role: 'error',
        text: error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.',
        originalQuestion: question, // For retry
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (question) => {
    setInputValue(question);
    // Remove the last error message
    setMessages(prev => prev.filter(m => m.role !== 'error'));
  };

  const handleSourcePress = (source) => {
    if (source.type === 'quran_verse') {
      try {
        // e.g., "Bakara 43" or "Ali Imran 15"
        const parts = source.citation.trim().split(' ');
        const possibleVerseId = parseInt(parts[parts.length - 1], 10);
        
        let targetSurah = null;
        let targetVerseId = null;

        if (!isNaN(possibleVerseId)) {
          targetVerseId = possibleVerseId;
          const possibleName = parts.slice(0, parts.length - 1).join(' ').trim();
          
          // Match surah by name using getSurahById (inexact match logic)
          // We'll import SURAHS directly since searchSurahs is better but might not be imported
          const { searchSurahs } = require('../data/surahs');
          const results = searchSurahs(possibleName);
          
          if (results && results.length > 0) {
            targetSurah = results[0];
          }
        }

        if (targetSurah) {
          navigation.navigate('SurahDetail', { surah: targetSurah, initialVerseId: targetVerseId });
        } else {
          navigation.navigate('Quran', { animation: 'slide_from_right' });
        }
      } catch (error) {
        navigation.navigate('Quran', { animation: 'slide_from_right' });
      }
    }
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
                <Text style={isUser ? styles.userText : styles.assistantText}>{msg.text}</Text>
              )}
            </>
          )}

          {/* Sources */}
          {msg.sources && msg.sources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <View style={styles.sourcesDivider} />
              <Text style={styles.sourcesTitle}>Kaynaklar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourcesScroll}>
                {msg.sources.map((src, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.sourceChip}
                    onPress={() => handleSourcePress(src)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sourceChipIcon}>
                      {src.type === 'quran_verse' ? '📖' : '📚'}
                    </Text>
                    <Text style={styles.sourceChipText}>{src.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
                 <Text style={styles.typingText}>Düşünüyor...</Text>
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
  sourcesScroll: {
    flexDirection: 'row',
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 8,
    gap: 4,
  },
  sourceChipIcon: {
    fontSize: 12,
  },
  sourceChipText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
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
});
