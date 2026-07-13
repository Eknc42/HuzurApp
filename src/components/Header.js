// Header — Reusable screen header with back button, title, and actions
// Replaces ~10 different inline header implementations
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows, ComponentSize } from '../theme/colors';
import { Typography } from '../theme/typography';
import { BackIcon } from './Icons';
import PressableScale from './PressableScale';

/**
 * @param {object} props
 * @param {string} [props.title] - Screen title
 * @param {string} [props.subtitle] - Secondary text below title
 * @param {function} [props.onBack] - Back button handler (omit to hide)
 * @param {React.ReactNode} [props.rightActions] - Right-side action buttons
 * @param {React.ReactNode} [props.children] - Custom header content (replaces title/subtitle)
 * @param {boolean} [props.large=false] - Large title variant
 * @param {object} [props.style]
 */
export default function Header({
  title,
  subtitle,
  onBack,
  rightActions,
  children,
  large = false,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {onBack ? (
          <PressableScale onPress={onBack} accessibilityLabel="Geri" accessibilityRole="button">
            <View style={styles.backBtn}>
              <BackIcon size={20} color={Colors.textSecondary} />
            </View>
          </PressableScale>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {children ? (
          <View style={styles.customContent}>{children}</View>
        ) : (
          <View style={styles.titleContainer}>
            {title && (
              <Text
                style={large ? styles.titleLarge : styles.title}
                numberOfLines={1}
                accessibilityRole="header"
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {rightActions ? (
          <View style={styles.actions}>{rightActions}</View>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>
    </View>
  );
}

/**
 * Header icon button — used for right-side actions
 */
export function HeaderIconButton({ icon, onPress, active, accessibilityLabel }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <View style={[styles.iconBtn, active && styles.iconBtnActive]}>
        {icon}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ComponentSize.headerHeight,
  },
  backBtn: {
    width: ComponentSize.touchTarget,
    height: ComponentSize.touchTarget,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  backPlaceholder: {
    width: ComponentSize.touchTarget,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  titleLarge: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  customContent: {
    flex: 1,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: ComponentSize.touchTarget,
    height: ComponentSize.touchTarget,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  iconBtnActive: {
    borderColor: Colors.emeraldBorderStrong,
    ...Shadows.glowEmeraldSoft,
  },
});
