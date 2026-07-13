// GlassCard — Premium dark glassmorphism with layered gradient & top sheen.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Shadows, Gradients } from '../theme/colors';

export default function GlassCard({
  children,
  style,
  glowColor,
  noPadding,
  intensity = 'medium', // 'low' | 'medium' | 'high'
  bordered = true,
}) {
  const surfaceColors =
    intensity === 'high'
      ? ['rgba(32,32,32,0.96)', 'rgba(18,18,18,0.96)']
      : intensity === 'low'
      ? ['rgba(20,20,20,0.6)', 'rgba(12,12,12,0.6)']
      : Gradients.cardSurface;

  return (
    <View
      style={[
        styles.card,
        bordered && styles.bordered,
        glowColor && {
          shadowColor: glowColor,
          shadowOpacity: 0.22,
          shadowRadius: 22,
        },
        style,
      ]}>
      <LinearGradient
        colors={surfaceColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Top sheen — subtle highlight for depth */}
      <LinearGradient
        colors={Gradients.cardShine}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.sheen}
        pointerEvents="none"
      />
      {!noPadding ? <View style={styles.inner}>{children}</View> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCardSolid,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  inner: {
    padding: 20,
  },
});
