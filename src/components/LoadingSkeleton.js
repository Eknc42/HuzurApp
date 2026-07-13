// LoadingSkeleton — Shimmer placeholder for loading states
// Prevents layout shift and provides premium perceived performance
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Motion } from '../theme/colors';

/**
 * @param {object} props
 * @param {number} [props.width] - Width of skeleton element
 * @param {number|string} [props.height=16] - Height of skeleton element
 * @param {number} [props.borderRadius] - Border radius override
 * @param {'text'|'card'|'avatar'|'verse'|'surahItem'|'custom'} [props.variant='text']
 * @param {object} [props.style] - Additional styles
 */
export default function LoadingSkeleton({
  width,
  height = 16,
  borderRadius,
  variant = 'text',
  style,
}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  // Variant presets
  const presets = {
    text: { width: width || '100%', height: 14, borderRadius: Radius.xs },
    card: { width: width || '100%', height: height || 180, borderRadius: Radius.xl },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    verse: { width: width || '100%', height: height || 120, borderRadius: Radius.lg },
    surahItem: { width: width || '100%', height: 64, borderRadius: Radius.md },
    custom: { width: width || '100%', height, borderRadius: borderRadius || Radius.sm },
  };

  const preset = presets[variant] || presets.custom;

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: preset.width,
          height: preset.height,
          borderRadius: borderRadius !== undefined ? borderRadius : preset.borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX: shimmerTranslate }] },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.06)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Preset: Daily Verse Card skeleton
 */
export function DailyVerseSkeleton() {
  return (
    <View style={skeletonStyles.dailyCard}>
      <LoadingSkeleton variant="text" width={100} height={12} style={{ marginBottom: 16 }} />
      <LoadingSkeleton variant="text" width="90%" height={28} style={{ marginBottom: 10 }} />
      <LoadingSkeleton variant="text" width="75%" height={28} style={{ marginBottom: 16 }} />
      <LoadingSkeleton variant="text" width="100%" height={14} style={{ marginBottom: 6 }} />
      <LoadingSkeleton variant="text" width="80%" height={14} style={{ marginBottom: 16 }} />
      <LoadingSkeleton variant="text" width={120} height={12} />
    </View>
  );
}

/**
 * Preset: Surah list item skeleton
 */
export function SurahListSkeleton({ count = 8 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={skeletonStyles.surahItem}>
          <LoadingSkeleton variant="custom" width={36} height={36} borderRadius={10} />
          <View style={skeletonStyles.surahItemText}>
            <LoadingSkeleton variant="text" width="60%" height={14} style={{ marginBottom: 6 }} />
            <LoadingSkeleton variant="text" width="40%" height={10} />
          </View>
          <LoadingSkeleton variant="text" width={50} height={18} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.bgTertiary,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
});

const skeletonStyles = StyleSheet.create({
  dailyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 28,
    minHeight: 240,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  surahItemText: {
    flex: 1,
  },
});
