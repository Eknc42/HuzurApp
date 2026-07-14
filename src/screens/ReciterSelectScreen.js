// ReciterSelectScreen — Hafız Seçim Ekranı (mp3quran.net API)
// 150+ hafız, arama, rivayet filtreleme, premium glassmorphism
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { PlayIcon, PauseIcon, StarIcon, HeartIcon } from '../components/Icons';
import { UserIcon, WidgetIcon } from '../components/IconsExtra';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import {
  getReciters,
  getDefaultMoshaf,
  getFeaturedReciters,
} from '../services/mp3quranApi';
import { RECITERS as STATIC_RECITERS } from '../data/reciters';
import { playSurahFromServer, stopRecitation } from '../services/audioService';
import { findQdcMatch } from '../services/verseTimingApi';

const { width } = Dimensions.get('window');


// Module-level pending selection (shared with parent screens)
let _pendingReciterSelection = null;
export function setPendingReciterSelection(reciter) {
  _pendingReciterSelection = reciter;
}
export function getPendingReciterSelection() {
  const selection = _pendingReciterSelection;
  _pendingReciterSelection = null; // consume once
  return selection;
}

const TABS = [
  { id: 'featured', label: 'Öne Çıkan', icon: StarIcon },
  { id: 'favorites', label: 'Favoriler', icon: HeartIcon },
  { id: 'all',      label: 'Tümü',      icon: WidgetIcon },
];

