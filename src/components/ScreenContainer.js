// ScreenContainer — Wraps every screen with safe area, background, and StatusBar
// Eliminates boilerplate repeated across all 16 screens
import React from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Gradients } from '../theme/colors';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.gradient=true] - Use cinematic gradient background
 * @param {string[]} [props.gradientColors] - Custom gradient colors
 * @param {string[]} [props.edges=['top']] - Safe area edges to respect
 * @param {object} [props.style] - Additional container styles
 * @param {boolean} [props.statusBarLight=true]
 */
export default function ScreenContainer({
  children,
  gradient = true,
  gradientColors,
  edges = ['top'],
  style,
  statusBarLight = true,
}) {
  const insets = useSafeAreaInsets();

  const paddingStyle = {};
  if (edges.includes('top')) paddingStyle.paddingTop = insets.top;
  if (edges.includes('bottom')) paddingStyle.paddingBottom = insets.bottom;
  if (edges.includes('left')) paddingStyle.paddingLeft = insets.left;
  if (edges.includes('right')) paddingStyle.paddingRight = insets.right;

  return (
    <View style={[styles.container, paddingStyle, style]}>
      <StatusBar
        barStyle={statusBarLight ? 'light-content' : 'dark-content'}
        backgroundColor={Colors.bgPrimary}
      />
      {gradient && (
        <LinearGradient
          colors={gradientColors || Gradients.appBackground}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
});
