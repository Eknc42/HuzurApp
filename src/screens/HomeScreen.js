// HomeScreen — Main hub with daily verse, quick mood access, and favorites
// The soul of the Huzur app — calm, cinematic, and deeply personal
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import {
  CrescentIcon, StarIcon, SparkleIcon,
  BookmarkIcon, HeartIcon,
  WaveIcon, CompassIcon, FlameIcon, DoveIcon,
} from '../components/Icons';
import { HomeIcon, RefreshIcon, WidgetIcon, PersonIcon, BookOpenIcon, RadioTowerIcon, MoonIcon, HeadphonesIcon, ClockIcon } from '../components/IconsExtra';
import { IslamicStar, GeometricDots, CornerAccent } from '../components/IslamicPattern';
import GlassCard from '../components/GlassCard';
import PressableScale from '../components/PressableScale';
import BottomNavBar from '../components/BottomNavBar';
import Badge from '../components/Badge';
import ScreenContainer from '../components/ScreenContainer';
import { DailyVerseSkeleton } from '../components/LoadingSkeleton';
import NextPrayerWidget from '../components/NextPrayerWidget';
import { usePremium } from '../contexts/PremiumContext';

import { fetchDailyVerse } from '../utils/dailyVerse';
import { SURAHS } from '../data/surahs';

// Quick access tiles — directly route to main features
const QUICK_ACTIONS = [
  { id: 'chat', label: 'AI Asistan', subtitle: 'Sorularınızı yanıtlar', color: '#3b82f6', screen: 'AIChat', Icon: SparkleIcon },
  { id: 'zikirmatik', label: 'Zikirmatik', subtitle: 'Zikirlerini say', color: '#f43f5e', screen: 'Zikirmatik', Icon: HeartIcon },
  { id: 'prayer', label: 'Namaz Vakitleri', subtitle: 'Canlı sayaç', color: '#c4b5fd', screen: 'PrayerTimes', Icon: ClockIcon },
  { id: 'qibla', label: 'Kıble', subtitle: 'Kabe yönü', color: '#f59e0b', screen: 'Qibla', Icon: CompassIcon },
  { id: 'guide', label: 'Rehber', subtitle: 'Ayet açıklamaları', color: '#a78bfa', screen: 'AIExplanation', Icon: CompassIcon },
  { id: 'quran', label: 'Kur\'an-ı Kerim', subtitle: '114 sure', color: '#10b981', screen: 'Quran', Icon: BookOpenIcon },
];

// Faziletli sureler — yaygın olarak okunan sureler
const FEATURED_SURAH_IDS = [36, 67, 55, 56, 18, 1, 112];

const { width, height } = Dimensions.get('window');

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Gece huzuru';
  if (hour < 12) return 'Günaydın';
  if (hour < 17) return 'İyi öğleden sonralar';
  if (hour < 21) return 'İyi akşamlar';
  return 'Huzurlu geceler';
}

