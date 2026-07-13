import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../theme/colors';
import { Typography } from '../theme/typography';
import { BookmarkIcon } from './Icons';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArabicNumeral(n) {
  return String(n)
    .split('')
    .map((d) => ARABIC_DIGITS[parseInt(d, 10)] || d)
    .join('');
}

export default function VerseRow({
  verse,
  isPlaying,
  isBookmarked,
  onPress,
  onLayout,
  onBookmark,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLayout={onLayout}
      activeOpacity={0.85}
      style={[
        styles.verseRow,
        isPlaying && styles.verseRowPlaying,
      ]}
    >
      <View style={styles.verseRowHeader}>
        <View style={[styles.verseNumberPill, isPlaying && styles.verseNumberPillPlaying]}>
          <Text style={[styles.verseNumberPillText, isPlaying && styles.verseNumberPillTextPlaying]}>
            {verse.id}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onBookmark}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.verseBookmark}
        >
          <BookmarkIcon
            size={18}
            color={isBookmarked ? Colors.emerald : Colors.textMuted}
            filled={isBookmarked}
          />
        </TouchableOpacity>
      </View>

      <Text
        style={[
          styles.verseRowArabic,
          isPlaying && styles.verseRowArabicPlaying,
        ]}
      >
        {verse.arabic}
        <Text
          style={[
            styles.verseRowMarker,
            isPlaying && styles.verseRowMarkerPlaying,
          ]}
        >
          {' \u06dd' + toArabicNumeral(verse.id) + ' '}
        </Text>
      </Text>

      <Text
        style={[
          styles.verseRowTurkish,
          isPlaying && styles.verseRowTurkishPlaying,
        ]}
      >
        {verse.tr}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  verseRow: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.base,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.xl,
    backgroundColor: 'transparent',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  verseRowPlaying: {
    backgroundColor: Colors.bgSurface,
    borderLeftColor: Colors.emerald,
  },
  verseRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verseNumberPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  verseNumberPillPlaying: {
    backgroundColor: Colors.emeraldMuted,
    borderColor: Colors.emerald,
  },
  verseNumberPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  verseNumberPillTextPlaying: {
    color: Colors.emerald,
  },
  verseBookmark: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseRowArabic: {
    ...Typography.arabicLarge,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  verseRowArabicPlaying: {
    color: Colors.emerald,
  },
  verseRowMarker: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  verseRowMarkerPlaying: {
    fontSize: 20,
    color: Colors.emerald,
    fontWeight: '700',
  },
  verseRowTurkish: {
    ...Typography.translation,
    textAlign: 'left',
  },
  verseRowTurkishPlaying: {
    color: Colors.emeraldLight,
  },
});
