// EmptyState — Consistent empty content placeholder
// Replaces scattered emoji-based empty states with a polished, unified component
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Radius } from '../theme/colors';
import { Typography } from '../theme/typography';
import GlowButton from './GlowButton';

/**
 * @param {object} props
 * @param {React.ReactNode} props.icon - SVG icon component
 * @param {string} props.title - Primary message
 * @param {string} [props.message] - Secondary description
 * @param {string} [props.actionLabel] - Button label
 * @param {function} [props.onAction] - Button press handler
 * @param {object} [props.style]
 */
export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  style,
}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, slideUp]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        style,
      ]}
    >
      {icon && (
        <View style={styles.iconWrap}>
          {icon}
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <View style={styles.actionWrap}>
          <GlowButton
            title={actionLabel}
            onPress={onAction}
            small
            variant="ghost"
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  actionWrap: {
    marginTop: Spacing.md,
  },
});