export default function HomeScreen({ navigation }) {
  const [daily, setDaily] = useState(null);
  const greeting = getGreeting();
  const { isPremium } = usePremium();

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-15)).current;
  const dailyOpacity = useRef(new Animated.Value(0)).current;
  const dailyTranslateY = useRef(new Animated.Value(25)).current;
  const dailyScale = useRef(new Animated.Value(0.97)).current;
  const moodOpacity = useRef(new Animated.Value(0)).current;
  const moodTranslateY = useRef(new Animated.Value(25)).current;
  const quickOpacity = useRef(new Animated.Value(0)).current;
  const quickTranslateY = useRef(new Animated.Value(25)).current;
  const decorOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    // Load daily verse
    fetchDailyVerse().then(setDaily);

    // Header
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0, duration: 600, useNativeDriver: true,
      }),
    ]).start();

    // Daily verse card
    Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.timing(dailyOpacity, {
          toValue: 1, duration: 700, useNativeDriver: true,
        }),
        Animated.timing(dailyTranslateY, {
          toValue: 0, duration: 700, useNativeDriver: true,
        }),
        Animated.spring(dailyScale, {
          toValue: 1, tension: 40, friction: 8, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Mood strip
    Animated.sequence([
      Animated.delay(550),
      Animated.parallel([
        Animated.timing(moodOpacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
        Animated.timing(moodTranslateY, {
          toValue: 0, duration: 600, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Quick actions
    Animated.sequence([
      Animated.delay(750),
      Animated.parallel([
        Animated.timing(quickOpacity, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
        Animated.timing(quickTranslateY, {
          toValue: 0, duration: 500, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Decorations
    Animated.timing(decorOpacity, {
      toValue: 1, duration: 2000, delay: 400, useNativeDriver: true,
    }).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.35, duration: 3000, useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.15, duration: 3000, useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDailyVersePress = () => {
    if (daily) {
      navigation.navigate('Verse', { mood: daily.mood, verse: daily.verse });
    }
  };

  const handleQuickAction = (action) => {
    if (action.id === 'chat' && !isPremium) {
      navigation.navigate('Paywall');
    } else {
      navigation.navigate(action.screen);
    }
  };

  return (
    <ScreenContainer gradient={false} edges={['top']}>
      {/* Background — refined cinematic gradient */}
      <LinearGradient
        colors={['#000000', '#040b07', '#020503', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Top emerald halo */}
      <View pointerEvents="none" style={styles.topHalo}>
        <LinearGradient
          colors={['rgba(16,185,129,0.10)', 'rgba(16,185,129,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Background decorations */}
      <Animated.View style={[styles.bgStar, { opacity: decorOpacity }]}>
        <IslamicStar size={160} color={Colors.emeraldBorder} opacity={0.03} />
      </Animated.View>
      <Animated.View style={[styles.bgDots, { opacity: decorOpacity }]}>
        <GeometricDots size={80} color={Colors.beigeBorder} opacity={0.04} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] },
          ]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting.toLocaleUpperCase('tr-TR')}</Text>
              <View style={styles.brandRow}>
                <CrescentIcon size={18} color={Colors.emerald} />
                <Text style={styles.brandName}>Huzur</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Next Prayer Widget */}
        <NextPrayerWidget
          onPress={() => navigation.navigate('PrayerTimes')}
          style={{ marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.md }}
        />

        {/* Daily Verse Card — Hero section */}
        <Animated.View
          style={{
            opacity: dailyOpacity,
            transform: [
              { translateY: dailyTranslateY },
              { scale: dailyScale },
            ],
          }}
        >
          <TouchableOpacity
            onPress={handleDailyVersePress}
            activeOpacity={0.85}
            style={styles.dailyCardTouch}
            disabled={!daily}
          >
            <View style={styles.dailyCard}>
              {/* Gradient background — richer emerald hero */}
              <LinearGradient
                colors={['#0b1612', '#0d1814', '#0a120e']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              {/* Top sheen */}
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.dailySheen}
                pointerEvents="none"
              />

              {/* Removed Glow */}

              {/* Border */}
              <View style={styles.dailyBorder} />

              {/* Corner accents */}
              <View style={styles.dailyCornerTL}>
                <CornerAccent size={28} color={Colors.emerald} opacity={0.25} rotation={0} />
              </View>
              <View style={styles.dailyCornerBR}>
                <CornerAccent size={28} color={Colors.emerald} opacity={0.25} rotation={180} />
              </View>

              {/* Content */}
              <View style={styles.dailyContent}>
                <View style={styles.dailyBadge}>
                  <StarIcon size={12} color={Colors.beige} />
                  <Text style={styles.dailyBadgeText}>GÜNÜN AYETİ</Text>
                </View>

                {!daily ? (
                  <DailyVerseSkeleton />
                ) : (
                  <>
                    <Text style={styles.dailyArabic}>
                      {daily.verse.arabicText}
                    </Text>

                    <View style={styles.dailyDivider}>
                      <View style={styles.dailyDividerLine} />
                      <View style={styles.dailyDividerDot} />
                      <View style={styles.dailyDividerLine} />
                    </View>

                    <Text style={styles.dailyTranslation}>
                      "{daily.verse.translationTr}"
                    </Text>

                    <View style={styles.dailyFooter}>
                      <Text style={styles.dailySurah}>
                        {daily.verse.surahTr} · {daily.verse.ayah}
                      </Text>
                      <View style={styles.dailyArrow}>
                        <Text style={styles.dailyArrowText}>Keşfet →</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>


        {/* Quick Access — 2x2 feature grid */}
        <Animated.View
          style={{
            opacity: moodOpacity,
            transform: [{ translateY: moodTranslateY }],
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          </View>

          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => {
              const { Icon } = action;
              return (
                <PressableScale
                  key={action.id}
                  onPress={() => handleQuickAction(action)}
                  style={styles.quickCardTouch}
                  scaleValue={0.95}
                >
                  <View style={[styles.quickCard, { borderColor: `${action.color}22` }]}>
                    <View
                      style={[
                        styles.quickCardGlow,
                        { backgroundColor: `${action.color}10` },
                      ]}
                    />
                    <View
                      style={[
                        styles.quickIconWrap,
                        { backgroundColor: `${action.color}14`, borderColor: `${action.color}30` },
                      ]}
                    >
                      <Icon size={22} color={action.color} />
                    </View>
                    <View style={styles.quickTextWrap}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.quickLabel} numberOfLines={1}>
                          {action.label}
                        </Text>
                      </View>
                      <Text style={styles.quickSub} numberOfLines={1}>
                        {action.subtitle}
                      </Text>
                    </View>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>

        {/* Faziletli Sureler — horizontal scroll */}
        <Animated.View
          style={{
            opacity: quickOpacity,
            transform: [{ translateY: quickTranslateY }],
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Faziletli Sureler</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Quran')} activeOpacity={0.7}>
              <Text style={styles.seeAll}>Tümü →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.surahScroll}
          >
            {FEATURED_SURAH_IDS.map((sid) => {
              const surah = SURAHS.find((s) => s.id === sid);
              if (!surah) return null;
              return (
                <PressableScale
                  key={sid}
                  onPress={() => navigation.navigate('SurahDetail', { surah })}
                  scaleValue={0.94}
                  style={styles.surahCardTouch}
                >
                  <View style={styles.surahCard}>
                    <View style={styles.surahCardGlow} />
                    <View style={styles.surahNumberWrap}>
                      <Text style={styles.surahNumber}>{surah.id}</Text>
                    </View>
                    <Text style={styles.surahArabic} numberOfLines={1}>
                      {surah.name}
                    </Text>
                    <Text style={styles.surahNameTr} numberOfLines={1}>
                      {surah.nameTr}
                    </Text>
                    <Text style={styles.surahMeta} numberOfLines={1}>
                      {surah.verseCount} ayet · {surah.type}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Bottom spacing for floating nav bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab="Home" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Background
  topHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    opacity: 0.9,
  },
  bgStar: {
    position: 'absolute',
    top: height * 0.25,
    right: -40,
  },
  bgDots: {
    position: 'absolute',
    bottom: 200,
    left: 10,
  },

  // Header
  header: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textPrimary,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  // Daily Card
  dailyCardTouch: {
    marginHorizontal: Spacing.lg,
  },
  dailyCard: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    minHeight: 340,
    ...Shadows.lg,
  },
  dailySheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  dailyGlow: {
    display: 'none',
  },
  dailyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xxxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  dailyCornerTL: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  dailyCornerBR: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  dailyContent: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 165, 116, 0.10)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.16)',
    marginBottom: 22,
  },
  dailyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.beige,
    letterSpacing: 1.6,
  },
  dailyArabic: {
    ...Typography.arabicMedium,
    fontSize: 23,
    lineHeight: 42,
    marginBottom: 12,
  },
  dailyDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    marginVertical: 14,
  },
  dailyDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.emeraldBorder,
  },
  dailyDividerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.emerald,
    marginHorizontal: 8,
  },
  dailyTranslation: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    fontStyle: 'italic',
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  dailyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  dailySurah: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 0.8,
  },
  dailyArrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyArrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    ...Typography.h4,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.emerald,
    letterSpacing: 0.3,
  },

  // Quick access grid — 2 per row
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    rowGap: 12,
  },
  quickCardTouch: {
    width: (width - Spacing.lg * 2 - 12) / 2,
  },
  quickCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.xs,
  },
  quickCardGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTextWrap: {
    flex: 1,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  quickSub: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Featured Surahs
  surahScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  surahCardTouch: {
    width: 140,
  },
  surahCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.xs,
  },
  surahCardGlow: {
    position: 'absolute',
    top: -30,
    left: '20%',
    right: '20%',
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.emerald,
    opacity: 0.06,
  },
  surahNumberWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  surahNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emerald,
  },
  surahArabic: {
    ...Typography.arabicMedium,
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 4,
  },
  surahNameTr: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  surahMeta: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
