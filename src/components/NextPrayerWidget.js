// NextPrayerWidget — Home screen "Next Prayer" card
// Glassmorphism card showing location, countdown, and next prayer name/time
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';

import { getPrayerIcon, LocationIcon, ClockIcon } from './PrayerIcons';
import { CrescentIcon } from './Icons';
import PressableScale from './PressableScale';
import usePrayerTimes from '../hooks/usePrayerTimes';

/**
 * Pad single digit to 2 chars: 5 → "05"
 */
const pad = (n) => String(n).padStart(2, '0');

export default function NextPrayerWidget({ onPress, style }) {
  const {
    loading,
    error,
    location,
    nextPrayer,
    countdown,
  } = usePrayerTimes();

  // Entrance animation
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  // Pulsing glow for the countdown
  const glowPulse = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 700, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 700, useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1, tension: 40, friction: 8, useNativeDriver: true,
      }),
    ]).start();

    // Subtle glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.18, duration: 2500, useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.08, duration: 2500, useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator color={Colors.emerald} size="small" />
        <Text style={styles.loadingText}>Namaz vakitleri yükleniyor…</Text>
      </View>
    );
  }

  if (error || !nextPrayer) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorText}>{error || 'Veri bulunamadı'}</Text>
      </View>
    );
  }

  const accentColor = nextPrayer.color || Colors.emerald;

  return (
    <Animated.View
      style={[
        { opacity, transform: [{ translateY }, { scale }] },
        style,
      ]}
    >
      <PressableScale onPress={onPress} scaleValue={0.97}>
        <View style={styles.card}>
          {/* Gradient background */}
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
            style={styles.sheen}
            pointerEvents="none"
          />

          {/* Accent glow (top-right) */}
          <Animated.View style={[styles.accentGlow, { backgroundColor: accentColor, opacity: glowPulse }]} />

          {/* Border overlay */}
          <View style={styles.borderOverlay} />

          {/* Content */}
          <View style={styles.content}>
            {/* Top row: Badge + Location */}
            <View style={styles.topRow}>
              <View style={styles.badge}>
                <CrescentIcon size={10} color={Colors.emerald} />
                <Text style={styles.badgeText}>NAMAZ VAKTİ</Text>
              </View>
              <View style={styles.locationRow}>
                <LocationIcon size={12} color={Colors.textTertiary} />
                <Text style={styles.locationText}>
                  {location?.city}, {location?.country}
                </Text>
              </View>
            </View>

            {/* Countdown — Hero */}
            <View style={styles.countdownSection}>
              <View style={styles.countdownRow}>
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
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: `${accentColor}30` }]} />
              <View style={[styles.dividerDot, { backgroundColor: accentColor }]} />
              <View style={[styles.dividerLine, { backgroundColor: `${accentColor}30` }]} />
            </View>

            {/* Next prayer info */}
            <View style={styles.nextPrayerRow}>
              <View style={[styles.prayerIconWrap, { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}30` }]}>
                {getPrayerIcon(nextPrayer.key, { size: 20, color: accentColor })}
              </View>
              <View style={styles.prayerInfo}>
                <Text style={styles.nextLabel}>Sonraki Vakit</Text>
                <Text style={[styles.prayerName, { color: accentColor }]}>
                  {nextPrayer.labelTr}
                </Text>
              </View>
              <View style={styles.prayerTimeBox}>
                <ClockIcon size={12} color={Colors.textTertiary} />
                <Text style={styles.prayerTime}>{nextPrayer.time}</Text>
              </View>
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  accentGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  content: {
    padding: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.emeraldGlow,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.emerald,
    letterSpacing: 1.4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.2,
  },

  // Countdown
  countdownSection: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  countdownUnit: {
    alignItems: 'center',
    minWidth: 58,
  },
  countdownNumber: {
    fontSize: 44,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    lineHeight: 52,
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
    fontSize: 36,
    fontWeight: '200',
    lineHeight: 52,
    marginTop: 0,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    alignSelf: 'center',
    marginVertical: Spacing.base,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
  },

  // Next prayer row
  nextPrayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prayerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerInfo: {
    flex: 1,
  },
  nextLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  prayerName: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  prayerTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  prayerTime: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },

  // Loading / Error
  loadingContainer: {
    borderRadius: Radius.xxl,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  errorContainer: {
    borderRadius: Radius.xxl,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
    textAlign: 'center',
  },
});
