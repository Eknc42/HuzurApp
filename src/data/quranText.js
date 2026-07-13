// Huzur — Kur'an Metni (İlk Sureler + API Fetch)
// Fatiha ve kısa sureler gömülü, diğerleri AlQuran Cloud API'den çekilir

import AsyncStorage from '@react-native-async-storage/async-storage';

// Gömülü sureler (çevrimdışı erişim)
const BUNDLED_SURAHS = {
  1: [ // Fatiha
    { id: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', tr: 'Rahmân ve Rahîm olan Allah\'ın adıyla.' },
    { id: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', tr: 'Hamd, âlemlerin Rabbi Allah\'a mahsustur.' },
    { id: 3, arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', tr: 'O, Rahmân\'dır, Rahîm\'dir.' },
    { id: 4, arabic: 'مَالِكِ يَوْمِ الدِّينِ', tr: 'Din gününün sahibidir.' },
    { id: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', tr: 'Yalnız sana kulluk eder, yalnız senden yardım dileriz.' },
    { id: 6, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', tr: 'Bizi doğru yola ilet.' },
    { id: 7, arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', tr: 'Kendilerine nimet verdiklerinin yoluna; gazaba uğrayanların ve sapıtanların yoluna değil.' },
  ],
  112: [ // İhlas
    { id: 1, arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', tr: 'De ki: O, Allah\'tır, birdir.' },
    { id: 2, arabic: 'اللَّهُ الصَّمَدُ', tr: 'Allah Samed\'dir. (Her şey O\'na muhtaçtır; O, hiçbir şeye muhtaç değildir.)' },
    { id: 3, arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', tr: 'O doğurmamıştır ve doğmamıştır.' },
    { id: 4, arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', tr: 'Ve O\'nun hiçbir dengi yoktur.' },
  ],
  113: [ // Felak
    { id: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', tr: 'De ki: Sabahın Rabbine sığınırım.' },
    { id: 2, arabic: 'مِن شَرِّ مَا خَلَقَ', tr: 'Yarattıklarının şerrinden.' },
    { id: 3, arabic: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', tr: 'Karanlığı çöktüğü zaman gecenin şerrinden.' },
    { id: 4, arabic: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', tr: 'Ve düğümlere üfleyenlerin şerrinden.' },
    { id: 5, arabic: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', tr: 'Ve haset ettiği zaman hasetçinin şerrinden.' },
  ],
  114: [ // Nas
    { id: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', tr: 'De ki: İnsanların Rabbine sığınırım.' },
    { id: 2, arabic: 'مَلِكِ النَّاسِ', tr: 'İnsanların Melikine (Hükümdarına).' },
    { id: 3, arabic: 'إِلَٰهِ النَّاسِ', tr: 'İnsanların İlahına.' },
    { id: 4, arabic: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', tr: 'Sinsi vesvesecinin şerrinden.' },
    { id: 5, arabic: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', tr: 'O ki insanların göğüslerine vesvese verir.' },
    { id: 6, arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ', tr: 'Cinlerden ve insanlardan.' },
  ],
  // Not: Yasin, Mülk, Rahman gibi uzun sureler bilerek gömülmedi — API'den
  // tam metin çekilir. Sadece çok kısa sureler (Fatiha, İhlas, Felak, Nas)
  // çevrimdışı için gömülüdür.
};

const API_BASE = 'https://api.alquran.cloud/v1';

// Gömülü sure varsa döndür, yoksa API'den çek
export async function getSurahVerses(surahId) {
  // Önce gömülü kontrol
  if (BUNDLED_SURAHS[surahId]) {
    return BUNDLED_SURAHS[surahId];
  }

  // Cache kontrol
  const cacheKey = `quran_surah_${surahId}`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // Cache okuma hatası, devam et
  }

  // API'den çek — Arapça + Türkçe çeviri
  try {
    const [arabicRes, turkishRes] = await Promise.all([
      fetch(`${API_BASE}/surah/${surahId}`),
      fetch(`${API_BASE}/surah/${surahId}/tr.diyanet`),
    ]);

    const arabicData = await arabicRes.json();
    const turkishData = await turkishRes.json();

    if (arabicData.code === 200 && turkishData.code === 200) {
      const verses = arabicData.data.ayahs.map((ayah, i) => ({
        id: ayah.numberInSurah,
        arabic: ayah.text,
        tr: turkishData.data.ayahs[i]?.text || '',
      }));

      // Cache kaydet
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(verses));
      } catch (e) {
        // Cache yazma hatası
      }

      return verses;
    }
  } catch (e) {
    console.warn('Kur\'an API hatası:', e);
  }

  return null;
}

// Son okunan sureyi kaydet/getir
const LAST_READ_KEY = 'huzur_last_read';

export async function saveLastRead(surahId, verseId) {
  try {
    await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify({ surahId, verseId, timestamp: Date.now() }));
  } catch (e) {}
}

export async function getLastRead() {
  try {
    const data = await AsyncStorage.getItem(LAST_READ_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// Yer imi sistemi
const BOOKMARKS_KEY = 'huzur_bookmarks';

export async function getBookmarks() {
  try {
    const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export async function toggleBookmark(surahId, verseId) {
  const bookmarks = await getBookmarks();
  const index = bookmarks.findIndex(b => b.surahId === surahId && b.verseId === verseId);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push({ surahId, verseId, timestamp: Date.now() });
  }
  try {
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (e) {}
  return bookmarks;
}

export async function isBookmarked(surahId, verseId) {
  const bookmarks = await getBookmarks();
  return bookmarks.some(b => b.surahId === surahId && b.verseId === verseId);
}
