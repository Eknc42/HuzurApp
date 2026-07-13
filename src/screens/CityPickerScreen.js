// CityPickerScreen — Searchable city selection for prayer times
// Full-screen modal with all 81 Turkish provinces, search, and current selection indicator
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { LocationIcon } from '../components/PrayerIcons';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import PressableScale from '../components/PressableScale';
import { LOCATIONS } from '../data/locations';

const ALL_CITIES = LOCATIONS;

// ============================================================
// CityRow — single row in the city list
// ============================================================
function CityRow({ item, isSelected, onSelect, index }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = Math.min(index * 30, 600);
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1, duration: 400, delay, useNativeDriver: true,
      }),
      Animated.timing(slideX, {
        toValue: 0, duration: 400, delay, useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateX: slideX }] }}>
      <PressableScale onPress={() => onSelect(item.key)} scaleValue={0.97}>
        <View
          style={[
            styles.cityRow,
            isSelected && styles.cityRowSelected,
          ]}
        >
          {/* Glow for selected */}
          {isSelected && (
            <LinearGradient
              colors={['rgba(16,185,129,0.10)', 'rgba(16,185,129,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.selectedGlow}
            />
          )}

          {/* Plate badge (only for cities, otherwise small pin or similar, but let's just show plate for both since districts share the city's plate) */}
          <View style={[styles.plateBadge, isSelected && styles.plateBadgeSelected]}>
            <Text style={[styles.plateText, isSelected && styles.plateTextSelected]}>
              {item.plate || '📍'}
            </Text>
          </View>

          {/* City / District name */}
          <Text style={[
            styles.cityName, 
            isSelected && styles.cityNameSelected,
            !item.isCity && { fontSize: 16 } // Slightly smaller for districts
          ]}>
            {item.display}
          </Text>

          {/* Selected check */}
          {isSelected && (
            <View style={styles.checkWrap}>
              <View style={styles.checkDot} />
              <Text style={styles.checkText}>Seçili</Text>
            </View>
          )}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

// ============================================================
// CityPickerScreen
// ============================================================
export default function CityPickerScreen({ navigation, route }) {
  const { selectedCityKey, onCitySelect } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cities by search query (Turkish-aware)
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return ALL_CITIES;
    const q = searchQuery.toLocaleLowerCase('tr-TR').trim();
    return ALL_CITIES.filter(
      (c) =>
        c.search.includes(q) ||
        (c.plate && c.plate.includes(q))
    );
  }, [searchQuery]);

  const handleSelect = useCallback((key) => {
    if (onCitySelect) {
      onCitySelect(key);
    }
    navigation.goBack();
  }, [navigation, onCitySelect]);

  const renderItem = useCallback(({ item, index }) => (
    <CityRow
      item={item}
      isSelected={item.key === selectedCityKey}
      onSelect={handleSelect}
      index={index}
    />
  ), [selectedCityKey, handleSelect]);

  const keyExtractor = useCallback((item) => item.key, []);

  return (
    <ScreenContainer gradient={false} edges={['top']}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#000000', '#040b07', '#020503', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header */}
      <Header
        title="Şehir veya İlçe Seç"
        subtitle="Konumunu Belirle"
        onBack={() => navigation.goBack()}
      />

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Şehir veya plaka ara…"
          autoFocus={false}
        />
      </View>

      {/* City count info */}
      <View style={styles.infoBar}>
        <LocationIcon size={12} color={Colors.textMuted} />
        <Text style={styles.infoText}>
          {filteredCities.length} şehir {searchQuery ? 'bulundu' : 'listeleniyor'}
        </Text>
      </View>

      {/* City list */}
      <FlatList
        data={filteredCities}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
            <Text style={styles.emptyHint}>Farklı bir arama deneyin</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  // Search
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // Info bar
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: 8,
  },

  // City row
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgSurface,
    overflow: 'hidden',
    position: 'relative',
    gap: 14,
  },
  cityRowSelected: {
    borderColor: Colors.emerald,
    backgroundColor: Colors.emeraldGlow,
  },
  selectedGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 80,
  },

  // Plate badge
  plateBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateBadgeSelected: {
    backgroundColor: Colors.emeraldGlow,
    borderColor: Colors.emeraldBorderStrong,
  },
  plateText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  plateTextSelected: {
    color: Colors.emerald,
  },

  // City name
  cityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  cityNameSelected: {
    color: Colors.emerald,
  },

  // Check indicator
  checkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
  },
  checkText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.emerald,
    letterSpacing: 0.3,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
