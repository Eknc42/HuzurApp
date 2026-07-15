// SimplePlayerScreen — Kapsamlı Dinleme Modu
// Ayet içermez, büyük albüm kapağı/ses dalgası animasyonu ve tam mp3quran kütüphanesi
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import {
  PlayIcon, PauseIcon, CrescentIcon,
} from '../components/Icons';
import { HeadphonesIcon, ChevronRightIcon, MoonIcon, MixerIcon, ShuffleIcon } from '../components/IconsExtra';
import { IslamicStar } from '../components/IslamicPattern';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { usePremium } from '../contexts/PremiumContext';
import { SURAHS } from '../data/surahs';
import {
  playSurahFromServer,
  stopRecitation,
  pauseRecitation,
  resumeRecitation,
  subscribeToAudioControlActions,
  AUDIO_CONTROL_ACTIONS,
  getRecitationCurrentTime,
  getRecitationDuration,
  seekRecitation,
} from '../services/audioService';

const { width, height } = Dimensions.get('window');

// Floating particle for atmosphere
function FloatingParticle({ delay, x, color }) {
  const translateY = useRef(new Animated.Value(height * 0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(height * 0.8);
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: height * 0.1,
            duration: 8000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.3 + Math.random() * 0.3,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 6000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          transform: [{ translateY }],
          opacity,
          backgroundColor: color || Colors.emerald,
        },
      ]}
    />
  );
}

