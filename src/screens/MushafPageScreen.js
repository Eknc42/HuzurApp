// MushafPageScreen — Gerçek Mushaf Nüsha Sayfa Görüntüleyici
// 604 sayfa, orijinal Mushaf görselleri, sayfa çevirme
import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  ActivityIndicator,
  StatusBar,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Shadows } from '../theme/colors';
import { BackIcon } from '../components/Icons';
import { BookOpenIcon } from '../components/IconsExtra';
import { SURAHS } from '../data/surahs';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_PAGES = 604;

// Mushaf page image CDN (King Fahd Complex — Madani Mushaf)
const PAGE_CDN = 'https://quran.islam-db.com/public/data/pages/quranpages_1024/images';

function getPageUrl(page) {
  return `${PAGE_CDN}/page${String(page).padStart(3, '0')}.png`;
}

// Surah → Başlangıç Sayfası (Medine Mushafı)
const SURAH_PAGES = [
  0, 1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262,
  267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396,
  404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489,
  496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537,
  542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570,
  572, 574, 575, 577, 578, 580, 582, 583, 585, 586, 587, 587, 589, 590,
  591, 591, 592, 593, 594, 595, 595, 596, 596, 597, 597, 598, 598, 599,
  599, 600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604,
];

// Cüz → Başlangıç Sayfası
const JUZ_PAGES = [
  0, 1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262,
  282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

function getSurahForPage(page) {
  let surah = null;
  for (let i = 1; i <= 114; i++) {
    if (SURAH_PAGES[i] <= page) surah = SURAHS[i - 1];
    else break;
  }
  return surah;
}

function getJuzForPage(page) {
  let juz = 1;
  for (let j = 1; j <= 30; j++) {
    if (JUZ_PAGES[j] <= page) juz = j;
  }
  return juz;
}

// Tek bir Mushaf sayfası
const MushafPage = React.memo(({ pageNumber, width: pw }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[ps.outer, { width: pw }]}>
      <View style={ps.frame}>
        {/* Krem kağıt arka plan */}
        <LinearGradient
          colors={['#f8f0e0', '#f2e8d0', '#f8f0e0']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* İç çerçeve */}
        <View style={ps.inner}>
          {loading && !error && (
            <View style={ps.loader}>
              <ActivityIndicator size="large" color="#9a7b2e" />
              <Text style={ps.loaderText}>Sayfa {pageNumber}</Text>
            </View>
          )}

          {error ? (
            <View style={ps.loader}>
              <Text style={ps.errorText}>Sayfa yüklenemedi</Text>
              <TouchableOpacity
                onPress={() => { setError(false); setLoading(true); }}
                style={ps.retryBtn}
              >
                <Text style={ps.retryText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ReactNativeZoomableView
              maxZoom={3}
              minZoom={1}
              zoomStep={0.5}
              initialZoom={1}
              bindToBorders={true}
              style={{ flex: 1, width: '100%', height: '100%' }}
            >
              <Image
                source={{ uri: getPageUrl(pageNumber) }}
                style={ps.image}
                resizeMode="contain"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
              />
            </ReactNativeZoomableView>
          )}
        </View>
      </View>
    </View>
  );
});

