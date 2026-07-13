// RadioScreen — Canlı Kur'an Radyosu
// Premium glassmorphism tasarım, equalizer animasyonu, kategori filtreleme
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { StarIcon, SparkleIcon, CompassIcon } from '../components/Icons';
import { PlayIcon, PauseIcon } from '../components/Icons';
import { BookOpenIcon, RadioTowerIcon } from '../components/IconsExtra';
import LinearGradient from 'react-native-linear-gradient';
import BottomNavBar from '../components/BottomNavBar';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { getRadios, categorizeRadios } from '../services/mp3quranApi';
import {
  playRadio,
  stopRadio,
  subscribeToAudioControlActions,
  AUDIO_CONTROL_ACTIONS,
} from '../services/audioService';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'featured', label: 'Öne Çıkan', Icon: StarIcon },
  { id: 'reciters', label: 'Hafızlar', Icon: SparkleIcon },
  { id: 'islamic', label: 'İslami', Icon: BookOpenIcon },
  { id: 'quranTranslation', label: 'Çeviriler', Icon: CompassIcon },
];

// Animated equalizer bars
function EqualizerBars({ isActive }) {
  const bar1 = useRef(new Animated.Value(4)).current;
  const bar2 = useRef(new Animated.Value(10)).current;
  const bar3 = useRef(new Animated.Value(6)).current;
  const bar4 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!isActive) return;

    const animateBar = (bar, min, max, dur) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: max, duration: dur, useNativeDriver: false }),
          Animated.timing(bar, { toValue: min, duration: dur + 100, useNativeDriver: false }),
        ])
      );

    const a1 = animateBar(bar1, 3, 14, 300);
    const a2 = animateBar(bar2, 4, 16, 250);
    const a3 = animateBar(bar3, 3, 12, 350);
    const a4 = animateBar(bar4, 4, 14, 280);

    a1.start(); a2.start(); a3.start(); a4.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); a4.stop(); };
  }, [bar1, bar2, bar3, bar4, isActive]);

  if (!isActive) return null;

  return (
    <View style={styles.eqBarsContainer}>
      {[bar1, bar2, bar3, bar4].map((bar, i) => (
        <Animated.View
          key={i}
          style={[styles.eqAnimBar, { height: bar }]}
        />
      ))}
    </View>
  );
}