export default function SimplePlayerScreen({ navigation, route }) {
  const { isPremium } = usePremium();
  const { reciter, surahId: initialSurahId } = route.params;
  const [surahId, setSurahId] = useState(initialSurahId || 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [repeatMode, setRepeatMode] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isSurahModalVisible, setSurahModalVisible] = useState(false);
  
  const isShuffleRef = useRef(isShuffle);
  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);
  
  const [audioProgress, setAudioProgress] = useState('0:00');
  const [audioDuration, setAudioDuration] = useState('0:00');
  const [progressValue, setProgressValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const progressBarWidth = useRef(0);

  const surah = SURAHS.find(s => s.id === surahId);
  const isPlayingRef = useRef(false);
  const surahIdRef = useRef(surahId);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.15)).current;
  const coverScale = useRef(new Animated.Value(0.9)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { surahIdRef.current = surahId; }, [surahId]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    // Fade in
    Animated.timing(headerOpacity, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();
    
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1, duration: 700, useNativeDriver: true,
        }),
        Animated.spring(coverScale, {
          toValue: 1, tension: 30, friction: 8, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.3, duration: 3000, useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.15, duration: 3000, useNativeDriver: true,
        }),
      ])
    ).start();

    // Wave animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1, duration: 1500, useNativeDriver: true,
      })
    ).start();

    // Otomatik oynat
    startPlayback(surahId);

    return () => {
      stopRecitation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update progress
  useEffect(() => {
    let interval;
    if (isPlaying && !isPaused && !isSeeking) {
      interval = setInterval(async () => {
        const current = await getRecitationCurrentTime();
        const dur = getRecitationDuration();
        if (dur > 0) {
           setProgressValue(current / dur);
           const m = Math.floor(current / 60);
           const s = Math.floor(current % 60);
           setAudioProgress(`${m}:${String(s).padStart(2, '0')}`);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isSeeking]);

  // Handle external media controls
  useEffect(() => {
    const unsub = subscribeToAudioControlActions((event) => {
      const { action } = event;
      if (action === AUDIO_CONTROL_ACTIONS.PAUSE) {
        pauseRecitation();
        setIsPaused(true);
      } else if (action === AUDIO_CONTROL_ACTIONS.PLAY) {
        resumeRecitation();
        setIsPaused(false);
        setIsPlaying(true);
      } else if (action === AUDIO_CONTROL_ACTIONS.STOP) {
        stopRecitation();
        setIsPlaying(false);
        setIsPaused(false);
      } else if (action === AUDIO_CONTROL_ACTIONS.NEXT) {
        goToNextSurah();
      } else if (action === AUDIO_CONTROL_ACTIONS.PREVIOUS) {
        goToPreviousSurah();
      }
    });
    return unsub;
  }, []);

  const startPlayback = (id) => {
    stopRecitation();
    setIsPlaying(false);
    setIsPaused(false);
    setAudioProgress('0:00');
    setProgressValue(0);

    const callbacks = {
      onLoaded: ({ duration }) => {
        const m = Math.floor(duration / 60);
        const s = Math.floor(duration % 60);
        setAudioDuration(`${m}:${String(s).padStart(2, '0')}`);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
        setAudioProgress('0:00');
        if (isShuffleRef.current) {
          const nextId = Math.floor(Math.random() * 114) + 1;
          setSurahId(nextId);
          startPlayback(nextId);
        } else if (surahIdRef.current < 114) {
          const nextId = surahIdRef.current + 1;
          setSurahId(nextId);
          startPlayback(nextId);
        }
      },
      onError: (err) => {
        console.warn('Ses hatası:', err);
        setIsPlaying(false);
        setIsPaused(false);
      },
    };

    playSurahFromServer(reciter.server, id, callbacks);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const togglePlay = () => {
    if (isPlaying && !isPaused) {
      pauseRecitation();
      setIsPaused(true);
    } else if (isPaused) {
      resumeRecitation();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      startPlayback(surahId);
    }
  };

  const goToNextSurah = () => {
    let nextSurahId;
    if (isShuffleRef.current) {
      nextSurahId = Math.floor(Math.random() * 114) + 1;
    } else {
      const currentSurahId = surahIdRef.current;
      nextSurahId = currentSurahId < 114 ? currentSurahId + 1 : 1;
    }
    setSurahId(nextSurahId);
    startPlayback(nextSurahId);
  };

  const goToPreviousSurah = () => {
    const currentSurahId = surahIdRef.current;
    const prevSurahId = currentSurahId > 1 ? currentSurahId - 1 : 114;
    setSurahId(prevSurahId);
    startPlayback(prevSurahId);
  };

  const handleSeekEvent = (evt, isRelease = false) => {
    const locX = evt.nativeEvent.locationX;
    const width = progressBarWidth.current;
    if (width > 0) {
      const percentage = Math.max(0, Math.min(1, locX / width));
      setProgressValue(percentage);
      const dur = getRecitationDuration();
      
      const current = percentage * dur;
      const m = Math.floor(current / 60);
      const s = Math.floor(current % 60);
      setAudioProgress(`${m}:${String(s).padStart(2, '0')}`);

      if (isRelease) {
        seekRecitation(current);
        setIsSeeking(false);
      }
    }
  };

  // Particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 800,
    x: Math.random() * width,
  }));

  // Waveform heights
  const generateWaveform = () => {
    return Array.from({ length: 40 }).map((_, i) => {
      const isCenter = i > 15 && i < 25;
      const baseHeight = isCenter ? 20 + Math.random() * 40 : 10 + Math.random() * 20;
      return (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            { height: baseHeight },
            (isPlaying && !isPaused) && {
              transform: [{
                scaleY: waveAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1 + Math.random(), 1]
                })
              }]
            }
          ]}
        />
      );
    });
  };

  return (
    <ScreenContainer>
      {/* Dynamic Background */}
      <LinearGradient
        colors={['#000000', '#030d08', '#020a06', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Floating particles */}
      {particles.map(p => (
        <FloatingParticle key={p.id} delay={p.delay} x={p.x} color={Colors.emeraldBright} />
      ))}

      {/* Removed glow orb because it creates awkward proportions */}

      {/* Background decoration */}
      <View style={styles.bgDecoration}>
        <IslamicStar size={280} color={Colors.emeraldBorder} opacity={0.03} />
      </View>

      <Header 
        title="Kapsamlı Dinleme" 
        onBack={() => navigation.goBack()} 
        rightActions={
          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={() => {
              if (isPremium) navigation.navigate('SleepMode');
              else navigation.navigate('Paywall');
            }}
          >
            <MoonIcon size={24} color={Colors.textMuted} />
          </TouchableOpacity>
        }
      />

      {/* Main content */}
      <Animated.View
        style={[
          styles.mainContent,
          { opacity: contentOpacity },
        ]}
      >
        {/* Album Cover / Artwork */}
        <Animated.View style={[styles.coverContainer, { transform: [{ scale: coverScale }] }]}>
          <View style={styles.coverInner}>
            {reciter.photo ? (
              <Image source={{ uri: reciter.photo }} style={styles.coverImage} />
            ) : (
              <LinearGradient
                colors={['#0a1410', '#050d0a']}
                style={styles.coverPlaceholder}
              >
                <HeadphonesIcon size={80} color={Colors.emerald} />
              </LinearGradient>
            )}
            
            <View style={styles.waveformOverlay}>
              {generateWaveform()}
            </View>
          </View>
        </Animated.View>

        {/* Info Area */}
        <View style={styles.infoArea}>
          <Text style={styles.surahNameArabic}>{surah?.name}</Text>
          <TouchableOpacity 
            style={styles.surahSelector} 
            activeOpacity={0.7}
            onPress={() => setSurahModalVisible(true)}
          >
            <Text style={styles.surahNameTr}>{surah?.nameTr} Suresi</Text>
            <ChevronRightIcon size={16} color={Colors.emerald} />
          </TouchableOpacity>
          <Text style={styles.reciterName}>{reciter.name}</Text>
        </View>

      </Animated.View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View 
          style={styles.progressTrackArea}
          onLayout={(e) => {
            progressBarWidth.current = e.nativeEvent.layout.width;
          }}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            setIsSeeking(true);
            handleSeekEvent(e, false);
          }}
          onResponderMove={(e) => handleSeekEvent(e, false)}
          onResponderRelease={(e) => handleSeekEvent(e, true)}
        >
          <View style={styles.progressTrack} pointerEvents="none">
            <View style={[styles.progressFill, { width: `${progressValue * 100}%` }]} />
            <View style={[styles.progressThumb, { left: `${progressValue * 100}%` }]} />
          </View>
        </View>
        <View style={styles.progressTimes}>
          <Text style={styles.progressTime}>{audioProgress}</Text>
          <Text style={styles.progressTime}>{audioDuration}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Shuffle */}
        <TouchableOpacity 
          onPress={() => setIsShuffle(!isShuffle)} 
          style={[styles.actionButton, isShuffle && { backgroundColor: Colors.emerald }]} 
          activeOpacity={0.7}
        >
          <ShuffleIcon size={24} color={isShuffle ? Colors.white : Colors.emerald} />
        </TouchableOpacity>

        {/* Previous */}
        <TouchableOpacity onPress={goToPreviousSurah} style={styles.skipButton} activeOpacity={0.7}>
          <Text style={styles.skipText}>⟨⟨</Text>
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity
          onPress={togglePlay}
          activeOpacity={0.7}
          style={styles.playButton}
        >
          <View style={styles.playButtonInner}>
            {isPlaying && !isPaused ? (
              <PauseIcon size={28} color={Colors.white} />
            ) : (
              <PlayIcon size={28} color={Colors.white} />
            )}
          </View>
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity onPress={goToNextSurah} style={styles.skipButton} activeOpacity={0.7}>
          <Text style={styles.skipText}>⟩⟩</Text>
        </TouchableOpacity>

        {/* Ambient Sounds */}
        <TouchableOpacity 
          onPress={() => {
            if (isPremium) navigation.navigate('AmbientMixer');
            else navigation.navigate('Paywall');
          }} 
          style={styles.actionButton} 
          activeOpacity={0.7}
        >
          <MixerIcon size={24} color={Colors.emerald} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* Surah Selection Modal */}
      <Modal
        visible={isSurahModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSurahModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sure Seçin</Text>
              <TouchableOpacity onPress={() => setSurahModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={SURAHS}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, surahId === item.id && styles.modalItemActive]}
                  onPress={() => {
                    setSurahModalVisible(false);
                    setSurahId(item.id);
                    startPlayback(item.id);
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <View style={styles.modalItemBadge}>
                      <Text style={styles.modalItemNumber}>{item.id}</Text>
                    </View>
                    <View>
                      <Text style={styles.modalItemName}>{item.nameTr}</Text>
                      <Text style={styles.modalItemDesc}>{item.meaning}</Text>
                    </View>
                  </View>
                  <Text style={styles.modalItemArabic}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Particles & Background
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  glowOrb: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: Colors.emerald,
  },
  bgDecoration: {
    position: 'absolute',
    top: height * 0.1,
    right: -80,
    opacity: 0.5,
  },

  // Main content
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  coverContainer: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: 32,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...Shadows.xl,
    marginBottom: 40,
  },
  coverInner: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#050a08',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  waveBar: {
    width: 4,
    backgroundColor: Colors.emeraldBright,
    borderRadius: 2,
    opacity: 0.8,
  },
  
  infoArea: {
    alignItems: 'center',
  },
  surahNameArabic: {
    fontSize: 36,
    color: Colors.textArabic,
    fontWeight: '400',
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  surahSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.emeraldMuted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    gap: 8,
    marginBottom: 12,
  },
  surahNameTr: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 0.5,
  },
  reciterName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textMuted,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  progressTrackArea: {
    height: 30,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.emerald,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.emeraldBright,
    marginLeft: -6,
    ...Shadows.glowEmerald,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  playButton: {
    ...Shadows.glowEmerald,
  },
  playButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.emeraldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
    gap: 16,
  },
  bottomAction: {},
  bottomActionText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  bottomDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius: Radius.xxxl,
    borderTopRightRadius: Radius.xxxl,
    height: height * 0.7,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalCloseText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalItemActive: {
    backgroundColor: Colors.emeraldMuted,
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  modalItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  modalItemDesc: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  modalItemArabic: {
    fontSize: 18,
    color: Colors.textArabic,
  },
});