export default function MushafPageScreen({ navigation, route }) {
  const { initialSurahId, initialPage } = route.params || {};
  const flatListRef = useRef(null);

  const startPage = initialPage || (initialSurahId ? SURAH_PAGES[initialSurahId] : 1) || 1;
  const [currentPage, setCurrentPage] = useState(startPage);
  const [showPicker, setShowPicker] = useState(false);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInputStr, setPageInputStr] = useState('');

  const PAGE_W = SCREEN_WIDTH;

  // 604 sayfa dizisi
  const pages = useMemo(() => Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1), []);

  // Mevcut sayfa bilgisi
  const surah = useMemo(() => getSurahForPage(currentPage), [currentPage]);
  const juz = useMemo(() => getJuzForPage(currentPage), [currentPage]);

  // Sayfa değişimi
  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setCurrentPage(viewableItems[0].item);
  }).current;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Sayfaya atla
  const goToPage = useCallback((p) => {
    const clamped = Math.max(1, Math.min(TOTAL_PAGES, p));
    flatListRef.current?.scrollToIndex({ index: clamped - 1, animated: false });
    setCurrentPage(clamped);
  }, []);

  // Sureye atla
  const goToSurah = useCallback((id) => {
    const p = SURAH_PAGES[id];
    if (p) { goToPage(p); setShowPicker(false); }
  }, [goToPage]);

  // Sayfa render
  const renderItem = useCallback(({ item }) => (
    <MushafPage pageNumber={item} width={PAGE_W} />
  ), [PAGE_W]);

  const getItemLayout = useCallback((_, index) => ({
    length: PAGE_W, offset: PAGE_W * index, index,
  }), [PAGE_W]);

  // Sure listesi
  const pickerData = useMemo(() =>
    SURAHS.map(s => ({ id: s.id, name: s.nameTr, nameAr: s.name, page: SURAH_PAGES[s.id] })),
    []
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Üst Başlık */}
      <View style={s.header}>
        <LinearGradient colors={['#000', '#0a0f0d']} style={StyleSheet.absoluteFillObject} />
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <BackIcon size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Mushaf-ı Şerif</Text>
            {surah && (
              <Text style={s.headerSub}>
                {surah.nameTr} Suresi · Cüz {juz} · Sayfa {currentPage}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setShowPicker(!showPicker)}
            style={s.pickerBtn}
            activeOpacity={0.7}
          >
            <BookOpenIcon size={16} color={Colors.emerald} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sure Seçici */}
      {showPicker && (
        <View style={s.pickerOverlay}>
          <TouchableOpacity
            style={s.pickerBg}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          />
          <View style={s.pickerBox}>
            <LinearGradient
              colors={['#141c18', '#0a0f0d']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={s.pickerHead}>
              <Text style={s.pickerHeadTitle}>Sure Seçin</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={s.pickerHeadClose}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerData}
              keyExtractor={(item) => `pk-${item.id}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.pickerRow}
                  activeOpacity={0.7}
                  onPress={() => goToSurah(item.id)}
                >
                  <View style={s.pickerNum}>
                    <Text style={s.pickerNumText}>{item.id}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pickerName}>{item.name}</Text>
                    <Text style={s.pickerPageText}>Sayfa {item.page}</Text>
                  </View>
                  <Text style={s.pickerAr}>{item.nameAr}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              style={s.pickerList}
              initialNumToRender={20}
            />
          </View>
        </View>
      )}

      {/* Mushaf Sayfaları */}
      <View style={s.pagesWrap}>
        <FlatList
          ref={flatListRef}
          data={pages}
          renderItem={renderItem}
          keyExtractor={(item) => `mp-${item}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={startPage - 1}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewRef}
          viewabilityConfig={viewConfig}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={1}
          removeClippedSubviews
        />
      </View>

      {/* Alt Gezinme Çubuğu */}
      <View style={s.bottom}>
        <LinearGradient colors={['#0a0f0d', '#000']} style={StyleSheet.absoluteFillObject} />
        <View style={s.bottomRow}>
          <TouchableOpacity
            onPress={() => goToPage(currentPage - 1)}
            style={s.navBtn}
            activeOpacity={0.7}
            disabled={currentPage <= 1}
          >
            <Text style={[s.navText, currentPage <= 1 && s.navOff]}>‹ Önceki</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.badge}
            activeOpacity={0.7}
            onPress={() => {
              setPageInputStr(String(currentPage));
              setIsEditingPage(true);
            }}
          >
            {isEditingPage ? (
              <TextInput
                style={[s.badgeText, { padding: 0, margin: 0, minWidth: 40, textAlign: 'center' }]}
                value={pageInputStr}
                onChangeText={setPageInputStr}
                keyboardType="numeric"
                autoFocus
                onBlur={() => setIsEditingPage(false)}
                onSubmitEditing={() => {
                  const p = parseInt(pageInputStr, 10);
                  if (!isNaN(p)) {
                    goToPage(p);
                  }
                  setIsEditingPage(false);
                }}
              />
            ) : (
              <Text style={s.badgeText}>{currentPage} / {TOTAL_PAGES}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => goToPage(currentPage + 1)}
            style={s.navBtn}
            activeOpacity={0.7}
            disabled={currentPage >= TOTAL_PAGES}
          >
            <Text style={[s.navText, currentPage >= TOTAL_PAGES && s.navOff]}>Sonraki ›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Sayfa görseli stilleri
const ps = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  frame: {
    flex: 1,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#c4a35a',
  },
  inner: {
    flex: 1,
    margin: 3,
    borderWidth: 1,
    borderColor: '#d4b87a',
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#f5ead6',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5ead6',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: '#8b6914',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#8b4513',
    fontWeight: '600',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: 'rgba(139,105,20,0.15)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(196,163,90,0.4)',
  },
  retryText: {
    fontSize: 13,
    color: '#8b6914',
    fontWeight: '600',
  },
});

// Ekran stilleri
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Header
  header: { paddingTop: 50, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 11, fontWeight: '500', color: Colors.textMuted, marginTop: 2 },
  pickerBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.emeraldMuted,
    borderWidth: 1, borderColor: Colors.emeraldBorder,
  },

  // Pages
  pagesWrap: { flex: 1, backgroundColor: '#1a1408' },

  // Bottom
  bottom: { paddingBottom: 30, paddingTop: 8 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  navBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  navText: { fontSize: 13, fontWeight: '600', color: Colors.emerald },
  navOff: { color: Colors.textMuted, opacity: 0.4 },
  badge: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.full,
    paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.emeraldBorder,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },

  // Picker
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  pickerBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  pickerBox: {
    position: 'absolute', top: 90, left: 16, right: 16,
    maxHeight: SCREEN_HEIGHT * 0.6, borderRadius: Radius.xl,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.emeraldBorder,
    ...Shadows.md,
  },
  pickerHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.emeraldBorder,
  },
  pickerHeadTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  pickerHeadClose: { fontSize: 13, fontWeight: '600', color: Colors.emerald },
  pickerList: { maxHeight: SCREEN_HEIGHT * 0.5 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(16,185,129,0.08)',
  },
  pickerNum: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.emeraldMuted, alignItems: 'center', justifyContent: 'center',
    marginRight: 12, borderWidth: 1, borderColor: Colors.emeraldBorder,
  },
  pickerNumText: { fontSize: 11, fontWeight: '700', color: Colors.emerald },
  pickerName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  pickerPageText: { fontSize: 10, fontWeight: '500', color: Colors.textMuted, marginTop: 1 },
  pickerAr: { fontSize: 18, color: Colors.textArabic, writingDirection: 'rtl' },
});
