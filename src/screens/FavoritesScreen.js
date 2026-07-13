import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { BackIcon, BookmarkIcon } from '../components/Icons';
import { IslamicStar } from '../components/IslamicPattern';
import GlowButton from '../components/GlowButton';
import BottomNavBar from '../components/BottomNavBar';
import EmptyState from '../components/EmptyState';
import { useToast } from '../contexts/ToastContext';
import ScreenContainer from '../components/ScreenContainer';
import {
  hydrateMoodFavorites,
  toggleMoodFavorite,
} from '../services/moodFavoritesStorage';
import { getBookmarks, toggleBookmark, getSurahVerses } from '../data/quranText';
import { getSurahById } from '../data/surahs';

export default function FavoritesScreen({ navigation }) {
  const [savedVerses, setSavedVerses] = useState([]);
  const { showToast } = useToast();

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;
  const emptyOpacity = useRef(new Animated.Value(0)).current;

  const reload = useCallback(async () => {
    const moodItems = await hydrateMoodFavorites();
    const quranBookmarks = await getBookmarks();
    
    const hydratedQuranBookmarks = [];
    for (const b of quranBookmarks) {
      const surah = getSurahById(b.surahId);
      const verses = await getSurahVerses(b.surahId);
      if (surah && verses) {
        const verse = verses.find((v) => v.id === b.verseId);
        if (verse) {
          hydratedQuranBookmarks.push({
            type: 'quran',
            surahId: b.surahId,
            verseId: b.verseId,
            timestamp: b.timestamp,
            verse: {
              id: verse.id,
              surahTr: surah.nameTr,
              ayah: verse.id,
              arabicText: verse.arabic,
              translationTr: verse.tr,
            },
            mood: { color: Colors.emerald } // fake mood for styling
          });
        }
      }
    }
    
    const combined = [...moodItems, ...hydratedQuranBookmarks].sort((a, b) => {
      const timeA = a.type === 'quran' ? (a.timestamp || 0) : (a.verseData?.savedAt || a.verse?.id || 0);
      const timeB = b.type === 'quran' ? (b.timestamp || 0) : (b.verseData?.savedAt || b.verse?.id || 0);
      return timeB - timeA;
    });

    setSavedVerses(combined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      headerOpacity.setValue(0);
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, [headerOpacity, reload]),
  );

  useEffect(() => {
    emptyOpacity.setValue(0);
    listOpacity.setValue(0);

    requestAnimationFrame(() => {
      if (savedVerses.length > 0) {
        Animated.parallel([
          Animated.timing(emptyOpacity, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(listOpacity, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.timing(emptyOpacity, {
          toValue: 1,
          duration: 500,
          delay: 150,
          useNativeDriver: true,
        }).start();
        Animated.timing(listOpacity, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [savedVerses, emptyOpacity, listOpacity]);

  const handleVersePress = (item) => {
    if (item.type === 'quran') {
      const surah = getSurahById(item.surahId);
      navigation.navigate('SurahDetail', { surah });
    } else {
      navigation.navigate('Verse', { mood: item.mood, verse: item.verse, fromFavorites: true });
    }
  };

  const promptRemove = (item) => {
    Alert.alert(
      'Kaydı kaldır',
      'Bu ayeti Kayıtlar listesinden çıkarmak ister misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            if (item.type === 'quran') {
              await toggleBookmark(item.surahId, item.verseId);
            } else {
              await toggleMoodFavorite(item.mood.id, item.verse);
            }
            await reload();
            showToast('Ayet kaydı kaldırıldı', 'info');
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer gradient={false} edges={['top']}>
      <LinearGradient
        colors={['#000000', '#060807', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Top emerald halo */}
      <View pointerEvents="none" style={styles.topHalo}>
        <LinearGradient
          colors={['rgba(212, 165, 116, 0.06)', 'rgba(212, 165, 116, 0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

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
          <BookmarkIcon size={18} color={Colors.beige} filled />
          <Text style={styles.headerTitle}>Kaydedilen Ayetler</Text>
        </View>

        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Counter */}
      <Animated.View style={[styles.counter, { opacity: headerOpacity }]}>
        <Text style={styles.counterText}>
          {savedVerses.length} ayet kaydedildi
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {savedVerses.length > 0 ? (
          <Animated.View style={{ opacity: listOpacity }}>
            {savedVerses.map((item) => (
            <TouchableOpacity
                key={item.verse.id}
                onPress={() => handleVersePress(item)}
                onLongPress={() => promptRemove(item)}
                delayLongPress={380}
                activeOpacity={0.8}
                style={styles.verseCard}
              >
                <View style={[styles.verseCardInner, { borderColor: `${item.mood.color}15` }]}>
                  {/* Top row */}
                  <View style={[styles.cardTopRow, { justifyContent: 'flex-end' }]}>
                    <Text style={styles.surahRef}>
                      {item.verse.surahTr} · {item.verse.ayah}
                    </Text>
                  </View>

                  {/* Arabic text */}
                  <Text style={styles.arabicText} numberOfLines={2}>
                    {item.verse.arabicText}
                  </Text>

                  {/* Translation */}
                  <Text style={styles.translationText} numberOfLines={2}>
                    {item.verse.translationTr}
                  </Text>

                  {/* Bottom accent */}
                  <View style={styles.cardBottomAccent}>
                    <View style={[styles.accentLine, { backgroundColor: `${item.mood.color}25` }]} />
                  </View>
                </View>
            </TouchableOpacity>
            ))}
          </Animated.View>
        ) : (
          /* Empty state */
          <EmptyState
            icon={<BookmarkIcon size={32} color={Colors.textMuted} />}
            title="Henüz kaydedilen ayet yok"
            message="Ayet ekranındaki yer imi simgesine dokunarak ayeti buraya ekleyebilirsiniz"
            actionLabel="Ayetleri Keşfet"
            onAction={() => navigation.navigate('MoodSelection')}
          />
        )}
      </ScrollView>
      <BottomNavBar activeTab="Favorites" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },

  topHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
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
    ...Shadows.sm,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },

  // Counter
  counter: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  counterText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 140,
  },

  // Verse cards
  verseCard: {
    marginBottom: 16,
  },
  verseCardInner: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 22,
    ...Shadows.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  surahRef: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  arabicText: {
    fontSize: 19,
    color: Colors.textArabic,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 34,
    marginBottom: 12,
  },
  translationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  cardBottomAccent: {
    marginTop: 16,
    alignItems: 'center',
  },
  accentLine: {
    width: 44,
    height: 2,
    borderRadius: 1,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 20,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
    paddingHorizontal: 40,
  },
});