export default function ReciterSelectScreen({ navigation, route }) {
  const { currentReciterId, surahId } = route.params || {};
  const [allReciters, setAllReciters] = useState([]);
  const [displayList, setDisplayList] = useState([]);
  const [selectedId, setSelectedId] = useState(currentReciterId || null);
  const [playingId, setPlayingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('featured');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadFavorites();
    loadReciters();

    Animated.sequence([
      Animated.timing(headerOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      Animated.timing(listOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
    ]).start();

    return () => stopRecitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterReciters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allReciters, searchQuery, activeTab, favorites]);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem('@favorite_reciters');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Favoriler yüklenemedi:', e);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const newFavs = favorites.includes(id)
        ? favorites.filter(fId => fId !== id)
        : [...favorites, id];
      
      setFavorites(newFavs);
      await AsyncStorage.setItem('@favorite_reciters', JSON.stringify(newFavs));
    } catch (e) {
      console.warn('Favori kaydedilemedi:', e);
    }
  };

  const loadReciters = async () => {
    try {
      const data = await getReciters();
      
      // Fetch known static photos for popular reciters
      const staticPhotos = {};
      STATIC_RECITERS.forEach(r => {
        if (r.qdcId && r.photo) {
          staticPhotos[r.qdcId] = r.photo;
        }
      });

      // Annotate each reciter with a QDC id (if any) and keep ONLY those
      // that have a QDC equivalent — these are the reciters whose audio can
      // be perfectly synced with verse highlighting.
      const excludedNames = ['ibrahim aldosari', 'sami aldosari'];
      const valid = data
        .filter(r => r.moshaf && r.moshaf.length > 0)
        .map(r => {
          const qdcId = findQdcMatch(r.name || '', r.letter || '');
          const photo = qdcId && staticPhotos[qdcId] ? staticPhotos[qdcId] : null;
          return { ...r, qdcId, photo };
        })
        .filter(r => r.qdcId !== null)
        .filter(r => {
          const n = (r.name || '').toLowerCase();
          return !excludedNames.some(ex => n.includes(ex));
        });
      setAllReciters(valid);
    } catch (e) {
      console.warn('Hafız yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  };

  const filterReciters = () => {
    // "Seçkin 5" sekmesi: reciters.js'deki statik liste
    if (activeTab === 'static') {
      let list = STATIC_RECITERS.map(r => ({
        id: r.id,
        name: r.nameTr,
        nameEn: r.nameEn,
        photo: r.photo || null,
        qdcId: r.qdcId || null,
        moshaf: [{
          id: r.id,
          server: r.audioBaseUrl + '/',
          surah_total: 114,
          name: r.style,
        }],
        _isStatic: true,
        _reciterData: r,
      }));

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(r =>
          r.name.toLowerCase().includes(q) ||
          (r.nameEn || '').toLowerCase().includes(q)
        );
      }

      setDisplayList(list);
      return;
    }

    let list = allReciters;

    if (activeTab === 'featured') {
      list = getFeaturedReciters(allReciters);
    } else if (activeTab === 'favorites') {
      list = allReciters.filter(r => favorites.includes(r.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.name || '').toLowerCase().includes(q)
      );
    }

    // Alfabetik sırala
    list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    setDisplayList(list);
  };

  const handleSelect = useCallback((reciter) => {
    setSelectedId(reciter.id);

    // Önizlemeyi durdur
    stopRecitation();
    setPlayingId(null);

    // Statik (reciters.js) hafız ise doğrudan audioBaseUrl kullan
    if (reciter._isStatic) {
      const r = reciter._reciterData;
      setPendingReciterSelection({
        id: r.id,
        name: r.nameTr,
        moshaf: reciter.moshaf[0],
        server: r.audioBaseUrl + '/',
        qdcId: r.qdcId || null,
        photo: r.photo || null,
      });
      navigation.goBack();
      return;
    }

    const moshaf = getDefaultMoshaf(reciter);

    // Store selection and go back
    setPendingReciterSelection({
      id: reciter.id,
      name: reciter.name,
      moshaf,
      server: moshaf?.server || '',
      qdcId: reciter.qdcId, // for perfect verse-audio sync
      photo: reciter.photo || null,
    });
    navigation.goBack();
  }, [navigation]);

  const togglePreview = useCallback((reciter) => {
    if (playingId === reciter.id) {
      stopRecitation();
      setPlayingId(null);
    } else {
      const moshaf = getDefaultMoshaf(reciter);
      if (!moshaf) return;
      const previewSurah = surahId || 1; // Fatiha varsayılan
      setPlayingId(reciter.id);
      playSurahFromServer(moshaf.server, previewSurah, {
        onEnd: () => setPlayingId(null),
        onError: () => setPlayingId(null),
      });
    }
  }, [playingId, surahId]);

  const renderReciterItem = useCallback(({ item }) => {
    const isSelected = selectedId === item.id;
    const isPlaying = playingId === item.id;
    const moshaf = getDefaultMoshaf(item);
    const surahCount = moshaf?.surah_total || 0;
    const moshafCount = item.moshaf?.length || 0;
    const accentColor = isSelected ? Colors.emerald : Colors.textMuted;
    const isFav = favorites.includes(item.id);

    return (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        activeOpacity={0.8}
        style={styles.reciterCard}
        accessibilityRole="button"
        accessibilityLabel={`${item.name} hafızını seç`}
      >
        <View style={[
          styles.reciterInner,
          isSelected && { borderColor: `${Colors.emerald}40` },
        ]}>
          {isSelected && (
            <View style={styles.reciterGlow} />
          )}

          <View style={styles.reciterRow}>
            {/* Avatar */}
            <View style={[
              styles.reciterAvatar,
              { borderColor: isSelected ? Colors.emerald : Colors.borderSubtle },
              isSelected && { backgroundColor: `${Colors.emerald}12` },
            ]}>
              {item.photo ? (
                <Image
                  source={{ uri: item.photo }}
                  style={styles.reciterPhoto}
                  defaultSource={undefined}
                />
              ) : (
                <UserIcon
                  size={20}
                  color={accentColor}
                />
              )}
            </View>

            {/* Info */}
            <View style={styles.reciterInfo}>
              <Text style={[
                styles.reciterName,
                isSelected && { color: Colors.emerald },
              ]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.reciterMeta}>
                <Text style={styles.reciterStyle}>{surahCount} sure</Text>
                {moshafCount > 1 && (
                  <>
                    <View style={styles.metaDot} />
                    <Text style={styles.reciterStyle}>{moshafCount} rivayet</Text>
                  </>
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.reciterActions}>
              <TouchableOpacity
                onPress={() => toggleFavorite(item.id)}
                style={styles.favButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <HeartIcon 
                  size={20} 
                  color={isFav ? Colors.emerald : Colors.textMuted} 
                  filled={isFav} 
                />
              </TouchableOpacity>
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => togglePreview(item)}
                activeOpacity={0.7}
                style={[styles.previewButton, isPlaying && { borderColor: Colors.emerald }]}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? "Önizlemeyi durdur" : "Önizlemeyi başlat"}
              >
                {isPlaying ? (
                  <PauseIcon size={14} color={Colors.emerald} />
                ) : (
                  <PlayIcon size={14} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [selectedId, playingId, handleSelect, togglePreview, favorites]);

  return (
    <ScreenContainer gradient={true}>
      <Animated.View style={{ opacity: headerOpacity }}>
        <Header
          title="Hafız Seçimi"
          onBack={() => {
            stopRecitation();
            navigation.goBack();
          }}
        />
      </Animated.View>

      <Animated.View style={[styles.searchContainer, { opacity: headerOpacity }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Hafız ara..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive,
            ]}
          >
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.tabLabelActive,
            ]}>
              <tab.icon size={14} color={activeTab === tab.id ? Colors.white : Colors.textMuted} filled={activeTab === tab.id} />
              {'  '}{tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.emerald} />
          <Text style={styles.loadingText}>Hafızlar yükleniyor...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: listOpacity }}>
          <FlatList
            data={displayList}
            keyExtractor={(item) => `${item.id}`}
            extraData={favorites}
            renderItem={renderReciterItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
              </View>
            }
          />
        </Animated.View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.white,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 12,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },

  // Reciter card
  reciterCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  reciterInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reciterGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.emerald,
    opacity: 0.05,
  },
  reciterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  reciterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  reciterPhoto: {
    width: '100%',
    height: '100%',
  },
  reciterInfo: {
    flex: 1,
  },
  reciterName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reciterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reciterStyle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '400',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  reciterActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  favButton: {
    padding: 4,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.emerald,
  },
  previewButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});