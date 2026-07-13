// validationUtils.js — Input validation ve sanitization
// Ayet referansları, arama terimleri, kelimeleri valide et

/**
 * Ayet referansını valide et (sure:ayet format)
 * @param {string} ayahString - "13:28", "2:186" gibi format
 * @returns {boolean} Geçerli mi?
 */
export function isValidAyahRef(ayahString) {
  if (!ayahString || typeof ayahString !== 'string') {
    return false;
  }
  const m = ayahString.trim().match(/^(\d+)\s*:\s*(\d+)/);
  if (!m) return false;
  const surahId = parseInt(m[1], 10);
  const verseId = parseInt(m[2], 10);
  return surahId >= 1 && surahId <= 114 && verseId >= 1;
}

/**
 * Ayet referansını parse et
 * @param {string} ayahString - "13:28" gibi format
 * @returns {object|null} { surahId, verseId } veya null
 */
export function parseAyahRef(ayahString) {
  if (!ayahString || typeof ayahString !== 'string') {
    return null;
  }
  const m = ayahString.trim().match(/^(\d+)\s*:\s*(\d+)/);
  if (!m) return null;
  const surahId = parseInt(m[1], 10);
  const verseId = parseInt(m[2], 10);
  if (surahId < 1 || surahId > 114 || verseId < 1) return null;
  return { surahId, verseId };
}

/**
 * Arama terimini sanitize et
 * @param {string} query - Arama terimi
 * @param {number} maxLength - Maksimum uzunluk (default 100)
 * @returns {string} Sanitized query
 */
export function sanitizeSearchQuery(query, maxLength = 100) {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Boşlukları normalize et
  let sanitized = query.trim().replace(/\s+/g, ' ');

  // Zararlı karakterleri kaldır (sadece alfanumerik, boşluk, tek tırnak, tire)
  sanitized = sanitized.replace(/[^\w\s'-]/gu, '');

  // Uzunluğu sınırla
  sanitized = sanitized.substring(0, maxLength);

  return sanitized;
}

/**
 * Sure adını valide et
 * @param {string} name - Sure adı
 * @returns {boolean} Geçerli mi?
 */
export function isValidSurahName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  // En az 2 karakter, en fazla 50 karakter
  const trim = name.trim();
  return trim.length >= 2 && trim.length <= 50;
}

/**
 * Mood ID'sini valide et
 * @param {string} moodId - Mood ID
 * @returns {boolean} Geçerli mi?
 */
export function isValidMoodId(moodId) {
  const validMoods = ['anxious', 'lonely', 'grateful', 'lost', 'unmotivated', 'peaceful'];
  return validMoods.includes(moodId);
}

/**
 * URL'yi basit bir şekilde valide et (sadece http/https)
 * @param {string} url - URL
 * @returns {boolean} Geçerli mi?
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Reciter ID'sini valide et (basit)
 * @param {string} reciterId - Reciter ID
 * @returns {boolean} Geçerli mi?
 */
export function isValidReciterId(reciterId) {
  if (!reciterId || typeof reciterId !== 'string') {
    return false;
  }
  // En fazla 50 karakter, alfanumerik + tire + nokta
  return /^[a-zA-Z0-9._-]{1,50}$/.test(reciterId);
}

/**
 * Verse ID'sini valide et
 * @param {string} verseId - Verse ID
 * @returns {boolean} Geçerli mi?
 */
export function isValidVerseId(verseId) {
  if (!verseId || typeof verseId !== 'string') {
    return false;
  }
  // Format: "anx-1", "lon-5237", vb
  return /^[a-z]+-\d+$/.test(verseId);
}

/**
 * Arapça metni kontrol et (çok basit)
 * @param {string} text - Arapça metin
 * @returns {boolean} Muhtemelen Arapça mı?
 */
export function isLikelyArabic(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  // Arapça unicode range: U+0600 to U+06FF
  const arabicRange = /[\u0600-\u06FF]/g;
  return arabicRange.test(text);
}

/**
 * Metin uzunluğunu kontrol et
 * @param {string} text - Metin
 * @param {number} min - Minimum uzunluk
 * @param {number} max - Maksimum uzunluk
 * @returns {boolean} Geçerli mi?
 */
export function isValidTextLength(text, min = 1, max = 5000) {
  if (typeof text !== 'string') {
    return false;
  }
  const len = text.trim().length;
  return len >= min && len <= max;
}
