// PrayerTimesScreen — Full prayer times screen
// Shows next prayer countdown hero + all 6 prayer times in a vertical list
// Highlights the current/active prayer time
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { CrescentIcon } from '../components/Icons';
import { getPrayerIcon, LocationIcon, ClockIcon } from '../components/PrayerIcons';
import { ChevronRightIcon } from '../components/IconsExtra';
import { IslamicStar, GeometricDots } from '../components/IslamicPattern';

import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import usePrayerTimes from '../hooks/usePrayerTimes';

const { width, height } = Dimensions.get('window');
const pad = (n) => String(n).padStart(2, '0');

// ============================================================
// PrayerTimeRow — A single prayer time in the list
// ============================================================
function PrayerTimeRow({ prayer, isActive, isNext, index }) {
  const translateX = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 500,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accentColor = prayer.color || Colors.textTertiary;
  const borderColor = isActive
    ? Colors.emerald
    : isNext
    ? `${accentColor}60`
    : Colors.borderSubtle;
  const bgColor = isActive
    ? Colors.emeraldGlow
    : isNext
    ? `${accentColor}08`
    : Colors.bgSurface;

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <View
        style={[
          styles.prayerRow,
          {
            borderColor,
            backgroundColor: bgColor,
          },
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.rowIconWrap,
            {
              backgroundColor: isActive ? Colors.emeraldGlow : `${accentColor}14`,
              borderColor: isActive ? Colors.emeraldBorderStrong : `${accentColor}30`,
            },
          ]}
        >
          {getPrayerIcon(prayer.key, {
            size: 20,
            color: isActive ? Colors.emerald : accentColor,
          })}
        </View>

        {/* Name & Status */}
        <View style={styles.rowInfo}>
          <Text
            style={[
              styles.rowName,
              isActive && { color: Colors.emerald },
              isNext && { color: accentColor },
            ]}
          >
            {prayer.labelTr}
          </Text>
          {isActive && (
            <View style={styles.activeIndicator}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Şu anki vakit</Text>
            </View>
          )}
          {isNext && !isActive && (
            <Text style={[styles.nextText, { color: accentColor }]}>Sonraki vakit</Text>
          )}
        </View>

        {/* Time */}
        <Text
          style={[
            styles.rowTime,
            isActive && { color: Colors.emerald, fontWeight: '700' },
            isNext && !isActive && { color: accentColor },
          ]}
        >
          {prayer.time}
        </Text>
      </View>
    </Animated.View>
  );
}

