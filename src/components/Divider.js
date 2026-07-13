// Divider — Visual separator with optional centered label
// Uses design tokens for consistent styling
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { Typography } from '../theme/typography';

/**
 * @param {object} props
 * @param {'horizontal'|'vertical'} [props.direction='horizontal']
 * @param {string} [props.label] - Optional centered text
 * @param {string} [props.color] - Override divider color
 * @param {number} [props.spacing] - Vertical margin
 * @param {object} [props.style]
 */
export default function Divider({
  direction = 'horizontal',
  label,
  color,
  spacing = Spacing.md,
  style,
}) {
  if (direction === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          { backgroundColor: color || Colors.borderSubtle },
          style,
        ]}
      />
    );
  }

  if (label) {
    return (
      <View style={[styles.labelContainer, { marginVertical: spacing }, style]}>
        <View style={[styles.line, { backgroundColor: color || Colors.borderSubtle }]} />
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.line, { backgroundColor: color || Colors.borderSubtle }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        { backgroundColor: color || Colors.borderSubtle, marginVertical: spacing },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  label: {
    ...Typography.captionMedium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
