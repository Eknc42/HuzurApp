// mp3quranApi.js — mp3quran.net API v3 istemcisi
// Hafız, sure, radyo, rivayet verileri + önbellek + retry logic

import { fetchWithRetry, categorizeNetworkError, getNetworkStatus } from './networkService';

const BASE_URL = 'https://mp3quran.net/api/v3';
const LANGUAGE = 'tr';

// Bellek ve AsyncStorage önbelleği
const cache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 dakika
const PERSISTENT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 gün

async function fetchWithCache(key, url, options = {}) {
  const {
    retries = 3,
    timeout = 15000,
    skipCache = false,
    persistentCache = true,
  } = options;

  const now = Date.now();

  // Check in-memory cache
  if (!skipCache && cache[key] && now - cache[key].time < CACHE_TTL) {
    return cache[key].data;
  }

  try {
    const data = await fetchWithRetry(url, {}, retries, timeout);

    // Store in memory cache
    cache[key] = { data, time: now };

    // Store in persistent cache if enabled
    if (persistentCache) {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(
          `api_cache_${key}`,
          JSON.stringify({ data, time: now })
        );
      } catch (e) {
        console.warn('Failed to save persistent cache:', e);
      }
    }

    return data;
  } catch (error) {
    console.warn(`API error for ${key}:`, error);

    // Try in-memory cache first
    if (cache[key]) {
      console.warn(`Returning stale cache for ${key}`);
      return cache[key].data;
    }

    // Try persistent cache as fallback
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const persisted = await AsyncStorage.getItem(`api_cache_${key}`);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (now - parsed.time < PERSISTENT_CACHE_TTL) {
          console.warn(`Returning persistent cache for ${key}`);
          cache[key] = parsed; // Restore to memory cache
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn('Failed to load persistent cache:', e);
    }

    // If offline, throw with clear message
    if (!getNetworkStatus()) {
      const errorInfo = categorizeNetworkError(error);
      const offlineError = new Error(`OFFLINE: ${errorInfo.message}`);
      offlineError.isOffline = true;
      offlineError.shouldRetry = false;
      throw offlineError;
    }

    // Otherwise throw original error with metadata
    const errorInfo = categorizeNetworkError(error);
    const wrappedError = new Error(errorInfo.message);
    wrappedError.originalError = error;
    wrappedError.shouldRetry = errorInfo.retry;
    wrappedError.errorType = errorInfo.type;
    throw wrappedError;
  }
}

/**
 * Tüm hafızları getir (150+)
 * Her hafızın birden fazla mushaf/rivayet'i olabilir
 */
export async function getReciters() {
  const data = await fetchWithCache(
    'reciters',
    `${BASE_URL}/reciters?language=${LANGUAGE}`
  );
  return data.reciters || [];
}

/**
 * Belirli bir hafızı getir
 */
export async function getReciterById(id) {
  const data = await fetchWithCache(
    `reciter_${id}`,
    `${BASE_URL}/reciters?language=${LANGUAGE}&reciter=${id}`
  );
  return (data.reciters || [])[0] || null;
}

/**
 * Belirli bir sure'yi okuyan hafızları getir
 */
export async function getRecitersBySurah(surahId) {
  const data = await fetchWithCache(
    `reciters_surah_${surahId}`,
    `${BASE_URL}/reciters?language=${LANGUAGE}&surah=${surahId}`
  );
  return data.reciters || [];
}

/**
 * Sure listesini getir (Türkçe isimler, Mekki/Medeni bilgisi)
 */
export async function getSurahs() {
  const data = await fetchWithCache(
    'surahs',
    `${BASE_URL}/suwar?language=${LANGUAGE}`
  );
  return (data.suwar || []).map(s => ({
    ...s,
    name: (s.name || '').replace(/\r\n/g, '').replace(/\ufeff/g, '').trim(),
  }));
}

/**
 * Rivayet türlerini getir
 */
export async function getRiwayat() {
  const data = await fetchWithCache('riwayat', `${BASE_URL}/riwayat`);
  return data.riwayat || [];
}

/**
 * Radyo istasyonlarını getir (130+)
 */
export async function getRadios() {
  const data = await fetchWithCache(
    'radios',
    `${BASE_URL}/radios?language=${LANGUAGE}`
  );
  return data.radios || [];
}