export default function RadioScreen({ navigation }) {
  const [radios, setRadios] = useState([]);
  const [categorized, setCategorized] = useState({});
  const [activeCategory, setActiveCategory] = useState('featured');
  const [currentRadio, setCurrentRadio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const insets = useSafeAreaInsets();

  // Mount tracking — race condition koruması
  const isMountedRef = useRef(true);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const playerTranslateY = useRef(new Animated.Value(80)).current;
  const playerOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  const loadRadios = async () => {
    try {
      const data = await getRadios();
      setRadios(data);
      setCategorized(categorizeRadios(data));
    } catch (e) {
      console.warn('Radyo yükleme hatası:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const showPlayer = () => {
    Animated.parallel([
      Animated.spring(playerTranslateY, {
        toValue: 0, tension: 60, friction: 10, useNativeDriver: true,
      }),
      Animated.timing(playerOpacity, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),
    ]).start();
  };

  const hidePlayer = useCallback(() => {
    Animated.parallel([
      Animated.timing(playerTranslateY, {
        toValue: 80, duration: 200, useNativeDriver: true,
      }),
      Animated.timing(playerOpacity, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }),
    ]).start();
  }, [playerOpacity, playerTranslateY]);

  useEffect(() => {
    loadRadios();

    Animated.stagger(200, [
      Animated.timing(headerOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
      Animated.timing(listOpacity, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1, duration: 2000, useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3, duration: 2000, useNativeDriver: true,
        }),
      ])
    ).start();

    const unsubscribeBlur = navigation.addListener('blur', () => {
      // Radyo sayfasından çıkıldığında radyoyu durdur
      stopRadio();
      setIsPlaying(false);
      setCurrentRadio(null);
      hidePlayer();
    });

    return () => {
      isMountedRef.current = false;
      unsubscribeBlur();
    };
  }, [headerOpacity, listOpacity, glowPulse, navigation, hidePlayer]);

  useEffect(() => {
    const unsubscribe = subscribeToAudioControlActions((event) => {
      if (!isMountedRef.current) return;
      
      if (event?.action === AUDIO_CONTROL_ACTIONS.STOP) {
        setIsPlaying(false);
        setCurrentRadio(null);
        hidePlayer();
      } else if (event?.action === AUDIO_CONTROL_ACTIONS.PAUSE) {
        if (isPlaying) {
          stopRadio();
          setIsPlaying(false);
        }
      } else if (event?.action === AUDIO_CONTROL_ACTIONS.PLAY) {
        if (currentRadio && !isPlaying) {
          // Re-connect to the current radio
          setIsConnecting(true);
          playRadio(currentRadio.url, {
            onLoaded: () => {
              if (!isMountedRef.current) return;
              setIsPlaying(true);
              setIsConnecting(false);
            },
            onError: () => {
              if (!isMountedRef.current) return;
              setIsConnecting(false);
              setIsPlaying(false);
            },
          });
        }
      }
    });

    return unsubscribe;
  }, [hidePlayer, isPlaying, currentRadio]);

  const toggleRadio = useCallback((radio) => {
    if (currentRadio?.id === radio.id && isPlaying) {
      stopRadio();
      setIsPlaying(false);
      setCurrentRadio(null);
      hidePlayer();
    } else {
      setCurrentRadio(radio);
      setIsPlaying(false);
      setIsConnecting(true);
      showPlayer();

      playRadio(radio.url, {
        onLoaded: () => {
          if (!isMountedRef.current) return;
          setIsPlaying(true);
          setIsConnecting(false);
        },
        onError: () => {
          if (!isMountedRef.current) return;
          setIsConnecting(false);
          setIsPlaying(false);
          setCurrentRadio(null);
          hidePlayer();
          Alert.alert('Bağlantı Hatası', 'Radyo yayınına bağlanılamadı veya yayın şu an aktif değil.');
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRadio?.id, isPlaying, hidePlayer]);

  const stopCurrentRadio = () => {
    stopRadio();
    if (!isMountedRef.current) return;
    setIsPlaying(false);
    setCurrentRadio(null);
    hidePlayer();
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const currentList = categorized[activeCategory] || [];

  const renderRadioItem = useCallback(({ item, index }) => {
    const isActive = currentRadio?.id === item.id;
    const playing = isActive && isPlaying;

    return (
      <TouchableOpacity
        onPress={() => toggleRadio(item)}
        activeOpacity={0.7}
        style={styles.radioItem}
        accessibilityRole="button"
        accessibilityLabel={`${item.name} radyosunu çal`}
      >
        <LinearGradient
          colors={isActive
            ? ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.02)']
            : ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.005)']
          }
          style={[
            styles.radioCard,
            isActive && styles.radioCardActive,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Left: Number / Equalizer */}
          <View style={[
            styles.radioIconWrap,
            isActive && styles.radioIconWrapActive,
          ]}>
            {playing ? (
              <EqualizerBars isActive={true} />
            ) : isActive && isConnecting ? (
              <ActivityIndicator size="small" color={Colors.emerald} />
            ) : (
              <Text style={[
                styles.radioNumber,
                isActive && { color: Colors.emerald },
              ]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
            )}
          </View>

          {/* Center: Info */}
          <View style={styles.radioInfo}>
            <Text
              style={[styles.radioName, isActive && styles.radioNameActive]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text style={styles.radioMeta}>
              {playing ? '🔴  Canlı yayın' : isActive && isConnecting ? '⏳  Bağlanıyor...' : 'Canlı radyo'}
            </Text>
          </View>

          {/* Right: Play indicator */}
          <View style={[
            styles.playIndicator,
            isActive && styles.playIndicatorActive,
          ]}>
            <Text style={[
              styles.playIcon,
              isActive && { color: Colors.emerald },
            ]}>
              {playing ? '⏸' : '▶'}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }, [currentRadio?.id, isPlaying, isConnecting, toggleRadio]);

  return (
    <ScreenContainer gradient={true}>
      <Animated.View style={{ opacity: headerOpacity }}>
        <Header
          title="Kur'an Radyosu"
          onBack={() => navigation.goBack()}
          centerContent={
            <View style={styles.headerCenter}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>CANLI</Text>
              </View>
              <Text style={styles.headerTitle}>Kur'an Radyosu</Text>
            </View>
          }
        />
      </Animated.View>

      <View style={styles.categoryContainer}>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.Icon;
            const isActive = activeCategory === cat.id;

            return (
              <Pressable
                key={cat.id}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                onPress={() => handleCategoryChange(cat.id)}
              >
                <View style={[styles.categoryIconWrap, isActive && styles.categoryIconWrapActive]}>
                  <Icon size={16} color={isActive ? Colors.emerald : 'rgba(245,245,240,0.6)'} />
                </View>
                <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Count badge */}
      <View style={styles.countRow}>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {currentList.length} radyo
          </Text>
        </View>
      </View>

      {/* Radio list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.emerald} />
          <Text style={styles.loadingText}>Radyolar yükleniyor...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: listOpacity }}>
          <FlatList
            data={currentList}
            keyExtractor={(item) => `radio_${item.id}`}
            renderItem={renderRadioItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📡</Text>
                <Text style={styles.emptyText}>Bu kategoride radyo bulunamadı</Text>
              </View>
            }
          />
        </Animated.View>
      )}

      {/* Now Playing Bar */}
      {currentRadio && (
        <Animated.View style={[
          styles.nowPlayingBar,
          {
            bottom: Math.max(105, insets.bottom + 85),
            transform: [{ translateY: playerTranslateY }],
            opacity: playerOpacity,
          },
        ]}>
          <LinearGradient
            colors={['rgba(16,30,22,0.98)', 'rgba(8,15,10,0.99)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.nowPlayingContent}>
            {/* Live indicator */}
            <View style={styles.nowPlayingLeft}>
              {isPlaying ? (
                <Animated.View style={[styles.livePulse, { opacity: glowPulse }]}>
                  <View style={styles.liveDot} />
                </Animated.View>
              ) : (
                <ActivityIndicator size="small" color={Colors.emerald} />
              )}
              <View style={styles.nowPlayingInfo}>
                <Text style={styles.nowPlayingName} numberOfLines={1}>
                  {currentRadio.name}
                </Text>
                <Text style={styles.nowPlayingStatus}>
                  {isPlaying ? 'Canlı yayın dinleniyor' : 'Bağlanıyor...'}
                </Text>
              </View>
            </View>

            {/* Stop */}
            <TouchableOpacity
              onPress={stopCurrentRadio}
              style={styles.stopButton}
              activeOpacity={0.7}
            >
              <View style={styles.stopIcon} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <BottomNavBar activeTab="Radio" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f5f5f0',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(245,245,240,0.35)',
    marginTop: 1,
  },

  // Category Header
  categoryContainer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgSurface,
  },
  categoryTabActive: {
    backgroundColor: Colors.emeraldTint,
    borderColor: Colors.borderEmerald,
  },
  categoryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  categoryIconWrapActive: {
    backgroundColor: 'rgba(16,185,129,0.14)',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(245,245,240,0.5)',
    letterSpacing: 0.2,
  },
  categoryLabelActive: {
    color: Colors.emerald,
    fontWeight: '600',
  },

  // Count
  countRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  countBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgSurface,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(245,245,240,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(245,245,240,0.35)',
    marginTop: 14,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 240,
  },

  // Radio item
  radioItem: {
    marginBottom: 6,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 12,
  },
  radioCardActive: {
    borderColor: 'rgba(16,185,129,0.15)',
    backgroundColor: 'rgba(16,185,129,0.05)',
  },

  // Icon
  radioIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIconWrapActive: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  radioNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(245,245,240,0.4)',
    fontVariant: ['tabular-nums'],
  },

  // Equalizer
  eqBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 18,
  },
  eqAnimBar: {
    width: 3,
    backgroundColor: Colors.emerald,
    borderRadius: 1.5,
  },

  // Info
  radioInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  radioName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e5e5e5',
    letterSpacing: 0.2,
  },
  radioNameActive: {
    color: Colors.emerald,
    fontWeight: '600',
  },
  radioMeta: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(245,245,240,0.4)',
    marginTop: 2,
  },

  // Play
  playIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIndicatorActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  playIcon: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },

  // Empty
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(245,245,240,0.3)',
  },

  // Now Playing
  nowPlayingBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    overflow: 'hidden',
    elevation: 10,
    zIndex: 100,
    shadowColor: Colors.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  nowPlayingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  nowPlayingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  livePulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f5f5f0',
  },
  nowPlayingStatus: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.emerald,
    marginTop: 2,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(245,245,240,0.5)',
  },
});
