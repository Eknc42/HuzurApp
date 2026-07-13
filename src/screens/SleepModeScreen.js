// SleepModeScreen — Gece / Uyku Dinleme Modu
// AMOLED siyah, yavaş ayet geçişleri, ambient ses karışımı, uyku zamanlayıcı
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Colors, Radius } from '../theme/colors';
import { Typography } from '../theme/typography';
import { PauseIcon, PlayIcon, CrescentIcon } from '../components/Icons';
import { MoonIcon } from '../components/IconsExtra';
import ScreenContainer from '../components/ScreenContainer';
import Header, { HeaderIconButton } from '../components/Header';
import { 
  playAmbientSound, 
  stopAllAmbientSounds, 
  pauseRecitation, 
  resumeRecitation,
  stopRecitation 
} from '../services/audioService';

const { width, height } = Dimensions.get('window');

// Sample verses for sleep mode
const SLEEP_VERSES = [
  {
    arabic: 'وَمِنْ آيَاتِهِ مَنَامُكُم بِاللَّيْلِ وَالنَّهَارِ وَابْتِغَاؤُكُم مِّن فَضْلِهِ',
    tr: 'O\'nun ayetlerinden biri de gece ve gündüz uyumanız ve O\'nun lütfundan aramanızdır.',
    surah: 'Rûm · 23',
  },
  {
    arabic: 'هُوَ الَّذِي جَعَلَ لَكُمُ اللَّيْلَ لِتَسْكُنُوا فِيهِ وَالنَّهَارَ مُبْصِرًا',
    tr: 'O, geceyi dinlenesiniz diye, gündüzü de göresiniz diye yaratandır.',
    surah: 'Yûnus · 67',
  },
  {
    arabic: 'اللَّهُ لَطِيفٌ بِعِبَادِهِ',
    tr: 'Allah kullarına çok lütufkârdır.',
    surah: 'Şûrâ · 19',
  },
  {
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    tr: 'Bilin ki kalpler ancak Allah\'ı anmakla huzur bulur.',
    surah: 'Ra\'d · 28',
  },
  {
    arabic: 'وَهُوَ الَّذِي يَتَوَفَّاكُم بِاللَّيْلِ وَيَعْلَمُ مَا جَرَحْتُم بِالنَّهَارِ',
    tr: 'O, sizi geceleyin vefat ettiren ve gündüz ne yaptığınızı bilendir.',
    surah: 'En\'âm · 60',
  },
];

const TIMER_OPTIONS = [
  { label: '15 dk', minutes: 15 },
  { label: '30 dk', minutes: 30 },
  { label: '45 dk', minutes: 45 },
  { label: '1 sa', minutes: 60 },
  { label: '∞', minutes: 0 },
];

