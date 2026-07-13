// verseTimingApi.js — Ayet zamanlama verisi servisi
// Quran.com CDN API'den gerçek ayet zamanlamalarını çeker
// Fallback: mp3quran.net orantılı dağılım

import AsyncStorage from '@react-native-async-storage/async-storage';

// Quran.com CDN — ayet timing verisi (milisaniye)
const QDC_BASE = 'https://api.qurancdn.com/api/qdc/audio/reciters';

// QDC reciters that DO have verse-by-verse timing data on api.qurancdn.com.
// Each entry: QDC reciter id + name patterns to match against mp3quran reciter
// names (Arabic + Latin) so we can filter the mp3quran list to only show
// reciters whose audio can be perfectly synced.
const QDC_RECITERS = [
  { qdcId: 7,   patterns: ['العفاسي', 'afasy', 'alafasy', 'afasi'] },                  // Mishari Rashid Alafasy
  { qdcId: 2,   patterns: ['عبد الباسط', 'abdul baset', 'abdul-basit', 'abdulbasit', 'abdul basit', 'abdulbaset'] }, // AbdulBaset AbdulSamad
  { qdcId: 3,   patterns: ['السديس', 'sudais', 'sudays', 'as-sudais', 'sudaes'] },               // Abdurrahman as-Sudais
  { qdcId: 4,   patterns: ['الشاطري', 'shatri', 'al-shatri', 'shaatree'] },            // Abu Bakr al-Shatri
  { qdcId: 5,   patterns: ['الرفاعي', 'rifai', 'ar-rifai', 'rifaai'] },                // Hani ar-Rifai
  { qdcId: 6,   patterns: ['الحصري', 'husary', 'al-husary', 'hussary'] },              // Mahmoud Khalil Al-Husary
  { qdcId: 9,   patterns: ['المنشاوي', 'minshawi', 'minshawy', 'al-minshawi'] },       // Mohamed Siddiq al-Minshawi
  { qdcId: 10,  patterns: ['الشريم', 'shuraim', 'shuraym', 'ash-shuraim'] },           // Sa'ud ash-Shuraim
  { qdcId: 97,  patterns: ['الدوسري', 'dossari', 'dussary', 'dosari', 'al-dosari'] },  // Yasser Ad Dussary
  { qdcId: 161, patterns: ['التنيجي', 'tunaiji', 'al-tunaiji'] },                      // Khalifah Al Tunaiji
];

/**
 * Find the QDC reciter id for a given mp3quran reciter by name.
 * @param {string} arabicName - reciter Arabic name (mp3quran .name)
 * @param {string} latinName - reciter Latin/transliterated name (optional)
 * @returns {number|null} QDC reciter id, or null if no match
 */
export function findQdcMatch(arabicName = '', latinName = '') {
  const haystack = `${arabicName} ${latinName}`.toLowerCase();
  for (const entry of QDC_RECITERS) {
    if (entry.patterns.some((p) => haystack.includes(p.toLowerCase()))) {
      return entry.qdcId;
    }
  }
  return null;
}

// Default QDC reciter (Alafasy)
const DEFAULT_QDC_RECITER = 7;

// In-memory cache
const timingCache = {};
const CACHE_KEY_PREFIX = 'verse_timing_';

/**
 * Ayet zamanlamalarını getir (QDC API)
 * @param {number} surahId - Sure numarası (1-114)
 * @param {number|null} qdcReciterId - QDC okuyucu ID'si
 * @returns {array|null} [{verseId, timestampFrom, timestampTo, duration}, ...]
 */
export async function getVerseTimings(surahId, qdcReciterId = null) {
  const reciterId = qdcReciterId || DEFAULT_QDC_RECITER;
  const cacheKey = `${CACHE_KEY_PREFIX}${reciterId}_${surahId}`;

  // Check memory cache
  if (timingCache[cacheKey]) {
    return timingCache[cacheKey];
  }

  // Check persistent cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // New format: { timings: [...], audioUrl: '...' }
      if (parsed && parsed.timings && Array.isArray(parsed.timings)) {
        const arr = parsed.timings;
        arr.audioUrl = parsed.audioUrl || null;
        timingCache[cacheKey] = arr;
        return arr;
      }
      // Legacy format: plain array
      if (Array.isArray(parsed)) {
        timingCache[cacheKey] = parsed;
        return parsed;
      }
    }
  } catch (e) {
    // Cache miss, continue
  }

  // Fetch from QDC API
  try {
    const url = `${QDC_BASE}/${reciterId}/audio_files?chapter=${surahId}&segments=true`;
    const response = await fetch(url, { timeout: 10000 });
    const data = await response.json();

    if (data.audio_files && data.audio_files.length > 0) {
      const audioFile = data.audio_files[0];
      const verseTimings = (audioFile.verse_timings || []).map(vt => {
        // verse_key format: "1:3" → ayetId = 3
        const verseId = parseInt(vt.verse_key.split(':')[1], 10);
        return {
          verseId,
          timestampFrom: vt.timestamp_from, // ms
          timestampTo: vt.timestamp_to,     // ms
          duration: vt.duration,            // ms
        };
      });

      // Attach audio URL so caller can play the EXACT audio that matches timings
      verseTimings.audioUrl = audioFile.audio_url || null;

      // Save to cache (also keep audioUrl)
      timingCache[cacheKey] = verseTimings;
      try {
        await AsyncStorage.setItem(
          cacheKey,
          JSON.stringify({ timings: verseTimings, audioUrl: verseTimings.audioUrl })
        );
      } catch (e) {
        // Cache write error, ignore
      }

      return verseTimings;
    }
  } catch (e) {
    console.warn('Verse timing API error:', e);
  }

  return null;
}

/**
 * Timing verisinden şu anki ayeti bul
 * @param {array} timings - getVerseTimings() sonucu
 * @param {number} currentTimeMs - Geçen süre (milisaniye)
 * @returns {object} { verseId, verseIndex, progress }
 */
export function findVerseFromTimings(timings, currentTimeMs) {
  if (!timings || timings.length === 0) {
    return { verseId: null, verseIndex: -1, progress: 0 };
  }

  // 1) Exact match: time is inside a verse's [from, to) window
  for (let i = 0; i < timings.length; i++) {
    const t = timings[i];
    if (currentTimeMs >= t.timestampFrom && currentTimeMs < t.timestampTo) {
      return {
        verseId: t.verseId,
        verseIndex: i,
        progress: t.duration > 0 ? (currentTimeMs - t.timestampFrom) / t.duration : 0,
      };
    }
  }

  // 2) Time is before first verse → first verse
  if (currentTimeMs < timings[0].timestampFrom) {
    return { verseId: timings[0].verseId, verseIndex: 0, progress: 0 };
  }

  // 3) Time is in a gap between verses (or past last) → return the most
  //    recently passed verse so we never erroneously jump to the surah's
  //    final verse during a tiny inter-verse gap.
  for (let i = timings.length - 1; i >= 0; i--) {
    if (currentTimeMs >= timings[i].timestampFrom) {
      return { verseId: timings[i].verseId, verseIndex: i, progress: 1 };
    }
  }

  // Fallback (shouldn't reach here)
  return { verseId: timings[0].verseId, verseIndex: 0, progress: 0 };
}

