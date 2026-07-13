// OnboardingScreen — Welcome screen with Quran quote
// Cinematic AMOLED design with animated entrance
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { Typography } from '../theme/typography';
import { CrescentIcon, StarIcon } from '../components/Icons';
import { IslamicStar, GeometricDots } from '../components/IslamicPattern';
import GlowButton from '../components/GlowButton';
import ScreenContainer from '../components/ScreenContainer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_STORAGE_KEY } from '../constants/storageKeys';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const quoteTranslateY = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(30)).current;
  const decorOpacity = useRef(new Animated.Value(0)).current;
  const starRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequential entrance animation
    Animated.sequence([
      // Logo fade in + scale
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Title
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Quote
      Animated.parallel([
        Animated.timing(quoteOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(quoteTranslateY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      // Button
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Decorative elements fade
    Animated.timing(decorOpacity, {
      toValue: 1,
      duration: 2000,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Slow star rotation
    Animated.loop(
      Animated.timing(starRotate, {
        toValue: 1,
        duration: 60000,
        useNativeDriver: true,
      })
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const starSpin = starRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScreenContainer gradient={true}>
      {/* Decorative Background Elements */}
      <Animated.View style={[styles.decorTopRight, { opacity: decorOpacity }]}>
        <GeometricDots size={80} color={Colors.emeraldBorder} opacity={0.06} />
      </Animated.View>
      <Animated.View style={[styles.decorBottomLeft, { opacity: decorOpacity }]}>
        <GeometricDots size={80} color={Colors.beigeBorder} opacity={0.04} />
      </Animated.View>
      <Animated.View style={[styles.decorCenter, { opacity: decorOpacity, transform: [{ rotate: starSpin }] }]}>
        <IslamicStar size={200} color={Colors.emeraldBorder} opacity={0.04} />
      </Animated.View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoGlow}>
            <CrescentIcon size={56} color={Colors.emerald} />
          </View>
          <View style={styles.logoStarAccent}>
            <StarIcon size={16} color={Colors.beige} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <Text style={styles.appName}>Huzur</Text>
          <Text style={styles.tagline}>Ruhani yol arkadaşın</Text>
        </Animated.View>

        {/* Quran Quote */}
        <Animated.View
          style={[
            styles.quoteContainer,
            {
              opacity: quoteOpacity,
              transform: [{ translateY: quoteTranslateY }],
            },
          ]}
        >
          <View style={styles.quoteDivider} />
          <Text style={styles.arabicQuote}>
            أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
          </Text>
          <Text style={styles.translationQuote}>
            "Biliniz ki, kalpler ancak Allah'ı{'\n'}anmakla huzur bulur."
          </Text>
          <Text style={styles.reference}>— Ar-Ra'd 13:28</Text>
          <View style={styles.quoteDivider} />
        </Animated.View>

        {/* CTA Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacity,
              transform: [{ translateY: buttonTranslateY }],
            },
          ]}
        >
          <GlowButton
            title="Bugün nasıl hissediyorsun?"
            onPress={async () => {
              try {
                await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
              } catch (e) {
                console.warn('Onboarding kalıcı kayıt yapılamadı:', e);
              }
              navigation.replace('Home');
            }}
          />
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },

  // Logo
  logoContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  logoGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.emeraldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  logoStarAccent: {
    position: 'absolute',
    top: -4,
    right: -4,
  },

  // Title
  appName: {
    fontSize: 42,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },

  // Quote
  quoteContainer: {
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.xxxl,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  quoteDivider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.emeraldBorder,
    marginVertical: Spacing.lg,
  },
  arabicQuote: {
    ...Typography.arabicMedium,
    marginBottom: Spacing.lg,
  },
  translationQuote: {
    ...Typography.translation,
    color: Colors.textSecondary,
  },
  reference: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.emerald,
    letterSpacing: 1,
    marginTop: Spacing.md,
  },

  // Button
  buttonContainer: {
    width: '100%',
    paddingHorizontal: Spacing.md,
  },

  // Decorations
  decorTopRight: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  decorBottomLeft: {
    position: 'absolute',
    bottom: 100,
    left: 20,
  },
  decorCenter: {
    position: 'absolute',
    top: height * 0.15,
    alignSelf: 'center',
  },
});