/**
 * Sure ses URL'si oluştur
 * Format: {server}{surahNumber_3digit}.mp3
 * Örnek: https://server8.mp3quran.net/afs/001.mp3
 */
export function getSurahAudioUrl(serverUrl, surahId) {
  const paddedId = String(surahId).padStart(3, '0');
  return `${serverUrl}${paddedId}.mp3`;
}

/**
 * Hafızın varsayılan mushafını bul (Hafs an Asım - Murattal)
 */
export function getDefaultMoshaf(reciter) {
  if (!reciter || !reciter.moshaf) return null;
  // Önce Hafs Murattal (rewaya_id: 1, moshaf_type: 11) ara
  const hafs = reciter.moshaf.find(m => m.rewaya_id === 1 && m.moshaf_type === 11);
  if (hafs) return hafs;
  // Yoksa ilk mushafı döndür
  return reciter.moshaf[0] || null;
}

/**
 * Mushafın belirli bir sureyi içerip içermediğini kontrol et
 */
export function moshafHasSurah(moshaf, surahId) {
  if (!moshaf || !moshaf.surah_list) return false;
  const surahs = moshaf.surah_list.split(',').map(Number);
  return surahs.includes(surahId);
}

/**
 * Popüler/öne çıkan hafızları getir
 */
export function getFeaturedReciters(allReciters) {
  const featuredIds = [123, 102, 51, 118, 112, 54, 30, 31, 92, 86, 81, 12, 109, 76, 107, 253, 245, 161];
  const featured = allReciters.filter(r => featuredIds.includes(r.id));
  // If none of the hardcoded featured IDs match the QDC-filtered list,
  // fallback to the first 10 QDC-supported reciters so the tab never empties.
  if (featured.length === 0 && allReciters.length > 0) {
    return allReciters.slice(0, 10);
  }
  return featured;
}

/**
 * Radyoları kategorilere ayır
 */
export function categorizeRadios(radios) {
  const categories = {
    featured: [], // Öne çıkan
    reciters: [], // Hafız radyoları
    quranTranslation: [], // Kur'an çevirileri
    islamic: [], // İslami içerik
  };

  radios.forEach(radio => {
    const name = (radio.name || '').toLowerCase();
    const url = (radio.url || '').toLowerCase();

    if (url.includes('translation_quran')) {
      categories.quranTranslation.push(radio);
    } else if (
      name.includes('radyo') || name.includes('radio') ||
      name.includes('genel') || name.includes('huzurlu') ||
      name.includes('bayram') || name.includes('fetva') ||
      name.includes('rukiye') || name.includes('tefsir') ||
      name.includes('sahih') || name.includes('hikaye') ||
      name.includes('zikirler') || name.includes('kısa') ||
      name.includes('peygamber') || name.includes('sakinlik') ||
      name.includes('mülk') || name.includes('bakara') ||
      url.includes('mix') || url.includes('salma') ||
      url.includes('eid') || url.includes('fatwa') ||
      url.includes('roqiah') || url.includes('tafseer') ||
      url.includes('athkar') || url.includes('sahabah') ||
      url.includes('ramadan') || url.includes('sakeenah') ||
      url.includes('alanbiya') || url.includes('saheh') ||
      url.includes('tarateel') || url.includes('almukhtasar')
    ) {
      categories.islamic.push(radio);
    } else {
      categories.reciters.push(radio);
    }
  });

  // Öne çıkan: mix, sakinlik, türkçe çeviri, sabah zikir
  const featuredUrls = ['mix', 'salma', 'sakeenah', 'athkar_sabah', 'athkar_masa', 'translation_quran_turkish'];
  categories.featured = radios.filter(r =>
    featuredUrls.some(u => (r.url || '').includes(u))
  );

  return categories;
}

/**
 * Son seçilen okuyucuyu kaydet
 */
export async function saveLastReciter(reciter) {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('last_selected_reciter', JSON.stringify(reciter));
  } catch (e) {
    console.warn('Failed to save last reciter:', e);
  }
}

/**
 * Son seçilen okuyucuyu getir
 */
export async function getLastReciter() {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const data = await AsyncStorage.getItem('last_selected_reciter');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Failed to load last reciter:', e);
    return null;
  }
}
