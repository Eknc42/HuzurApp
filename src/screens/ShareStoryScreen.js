// ShareStoryScreen — Instagram-story-style export preview
// Premium typography, cinematic dark background, elegant verse card
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  InteractionManager,
  ActivityIndicator,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { CrescentIcon, StarIcon } from '../components/Icons';
import { CornerAccent, IslamicStar } from '../components/IslamicPattern';
import GlowButton from '../components/GlowButton';
import BottomNavBar from '../components/BottomNavBar';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = CARD_WIDTH * 1.6; // ~9:16 ratio adapted

function toShareableFileUri(rawPath) {
  if (!rawPath) return '';
  const without = String(rawPath).replace(/^file:\/\//, '');
  return Platform.OS === 'android' ? `file://${without}` : `file://${without}`;
}

async function requestAndroidGalleryAccess() {
  if (Platform.OS !== 'android') return true;
  const sdk = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
  try {
    // Android 10 (API 29) ve sonrasında görselleri kaydetmek (MediaStore) için 
    // herhangi bir depolama iznine gerek yoktur.
    if (sdk >= 29) {
      return true;
    } else {
      // Sadece Android 9 (API 28) ve öncesi için yazma izni isteriz.
      const r = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      return r === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch {
    return false;
  }
}

export default function ShareStoryScreen({ route, navigation }) {
  const { mood, verse } = route.params;
  const shotRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Animations
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(20)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ekran açılış animasyonları tek sefer
  }, []);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.03, 0.08, 0.03],
  });

  const captureCardFile = async () => {
    if (!shotRef.current) {
      throw new Error('Görünüm hazır değil');
    }
    await new Promise((resolve) =>
      InteractionManager.runAfterInteractions(() => resolve()),
    );
    await new Promise((r) => setTimeout(r, 350));
    return captureRef(shotRef, {
      format: 'png',
      quality: 0.92,
      result: 'tmpfile',
      fileName: `Huzur_Ayet_${Date.now()}`,
    });
  };

  const handleShareSheet = async () => {
    if (sharing || saving) return;
    setSharing(true);
    try {
      const tmp = await captureCardFile();
      const uri = toShareableFileUri(tmp);
      await Share.open({
        urls: [uri],
        type: 'image/png',
        title: verse.surahTr,
        subject: verse.surahTr,
        message: `${verse.surahTr} · ${verse.ayah}`,
        failOnCancel: false,
      });
    } catch (e) {
      const msg = (e?.message ?? String(e)).toLowerCase();
      if (/cancel|cancell|could not share|unable to share/i.test(msg)) return;
      console.warn(e);
      Alert.alert('Paylaşım', 'Görsel paylaşılamadı.');
    } finally {
      setSharing(false);
    }
  };

  const handleSaveImage = async () => {
    if (sharing || saving) return;
    setSaving(true);
    try {
      if (Platform.OS === 'android') {
        const ok = await requestAndroidGalleryAccess();
        if (!ok) {
          Alert.alert('İzin', 'Kaydetmek için depolama / fotoğraf izni gerekir.');
          return;
        }
      }
      const tmp = await captureCardFile();
      const uri = toShareableFileUri(tmp);
      await CameraRoll.save(uri, { type: 'photo', album: 'Huzur' });
      Alert.alert('Tamamlandı', 'Görsel cihaz galerine kaydedildi.');
    } catch (e) {
      console.warn(e);
      Alert.alert('Kayıt', 'Görsel kaydedilemedi. İzinleri kontrol edin.');
    } finally {
      setSaving(false);
    }
  };

  const busy = sharing || saving;

  const isLongVerse = verse?.arabicText?.length > 150 || verse?.translationTr?.length > 200;
  const isVeryLongVerse = verse?.arabicText?.length > 300 || verse?.translationTr?.length > 400;

  return (
    <ScreenContainer gradient={true}>
      <Header
        title="Ayeti Paylaş"
        onBack={() => navigation.goBack()}
      />

      {/* Story Card Preview (view-shot için sarmalayıcı) */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.cardContainer}
        showsVerticalScrollIndicator={false}
      >
        <View
          ref={shotRef}
          collapsable={false}
          style={styles.captureFrame}
        >
          <Animated.View
            style={[
              styles.storyCard,
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <LinearGradient
              colors={['#0a0a0a', '#111111', '#0a0a0a']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            <Animated.View
              style={[styles.shimmerOverlay, { opacity: shimmerOpacity }]}
            />

            <View style={[styles.cardBorder, { borderColor: `${mood.color}15` }]} />

            <View style={styles.cardCornerTL}>
              <CornerAccent size={32} color={mood.color} opacity={0.35} rotation={0} />
            </View>
            <View style={styles.cardCornerTR}>
              <CornerAccent size={32} color={mood.color} opacity={0.35} rotation={90} />
            </View>
            <View style={styles.cardCornerBL}>
              <CornerAccent size={32} color={mood.color} opacity={0.35} rotation={270} />
            </View>
            <View style={styles.cardCornerBR}>
              <CornerAccent size={32} color={mood.color} opacity={0.35} rotation={180} />
            </View>

            <View style={styles.starWatermark}>
              <IslamicStar size={120} color={mood.color} opacity={0.04} />
            </View>

            <View style={styles.cardContent}>
              <StarIcon size={18} color={mood.color} />

              <Text style={[
                styles.cardArabic,
                isLongVerse && { fontSize: 20, lineHeight: 38 },
                isVeryLongVerse && { fontSize: 16, lineHeight: 32 }
              ]}>{verse.arabicText}</Text>

              <View style={styles.cardDividerContainer}>
                <View style={[styles.cardDividerLine, { backgroundColor: `${mood.color}25` }]} />
                <View style={[styles.cardDividerDot, { backgroundColor: `${mood.color}50` }]} />
                <View style={[styles.cardDividerLine, { backgroundColor: `${mood.color}25` }]} />
              </View>

              <Text style={[
                styles.cardTranslation,
                isLongVerse && { fontSize: 14, lineHeight: 22 },
                isVeryLongVerse && { fontSize: 12, lineHeight: 18 }
              ]}>
                "{verse.translationTr}"
              </Text>

              <Text style={[styles.cardReference, { color: mood.color }]}>
                {verse.surahTr} · {verse.ayah}
              </Text>

              <View style={styles.watermark}>
                <CrescentIcon size={14} color={Colors.textMuted} />
                <Text style={styles.watermarkText}>Huzur</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {(sharing || saving) && (
          <View style={styles.busyBadge}>
            <ActivityIndicator color={Colors.emerald} size="small" />
            <Text style={styles.busyText}>
              {sharing ? 'Paylaşım için hazırlanıyor…' : 'Galeriye kaydediliyor…'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.buttonsContainer,
          {
            opacity: buttonsOpacity,
            transform: [{ translateY: buttonsTranslateY }],
          },
        ]}
      >
        <GlowButton
          title={sharing ? 'Hazırlanıyor…' : "Instagram'da veya başka yerde Paylaş"}
          onPress={handleShareSheet}
          style={styles.shareButton}
          disabled={busy}
        />
        <TouchableOpacity
          onPress={handleSaveImage}
          activeOpacity={0.7}
          style={[styles.saveButton, busy && { opacity: 0.45 }]}
          disabled={busy}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Kaydediliyor…' : 'Görseli Kaydet'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    paddingTop: Spacing.xl,
    paddingBottom: 100,
    alignItems: 'center',
  },
  captureFrame: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  storyCard: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xxl,
    borderWidth: 1,
  },

  cardCornerTL: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  cardCornerTR: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  cardCornerBL: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  cardCornerBR: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },

  starWatermark: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
  },

  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  cardArabic: {
    ...Typography.arabicMedium,
    fontSize: 24,
    lineHeight: 44,
    marginTop: 24,
    marginBottom: 16,
  },
  cardDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginVertical: 16,
  },
  cardDividerLine: {
    flex: 1,
    height: 1,
  },
  cardDividerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 10,
  },
  cardTranslation: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '400',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  cardReference: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 24,
  },

  watermark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    bottom: 24,
  },
  watermarkText: {
    fontSize: 12,
    fontWeight: '300',
    color: Colors.textMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  buttonsContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 28,
    paddingTop: Spacing.md,
  },
  shareButton: {
    marginBottom: Spacing.sm,
  },
  busyBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  busyText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  saveButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
});
