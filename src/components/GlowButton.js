// GlowButton — Premium emerald gradient button with refined press & glow.
import React, { useRef, useEffect } from 'react';
import { Pressable, Text, StyleSheet, Animated, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Shadows, Gradients } from '../theme/colors';

export default function GlowButton({
  title,
  onPress,
  style,
  small,
  disabled,
  icon,
  variant = 'primary', // 'primary' | 'ghost'
}) {
  const glowAnim = useRef(new Animated.Value(0.35)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (disabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.35,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glowAnim, disabled]);

  const onPressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const gradientColors = disabled
    ? ['#1f1f1f', '#141414']
    : variant === 'ghost'
    ? Gradients.ghostButton
    : Gradients.primaryButton;

  const isGhost = variant === 'ghost';

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pressScale }] }, style]}>
      {/* Soft glow behind */}
      {!disabled && !isGhost && (
        <Animated.View style={[styles.glowBg, { opacity: glowAnim }]} />
      )}

      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            small && styles.gradientSmall,
            isGhost && styles.ghost,
          ]}>
          {/* Top sheen */}
          {!isGhost && (
            <LinearGradient
              colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.sheen}
              pointerEvents="none"
            />
          )}
          <View style={styles.content}>
            {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
            <Text
              style={[
                styles.text,
                small && styles.textSmall,
                isGhost && styles.textGhost,
                disabled && styles.textDisabled,
              ]}>
              {title}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  glowBg: {
    position: 'absolute',
    top: 6,
    left: 10,
    right: 10,
    bottom: -6,
    backgroundColor: Colors.emerald,
    borderRadius: Radius.lg,
    ...Shadows.glowEmerald,
  },
  gradient: {
    borderRadius: Radius.lg,
    paddingVertical: 17,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  gradientSmall: {
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  ghost: {
    borderWidth: 1,
    borderColor: Colors.borderMedium,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  textSmall: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  textGhost: {
    color: Colors.textPrimary,
  },
  textDisabled: {
    color: '#666',
  },
});
