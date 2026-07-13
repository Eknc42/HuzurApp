// PremiumPlayerScreen — Sinematik Tam Ekran Oynatıcı
// Pulsing glow, floating particles, synced verse, ambient controls
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import {
  PlayIcon, PauseIcon, CrescentIcon,
} from '../components/Icons';
import { HeadphonesIcon, MoonIcon } from '../components/IconsExtra';
import { IslamicStar } from '../components/IslamicPattern';
import ScreenContainer from '../components/ScreenContainer';
import Header, { HeaderIconButton } from '../components/Header';
import {
  playRecitation,
  playSurahFromServerWithVerseTracking,
  playSurahFromServer,
  stopRecitation,
  pauseRecitation,
  resumeRecitation,
  stopAllSounds,
  subscribeToVerseChanges,
  subscribeToAudioControlActions,
  AUDIO_CONTROL_ACTIONS,
} from '../services/audioService';
import { getSurahVerses } from '../data/quranText';
import { getSurahById } from '../data/surahs';
import { useFocusEffect } from '@react-navigation/native';
import { getPendingReciterSelection } from './ReciterSelectScreen';
import { getLastReciter, saveLastReciter } from '../services/mp3quranApi';

const { width, height } = Dimensions.get('window');

// Floating particle
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

export default function PremiumPlayerScreen({ navigation, route }) {
  const { surah: initialSurah, verse, reciter: initialReciter } = route.params || {};
  const [surah, setSurah] = useState(initialSurah);
  const [currentReciter, setCurrentReciter] = useState(initialReciter || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.35);
  const [speed, setSpeed] = useState(1);
  const [repeatMode, setRepeatMode] = useState(false);

  // Verse tracking
  const [verses, setVerses] = useState([]);
  const [currentVerse, setCurrentVerse] = useState(verse || null);
  const verseUnsubscribeRef = useRef(null);
  const isPausedRef = useRef(false);
  const autoPlayHandledRef = useRef(false);
  const surahRef = useRef(initialSurah);
  const isPlayingRef = useRef(false);

  // Load last selected reciter on mount if not provided via props
  useEffect(() => {
    if (!currentReciter) {
      getLastReciter().then(last => {
        if (last) setCurrentReciter(last);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick up reciter selection when returning from ReciterSelectScreen
  useFocusEffect(
    useCallback(() => {
      const selected = getPendingReciterSelection();
      if (selected) {
        setCurrentReciter(selected);
        saveLastReciter(selected);
        stopRecitation();
        setIsPlaying(false);
        isPausedRef.current = false;
      }
    }, [])
  );

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.08)).current;
  const verseScale = useRef(new Animated.Value(0.96)).current;
  const progressAnim = useRef(new Animated.Value(0.35)).current;

  // Ref'leri güncel tut
  useEffect(() => { surahRef.current = surah; }, [surah]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Fetch surah verses for tracking
  useEffect(() => {
    if (!surah) return;
    
    autoPlayHandledRef.current = false;
    setVerses([]);
    
    getSurahVerses(surah.id)
      .then(v => {
        setVerses(v);
        // Otomatik oynatmayı tetikle (ilk açılışta veya sure değiştiğinde)
        if (!autoPlayHandledRef.current) {
           autoPlayHandledRef.current = true;
           // Sadece playSurah çağıracağız, togglePlay içindeki mantığı ayıracağız.
        }
      })
      .catch(e => console.warn('Surah verses load error:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah?.id]);

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
        Animated.spring(verseScale, {
          toValue: 1, tension: 30, friction: 8, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.2, duration: 3000, useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.08, duration: 3000, useNativeDriver: true,
        }),
      ])
    ).start();

    // Cleanup audio on unmount
    return () => {
      stopAllSounds();
      if (verseUnsubscribeRef.current) {
        verseUnsubscribeRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const startPlayback = useCallback(() => {
    if (!surah || !verses || verses.length === 0) return;
    
    const callbacks = {
      onLoaded: (info) => console.log('Ses yüklendi, süre:', info.duration),
      onEnd: () => {
        setIsPlaying(false);
        isPausedRef.current = false;
        goToNextSurah();
      },
      onError: (err) => {
        console.warn('Ses hatası:', err);
        setIsPlaying(false);
        isPausedRef.current = false;
      },
    };

    if (verseUnsubscribeRef.current) {
      verseUnsubscribeRef.current();
    }
    verseUnsubscribeRef.current = subscribeToVerseChanges((verseInfo) => {
      const verseObj = verses.find(v => v.id === verseInfo.verseId);
      if (verseObj) setCurrentVerse(verseObj);
    });

    if (currentReciter?.server) {
      playSurahFromServerWithVerseTracking(
        currentReciter.server,
        surah.id,
        verses,
        callbacks,
        currentReciter.qdcId || null
      );
    } else {
      const verseId = currentVerse?.id || 1;
      const reciterId = currentReciter?.audioId || 'ar.abdurrahmaansudais';
      playRecitation(surah.id, verseId, reciterId, callbacks);
    }
    
    isPausedRef.current = false;
    setIsPlaying(true);
  }, [surah, verses, currentReciter, currentVerse]);

  // Otomatik başlatma (verses geldiğinde)
  useEffect(() => {
    if (verses.length > 0 && autoPlayHandledRef.current) {
       startPlayback();
    }
  }, [verses, startPlayback]);

  const togglePlay = () => {
    if (isPlaying && !isPausedRef.current) {
      pauseRecitation();
      isPausedRef.current = true;
      setIsPlaying(true); 
    } else if (isPausedRef.current) {
      resumeRecitation();
      isPausedRef.current = false;
      setIsPlaying(true);
    } else {
      startPlayback();
    }
  };

  const goToNextSurah = useCallback(() => {
    const currentSurah = surahRef.current;
    const nextSurahId = currentSurah.id < 114 ? currentSurah.id + 1 : 1;
    const nextSurah = getSurahById(nextSurahId);
    stopRecitation();
    setIsPlaying(false);
    isPausedRef.current = false;
    setCurrentVerse(null);
    setSurah(nextSurah);
  }, []);

  const goToPreviousSurah = useCallback(() => {
    const currentSurah = surahRef.current;
    const prevSurahId = currentSurah.id > 1 ? currentSurah.id - 1 : 114;
    const prevSurah = getSurahById(prevSurahId);
    stopRecitation();
    setIsPlaying(false);
    isPausedRef.current = false;
    setCurrentVerse(null);
    setSurah(prevSurah);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAudioControlActions((event) => {
      if (event?.action === AUDIO_CONTROL_ACTIONS.STOP) {
        stopRecitation();
        setIsPlaying(false);
        isPausedRef.current = false;
      }
      if (event?.action === AUDIO_CONTROL_ACTIONS.NEXT) {
        goToNextSurah();
      }
      if (event?.action === AUDIO_CONTROL_ACTIONS.PREVIOUS) {
        goToPreviousSurah();
      }
      if (event?.action === AUDIO_CONTROL_ACTIONS.PAUSE) {
        if (!isPausedRef.current) {
          pauseRecitation();
          isPausedRef.current = true;
          setIsPlaying(true);
        }
      }
      if (event?.action === AUDIO_CONTROL_ACTIONS.PLAY) {
        if (isPausedRef.current) {
          resumeRecitation();
          isPausedRef.current = false;
          setIsPlaying(true);
        } else if (!isPlayingRef.current) {
          startPlayback();
        }
      }
    });
    return unsubscribe;
  }, [goToNextSurah, goToPreviousSurah, startPlayback]);
  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(speed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
  };

  const sampleVerse = currentVerse || verse || {
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    tr: 'Rahmân ve Rahîm olan Allah\'ın adıyla.',
  };
  const surahName = surah?.nameTr || 'Fatiha';
  const surahArabic = surah?.name || 'الفاتحة';
  const reciterName = currentReciter?.name || currentReciter?.nameTr || 'Abdülbasit Abdüssamed';

  // Particles
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 1200,
    x: Math.random() * width,
  }));

  return (
    <ScreenContainer>
      {/* Dynamic Background */}
      <LinearGradient
        colors={['#000000', '#020a06', '#000000', '#020503']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Floating particles */}
      {particles.map(p => (
        <FloatingParticle key={p.id} delay={p.delay} x={p.x} color={Colors.emerald} />
      ))}

      {/* Large glow orb */}
      <Animated.View style={[styles.glowOrb, { opacity: glowPulse }]} />

      {/* Background decoration */}
      <View style={styles.bgDecoration}>
        <IslamicStar size={200} color={Colors.emeraldBorder} opacity={0.02} />
      </View>

      <Header title="Şimdi Çalıyor" onBack={() => navigation.goBack()} onRightAction={() => navigation.navigate('SleepMode')} rightIcon={<MoonIcon size={18} color={Colors.textMuted} />} />

      {/* Main content */}
      <Animated.View
        style={[
          styles.mainContent,
          { opacity: contentOpacity, transform: [{ scale: verseScale }] },
        ]}
      >
        {/* Surah info */}
        <View style={styles.surahInfo}>
          <Text style={styles.surahArabicName}>{surahArabic}</Text>
          <Text style={styles.surahTurkishName}>{surahName} Suresi</Text>
        </View>

        {/* Current verse */}
        <View style={styles.verseContainer}>
          <Text style={styles.verseArabic}>
            {sampleVerse.arabic}
          </Text>

          <View style={styles.verseDivider}>
            <View style={styles.verseDividerLine} />
            <CrescentIcon size={12} color={Colors.emerald} />
            <View style={styles.verseDividerLine} />
          </View>

          <Text style={styles.verseTurkish}>
            {sampleVerse.tr}
          </Text>
        </View>

        {/* Reciter info */}
        <TouchableOpacity
          style={styles.reciterBar}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ReciterSelect', {
            currentReciterId: currentReciter?.id,
            surahId: surah?.id,
          })}
        >
          <HeadphonesIcon size={14} color={Colors.emerald} />
          <Text style={styles.reciterName}>{reciterName}</Text>
          <Text style={styles.reciterChange}>Değiştir</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
        </View>
        <View style={styles.progressTimes}>
          <Text style={styles.progressTime}>1:24</Text>
          <Text style={styles.progressTime}>4:12</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Speed */}
        <TouchableOpacity onPress={cycleSpeed} style={styles.secondaryControl} activeOpacity={0.7}>
          <Text style={styles.speedText}>{speed}x</Text>
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
            {isPlaying && !isPausedRef.current ? (
              <PauseIcon size={24} color={Colors.white} />
            ) : (
              <PlayIcon size={24} color={Colors.white} />
            )}
          </View>
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity onPress={goToNextSurah} style={styles.skipButton} activeOpacity={0.7}>
          <Text style={styles.skipText}>⟩⟩</Text>
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity
          onPress={() => setRepeatMode(!repeatMode)}
          style={styles.secondaryControl}
          activeOpacity={0.7}
        >
          <Text style={[styles.repeatText, repeatMode && { color: Colors.emerald }]}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomAction} activeOpacity={0.7}>
          <Text style={styles.bottomActionText}>⏱ Uyku Zamanlayıcı</Text>
        </TouchableOpacity>
        <View style={styles.bottomDot} />
        <TouchableOpacity
          style={styles.bottomAction}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AmbientMixer')}
        >
          <Text style={styles.bottomActionText}>🎵 Ambient Sesler</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Particles
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  // Glow orb
  glowOrb: {
    position: 'absolute',
    top: height * 0.25,
    left: width * 0.15,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: Colors.emerald,
  },
  bgDecoration: {
    position: 'absolute',
    top: height * 0.15,
    right: -60,
    opacity: 0.5,
  },

  // Main content
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  surahInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  surahArabicName: {
    fontSize: 32,
    color: Colors.textArabic,
    fontWeight: '400',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  surahTurkishName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },

  verseContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  verseArabic: {
    ...Typography.arabicLarge,
    fontSize: 26,
    lineHeight: 52,
    marginBottom: 16,
  },
  verseDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginVertical: 12,
    gap: 10,
  },
  verseDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.emeraldBorder,
  },
  verseTurkish: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // Reciter bar
  reciterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  reciterName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reciterChange: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.emerald,
    marginLeft: 4,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  progressTrack: {
    height: 3,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.emerald,
    marginLeft: -5,
    ...Shadows.glowEmerald,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  secondaryControl: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  skipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 22,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  playButton: {
    ...Shadows.glowEmerald,
  },
  playButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.emeraldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatText: {
    fontSize: 20,
    color: Colors.textMuted,
    fontWeight: '500',
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
});
