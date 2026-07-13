// ListItem — Reusable list row for surah items, reciter items, settings rows, etc.
// Consistent press animation, layout, and accessibility
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import PressableScale from './PressableScale';

/**
 * @param {object} props
 * @param {React.ReactNode} [props.leading] - Left icon, number badge, or avatar
 * @param {string} props.title - Primary text
 * @param {string} [props.subtitle] - Secondary text
 * @param {React.ReactNode} [props.trailing] - Right element (icon, badge, chevron)
 * @param {function} [props.onPress]
 * @param {boolean} [props.active=false] - Highlighted state
 * @param {boolean} [props.bordered=false] - Show bottom border
 * @param {string} [props.activeColor] - Custom active accent color
 * @param {object} [props.style]
 * @param {string} [props.accessibilityLabel]
 */
const ListItem = ({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  active = false,
  bordered = false,
  activeColor,
  style,
  accessibilityLabel,
}) => {
  const accent = activeColor || Colors.emerald;

  const content = (
    <View
      style={[
        styles.container,
        active && [styles.containerActive, { borderColor: `${accent}28` }],
        bordered && styles.bordered,
        style,
      ]}
    >
      {leading && <View style={styles.leading}>{leading}</View>}
      <View style={styles.content}>
        <Text
          style={[styles.title, active && { color: accent }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing && <View style={styles.trailing}>{trailing}</View>}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        scaleValue={0.97}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
      >
        {content}
      </PressableScale>
    );
  }

  return content;
};

export default React.memo(ListItem);

/**
 * Number badge — for surah numbers in list items
 */
export function NumberBadge({ number, active, color }) {
  const accent = color || Colors.emerald;
  return (
    <View style={[styles.numberBadge, active && { backgroundColor: `${accent}18`, borderColor: `${accent}30` }]}>
      <Text style={[styles.numberText, active && { color: accent }]}>
        {number}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    gap: 14,
  },
  containerActive: {
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
  },
  bordered: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
    borderRadius: 0,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...Typography.number,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
  },
});
