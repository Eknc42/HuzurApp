// AmbientMixerScreen — Ambient Ses Karıştırıcı
// Doğa sesleri + Kur'an tilaveti birlikte çalabilir, glassmorphism tasarım
import React, { useRef, useState, useEffect } from 'react';
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
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { playAmbientSound, stopAmbientSound, setAmbientVolume, stopAllAmbientSounds, getActiveAmbientIds } from '../services/audioService';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.floor((width - Spacing.lg * 2 - Spacing.base) / 2);

// === Custom SVG icons for ambient sounds ===
const RainIcon = ({ size = 32, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 14a4 4 0 010-8 5 5 0 019.6-1.5A4.5 4.5 0 0117 14H7z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={`${color}18`} />
    <Line x1="8" y1="17" x2="7" y2="20" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <Line x1="12" y1="17" x2="11" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <Line x1="16" y1="17" x2="15" y2="20" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

const OceanIcon = ({ size = 32, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 17c2 0 2-1.5 4-1.5S8 17 10 17s2-1.5 4-1.5S16 17 18 17s2-1.5 4-1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <Path d="M2 12c2 0 2-1.5 4-1.5S8 12 10 12s2-1.5 4-1.5S16 12 18 12s2-1.5 4-1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    <Path d="M2 7c2 0 2-1.5 4-1.5S8 7 10 7s2-1.5 4-1.5S16 7 18 7s2-1.5 4-1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
  </Svg>
);

const TreeIcon = ({ size = 32, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3l-4 5h2l-3 4h2l-3 4h12l-3-4h2l-3-4h2l-4-5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={`${color}18`} />
    <Path d="M12 16v5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <Path d="M9 21h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

const WindIcon = ({ size = 32, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 8h11a3 3 0 100-6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <Path d="M3 12h17a3 3 0 110 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <Path d="M3 16h8a2.5 2.5 0 110 5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

const NightIcon = ({ size = 32, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 13.5A8.5 8.5 0 1110.5 3a7 7 0 0010.5 10.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={`${color}1a`} />
    <Circle cx="6" cy="7" r="0.7" fill={color} />
    <Circle cx="15" cy="5" r="0.5" fill={color} opacity="0.7" />
    <Circle cx="18" cy="19" r="0.6" fill={color} opacity="0.8" />
  </Svg>
);

const FireIcon = ({ size = 32, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22a6 6 0 006-6c0-3-2-5-3-7-1 2-2 3-3 3 0-2 .5-4 1-6-3 1-7 4-7 10a6 6 0 006 6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={`${color}22`} />
    <Path d="M12 19a3 3 0 003-3c0-1.5-1-2-1.5-3-.5 1-1 1.5-1.5 1.5 0-1 .3-1.5.5-2.5-1.5.5-3.5 2-3.5 4a3 3 0 003 3z" fill={color} opacity="0.4" />
  </Svg>
);

const AMBIENT_SOUNDS = [
  { id: 'rain', Icon: RainIcon, name: 'Yağmur', desc: 'Yumuşak yağmur damlaları', color: '#60a5fa' },
  { id: 'ocean', Icon: OceanIcon, name: 'Okyanus', desc: 'Sahil dalgaları', color: '#06b6d4' },
  { id: 'forest', Icon: TreeIcon, name: 'Orman', desc: 'Yaprakların hışırtısı', color: '#22c55e' },
  { id: 'wind', Icon: WindIcon, name: 'Rüzgar', desc: 'Hafif esinti', color: '#a78bfa' },
  { id: 'night', Icon: NightIcon, name: 'Gece', desc: 'Sakin gece sesleri', color: '#6366f1' },
  { id: 'fire', Icon: FireIcon, name: 'Ateş', desc: 'Çıtırdayan ateş', color: '#f97316' },
];

export default function AmbientMixerScreen({ navigation }) {
  const [activeSounds, setActiveSounds] = useState({});
  const [loadingSounds, setLoadingSounds] = useState({});
  const [errorSounds, setErrorSounds] = useState({});

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();
    Animated.timing(cardsOpacity, {
      toValue: 1, duration: 600, delay: 250, useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NOTE: Ambient sounds intentionally persist when leaving this screen,
  // so they continue playing in background while reading the Quran.
  // Use the explicit "Hepsini Durdur" action below or toggle each card off.

  // Sync state on mount with what's actually playing in background
  useEffect(() => {
    const activeIds = getActiveAmbientIds();
    if (activeIds.length > 0) {
      const restored = {};
      activeIds.forEach((id) => { restored[id] = 0.5; });
      setActiveSounds(restored);
    }
  }, []);

  const stopAll = () => {
    stopAllAmbientSounds();
    setActiveSounds({});
    setLoadingSounds({});
    setErrorSounds({});
  };

  const toggleSound = (soundId) => {
    setActiveSounds(prev => {
      const newState = { ...prev };
      if (newState[soundId]) {
        stopAmbientSound(soundId);
        delete newState[soundId];
        setLoadingSounds(p => { const n = { ...p }; delete n[soundId]; return n; });
        setErrorSounds(p => { const n = { ...p }; delete n[soundId]; return n; });
      } else {
        newState[soundId] = 0.5;
        setLoadingSounds(p => ({ ...p, [soundId]: true }));
        setErrorSounds(p => { const n = { ...p }; delete n[soundId]; return n; });
        playAmbientSound(soundId, 0.5, {
          onLoaded: () => setLoadingSounds(p => { const n = { ...p }; delete n[soundId]; return n; }),
          onError: () => {
            setLoadingSounds(p => { const n = { ...p }; delete n[soundId]; return n; });
            setErrorSounds(p => ({ ...p, [soundId]: true }));
            setActiveSounds(p => { const n = { ...p }; delete n[soundId]; return n; });
          },
        });
      }
      return newState;
    });
  };

  const updateVolume = (soundId, delta) => {
    setActiveSounds(prev => {
      const newVol = Math.max(0.1, Math.min(1, (prev[soundId] || 0.5) + delta));
      setAmbientVolume(soundId, newVol);
      return { ...prev, [soundId]: newVol };
    });
  };

  const activeCount = Object.keys(activeSounds).length;

  return (
    <ScreenContainer gradient={true}>
      <Animated.View style={{ opacity: headerOpacity }}>
        <Header
          title="Ambient Sesler"
          onBack={() => navigation.goBack()}
          onRightAction={activeCount > 0 ? stopAll : undefined}
          rightIcon={activeCount > 0 ? <Text style={styles.clearText}>Durdur</Text> : undefined}
        />
      </Animated.View>

      <Text style={styles.subtitle}>
        Kur'an tilavetiyle birlikte dinlenebilecek sakinleştirici doğa sesleri
      </Text>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: cardsOpacity }}
      >
        <View style={styles.grid}>
          {AMBIENT_SOUNDS.map((sound) => {
            const { Icon } = sound;
            const isActive = !!activeSounds[sound.id];
            const isLoading = !!loadingSounds[sound.id];
            const hasError = !!errorSounds[sound.id];
            const volume = activeSounds[sound.id] || 0;
            const iconColor = isActive ? sound.color : Colors.textSecondary;

            return (
              <TouchableOpacity
                key={sound.id}
                onPress={() => toggleSound(sound.id)}
                activeOpacity={0.75}
                style={styles.cardTouch}
                disabled={isLoading}
              >
                <View style={[
                  styles.card,
                  isActive && { borderColor: `${sound.color}50`, backgroundColor: `${sound.color}08` },
                  hasError && { borderColor: '#ef444450' },
                ]}>
                  {/* Active glow */}
                  {isActive && (
                    <>
                      <View style={[styles.cardGlow, { backgroundColor: sound.color }]} />
                    </>
                  )}

                  {/* Icon container */}
                  <View style={[
                    styles.iconWrap,
                    {
                      backgroundColor: isActive ? `${sound.color}18` : Colors.bgElevated,
                      borderColor: isActive ? `${sound.color}40` : Colors.borderSubtle,
                    },
                  ]}>
                    <Icon size={28} color={iconColor} />
                  </View>

                  {/* Name */}
                  <Text style={[
                    styles.cardName,
                    isActive && { color: sound.color },
                  ]}>
                    {sound.name}
                  </Text>
                  {!isActive && !hasError && (
                    <Text style={styles.cardDesc} numberOfLines={1}>{sound.desc}</Text>
                  )}
                  {isLoading && (
                    <Text style={[styles.cardDesc, { color: sound.color }]}>Yükleniyor...</Text>
                  )}
                  {hasError && (
                    <Text style={[styles.cardDesc, { color: '#ef4444' }]}>Yüklenemedi</Text>
                  )}

                  {/* Volume indicator */}
                  {isActive && (
                    <View style={styles.volumeControl}>
                      <TouchableOpacity
                        onPress={() => updateVolume(sound.id, -0.1)}
                        style={styles.volumeButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.volumeButtonText}>−</Text>
                      </TouchableOpacity>

                      <View style={styles.volumeBar}>
                        <View style={[
                          styles.volumeFill,
                          {
                            width: `${volume * 100}%`,
                            backgroundColor: sound.color,
                          },
                        ]} />
                      </View>

                      <TouchableOpacity
                        onPress={() => updateVolume(sound.id, 0.1)}
                        style={styles.volumeButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.volumeButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Active dot */}
                  {isActive && (
                    <View style={[styles.activeDot, { backgroundColor: sound.color }]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emerald,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
    lineHeight: 18,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  cardTouch: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 130,
    justifyContent: 'center',
    ...Shadows.sm,
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    left: '10%',
    right: '10%',
    height: 60,
    borderRadius: 30,
    opacity: 0.08,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Volume control
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    width: '100%',
  },
  volumeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  volumeBar: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Stop all button
  mixActions: {
    marginTop: 20,
  },
  stopButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderRadius: Radius.lg,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  stopButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 0.3,
  },
});
