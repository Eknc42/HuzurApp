// verseDurations.js — Ayet süresi bilgisi
// Her hafız + sure kombinasyonu için ayet süreleri
// Format: { reciterId: { surahId: [duration_secs, ...] } }
// mp3quran.net ve islamic.network CDN verisi temelinde

// Şimdilik ortalama süreler (Alafasy - Merkezli)
// Gerçek süreler API'den veya metadata'dan alınmalı
const getAverageDurations = () => ({
  // Fatiha (Sure 1)
  1: [5, 6, 4, 4, 6, 4, 8],
  
  // Baqara (Sure 2) - ilk 50 ayet
  2: [5, 5, 5, 5, 4, 5, 5, 4, 5, 4, 4, 4, 4, 5, 4, 5, 5, 4, 4, 5,
      5, 4, 4, 5, 5, 4, 5, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 4, 5, 4,
      4, 5, 5, 5, 4, 4, 5, 5, 5, 4],
});

// Ayet süresi hesapla (ortalama 4-5 saniye)
function estimateVerseDuration(surahId, verseId, verseLength) {
  const baselineChars = 30; // Ortalama ayet uzunluğu
  const baselineDuration = 4.5; // saniye
  
  // Character count based estimation
  const estimatedDuration = (verseLength / baselineChars) * baselineDuration;
  
  return Math.max(2, Math.min(15, estimatedDuration)); // 2-15 saniye aralığı
}

/**
 * Verilen surah'daki ayetlerin toplam süresi hesapla
 * @param {number} surahId - Sure numarası
 * @param {array} verses - Ayet listesi
 * @returns {number} Toplam süre (saniye)
 */
export function getSurahTotalDuration(surahId, verses) {
  if (!verses || verses.length === 0) return 0;
  
  const durations = getAverageDurations();
  
  if (durations[surahId]) {
    return durations[surahId].slice(0, verses.length)
      .reduce((sum, dur) => sum + dur, 0);
  }
  
  // Fallback: ortalama süreler
  return verses.reduce((sum, verse) => {
    const estDuration = estimateVerseDuration(
      surahId, 
      verse.id, 
      String(verse.arabic || '').length
    );
    return sum + estDuration;
  }, 0);
}

/**
 * Verilen progress'e göre şu anki ayet'i bul
 * @param {array} verses - Ayet listesi
 * @param {number} currentTime - Geçen süre (saniye)
 * @param {number} surahId - Sure numarası
 * @param {number|null} actualTotalDuration - Gerçek ses süresi (saniye)
 * @returns {object} { verseId, relativeTime, totalDuration }
 */
export function findCurrentVerse(verses, currentTime, surahId, actualTotalDuration) {
  if (!verses || verses.length === 0) {
    return { verseId: null, relativeTime: 0, totalDuration: 0, verseIndex: -1 };
  }

  // Calculate verse durations
  let verseDurations;

  if (actualTotalDuration && actualTotalDuration > 0) {
    // Proportional distribution based on actual audio duration
    // Weight each verse by Arabic text length
    const weights = verses.map(v => {
      const len = String(v.arabic || '').length;
      return Math.max(len, 5); // minimum weight
    });
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    verseDurations = weights.map(w => (w / totalWeight) * actualTotalDuration);
  } else {
    // Fallback to estimated durations
    const knownDurations = getAverageDurations();
    verseDurations = verses.map((verse, i) => {
      if (knownDurations[surahId] && knownDurations[surahId][i]) {
        return knownDurations[surahId][i];
      }
      return estimateVerseDuration(
        surahId,
        verse.id,
        String(verse.arabic || '').length
      );
    });
  }

  let accumulatedTime = 0;

  for (let i = 0; i < verses.length; i++) {
    const dur = verseDurations[i];
    const nextTime = accumulatedTime + dur;

    if (currentTime >= accumulatedTime && currentTime < nextTime) {
      return {
        verseId: verses[i].id,
        verseIndex: i,
        relativeTime: currentTime - accumulatedTime,
        totalDuration: dur,
        surahId,
      };
    }

    accumulatedTime = nextTime;
  }

  // Last verse
  const lastDur = verseDurations[verseDurations.length - 1];
  return {
    verseId: verses[verses.length - 1].id,
    verseIndex: verses.length - 1,
    relativeTime: 0,
    totalDuration: lastDur,
    surahId,
  };
}

/**
 * Tüm ayetlerin kümülatif start time'larını hesapla
 * @param {array} verses - Ayet listesi
 * @param {number} surahId - Sure numarası
 * @returns {array} [{ verseId, startTime, endTime, duration }, ...]
 */
export function getVerseTimelines(verses, surahId) {
  if (!verses || verses.length === 0) return [];
  
  const durations = getAverageDurations();
  let accumulatedTime = 0;
  
  return verses.map((verse, index) => {
    let verseDuration;
    
    if (durations[surahId] && durations[surahId][index]) {
      verseDuration = durations[surahId][index];
    } else {
      verseDuration = estimateVerseDuration(
        surahId,
        verse.id,
        String(verse.arabic || '').length
      );
    }
    
    const startTime = accumulatedTime;
    const endTime = accumulatedTime + verseDuration;
    accumulatedTime = endTime;
    
    return {
      verseId: verse.id,
      verseIndex: index,
      startTime,
      endTime,
      duration: verseDuration,
      surahId,
    };
  });
}
