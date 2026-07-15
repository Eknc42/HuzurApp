// BottomNavBar — Premium floating "pill" navigation with animated active state.
// Visible on most screens; navigates while preserving previously available routes.
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing } from '../theme/colors';
import {
  CrescentIcon, SparkleIcon, BookmarkIcon,
} from './Icons';
import { BookOpenIcon, RadioTowerIcon, LightbulbIcon } from './IconsExtra';

const NAV_ITEMS = [
  { key: 'Home', label: 'Ana', route: 'Home' },
  { key: 'AI', label: 'Rehber', route: 'AIExplanation' },
  { key: 'AIChat', label: 'Asistan', route: 'AIChat' },
  { key: 'Radio', label: 'Radyo', route: 'Radio' },
  { key: 'Quran', label: "Kur'an", route: 'Quran' },
];

function normalizeActiveTab(activeTab) {
  if (!activeTab || activeTab === 'Share' || activeTab === 'Verse') return '';
  return activeTab;
}

function NavItem({ item, isActive, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const color = isActive ? Colors.emerald : Colors.textTertiary;
  const size = 20;
  const renderIcon = () => {
    switch (item.key) {
      case 'Home': return <CrescentIcon size={size} color={color} />;
      case 'AI': return <LightbulbIcon size={size} color={color} />;
      case 'AIChat': return <SparkleIcon size={size} color={color} />;
      case 'Radio': return <RadioTowerIcon size={size} color={color} />;
      case 'Quran': return <BookOpenIcon size={size} color={color} />;
      default: return null;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.navItem}
        android_ripple={{ color: 'rgba(255,255,255,0.04)', borderless: true }}
      >
        <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
          {isActive && (
            <LinearGradient
              colors={['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          {renderIcon()}
        </View>
        <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function BottomNavBar({ activeTab = 'Home' }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const resolvedTab = normalizeActiveTab(activeTab);
  const currentIndex = NAV_ITEMS.findIndex(item => item.key === resolvedTab);

  const mountAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [mountAnim]);

  const handlePress = (item) => {
    if (item.key === resolvedTab) return;

    const targetIndex = NAV_ITEMS.findIndex(i => i.key === item.key);
    // If current tab is unknown (e.g. nested screen), default to sliding from right,
    // otherwise compare indices.
    const animation = (currentIndex !== -1 && targetIndex < currentIndex) 
      ? 'slide_from_left' 
      : 'slide_from_right';

    if (item.key === 'Home') {
      // For Home, we reset to clear stack, but we can still pass params for animation
      navigation.reset({ index: 0, routes: [{ name: 'Home', params: { animation } }] });
    } else if (item.key === 'AI') {
      navigation.navigate('MoodSelection', { animation });
    } else if (item.key === 'AIChat') {
      navigation.navigate('AIChat', { animation });
    } else if (item.key === 'Radio') {
      navigation.navigate('Radio', { animation });
    } else {
      navigation.navigate(item.route, { animation });
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 16),
          opacity: mountAnim,
          transform: [
            {
              translateY: mountAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={styles.pill}>
        <LinearGradient
          colors={['rgba(20,20,20,0.95)', 'rgba(10,10,10,0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Top sheen */}
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.sheen}
          pointerEvents="none"
        />
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            isActive={item.key === resolvedTab}
            onPress={() => handlePress(item)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.xxxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.md,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrapActive: {
    borderWidth: 1,
    borderColor: Colors.borderEmerald,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textTertiary,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Colors.emerald,
    fontWeight: '600',
  },
});