// ============================================================
// PrayerTimesScreen — Main screen
// ============================================================
export default function PrayerTimesScreen({ navigation }) {
  const {
    loading,
    error,
    location,
    allPrayers,
    nextPrayer,
    countdown,
    currentIndex,
    nextIndex,
    selectedCityKey,
    setCity,
    refetch,
  } = usePrayerTimes();

  const handleCityPicker = () => {
    navigation.navigate('CityPicker', {
      selectedCityKey,
      onCitySelect: (key) => setCity(key),
    });
  };

  // Header animation
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(25)).current;
  const heroScale = useRef(new Animated.Value(0.97)).current;
  const decorOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1, duration: 700, useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        toValue: 0, duration: 700, useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1, tension: 40, friction: 8, useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(decorOpacity, {
      toValue: 1, duration: 2000, delay: 400, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.20, duration: 2500, useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.08, duration: 2500, useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accentColor = nextPrayer?.color || Colors.emerald;

  return (
    <ScreenContainer gradient={false} edges={['top']}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#000000', '#040b07', '#020503', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Top emerald halo */}
      <View pointerEvents="none" style={styles.topHalo}>
        <LinearGradient
          colors={['rgba(16,185,129,0.08)', 'rgba(16,185,129,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Background decorations */}
      <Animated.View style={[styles.bgStar, { opacity: decorOpacity }]}>
        <IslamicStar size={140} color={Colors.emeraldBorder} opacity={0.03} />
      </Animated.View>
      <Animated.View style={[styles.bgDots, { opacity: decorOpacity }]}>
        <GeometricDots size={70} color={Colors.beigeBorder} opacity={0.04} />
      </Animated.View>

      {/* Header */}
      <Header
        title="Namaz Vakitleri"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.emerald} size="large" />
          <Text style={styles.loadingText}>Vakitler yükleniyor…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Location Bar — tappable to change city */}
          <TouchableOpacity
            style={styles.locationBar}
            onPress={handleCityPicker}
            activeOpacity={0.7}
          >
            <LocationIcon size={14} color={Colors.textTertiary} />
            <Text style={styles.locationCity}>
              {location?.city}, {location?.country}
            </Text>
            <View style={styles.changeCityChip}>
              <Text style={styles.changeCityText}>Değiştir</Text>
              <ChevronRightIcon size={12} color={Colors.emerald} />
            </View>
          </TouchableOpacity>

          {/* Date badge */}
          <View style={styles.dateRow}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Hero Countdown Card */}
          <Animated.View
            style={{
              opacity: heroOpacity,
              transform: [
                { translateY: heroTranslateY },
                { scale: heroScale },
              ],
            }}
          >
            <View style={styles.heroCard}>
              {/* Card gradient */}
              <LinearGradient
                colors={['#0b1612', '#0d1814', '#0a120e']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              {/* Top sheen */}
              <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.heroSheen}
                pointerEvents="none"
              />

              {/* Accent glow */}
              <Animated.View
                style={[
                  styles.heroGlow,
                  { backgroundColor: accentColor, opacity: glowPulse },
                ]}
              />

              {/* Border */}
              <View style={styles.heroBorder} />

              <View style={styles.heroContent}>
                {/* Badge */}
                <View style={styles.heroBadge}>
                  <CrescentIcon size={10} color={Colors.emerald} />
                  <Text style={styles.heroBadgeText}>SONRAKİ VAKİT</Text>
                </View>

                {/* Prayer Name */}
                <View style={styles.heroNameRow}>
                  <View style={[styles.heroIconWrap, { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}30` }]}>
                    {nextPrayer && getPrayerIcon(nextPrayer.key, { size: 24, color: accentColor })}
                  </View>
                  <Text style={[styles.heroName, { color: accentColor }]}>
                    {nextPrayer?.labelTr}
                  </Text>
                  <View style={styles.heroTimeChip}>
                    <Text style={styles.heroTimeChipText}>{nextPrayer?.time}</Text>
                  </View>
                </View>

                {/* Countdown */}
                <View style={styles.heroCountdown}>
                  <View style={styles.countdownUnit}>
                    <Text style={[styles.countdownNumber, { color: accentColor }]}>
                      {pad(countdown.hours)}
                    </Text>
                    <Text style={styles.countdownLabel}>saat</Text>
                  </View>
                  <Text style={[styles.countdownSep, { color: accentColor }]}>:</Text>
                  <View style={styles.countdownUnit}>
                    <Text style={[styles.countdownNumber, { color: accentColor }]}>
                      {pad(countdown.minutes)}
                    </Text>
                    <Text style={styles.countdownLabel}>dakika</Text>
                  </View>
                  <Text style={[styles.countdownSep, { color: accentColor }]}>:</Text>
                  <View style={styles.countdownUnit}>
                    <Text style={[styles.countdownNumber, { color: accentColor }]}>
                      {pad(countdown.seconds)}
                    </Text>
                    <Text style={styles.countdownLabel}>saniye</Text>
                  </View>
                </View>

                {/* Progress hint */}
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: accentColor,
                        width: countdown.totalSec > 0
                          ? `${Math.max(5, 100 - (countdown.totalSec / (6 * 3600)) * 100)}%`
                          : '100%',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Section: All Prayer Times */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Günün Vakitleri</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>6 Vakit</Text>
            </View>
          </View>

          {/* Prayer Times List */}
          <View style={styles.prayerList}>
            {allPrayers.map((prayer, index) => (
              <PrayerTimeRow
                key={prayer.key}
                prayer={prayer}
                isActive={index === currentIndex}
                isNext={index === nextIndex}
                index={index}
              />
            ))}
          </View>

          {/* Bottom spacing for nav bar */}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="" />
    </ScreenContainer>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  // Background
  topHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    opacity: 0.9,
  },
  bgStar: {
    position: 'absolute',
    top: height * 0.3,
    right: -30,
  },
  bgDots: {
    position: 'absolute',
    bottom: 200,
    left: 10,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Location bar
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    gap: 6,
  },
  locationCity: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
    flex: 1,
  },
  changeCityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.emeraldGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  changeCityText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 0.3,
  },
  dateRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
  },
  dateBadge: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },

  // Hero Card
  heroCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
  },
  heroSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  heroBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  heroContent: {
    padding: Spacing.lg,
    alignItems: 'center',
  },

  // Hero badge
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.emeraldGlow,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    marginBottom: Spacing.md,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.emerald,
    letterSpacing: 1.6,
  },

  // Hero prayer name row
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.md,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    flex: 1,
  },
  heroTimeChip: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  heroTimeChipText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },

  // Countdown
  heroCountdown: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: Spacing.base,
  },
  countdownUnit: {
    alignItems: 'center',
    minWidth: 64,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    lineHeight: 56,
  },
  countdownLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  countdownSep: {
    fontSize: 40,
    fontWeight: '200',
    lineHeight: 56,
  },

  // Progress bar
  progressBar: {
    width: '80%',
    height: 3,
    backgroundColor: Colors.bgCard,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.6,
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
  sectionBadge: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },

  // Prayer list
  prayerList: {
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },

  // Individual prayer row
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.emerald,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.emerald,
    letterSpacing: 0.3,
  },
  nextText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  rowTime: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },

  // Loading / Error
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.emerald,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
