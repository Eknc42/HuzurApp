// LockScreenWidget — Concept visualization
// Shows how a daily verse widget would look on iOS lock screen
import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Colors, Shadows } from '../theme/colors';
import { BackIcon, CrescentIcon } from '../components/Icons';
import { IslamicStar } from '../components/IslamicPattern';
import BottomNavBar from '../components/BottomNavBar';
import { fetchDailyVerse } from '../utils/dailyVerse';

const { width, height } = Dimensions.get('window');

export default function LockScreenWidget({ navigation }) {
  const [daily, setDaily] = useState(null);

  // Animations
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const timeOpacity = useRef(new Animated.Value(0)).current;
  const timeScale = useRef(new Animated.Value(0.95)).current;
  const widgetOpacity = useRef(new Animated.Value(0)).current;
  const widgetTranslateY = useRef(new Animated.Value(20)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.05)).current;

  useEffect(() => {
    fetchDailyVerse().then(setDaily);

    // Sequential entrance
    Animated.sequence([
      // Screen fade in
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Time
      Animated.parallel([
        Animated.timing(timeOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(timeScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Widget
      Animated.parallel([
        Animated.timing(widgetOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(widgetTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Badge
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.12,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.05,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get current time
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const dateStr = now.toLocaleDateString('tr-TR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const [showInstructions, setShowInstructions] = useState(false);
  const instructionsOpacity = useRef(new Animated.Value(0)).current;

  const handleAddClick = () => {
    setShowInstructions(true);
    Animated.timing(instructionsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeInstructions = () => {
    Animated.timing(instructionsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowInstructions(false));
  };

  const isAndroid = Platform.OS === 'android';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Back button - floating */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <BackIcon size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Lock screen mockup */}
      <Animated.View style={[styles.lockScreen, { opacity: screenOpacity }]}>
        {/* Status bar mockup */}
        <View style={styles.statusBarMock}>
          <Text style={styles.statusTime}>{hours}:{minutes}</Text>
          <View style={styles.statusIcons}>
            <View style={styles.signalDot} />
            <View style={styles.signalDot} />
            <View style={styles.batteryBar} />
          </View>
        </View>

        {/* Time display */}
        <Animated.View
          style={[
            styles.timeContainer,
            {
              opacity: timeOpacity,
              transform: [{ scale: timeScale }],
            },
          ]}
        >
          <Text style={styles.timeText}>{hours}:{minutes}</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </Animated.View>

        {/* Widget */}
        <Animated.View
          style={[
            styles.widgetContainer,
            {
              opacity: widgetOpacity,
              transform: [{ translateY: widgetTranslateY }],
            },
          ]}
        >
          {/* Widget glow */}
          <Animated.View
            style={[styles.widgetGlow, { opacity: glowPulse }]}
          />

          <View style={styles.widget}>
            {/* Widget header */}
            <View style={styles.widgetHeader}>
              <CrescentIcon size={14} color={Colors.emerald} />
              <Text style={styles.widgetAppName}>HUZUR</Text>
              <View style={styles.widgetDot} />
              <Text style={styles.widgetLabel}>Günün Ayeti</Text>
            </View>

            {!daily ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Yükleniyor...</Text>
              </View>
            ) : (
              <>
                {/* Verse content */}
                <Text style={styles.widgetArabic}>
                  {daily.verse.arabicText}
                </Text>

                {/* Translation */}
                <Text 
                  style={styles.widgetTranslation} 
                  numberOfLines={3}
                >
                  {daily.verse.translationTr}
                </Text>

                {/* Reference */}
                <View style={styles.widgetFooter}>
                  <Text style={styles.widgetReference}>{daily.verse.surahTr} · {daily.verse.ayah}</Text>
                  <View style={styles.widgetStarAccent}>
                    <IslamicStar size={24} color={Colors.emeraldBorder} opacity={0.15} />
                  </View>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* Bottom indicators */}
        <View style={styles.bottomSection}>
          {/* Flashlight and Camera mockup */}
          <View style={styles.lockButtons}>
            <View style={styles.lockButtonMock}>
              <View style={styles.lockButtonIcon} />
            </View>
            <View style={styles.lockButtonMock}>
              <View style={styles.lockButtonIcon} />
            </View>
          </View>

          {/* Home indicator */}
          <View style={styles.homeIndicator} />
        </View>
      </Animated.View>

      {/* Settings Panel instead of Coming Soon Badge */}
      <Animated.View style={[styles.settingsPanel, { opacity: badgeOpacity }]}>
        <Text style={styles.panelTitle}>Günün Ayeti Widget'ı</Text>

        <Text style={styles.panelDescription}>
          Huzur uygulamasının widget'ını ana ekranınıza ekleyerek her gün özenle seçilen günün ayetini telefonunuzun ekranında görebilirsiniz.
        </Text>

        <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={handleAddClick}>
          <Text style={styles.addButtonText}>Nasıl Eklenir?</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Instructions Overlay */}
      {showInstructions && (
        <Animated.View style={[styles.instructionsOverlay, { opacity: instructionsOpacity }]}>
          <View style={styles.instructionsContent}>
            <View style={styles.instructionsIconWrapper}>
              <IslamicStar size={32} color={Colors.emerald} />
            </View>
            <Text style={styles.instructionsTitle}>Ana Ekrana Ekleme</Text>
            
            <View style={styles.instructionsSteps}>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                <Text style={styles.stepText}>Uygulamadan çıkıp cihazınızın ana ekranına dönün.</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                <Text style={styles.stepText}>Ekranda boş bir alana basılı tutarak düzenleme modunu açın.</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                <Text style={styles.stepText}>
                  {isAndroid 
                    ? "Alt menüden 'Widget'lar' veya 'Araç Takımları' seçeneğine dokunun." 
                    : "Ekranın üst köşesindeki '+' veya Ekle ikonuna dokunun."}
                </Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                <Text style={styles.stepText}>
                  Huzur uygulamasını bulup widget'ı dilediğiniz gibi ekrana yerleştirin.
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.gotItButton} activeOpacity={0.8} onPress={closeInstructions}>
              <Text style={styles.gotItButtonText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <BottomNavBar activeTab="" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Back button
  backButton: {
    position: 'absolute',
    top: 56,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Lock screen
  lockScreen: {
    width: width - 48,
    height: (width - 48) * 2,
    maxHeight: height * 0.75,
    backgroundColor: '#000000',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 220,
    ...Shadows.lg,
  },

  // Status bar mock
  statusBarMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 14,
    height: 44,
  },
  statusTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  batteryBar: {
    width: 22,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  // Time
  timeContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '200',
    color: '#ffffff',
    letterSpacing: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Widget
  widgetContainer: {
    paddingHorizontal: 20,
    marginTop: 32,
    position: 'relative',
  },
  widgetGlow: {
    position: 'absolute',
    top: -10,
    left: 10,
    right: 10,
    bottom: -10,
    backgroundColor: Colors.emerald,
    borderRadius: 24,
  },
  widget: {
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  widgetAppName: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.emerald,
    letterSpacing: 1.5,
  },
  widgetDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  widgetLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  widgetArabic: {
    fontSize: 18,
    color: Colors.textArabic,
    textAlign: 'center',
    lineHeight: 32,
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  widgetTranslation: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  widgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  widgetReference: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 0.5,
  },
  widgetStarAccent: {
    opacity: 0.8,
  },

  // Bottom section
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 12,
  },
  lockButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 44,
    marginBottom: 20,
  },
  lockButtonMock: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockButtonIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  homeIndicator: {
    width: 130,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Settings Panel
  settingsPanel: {
    position: 'absolute',
    bottom: 110,
    left: 24,
    right: 24,
    backgroundColor: Colors.bgCardSolid,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.md,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  panelDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: Colors.emerald,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Instructions Overlay
  instructionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  instructionsContent: {
    backgroundColor: Colors.bgCardSolid,
    width: '100%',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  instructionsIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.emerald}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${Colors.emerald}30`,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 24,
  },
  instructionsSteps: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  gotItButton: {
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  gotItButtonText: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '700',
  },
});
