// SurahDetailScreen — Ayet Okuma Ekranı
// Arapça + Türkçe, yer imi, son okunan kayıt, emerald vurgu efekti
// Çalma sırasında aktif ayet highlight
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { BackIcon, BookmarkIcon, CrescentIcon } from '../components/Icons';
import { HeadphonesIcon, MoonIcon, MixerIcon } from '../components/IconsExtra';
import { CornerAccent } from '../components/IslamicPattern';
import { getSurahVerses, saveLastRead, toggleBookmark, isBookmarked } from '../data/quranText';
import { getSurahById } from '../data/surahs';
import { 
  subscribeToVerseChanges, 
  playRecitation, 
  playSurahFromServerWithVerseTracking, 
  stopRecitation, 
  pauseRecitation, 
  resumeRecitation, 
  getRecitationCurrentTime, 
  getRecitationDuration, 
  seekRecitation, 
  stopAllAmbientSounds,
  subscribeToAudioControlActions,
  AUDIO_CONTROL_ACTIONS,
  requestBatteryOptimization
} from '../services/audioService';
import { PlayIcon, PauseIcon } from '../components/Icons';
import { getLastReciter, saveLastReciter } from '../services/mp3quranApi';
import { getPendingReciterSelection } from './ReciterSelectScreen';
import { usePremium } from '../contexts/PremiumContext';

const { width } = Dimensions.get('window');
const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

