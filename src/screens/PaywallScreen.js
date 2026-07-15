import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../theme/colors';
import { SparkleIcon, CrescentIcon } from '../components/Icons';
import { getPackages, purchasePackage, restorePurchases } from '../services/revenueCatService';
import { usePremium } from '../contexts/PremiumContext';
import ScreenContainer from '../components/ScreenContainer';

export default function PaywallScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isPremium, checkPremium } = usePremium();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    fetchPackages();
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
        colors={['#1F2937', '#111827', '#030712']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>Kapat</Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        >

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <CrescentIcon size={32} color={Colors.emeraldBright} />
          </View>
          <Text style={styles.title}>Huzur Premium</Text>
          <Text style={styles.subtitle}>
            Sınırsız AI Asistan erişimi ve daha fazla özellik ile ruhani yolculuğunuzu derinleştirin.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem text="Sınırsız AI Asistan erişimi" />
          <FeatureItem text="27.000 veri ile eğitilmiş %100 güvenilir kaynaklar" />
          <FeatureItem text="Kişiselleştirilmiş günlük öneriler" />
          <FeatureItem text="Özel Uyku Modu deneyimi" />
          <FeatureItem text="Sakinleştirici Ambient Sesler" />
          <FeatureItem text="Premium okuyucu sesleri (Yakında)" />
        </View>

        <View style={styles.packagesContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.emerald} />
          ) : packages.length === 0 ? (
            <View style={styles.noPackages}>
              <Text style={styles.noPackagesText}>
                Şu an paket bulunamadı. Lütfen daha sonra tekrar deneyin veya RevenueCat ayarlarınızı kontrol edin.
              </Text>
            </View>
          ) : (
            packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={styles.packageCard}
                onPress={() => handlePurchase(pkg)}
                disabled={isPurchasing}
              >
                <View style={styles.packageInfo}>
                  <Text style={styles.packageTitle}>{pkg.product.title}</Text>
                  <Text style={styles.packageDesc}>{pkg.product.description}</Text>
                </View>
                <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleRestore} disabled={isPurchasing}>
              <Text style={styles.restoreText}>Satın Alımları Geri Yükle</Text>
            </TouchableOpacity>
            {isPurchasing && <ActivityIndicator style={{ marginTop: 10 }} size="small" color={Colors.emerald} />}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const FeatureItem = ({ text }) => (
  <View style={styles.featureItem}>
    <SparkleIcon size={16} color={Colors.emerald} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  closeText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  features: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureText: {
    fontSize: 15,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
    fontWeight: '500',
  },
  packagesContainer: {
    gap: Spacing.md,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
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
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '700',
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
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  restoreText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