export default function SleepModeScreen({ navigation }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentVerse, setCurrentVerse] = useState(0);
  const [selectedTimer, setSelectedTimer] = useState(4); // Default: no timer
  const [showControls, setShowControls] = useState(true);
  const [ambientActive, setAmbientActive] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);

  // Animations
  const verseOpacity = useRef(new Animated.Value(1)).current;
  const verseTranslateY = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const breathScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.03)).current;

  // Auto-hide controls after 5 seconds
  useEffect(() => {
    let timeout;
    if (showControls) {
      timeout = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0.15, duration: 1500, useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 5000);
    }
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showControls]);

  // Handle ambient sounds
  useEffect(() => {
    stopAllAmbientSounds();
    if (ambientActive) {
      playAmbientSound(ambientActive, 0.3); // Play softly in sleep mode
    }
    return () => stopAllAmbientSounds();
  }, [ambientActive]);

  // Handle Timer
  useEffect(() => {
    const opt = TIMER_OPTIONS[selectedTimer];
    if (opt && opt.minutes > 0) {
      setRemainingTime(opt.minutes * 60);
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            stopRecitation();
            stopAllAmbientSounds();
            setIsPlaying(false);
            setAmbientActive(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setRemainingTime(null);
    }
  }, [selectedTimer]);

  // Breathing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathScale, {
          toValue: 1.02, duration: 4000, useNativeDriver: true,
        }),
        Animated.timing(breathScale, {
          toValue: 1, duration: 4000, useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.06, duration: 5000, useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.02, duration: 5000, useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto verse transition
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      nextVerse();
    }, 10000); // Change verse every 10 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentVerse]);

  const nextVerse = () => {
    // Fade out
    Animated.parallel([
      Animated.timing(verseOpacity, {
        toValue: 0, duration: 1500, useNativeDriver: true,
      }),
      Animated.timing(verseTranslateY, {
        toValue: -20, duration: 1500, useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentVerse(prev => (prev + 1) % SLEEP_VERSES.length);
      verseTranslateY.setValue(20);

      // Fade in
      Animated.parallel([
        Animated.timing(verseOpacity, {
          toValue: 1, duration: 2000, useNativeDriver: true,
        }),
        Animated.timing(verseTranslateY, {
          toValue: 0, duration: 2000, useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleScreenTap = () => {
    if (!showControls) {
      setShowControls(true);
      Animated.timing(controlsOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }).start();
    } else {
      if (isPlaying) {
        pauseRecitation();
        setIsPlaying(false);
      } else {
        resumeRecitation();
        setIsPlaying(true);
      }
    }
  };

  const verse = SLEEP_VERSES[currentVerse];

  return (
    <ScreenContainer gradient={true} gradientColors={['#000000', '#030604', '#010301']}>
      {/* Interactive invisible layer to detect taps */}
      <TouchableOpacity 
        style={StyleSheet.absoluteFill} 
        activeOpacity={1} 
        onPress={handleScreenTap}
      />

      {/* Header */}
      <Animated.View style={{ opacity: controlsOpacity }}>
        <Header
          title="Uyku Modu"
          onBack={() => navigation.goBack()}
        />
      </Animated.View>

      {/* Pure AMOLED black background */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Very subtle emerald glow */}
        <Animated.View style={[styles.sleepGlow, { opacity: glowOpacity }]} />
      </View>

      {/* Main verse content */}
      <View style={styles.verseArea}>
        <Animated.View
          style={[
            styles.verseContent,
            {
              opacity: verseOpacity,
              transform: [
                { translateY: verseTranslateY },
                { scale: breathScale },
              ],
            },
          ]}
        >
          {remainingTime !== null && remainingTime > 0 && (
            <Text style={styles.countdownText}>
              Uyku moduna kalan: {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
            </Text>
          )}

          <Text style={styles.verseArabic}>
            {verse.arabic}
          </Text>

          <View style={styles.verseDivider}>
            <View style={styles.verseDividerLine} />
            <CrescentIcon size={8} color="rgba(16,185,129,0.3)" />
            <View style={styles.verseDividerLine} />
          </View>

          <Text style={styles.verseTurkish}>
            {verse.tr}
          </Text>

          <Text style={styles.verseSurah}>{verse.surah}</Text>
        </Animated.View>
      </View>

      {/* Bottom controls */}
      <Animated.View style={[styles.bottomControls, { opacity: controlsOpacity }]}>
        {/* Ambient selector */}
        <View style={styles.ambientRow}>
          {['🌧️', '🌊', '🌙'].map((icon, i) => {
            const ids = ['rain', 'ocean', 'night'];
            const isActive = ambientActive === ids[i];
            return (
              <TouchableOpacity
                key={ids[i]}
                onPress={() => setAmbientActive(isActive ? null : ids[i])}
                style={[styles.ambientChip, isActive && styles.ambientChipActive]}
                activeOpacity={0.7}
              >
                <Text style={styles.ambientIcon}>{icon}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Play/Pause indicator */}
        <View style={styles.playIndicator}>
          {isPlaying ? (
            <PauseIcon size={16} color="rgba(255,255,255,0.2)" />
          ) : (
            <PlayIcon size={16} color="rgba(255,255,255,0.2)" />
          )}
        </View>

        {/* Timer */}
        <View style={styles.timerRow}>
          {TIMER_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelectedTimer(i)}
              style={[
                styles.timerChip,
                selectedTimer === i && styles.timerChipActive,
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.timerText,
                selectedTimer === i && styles.timerTextActive,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Glow
  sleepGlow: {
    position: 'absolute',
    top: height * 0.3,
    left: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: Colors.emerald,
  },
  // Verse area
  verseArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  verseContent: {
    alignItems: 'center',
  },
  countdownText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
    letterSpacing: 1,
  },
  verseArabic: {
    fontSize: 22,
    lineHeight: 44,
    color: 'rgba(232, 213, 183, 0.6)',
    textAlign: 'center',
    fontWeight: '400',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  verseDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    marginVertical: 16,
    gap: 8,
  },
  verseDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  verseTurkish: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.2)',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  verseSurah: {
    fontSize: 10,
    color: 'rgba(16, 185, 129, 0.25)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Bottom controls
  bottomControls: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ambientRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  ambientChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  ambientChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  ambientIcon: {
    fontSize: 18,
  },
  playIndicator: {
    marginBottom: 16,
  },
  timerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timerChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  timerChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  timerText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.15)',
  },
  timerTextActive: {
    color: 'rgba(16, 185, 129, 0.5)',
  },
});
