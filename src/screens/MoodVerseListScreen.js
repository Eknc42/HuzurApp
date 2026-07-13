// MoodVerseListScreen — Her kategori için tüm ayetleri listele
// Seslendirme: Yasser Al-Dossari (everyayah.com)
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { PlayIcon, PauseIcon, SparkleIcon } from '../components/Icons';
import { getVersesForMood } from '../data/verses';
import {
  playAudioFromUrl,
  stopRecitation,
} from '../services/audioService';
import BottomNavBar from '../components/BottomNavBar';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';

// Yasser Al-Dossari — everyayah.com
// URL format: https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/SSSAAA.mp3
function pad3(n) {
  return String(n).padStart(3, '0');
}

function parseAyah(ayahStr) {
  // '13:28' → { surah: 13, verse: 28 }
  // '94:5-6' → first verse of the range
  if (!ayahStr) return null;
  const [surahPart, versePart] = String(ayahStr).split(':');
  const surah = parseInt(surahPart, 10);
  const verse = parseInt(String(versePart).split('-')[0], 10);
  if (!surah || !verse) return null;
  return { surah, verse };
}

function dossariUrl(ayahStr) {
  const parsed = parseAyah(ayahStr);
  if (!parsed) return null;
  return `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${pad3(parsed.surah)}${pad3(parsed.verse)}.mp3`;
}

export default function MoodVerseListScreen({ route, navigation }) {
  const { mood } = route.params || {};
  const verses = mood ? getVersesForMood(mood.id) : [];

  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  // Entrance animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(listOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
    ]).start();
    return () => stopRecitation();
  }, [headerOpacity, listOpacity]);

  const handlePlay = (verse) => {
    if (playingId === verse.id) {
      stopRecitation();
      setPlayingId(null);
      return;
    }
    const url = dossariUrl(verse.ayah);
    if (!url) return;
    setLoadingId(verse.id);
    playAudioFromUrl(url, {
      onLoaded: () => {
        setLoadingId(null);
        setPlayingId(verse.id);
      },
      onEnd: () => setPlayingId(null),
      onError: () => {
        setLoadingId(null);
        setPlayingId(null);
      },
    });
  };

  if (!mood) {
    return (
      <ScreenContainer>
        <Text style={styles.emptyText}>Kategori bulunamadı.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer gradient={true}>
      <Header
        title={mood.labelTr}
        subtitle={`${verses.length} ayet`}
        onBack={() => {
          stopRecitation();
          navigation.goBack();
        }}
        titleStyle={{ color: mood.color }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: listOpacity }}>
          {verses.map((verse, index) => {
            const isPlaying = playingId === verse.id;
            const isLoading = loadingId === verse.id;
            return (
              <View key={verse.id} style={[styles.verseCard, { borderColor: `${mood.color}25` }]}>
                {/* Surah badge */}
                <View style={styles.verseHeader}>
                  <View style={[styles.surahPill, { borderColor: `${mood.color}40` }]}>
                    <Text style={[styles.surahPillText, { color: mood.color }]}>
                      {verse.surahTr} · {verse.ayah}
                    </Text>
                  </View>
                  <Text style={styles.verseIndex}>{index + 1}</Text>
                </View>

                {/* Arabic */}
                <Text style={styles.verseArabic} allowFontScaling={false}>
                  {verse.arabicText}
                </Text>

                {/* Turkish */}
                <Text style={styles.verseTranslation}>{verse.translationTr}</Text>

                {/* Actions: Play + Explanation */}
                <View style={styles.verseActions}>
                  <TouchableOpacity
                    onPress={() => handlePlay(verse)}
                    activeOpacity={0.75}
                    style={[
                      styles.playButton,
                      isPlaying && { backgroundColor: mood.color, borderColor: mood.color },
                    ]}
                    disabled={isLoading}
                  >
                    {isPlaying ? (
                      <PauseIcon size={14} color={Colors.white} />
                    ) : (
                      <PlayIcon size={14} color={isLoading ? Colors.textMuted : mood.color} />
                    )}
                    <Text
                      style={[
                        styles.playButtonText,
                        { color: isPlaying ? Colors.white : (isLoading ? Colors.textMuted : mood.color) },
                      ]}
                    >
                      {isLoading ? 'Yükleniyor…' : isPlaying ? 'Durdur' : 'Yasser Al-Dossari'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('AIExplanation', { mood, verse })}
                    activeOpacity={0.75}
                    style={styles.explainButton}
                  >
                    <SparkleIcon size={14} color={Colors.emerald} />
                    <Text style={styles.explainButtonText}>Açıklama</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {verses.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Bu kategori için ayet bulunamadı.</Text>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar activeTab="AI" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 20,
  },

  // Verse card
  verseCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    ...Shadows.sm,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  surahPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  surahPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  verseIndex: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  verseArabic: {
    ...Typography.arabicLarge,
    fontSize: 22,
    lineHeight: 44,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 14,
  },
  verseTranslation: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 18,
  },

  verseActions: {
    flexDirection: 'row',
    gap: 10,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: Radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
  },
  playButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  explainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.emeraldMuted,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  explainButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 0.3,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
});
