// QuranScreen — Sadece Ana Kategoriler (Etkileşimli Okuma, Kapsamlı Dinleme, Mushaf)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { BackIcon, CrescentIcon } from '../components/Icons';
import { ChevronRightIcon, BookOpenIcon, HeadphonesIcon } from '../components/IconsExtra';
import { CornerAccent } from '../components/IslamicPattern';
import BottomNavBar from '../components/BottomNavBar';
import { SURAHS } from '../data/surahs';
import { getLastRead } from '../data/quranText';
import ScreenContainer from '../components/ScreenContainer';

export default function QuranScreen({ navigation }) {
  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-15)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;

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
        Animated.timing(contentOpacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0, duration: 600, useNativeDriver: true,
        }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'center',
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          }}
        >
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl }}>

            {/* Kategori 1: Etkileşimli Okuma */}
            <TouchableOpacity
              onPress={() => navigation.navigate('SurahList')}
              activeOpacity={0.85}
              style={[styles.pageViewCard, { marginHorizontal: 0, marginBottom: Spacing.md }]}
            >
              <LinearGradient
                colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.03)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={[styles.pageViewBorder, { borderColor: 'rgba(16,185,129,0.3)' }]} />
              <View style={styles.pageViewContent}>
                <View style={styles.pageViewLeft}>
                  <View style={[styles.pageViewIconWrap, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                    <BookOpenIcon size={18} color={Colors.emerald} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.pageViewTitle, { color: Colors.emeraldBright }]}>1. Etkileşimli Okuma</Text>
                    <Text style={styles.pageViewSubtitle}>
                      Aşağıdaki listeden sure seçerek Türkçe-Arapça eşzamanlı okuyun ve dinleyin.
                    </Text>
                  </View>
                </View>
                <ChevronRightIcon size={16} color={Colors.emeraldBright} />
              </View>
            </TouchableOpacity>

            {/* Kategori 2: Kapsamlı Dinleme */}
            <TouchableOpacity
              onPress={() => navigation.navigate('LibraryReciters')}
              activeOpacity={0.85}
              style={[styles.pageViewCard, { marginHorizontal: 0, marginBottom: Spacing.md }]}
            >
              <LinearGradient
                colors={['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.03)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={[styles.pageViewBorder, { borderColor: 'rgba(59,130,246,0.3)' }]} />
              <View style={styles.pageViewContent}>
                <View style={styles.pageViewLeft}>
                  <View style={[styles.pageViewIconWrap, { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.3)' }]}>
                    <HeadphonesIcon size={18} color="#60a5fa" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.pageViewTitle, { color: '#60a5fa' }]}>2. Kapsamlı Dinleme</Text>
                    <Text style={styles.pageViewSubtitle}>
                      150+ hafız seçeneği ile arka planda radyo tarzında kesintisiz Kur'an dinleyin.
                    </Text>
                  </View>
                </View>
                <ChevronRightIcon size={16} color="#60a5fa" />
              </View>
            </TouchableOpacity>

            {/* Kategori 3: Orijinal Mushaf */}
            <TouchableOpacity
              onPress={() => navigation.navigate('MushafPage')}
              activeOpacity={0.85}
              style={[styles.pageViewCard, { marginHorizontal: 0, marginBottom: 0 }]}
            >
              <LinearGradient
                colors={['rgba(196,163,90,0.15)', 'rgba(196,163,90,0.03)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={[styles.pageViewBorder, { borderColor: 'rgba(196,163,90,0.3)' }]} />
              <View style={styles.pageViewContent}>
                <View style={styles.pageViewLeft}>
                  <View style={[styles.pageViewIconWrap, { backgroundColor: 'rgba(196,163,90,0.15)', borderColor: 'rgba(196,163,90,0.3)' }]}>
                    <BookOpenIcon size={18} color="#c4a35a" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.pageViewTitle, { color: '#c4a35a' }]}>3. Orijinal Mushaf</Text>
                    <Text style={styles.pageViewSubtitle}>
                      Kur'an sayfalarının orijinal Arapça görselleri üzerinden okumanızı yapın.
                    </Text>
                  </View>
                </View>
                <ChevronRightIcon size={16} color="#c4a35a" />
              </View>
            </TouchableOpacity>

          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab="Quran" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
    paddingTop: 10,
    justifyContent: 'center',
  },
  pageViewCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: 24,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    minHeight: 110,
    justifyContent: 'center',
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
    paddingVertical: 28,
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
});
