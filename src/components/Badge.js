// Badge — Small status indicator / tag
// Replaces inline badge styles scattered across HomeScreen, QuranScreen, etc.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../theme/colors';
import { Typography } from '../theme/typography';

/**
 * @param {object} props
 * @param {string} props.label - Badge text
 * @param {'primary'|'mood'|'status'|'neutral'} [props.variant='primary']
 * @param {string} [props.color] - Custom accent color (used for mood variant)
 * @param {'sm'|'md'} [props.size='sm']
 * @param {React.ReactNode} [props.icon] - Optional leading icon
 * @param {object} [props.style]
 */
export default function Badge({
  label,
  variant = 'primary',
  color,
  size = 'sm',
  icon,
  style,
}) {
  const accentColor = color || variantColors[variant] || Colors.emerald;
  const isMd = size === 'md';

  return (
    <View
      style={[
        styles.badge,
        isMd && styles.badgeMd,
        {
          backgroundColor: `${accentColor}14`,
          borderColor: `${accentColor}28`,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text
        style={[
          styles.label,
          isMd && styles.labelMd,
          { color: accentColor },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const variantColors = {
  primary: Colors.emerald,
  mood: Colors.beige,
  status: Colors.warning,
  neutral: Colors.textTertiary,
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 5,
  },
  badgeMd: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  iconWrap: {
    marginRight: 2,
  },
  label: {
    ...Typography.badge,
  },
  labelMd: {
    fontSize: 11,
    letterSpacing: 1.4,
  },
});
