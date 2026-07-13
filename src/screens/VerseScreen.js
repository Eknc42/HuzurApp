// VerseScreen — Immersive Quran verse display
// Large Arabic typography, translation, audio player, action buttons
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import {
  BackIcon, BookmarkIcon, HeartIcon, ShareIcon, SparkleIcon,
} from '../components/Icons';
import { CornerAccent } from '../components/IslamicPattern';
import AudioPlayer from '../components/AudioPlayer';
import ActionButton from '../components/ActionButton';
import BottomNavBar from '../components/BottomNavBar';
import useFavorite from '../hooks/useFavorite';
import { useToast } from '../contexts/ToastContext';

const { height } = Dimensions.get('window');

export default function VerseScreen({ route, navigation }) {
  const { mood, verse, fromFavorites } = route.params;
  const { saved, toggle: onToggleFavorite } = useFavorite(verse.id, mood.id, verse);
  const { showToast } = useToast();

  const handleToggleFavorite = async () => {
    await onToggleFavorite();
    showToast(saved ? 'Kayıtlardan kaldırıldı' : 'Kayıtlara eklendi', saved ? 'info' : 'success');
  };

  // Animations
  const arabicOpacity = useRef(new Animated.Value(0)).current;
  const arabicScale = useRef(new Animated.Value(0.95)).current;
  const translationOpacity = useRef(new Animated.Value(0)).current;
  const translationTranslateY = useRef(new Animated.Value(20)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const controlsTranslateY = useRef(new Animated.Value(30)).current;
  const decorOpacity = useRef(new Animated.Value(0)).current;

  // Glow pulse
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Arabic text entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(arabicOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(arabicScale, {
          toValue: 1,
          tension: 30,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      // Translation
      Animated.parallel([
        Animated.timing(translationOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(translationTranslateY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      // Controls
      Animated.parallel([
        Animated.timing(controlsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(controlsTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Decorations
    Animated.timing(decorOpacity, {
      toValue: 1,
      duration: 1500,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.6,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- giriş animasyonları yalnızca ilk yüklemede
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Background — layered with mood tint */}
      <LinearGradient
        colors={['#000000', `${mood.color}0a`, '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 0.85 }}
      />

      {/* Soft top halo with mood color */}
      <View pointerEvents="none" style={styles.topHalo}>
        <LinearGradient
          colors={[`${mood.color}18`, `${mood.color}00`]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Corner Decorations */}
      <Animated.View style={[styles.cornerTL, { opacity: decorOpacity }]}>
        <CornerAccent size={36} color={`${mood.color}40`} opacity={0.3} rotation={0} />
      </Animated.View>
      <Animated.View style={[styles.cornerTR, { opacity: decorOpacity }]}>
        <CornerAccent size={36} color={`${mood.color}40`} opacity={0.3} rotation={90} />
      </Animated.View>
      <Animated.View style={[styles.cornerBL, { opacity: decorOpacity }]}>
        <CornerAccent size={36} color={`${mood.color}40`} opacity={0.3} rotation={270} />
      </Animated.View>
      <Animated.View style={[styles.cornerBR, { opacity: decorOpacity }]}>
        <CornerAccent size={36} color={`${mood.color}40`} opacity={0.3} rotation={180} />
      </Animated.View>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <BackIcon size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.surahBadge}>
          <Text style={[styles.surahLabel, { color: mood.color }]}>
            {verse.surahTr}
          </Text>
          <Text style={styles.ayahLabel}>{verse.ayah}</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood Glow */}
        <Animated.View
          style={[
            styles.moodGlow,
            {
              backgroundColor: `${mood.color}08`,
              opacity: glowPulse,
            },
          ]}
        />

        {/* Arabic Verse */}
        <Animated.View
          style={[
            styles.arabicContainer,
            {
              opacity: arabicOpacity,
              transform: [{ scale: arabicScale }],
            },
          ]}
        >
          <Text style={styles.arabicText} allowFontScaling={false}>
            {verse.arabicText}
          </Text>
        </Animated.View>

        {/* Divider */}
        <Animated.View
          style={[styles.divider, { opacity: translationOpacity }]}
        >
          <View style={[styles.dividerLine, { backgroundColor: `${mood.color}30` }]} />
          <View style={[styles.dividerDot, { backgroundColor: mood.color }]} />
          <View style={[styles.dividerLine, { backgroundColor: `${mood.color}30` }]} />
        </Animated.View>

        {/* Translation */}
        <Animated.View
          style={{
            opacity: translationOpacity,
            transform: [{ translateY: translationTranslateY }],
          }}
        >
          <Text style={styles.translationText}>{verse.translationTr}</Text>
          <Text style={styles.translationTr}>{verse.translationEn}</Text>
        </Animated.View>

      </ScrollView>

      {/* Bottom Action Bar */}
      <Animated.View
        style={[
          styles.actionBar,
          {
            opacity: controlsOpacity,
            transform: [{ translateY: controlsTranslateY }],
          },
        ]}
      >
        <ActionButton
          icon={<BookmarkIcon size={22} color={saved ? Colors.emerald : Colors.textPrimary} filled={saved} />}
          onPress={handleToggleFavorite}
        />
        <ActionButton
          icon={<ShareIcon size={22} color={Colors.textPrimary} />}
          onPress={() => navigation.navigate('ShareStory', { mood, verse })}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },

  topHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  surahBadge: {
    alignItems: 'center',
  },
  surahLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  ayahLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 140,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.6,
  },

  // Glow
  moodGlow: {
    position: 'absolute',
    top: '18%',
    width: 320,
    height: 320,
    borderRadius: 160,
    alignSelf: 'center',
  },

  // Arabic
  arabicContainer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  arabicText: {
    ...Typography.arabicHero,
    fontSize: 34,
    lineHeight: 64,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    width: '60%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 14,
  },

  // Translation
  translationText: {
    ...Typography.translation,
    marginBottom: Spacing.md,
  },
  translationTr: {
    ...Typography.translationSmall,
    fontStyle: 'normal',
  },

  // Audio
  audioContainer: {
    width: '100%',
    marginTop: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadows.md,
  },

  // Actions — sits above floating nav bar
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },

  // Corners
  cornerTL: {
    position: 'absolute',
    top: 116,
    left: 16,
    zIndex: 1,
  },
  cornerTR: {
    position: 'absolute',
    top: 116,
    right: 16,
    zIndex: 1,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    zIndex: 1,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    zIndex: 1,
  },
});
