import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { SparkleIcon, CrescentIcon, StarIcon } from '../components/Icons';
import { getPackages, purchasePackage, restorePurchases } from '../services/revenueCatService';
import { usePremium } from '../contexts/PremiumContext';
import ScreenContainer from '../components/ScreenContainer';

const { width } = Dimensions.get('window');

export default function PaywallScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isPremium, checkPremium } = usePremium();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const badgeScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    fetchPackages();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    if (isPremium) {
      navigation.goBack();
    }
  }, [isPremium, navigation]);

  const fetchPackages = async () => {
    const availablePackages = await getPackages();
    setPackages(availablePackages);
    setIsLoading(false);
  };

  const handlePurchase = async (pkg) => {
    setIsPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        checkPremium();
        Alert.alert("Tebrikler!", "Premium versiyona geçtiniz.");
      }
    } catch (error) {
      if (!error.userCancelled) {
        Alert.alert("Hata", "Satın alma işlemi tamamlanamadı.");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        checkPremium();
        Alert.alert("Başarılı", "Satın alımlarınız geri yüklendi.");
      } else {
        Alert.alert("Bilgi", "Önceki bir satın alım bulunamadı.");
      }
    } catch (error) {
      Alert.alert("Hata", "Geri yükleme işlemi başarısız.");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#0f172a', '#020617', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Background Glows */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />
      
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>Vazgeç</Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        >
          <Animated.View 
            style={[
              styles.contentWrap, 
              { 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <View style={styles.header}>
              <Animated.View style={[styles.iconWrap, { transform: [{ scale: badgeScale }] }]}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <StarIcon size={34} color="#ffffff" />
              </Animated.View>
              
              <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>HUZUR PREMIUM</Text>
              </View>

              <Text style={styles.title}>Ruhani Yolculuğunuzu Derinleştirin</Text>
              <Text style={styles.subtitle}>
                Sınırsız araçlar ve özel deneyimler ile iç huzurunuza giden yolda engel tanımayın.
              </Text>
            </View>

            <View style={styles.glassCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.01)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <View style={styles.featuresList}>
                <FeatureItem text="27.000 veri ile eğitilmiş %100 güvenilir AI Asistan'a sınırsız erişim" highlight />
                <FeatureItem text="Kişiselleştirilmiş günlük tavsiyeler" highlight />
                <FeatureItem text="Özel Uyku Modu ve ekran koruyucu" highlight />
                <FeatureItem text="Sakinleştirici doğa ve ambiyans sesleri" highlight />
              </View>
            </View>

            <View style={styles.packagesContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color={Colors.emeraldBright} style={{ marginVertical: 30 }} />
              ) : packages.length === 0 ? (
                <View style={styles.noPackages}>
                  <Text style={styles.noPackagesText}>
                    Şu an paket bulunamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.
                  </Text>
                </View>
              ) : (
                packages.map((pkg, index) => {
                  const isPopular = index === 0 || packages.length === 1; // Mark first as popular
                  return (
                    <TouchableOpacity
                      key={pkg.identifier}
                      style={[styles.packageCard, isPopular && styles.packageCardPopular]}
                      onPress={() => handlePurchase(pkg)}
                      disabled={isPurchasing}
                      activeOpacity={0.8}
                    >
                      {isPopular && (
                        <LinearGradient
                          colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0)']}
                          style={StyleSheet.absoluteFillObject}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                        />
                      )}
                      
                      {isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>EN POPÜLER</Text>
                        </View>
                      )}

                      <View style={styles.packageInfo}>
                        <Text style={styles.packageTitle}>{pkg.product.title}</Text>
                        <Text style={styles.packageDesc}>{pkg.product.description}</Text>
                      </View>
                      <View style={styles.priceWrap}>
                        <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={handleRestore} disabled={isPurchasing} style={styles.restoreBtn}>
                <Text style={styles.restoreText}>Satın Alımları Geri Yükle</Text>
              </TouchableOpacity>
              {isPurchasing && (
                <View style={styles.purchasingOverlay}>
                  <ActivityIndicator size="large" color={Colors.emeraldBright} />
                  <Text style={styles.purchasingText}>İşleminiz yapılıyor...</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const FeatureItem = ({ text, highlight }) => (
  <View style={styles.featureItem}>
    <View style={[styles.bulletPoint, highlight && styles.bulletPointHighlight]}>
      <SparkleIcon size={12} color={highlight ? '#ffffff' : Colors.emeraldBright} />
    </View>
    <Text style={[styles.featureText, highlight && styles.featureTextHighlight]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    filter: 'blur(40px)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    filter: 'blur(40px)',
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    zIndex: 10,
  },
  closeText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.lg,
    shadowColor: Colors.emerald,
  },
  badgeWrap: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeText: {
    color: Colors.emeraldBright,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  glassCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featuresList: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletPoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletPointHighlight: {
    backgroundColor: Colors.emerald,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
    marginLeft: Spacing.md,
    fontWeight: '500',
    lineHeight: 20,
  },
  featureTextHighlight: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  packagesContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  packageCardPopular: {
    borderColor: Colors.emerald,
    borderWidth: 1.5,
    ...Shadows.md,
    shadowColor: Colors.emerald,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 24,
    backgroundColor: Colors.emerald,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  packageInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  packageDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.emeraldBright,
  },
  noPackages: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noPackagesText: {
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  restoreBtn: {
    padding: Spacing.md,
  },
  restoreText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },
  purchasingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    zIndex: 20,
  },
  purchasingText: {
    color: Colors.emeraldBright,
    marginTop: Spacing.sm,
    fontWeight: '600',
  }
});
