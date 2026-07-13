import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Spacing, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { CornerAccent } from './IslamicPattern';

const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

export default function SurahInfoCard({
  surah,
  opacity,
  scale,
}) {
  return (
    <Animated.View
      style={{
        opacity: opacity,
        transform: [{ scale: scale }],
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
  );
}

const styles = StyleSheet.create({
  infoCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  infoBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  infoCornerTL: { position: 'absolute', top: 10, left: 10 },
  infoCornerBR: { position: 'absolute', bottom: 10, right: 10 },
  infoContent: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  infoArabicName: {
    ...Typography.arabicLarge,
    fontSize: 28,
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
    ...Typography.arabicMedium,
    fontSize: 20,
  },
});
