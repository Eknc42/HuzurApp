// Toast — Slide-in notification for actions (bookmark, favorite, etc.)
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '../theme/colors';

const VARIANTS = {
  success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: Colors.emerald },
  info: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: Colors.info },
  warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: Colors.warning },
  error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: Colors.danger },
};

export default function Toast({ message, variant = 'success', visible, onHide, duration = 2000 }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -80, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide, translateY, opacity]);

  if (!visible && !message) return null;

  const v = VARIANTS[variant] || VARIANTS.success;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity, backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={[styles.text, { color: v.text }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: Spacing.lg,
    right: Spacing.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    zIndex: 9999,
    ...Shadows.md,
  },
  text: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
