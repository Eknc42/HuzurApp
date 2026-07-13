// ActionButton — Refined circular icon button with press animation & glass surface.
import React, { useRef } from 'react';
import { Pressable, StyleSheet, Animated, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Shadows, Gradients } from '../theme/colors';

export default function ActionButton({ icon, onPress, active, style, size = 52 }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: true, radius: size / 2 }}
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          active && styles.buttonActive,
        ]}
      >
        <LinearGradient
          colors={
            active
              ? ['rgba(16,185,129,0.18)', 'rgba(16,185,129,0.04)']
              : Gradients.cardSurface
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Top sheen */}
        <View style={[styles.sheen, { borderRadius: size / 2 }]} pointerEvents="none" />
        {icon}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  buttonActive: {
    borderColor: Colors.emeraldBorderStrong,
    ...Shadows.glowEmeraldSoft,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
