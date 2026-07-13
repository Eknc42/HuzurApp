// AIExplanationScreen — Spiritual guidance UI
// Elegant explanation with word-by-word reveal animation
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { SparkleIcon } from '../components/Icons';
import AnimatedText from '../components/AnimatedText';
import GlowButton from '../components/GlowButton';
import BottomNavBar from '../components/BottomNavBar';
import ScreenContainer from '../components/ScreenContainer';
import Header, { HeaderIconButton } from '../components/Header';

export default function AIExplanationScreen({ route, navigation }) {
  const { mood, verse } = route.params || {};

  useEffect(() => {
    if (!verse?.id) {
      const t = setTimeout(() => navigation.replace('MoodSelection'), 0);
      return () => clearTimeout(t);
    }
  }, [verse?.id, navigation]);

  const [showExplanation, setShowExplanation] = useState(false);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const verseOpacity = useRef(new Animated.Value(0)).current;
  const verseTranslateY = useRef(new Animated.Value(20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  const sparkleScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!verse?.id || !mood?.id) return undefined;

    setShowExplanation(false);

    headerOpacity.setValue(0);
    verseOpacity.setValue(0);
    verseTranslateY.setValue(20);
    cardOpacity.setValue(0);
    cardTranslateY.setValue(30);
    sparkleRotate.setValue(0);
    sparkleScale.setValue(1);
    buttonOpacity.setValue(0);

    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(verseOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(verseTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => setShowExplanation(true));

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(sparkleRotate, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(sparkleScale, {
              toValue: 1.2,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleScale, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verse?.id, mood?.id]);

  if (!mood?.id || !verse?.id) {
    return (
      <ScreenContainer>
        <View style={styles.redirectCenter}>
          <ActivityIndicator color={Colors.emerald} />
          <Text style={styles.redirectText}>Ruha özel ayete yönlendiriliyorsunuz…</Text>
        </View>
      </ScreenContainer>
    );
  }

  const sparkleSpin = sparkleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleExplanationComplete = () => {
    Animated.timing(buttonOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ScreenContainer gradient={true}>
      <Animated.View style={{ opacity: headerOpacity }}>
        <Header
          title="Anlam"
          onBack={() => navigation.goBack()}
          centerContent={
            <View style={styles.headerCenter}>
              <Animated.View
                style={{
                  transform: [
                    { rotate: sparkleSpin },
                    { scale: sparkleScale },
                  ],
                }}
              >
                <SparkleIcon size={20} color={Colors.emerald} />
              </Animated.View>
              <Text style={styles.headerTitle}>Anlam</Text>
            </View>
          }
        />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verse Summary Card */}
        <Animated.View
          style={[
            styles.verseCard,
            {
              opacity: verseOpacity,
              transform: [{ translateY: verseTranslateY }],
              borderColor: `${mood.color}20`,
            },
          ]}
        >
          <Text style={styles.verseSurah}>
            {verse.surahTr} · {verse.ayah}
          </Text>
          <Text style={styles.verseArabicSmall}>{verse.arabicText}</Text>
          <Text style={styles.verseTranslation}>{verse.translationTr}</Text>
        </Animated.View>

        {/* AI Explanation Card */}
        <Animated.View
          style={[
            styles.explanationCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          {/* Card header */}
          <View style={styles.explanationHeader}>
            <View style={styles.aiIndicator}>
              <SparkleIcon size={14} color={Colors.emerald} />
            </View>
            <View style={styles.headerLabelWrap}>
              <Text style={styles.explanationLabel}>Manevi Yansıma</Text>
              <Text style={styles.aiDisclaimer}>Metin yapay zekâ üretmez; ilham kartları Huzur editörleri tarafından hazırlanmıştır.</Text>
            </View>
          </View>

          {/* Explanation text with typing effect */}
          <View style={styles.explanationContent}>
            {showExplanation ? (
              <AnimatedText
                text={verse.aiExplanation}
                style={styles.explanationText}
                delay={35}
                onComplete={handleExplanationComplete}
              />
            ) : (
              <View style={styles.loadingDots}>
                <View style={[styles.dot, { backgroundColor: Colors.emerald }]} />
                <View style={[styles.dot, { backgroundColor: Colors.emerald, opacity: 0.6 }]} />
                <View style={[styles.dot, { backgroundColor: Colors.emerald, opacity: 0.3 }]} />
              </View>
            )}
          </View>
        </Animated.View>

      </ScrollView>

      <BottomNavBar activeTab="AI" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  redirectCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  redirectText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Header Center
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 0.3,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 60,
  },

  // Verse summary
  verseCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    marginTop: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  verseSurah: {
    ...Typography.label,
    marginBottom: Spacing.md,
  },
  verseArabicSmall: {
    ...Typography.arabicSmall,
    marginBottom: Spacing.md,
  },
  verseTranslation: {
    ...Typography.translationSmall,
    fontStyle: 'italic',
  },

  // Explanation card
  explanationCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    marginTop: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerLabelWrap: {
    flex: 1,
    flexShrink: 1,
  },
  aiDisclaimer: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 6,
    lineHeight: 15,
    fontWeight: '400',
    opacity: 0.85,
  },
  aiIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.emeraldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  explanationContent: {
    padding: 24,
    minHeight: 100,
  },
  explanationText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 28,
    fontWeight: '400',
  },

  // Loading dots
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Bottom
  bottomButton: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
});
