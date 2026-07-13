// MoodSelectionScreen — Glassmorphism mood cards grid
// Staggered entrance animation with glowing mood icons
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { MOODS } from '../data/moods';
import { getVerseForMood } from '../data/verses';
import {
  WaveIcon, HeartIcon, StarIcon, CompassIcon,
  FlameIcon, DoveIcon, BackIcon,
} from '../components/Icons';
import { PersonIcon } from '../components/IconsExtra';
import BottomNavBar from '../components/BottomNavBar';
import ScreenContainer from '../components/ScreenContainer';
import useAppearAnimation, { useStaggerAnimation } from '../hooks/useAppearAnimation';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = Math.floor((width - Spacing.xl * 2 - CARD_GAP) / 2) - 0.5;

// Map mood icon names to components
const MOOD_ICONS = {
  wave: (color) => <WaveIcon size={28} color={color} />,
  heart: (color) => <PersonIcon size={28} color={color} />,
  star: (color) => <StarIcon size={28} color={color} />,
  compass: (color) => <CompassIcon size={28} color={color} />,
  flame: (color) => <FlameIcon size={28} color={color} />,
  dove: (color) => <DoveIcon size={28} color={color} />,
};

export default function MoodSelectionScreen({ navigation }) {
  // Header animation
  const headerAnim = useAppearAnimation({ delay: 100, translateY: -20 });

  // Card animations (staggered)
  const cardAnims = useStaggerAnimation(MOODS.length, 100);

  const handleMoodPress = (mood) => {
    navigation.navigate('MoodVerseList', { mood });
  };

  return (
    <ScreenContainer gradient={true} edges={['top']}>
      {/* Top emerald halo */}
      <View pointerEvents="none" style={styles.topHalo}>
        <LinearGradient
          colors={['rgba(16,185,129,0.10)', 'rgba(16,185,129,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          headerAnim.style,
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <BackIcon size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerLabel}>AYETİNİ KEŞFET</Text>
          <Text style={styles.headerTitle}>Nasıl{'\n'}hissediyorsun?</Text>
          <Text style={styles.headerSubtitle}>
            Kalbine hitap eden bir ayet almak için bir ruh hali seç
          </Text>
        </View>
      </Animated.View>

      {/* Mood Cards Grid */}
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.gridScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {MOODS.map((mood, index) => (
            <Animated.View
              key={mood.id}
              style={[
                styles.cardWrapper,
                cardAnims[index].style,
              ]}
            >
              <TouchableOpacity
                onPress={() => handleMoodPress(mood)}
                activeOpacity={0.8}
                style={styles.cardTouchable}
              >
                <View style={[styles.card, { borderColor: `${mood.color}15` }]}>
                  {/* Glow effect */}
                  <View
                    style={[
                      styles.iconGlow,
                      { backgroundColor: `${mood.color}10` },
                    ]}
                  />

                  {/* Icon */}
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${mood.color}12` },
                    ]}
                  >
                    {MOOD_ICONS[mood.icon](mood.color)}
                  </View>

                  {/* Text */}
                  <Text style={[styles.moodLabel, { color: mood.color }]}>
                    {mood.labelTr}
                  </Text>
                  <Text style={styles.moodSubtitle}>{mood.subtitleTr}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
      {/* Navigation */}
      <BottomNavBar activeTab="AI" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({

  // Background
  topHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    opacity: 0.9,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  headerTextContainer: {
    marginBottom: Spacing.sm,
  },
  headerLabel: {
    ...Typography.label,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.6,
    lineHeight: 44,
  },
  headerSubtitle: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.textTertiary,
    lineHeight: 22,
  },

  // Grid
  gridScroll: {
    flex: 1,
  },
  gridScrollContent: {
    paddingBottom: 140,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: CARD_GAP,
    alignContent: 'flex-start',
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  cardTouchable: {
    borderRadius: Radius.xl,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 22,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.md,
  },

  // Icon
  iconGlow: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  // Text
  moodLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 5,
  },
  moodSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});
