/**
 * Ayet gösterimi alanındaki "sure:ayet" biçimini sayıya çevirir.
 * Örnek: "13:28", "2:186", "94:5-6" → ilk ayet numarası kullanılır (94 için 5).
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
 * Validate ayet reference format
 */
export function isValidAyahRef(ayahString) {
  return parseAyahRef(ayahString) !== null;
}