export default function SurahDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { surah, autoPlay, initialVerseId } = route.params;
  const [verses, setVerses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedVerses, setBookmarkedVerses] = useState({});
  const [activeVerse, setActiveVerse] = useState(initialVerseId || null);
  const [playingVerseId, setPlayingVerseId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reciterName, setReciterName] = useState('');
  const [audioDuration, setAudioDuration] = useState('0:00');
  const [audioProgress, setAudioProgress] = useState('0:00');
  const [progressValue, setProgressValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const scrollViewRef = useRef(null);
  const versePositions = useRef({});
  const progressBarWidth = useRef(0);
  const verseUnsubscribeRef = useRef(null);
  const surahIdRef = useRef(surah.id);
  const isPlayingRef = useRef(false);

  // İlk açılışta pil optimizasyonunu kapatma izni iste (Arka plan performansı için)
  useEffect(() => {
    requestBatteryOptimization();
  }, []);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const bismillahOpacity = useRef(new Animated.Value(0)).current;
  const bismillahScale = useRef(new Animated.Value(0.95)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSurah();

    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
    ]).start();

    // Subscribe to verse changes during playback
    verseUnsubscribeRef.current = subscribeToVerseChanges((verseInfo) => {
      if (verseInfo.surahId === surah.id) {
        setPlayingVerseId(verseInfo.verseId);
        saveLastRead(surah.id, verseInfo.verseId);
        // Scroll to center of verse
        const yPos = versePositions.current[verseInfo.verseId];
        if (yPos !== undefined && scrollViewRef.current) {
          // yPos is relative to the Animated.View.
          // By adding ~150-200px to the offset, we push the scrollview down more,
          // which makes the verse appear closer to the top of the screen.
          const offset = Math.max(0, yPos + 180);
          scrollViewRef.current.scrollTo({ y: offset, animated: true });
        }
      }
    });

    return () => {
      if (verseUnsubscribeRef.current) {
        verseUnsubscribeRef.current();
      }
    };
  }, [surah.id]);

  // Ref'leri güncel tut
  useEffect(() => { surahIdRef.current = surah.id; }, [surah.id]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Arka planda güvenli sure geçişi (UI render beklenmez)
  const playTargetSurahInBackground = async (targetId, shouldPlay) => {
    // Önce mevcut sesi ve tüm state'i temizle
    stopRecitation();
    setIsPlaying(false);
    setIsPaused(false);
    setAudioProgress('0:00');
    setProgressValue(0);
    setPlayingVerseId(null);

    const targetSurah = getSurahById(targetId);
    if (!targetSurah) {
      console.warn('playTargetSurahInBackground: surah not found for id', targetId);
      return;
    }
    navigation.setParams({ surah: targetSurah, autoPlay: shouldPlay });
    
    if (shouldPlay) {
      try {
        setLoading(true);
        const data = await getSurahVerses(targetId);
        setVerses(data);
        setLoading(false);
        // handlePlayPause'a doğrudan targetSurah ve data geçiyoruz,
        // böylece stale closure'dan bağımsız çalışır
        await handlePlayPause(true, targetSurah, data);
      } catch (e) {
        console.warn('playTargetSurahInBackground error:', e);
        setLoading(false);
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    if (autoPlay && !loading && verses && verses.length > 0) {
      const timer = setTimeout(() => {
        // UI açılışında force play (eğer arka plan tetiklememişse)
        handlePlayPause(true, surah, verses); 
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, loading, verses]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Sayfadan geri çıkıldığında (pop veya go_back) okumayı ve ambient sesleri durdur
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        stopRecitation();
        stopAllAmbientSounds();
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Bildirim ve harici medya kontrolleri ile uyum
  useEffect(() => {
    const unsub = subscribeToAudioControlActions((event) => {
      const { action } = event;
      if (action === AUDIO_CONTROL_ACTIONS.PAUSE) {
        pauseRecitation();
        setIsPaused(true);
      } else if (action === AUDIO_CONTROL_ACTIONS.PLAY) {
        resumeRecitation();
        setIsPaused(false);
        setIsPlaying(true);
      } else if (action === AUDIO_CONTROL_ACTIONS.STOP) {
        stopRecitation();
        setIsPlaying(false);
        setIsPaused(false);
      } else if (action === AUDIO_CONTROL_ACTIONS.NEXT) {
        // useRef ile her zaman güncel surahId'yi oku (stale closure önlenir)
        const currentId = surahIdRef.current;
        if (currentId < 114) {
          // Bildirimden geliyorsa her zaman çal (arka planda kullanıcı çalmayı bekliyordur)
          playTargetSurahInBackground(currentId + 1, true);
        }
      } else if (action === AUDIO_CONTROL_ACTIONS.PREVIOUS) {
        const currentId = surahIdRef.current;
        if (currentId > 1) {
          playTargetSurahInBackground(currentId - 1, true);
        }
      }
    });
    return unsub;
  }, [navigation]);

  // Canlı Oynatma İlerlemesi Takibi
  useEffect(() => {
    let interval;
    if (isPlaying && !isPaused && !isSeeking) {
      interval = setInterval(async () => {
        const current = await getRecitationCurrentTime();
        const dur = getRecitationDuration();
        if (dur > 0) {
           setProgressValue(current / dur);
           const m = Math.floor(current / 60);
           const s = Math.floor(current % 60);
           setAudioProgress(`${m}:${String(s).padStart(2, '0')}`);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isSeeking]);

  // Seek bar touch handlers
  const handleSeekEvent = (evt, isRelease = false) => {
    const locX = evt.nativeEvent.locationX;
    const width = progressBarWidth.current;
    if (width > 0) {
      const percentage = Math.max(0, Math.min(1, locX / width));
      setProgressValue(percentage);
      const dur = getRecitationDuration();
      
      const current = percentage * dur;
      const m = Math.floor(current / 60);
      const s = Math.floor(current % 60);
      setAudioProgress(`${m}:${String(s).padStart(2, '0')}`);

      if (isRelease) {
        seekRecitation(current);
        setIsSeeking(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      const pending = getPendingReciterSelection();
      if (pending) {
        setReciterName(pending.name);
        saveLastReciter(pending);
        // Stop current playing if any
        if (isPlaying) {
          handleStop();
        }
      }
    }, [isPlaying])
  );

  const loadSurah = async () => {
    setLoading(true);
    const data = await getSurahVerses(surah.id);
    setVerses(data);
    setLoading(false);
    
    // Save last read position immediately when opening the screen
    saveLastRead(surah.id, initialVerseId || 1);

    // Check bookmarks for each verse
    if (data) {
      const bm = {};
      for (const v of data) {
        bm[v.id] = await isBookmarked(surah.id, v.id);
      }
      setBookmarkedVerses(bm);
    }

    // Animate content in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(bismillahOpacity, {
          toValue: 1, duration: 700, useNativeDriver: true,
        }),
        Animated.spring(bismillahScale, {
          toValue: 1, tension: 40, friction: 8, useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.timing(contentOpacity, {
      toValue: 1, duration: 600, delay: 500, useNativeDriver: true,
    }).start();
  };

  const handleBookmark = async (verseId) => {
    await toggleBookmark(surah.id, verseId);
    setBookmarkedVerses(prev => ({
      ...prev,
      [verseId]: !prev[verseId],
    }));
  };

  const handleVersePress = (verseId) => {
    setActiveVerse(activeVerse === verseId ? null : verseId);
    saveLastRead(surah.id, verseId);
  };

  // Load reciter name
  useEffect(() => {
    (async () => {
      try {
        const rec = await getLastReciter();
        if (rec && rec.name) setReciterName(rec.name);
        else setReciterName('Yasser Al-Dosari');
      } catch { setReciterName('Yasser Al-Dosari'); }
    })();
  }, []);

  const handlePlayPause = async (forcePlay = false, overrideSurah = null, overrideVerses = null) => {
    const activeSurah = overrideSurah || surah;
    const activeVerses = overrideVerses || verses;

    if (!forcePlay && isPlaying && !isPaused) {
      pauseRecitation();
      setIsPaused(true);
      return;
    }
    if (!forcePlay && isPaused) {
      resumeRecitation();
      setIsPaused(false);
      return;
    }
    // Start playing
    setIsPlaying(true);
    setIsPaused(false);
    try {
      const rec = await getLastReciter();
      if (rec && rec.name) setReciterName(rec.name);
      
      const callbacks = {
        onLoaded: ({ duration }) => {
          const m = Math.floor(duration / 60);
          const s = Math.floor(duration % 60);
          setAudioDuration(`${m}:${String(s).padStart(2, '0')}`);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setAudioProgress('0:00');
          // Move to next Surah automatically
          if (activeSurah.id < 114) {
            playTargetSurahInBackground(activeSurah.id + 1, true);
          }
        },
        onError: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
      };

      if (rec?.server) {
        await playSurahFromServerWithVerseTracking(
          rec.server,
          activeSurah.id,
          activeVerses || [],
          callbacks,
          rec.qdcId || null
        );
      } else {
        const verseId = activeVerses && activeVerses.length > 0 ? activeVerses[0].id : 1;
        const reciterId = rec?.audioId || 'ar.abdurrahmaansudais';
        playRecitation(activeSurah.id, verseId, reciterId, callbacks);
      }
    } catch (e) {
      console.warn('Play error:', e);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    stopRecitation();
    setIsPlaying(false);
    setIsPaused(false);
    setAudioProgress('0:00');
    setPlayingVerseId(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <LinearGradient
        colors={['#000000', '#050d08', '#030705', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <BackIcon size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{surah.nameTr}</Text>
          <Text style={styles.headerSub}>{surah.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerRightButton}
          activeOpacity={0.7}
          onPress={() => {
            const firstVerse = verses && verses.length > 0 ? verses[0] : null;
            navigation.navigate('ReciterSelect', { surah, verse: firstVerse });
          }}
        >
          <HeadphonesIcon size={20} color={Colors.emerald} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Surah Info Card */}
        <Animated.View
          style={{
            opacity: bismillahOpacity,
            transform: [{ scale: bismillahScale }],
          }}
        >
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['#0a0f0d', '#0d1510', '#0a0f0d']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.infoBorder} />

            <View style={styles.infoCornerTL}>
              <CornerAccent size={18} color={Colors.emerald} opacity={0.2} rotation={0} />
            </View>
            <View style={styles.infoCornerBR}>
              <CornerAccent size={18} color={Colors.emerald} opacity={0.2} rotation={180} />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoArabicName}>{surah.name}</Text>
              <Text style={styles.infoTurkishName}>{surah.nameTr} Suresi</Text>
              <View style={styles.infoMeta}>
                <Text style={styles.infoMetaText}>{surah.meaning}</Text>
                <View style={styles.infoMetaDot} />
                <Text style={styles.infoMetaText}>{surah.verseCount} Ayet</Text>
                <View style={styles.infoMetaDot} />
                <Text style={styles.infoMetaText}>{surah.type}</Text>
              </View>

              {/* Bismillah (skip for Tevbe) */}
              {surah.id !== 9 && (
                <View style={styles.bismillahContainer}>
                  <View style={styles.bismillahLine} />
                  <Text style={styles.bismillahText}>{BISMILLAH}</Text>
                  <View style={styles.bismillahLine} />
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Verses */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.emerald} />
            <Text style={styles.loadingText}>Ayetler yükleniyor...</Text>
          </View>
        ) : verses ? (
          <Animated.View style={{ opacity: contentOpacity }}>
            {verses.map((verse) => {
              const isActive = activeVerse === verse.id;
              const isSaved = bookmarkedVerses[verse.id];
              const isPlaying = playingVerseId === verse.id;

              return (
                <TouchableOpacity
                  key={verse.id}
                  onPress={() => handleVersePress(verse.id)}
                  activeOpacity={0.85}
                  onLayout={(e) => {
                    versePositions.current[verse.id] = e.nativeEvent.layout.y;
                  }}
                  style={[
                    styles.verseCard,
                    isActive && styles.verseCardActive,
                    isPlaying && styles.verseCardPlaying,
                  ]}
                >
                  {/* Playing indicator glow */}
                  {isPlaying && (
                    <View style={styles.versePlayingGlow} />
                  )}

                  {/* Active background is handled by verseCardActive style */}

                  {/* Verse header */}
                  <View style={styles.verseHeader}>
                    <View style={[
                      styles.verseNumberBadge,
                      isActive && styles.verseNumberBadgeActive,
                      isPlaying && styles.verseNumberBadgePlaying,
                    ]}>
                      <Text style={[
                        styles.verseNumber,
                        isActive && styles.verseNumberActive,
                        isPlaying && styles.verseNumberPlaying,
                      ]}>
                        {verse.id}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleBookmark(verse.id)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <BookmarkIcon
                        size={18}
                        color={isSaved ? Colors.emerald : Colors.textMuted}
                        filled={isSaved}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Arabic text */}
                  <Text style={[
                    styles.verseArabic,
                    isPlaying && styles.verseArabicPlaying,
                  ]}>
                    {verse.arabic}
                  </Text>

                  {/* Turkish translation */}
                  <Text style={[
                    styles.verseTurkish,
                    isPlaying && styles.verseTurkishPlaying,
                  ]}>
                    {verse.tr}
                  </Text>

                  {/* Divider */}
                  <View style={styles.verseDivider}>
                    <View style={[
                      styles.verseDividerLine,
                      isPlaying && { backgroundColor: Colors.emerald },
                    ]} />
                    <View style={[
                      styles.verseDividerDot,
                      isActive && { backgroundColor: Colors.emerald },
                      isPlaying && { backgroundColor: Colors.emeraldLight },
                    ]} />
                    <View style={[
                      styles.verseDividerLine,
                      isPlaying && { backgroundColor: Colors.emerald },
                    ]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Ayetler yüklenemedi. İnternet bağlantınızı kontrol edin.
            </Text>
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Bottom Player Bar */}
      <View style={[
        styles.playerBar,
        { paddingBottom: Math.max(16, insets.bottom + 8) }
      ]}>
        <LinearGradient
          colors={['#0d1510', '#0a0f0d']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.playerBarBorder} />



        {/* Track info and Slider */}
        <View style={styles.playerTrackRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.playerTrackTitle} numberOfLines={1}>
              {surah.nameTr} Suresi
            </Text>
            <Text style={styles.playerTrackSub} numberOfLines={1}>
              {reciterName || 'Yasser Al-Dosari'}
            </Text>
          </View>
        </View>

        {/* Live Progress Bar */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderTimeText}>{audioProgress}</Text>
          <View
            style={styles.sliderTrackArea}
            onLayout={(e) => {
              progressBarWidth.current = e.nativeEvent.layout.width;
            }}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              setIsSeeking(true);
              handleSeekEvent(e, false);
            }}
            onResponderMove={(e) => handleSeekEvent(e, false)}
            onResponderRelease={(e) => handleSeekEvent(e, true)}
          >
            <View style={styles.sliderTrack} pointerEvents="none">
              <View style={[styles.sliderFill, { width: `${progressValue * 100}%` }]} />
              <View style={[styles.sliderThumb, { left: `${progressValue * 100}%` }]} />
            </View>
          </View>
          <Text style={styles.sliderTimeText}>{audioDuration}</Text>
        </View>

        {/* Controls */}
        <View style={styles.playerControls}>
          {/* Ambient Sounds */}
          <TouchableOpacity 
            onPress={() => {
              if (isPremium) navigation.navigate('AmbientMixer');
              else navigation.navigate('Paywall');
            }} 
            style={styles.actionButton} 
            activeOpacity={0.7}
          >
            <MixerIcon size={24} color={Colors.emerald} />
          </TouchableOpacity>

          {/* Previous */}
          <TouchableOpacity
            onPress={() => {
              if (surah.id > 1) {
                playTargetSurahInBackground(surah.id - 1, isPlaying);
              }
            }}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>⟨⟨</Text>
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            onPress={() => handlePlayPause()}
            activeOpacity={0.7}
            style={styles.playButton}
          >
            <View style={styles.playButtonInner}>
              {isPlaying && !isPaused ? (
                <PauseIcon size={28} color={Colors.white} />
              ) : (
                <PlayIcon size={28} color={Colors.white} />
              )}
            </View>
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity
            onPress={() => {
              if (surah.id < 114) {
                playTargetSurahInBackground(surah.id + 1, isPlaying);
              }
            }}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>⟩⟩</Text>
          </TouchableOpacity>

          {/* Sleep Mode */}
          <TouchableOpacity
            onPress={() => {
              if (isPremium) navigation.navigate('SleepMode');
              else navigation.navigate('Paywall');
            }}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <MoonIcon size={24} color={Colors.emerald} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textArabic,
    marginTop: 2,
    fontWeight: '400',
  },
  headerRightButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.emeraldMuted,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Info card
  infoCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    ...Shadows.md,
  },
  infoBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  infoCornerTL: { position: 'absolute', top: 10, left: 10 },
  infoCornerBR: { position: 'absolute', bottom: 10, right: 10 },
  infoContent: {
    padding: 28,
    alignItems: 'center',
  },
  infoArabicName: {
    fontSize: 28,
    color: Colors.textArabic,
    fontWeight: '400',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  infoTurkishName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  infoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  infoMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  infoMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  bismillahContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  bismillahLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.emeraldBorder,
  },
  bismillahText: {
    fontSize: 18,
    color: Colors.textArabic,
    fontWeight: '400',
    writingDirection: 'rtl',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Verse cards
  verseCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: 8,
    padding: 20,
    borderRadius: Radius.lg,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  verseCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  verseCardPlaying: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
  },
  versePlayingGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.emerald,
    opacity: 0.05,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verseNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseNumberBadgeActive: {
    backgroundColor: Colors.emeraldMuted,
    borderColor: Colors.emeraldBorder,
  },
  verseNumberBadgePlaying: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.emerald,
  },
  verseNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  verseNumberActive: {
    color: Colors.emerald,
  },
  verseNumberPlaying: {
    color: Colors.emerald,
  },
  verseArabic: {
    ...Typography.arabicLarge,
    fontSize: 24,
    lineHeight: 48,
    marginBottom: 16,
    color: Colors.textPrimary,
  },
  verseArabicPlaying: {
    color: Colors.emerald,
  },
  verseTurkish: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  verseTurkishPlaying: {
    color: Colors.emeraldLight,
  },
  verseDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verseDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  verseDividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginHorizontal: 8,
    opacity: 0.3,
  },

  // Player Bar
  playerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.emeraldBorder,
    overflow: 'hidden',
  },
  playerBarBorder: {
    ...StyleSheet.absoluteFillObject,
  },

  playerTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 10,
  },
  playerTrackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  playerTrackSub: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 2,
  },
  
  // Custom Slider
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  sliderTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    minWidth: 32,
    textAlign: 'center',
  },
  sliderTrackArea: {
    flex: 1,
    height: 24, // Touch hit area
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.emerald,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginLeft: -6,
    ...Shadows.sm,
  },

  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 4,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  playButton: {
    ...Shadows.glowEmerald,
  },
  playButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.emeraldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
