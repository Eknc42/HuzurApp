// QuranScreen — Sure Listesi ve Arama + Sayfa Görünümü Tab
// Premium glassmorphism tasarım, "Okumaya Devam Et" kartı, staggered animasyonlar
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  TextInput,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { BackIcon, BookmarkIcon, CrescentIcon } from '../components/Icons';
import { SearchIcon, ChevronRightIcon, BookOpenIcon } from '../components/IconsExtra';
import { IslamicStar, CornerAccent } from '../components/IslamicPattern';
import { SURAHS, searchSurahs } from '../data/surahs';
import { getLastRead } from '../data/quranText';
import PressableScale from '../components/PressableScale';
import SearchBar from '../components/SearchBar';
import ListItem, { NumberBadge } from '../components/ListItem';
import { SurahListSkeleton } from '../components/LoadingSkeleton';
import ScreenContainer from '../components/ScreenContainer';

const { width } = Dimensions.get('window');

export default function QuranScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSurahs, setFilteredSurahs] = useState(SURAHS);
  const [lastRead, setLastRead] = useState(null);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-15)).current;
  const continueOpacity = useRef(new Animated.Value(0)).current;
  const continueTranslateY = useRef(new Animated.Value(20)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      // Refresh last read on focus
      getLastRead().then(data => setLastRead(data));
    }, [])
  );

  useEffect(() => {
    // Animations
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0, duration: 500, useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.timing(continueOpacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
        Animated.timing(continueTranslateY, {
          toValue: 0, duration: 600, useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.timing(listOpacity, {
      toValue: 1, duration: 600, delay: 450, useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search handler
  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    setFilteredSurahs(searchSurahs(text));
  }, []);

  const handleSurahPress = useCallback((surah) => {
    navigation.navigate('SurahDetail', { surah });
  }, [navigation]);

  const lastReadSurah = lastRead ? SURAHS.find(s => s.id === lastRead.surahId) : null;

  // Surah list item
  const renderSurahItem = useCallback(({ item, index }) => (
    <ListItem
      leading={<NumberBadge number={item.id} />}
      title={item.nameTr}
      subtitle={`${item.meaning} · ${item.verseCount} ayet · ${item.type}`}
      trailing={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.surahNameArabic}>{item.name}</Text>
          <ChevronRightIcon size={16} color={Colors.textMuted} />
        </View>
      }
      onPress={() => handleSurahPress(item)}
      bordered={index < filteredSurahs.length - 1}
      accessibilityLabel={`${item.nameTr} suresi, ${item.verseCount} ayet`}
    />
  ), [filteredSurahs.length, handleSurahPress]);

  // Header component for FlatList
  const ListHeader = () => (
    <>
      {/* Continue Reading Card */}
      {lastReadSurah && (
        <Animated.View
          style={{
            opacity: continueOpacity,
            transform: [{ translateY: continueTranslateY }],
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('SurahDetail', { surah: lastReadSurah, initialVerseId: lastRead.verseId })}
            activeOpacity={0.85}
            style={styles.continueCard}
          >
            <View style={styles.continueInner}>
              <LinearGradient
                colors={['#0a0f0d', '#0d1510', '#0a0f0d']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.continueBorder} />

              {/* Corner accents */}
              <View style={styles.continueCornerTL}>
                <CornerAccent size={20} color={Colors.emerald} opacity={0.25} rotation={0} />
              </View>
              <View style={styles.continueCornerBR}>
                <CornerAccent size={20} color={Colors.emerald} opacity={0.25} rotation={180} />
              </View>

              <View style={styles.continueContent}>
                <View style={styles.continueBadge}>
                  <BookOpenIcon size={12} color={Colors.emerald} />
                  <Text style={styles.continueBadgeText}>OKUMAYA DEVAM ET</Text>
                </View>
                <Text style={styles.continueSurah}>{lastReadSurah.nameTr}</Text>
                <Text style={styles.continueVerse}>
                  {lastReadSurah.name} · Ayet {lastRead.verseId}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Mushaf Page View — Real Quran page images */}
      <Animated.View
        style={{
          opacity: continueOpacity,
          transform: [{ translateY: continueTranslateY }],
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('MushafPage')}
          activeOpacity={0.85}
          style={styles.pageViewCard}
        >
          <LinearGradient
            colors={['rgba(196,163,90,0.10)', 'rgba(196,163,90,0.03)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={[styles.pageViewBorder, { borderColor: 'rgba(196,163,90,0.25)' }]} />
          <View style={styles.pageViewContent}>
            <View style={styles.pageViewLeft}>
              <View style={[styles.pageViewIconWrap, { backgroundColor: 'rgba(196,163,90,0.12)', borderColor: 'rgba(196,163,90,0.25)' }]}>
                <BookOpenIcon size={18} color="#c4a35a" />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.pageViewTitle}>Mushaf Okuma</Text>
                <Text style={styles.pageViewSubtitle} numberOfLines={1}>Orijinal sayfa görselleriyle oku</Text>
              </View>
            </View>
            <ChevronRightIcon size={16} color="#c4a35a" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Section title */}
      <Animated.View style={[styles.sectionRow, { opacity: listOpacity }]}>
        <Text style={styles.sectionTitle}>Sureler</Text>
        <Text style={styles.sectionCount}>{filteredSurahs.length}</Text>
      </Animated.View>
    </>
  );

  return (
    <ScreenContainer gradient={false} edges={['top']}>
      <LinearGradient
        colors={['#000000', '#050d08', '#030705', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <BackIcon size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <CrescentIcon size={16} color={Colors.emerald} />
          <Text style={styles.headerTitle}>Kur'an-ı Kerim</Text>
        </View>

        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[styles.searchContainer, { opacity: headerOpacity }]}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Sure ara..."
        />
      </Animated.View>

      {/* Surah List */}
      <Animated.View style={[{ flex: 1 }, { opacity: listOpacity }]}>
        {filteredSurahs.length === 0 && searchQuery === '' ? (
          <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
             <SurahListSkeleton count={8} />
          </View>
        ) : (
          <FlatList
            data={filteredSurahs}
            renderItem={renderSurahItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={15}
          />
        )}
      </Animated.View>
    </ScreenContainer>
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
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
    fontWeight: '500',
  },

  // Continue Reading
  continueCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: 12,
  },
  continueInner: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  continueBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  continueCornerTL: { position: 'absolute', top: 10, left: 10 },
  continueCornerBR: { position: 'absolute', bottom: 10, right: 10 },
  continueContent: {
    padding: 24,
    alignItems: 'center',
  },
  continueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.emeraldMuted,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    marginBottom: 12,
  },
  continueBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.emerald,
    letterSpacing: 1.5,
  },
  continueSurah: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  continueVerse: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Page View Card
  pageViewCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: 20,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  pageViewBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  pageViewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
  },
  pageViewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  pageViewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.emeraldMuted,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageViewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  pageViewSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
  },

  // Section
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },

  // List
  listContent: {
    paddingBottom: 40,
  },

  // Surah items
  surahItem: {
    paddingHorizontal: Spacing.xl,
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    gap: Spacing.base,
  },
  surahNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.emeraldMuted,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.emerald,
  },
  surahInfo: {
    flex: 1,
  },
  surahNameTr: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  surahMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  surahNameArabic: {
    ...Typography.arabicSmall,
    fontSize: 20,
    marginRight: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginLeft: 64,
  },
});
