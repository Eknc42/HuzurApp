import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOODS } from '../data/moods';
import { getSurahById } from '../data/surahs';

import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { NativeModules, Platform } from 'react-native';

const DAILY_VERSE_CACHE_KEY = 'daily_verse_cache';
const APP_GROUP = 'group.com.huzurquran.app';

async function updateNativeWidgetData(verseData) {
  try {
    const widgetData = {
      arabicText: verseData.verse.arabicText,
      translationTr: verseData.verse.translationTr,
      surahRef: `${verseData.verse.surahTr} · ${verseData.verse.ayah}`
    };
    await SharedGroupPreferences.setItem('dailyVerse', widgetData, APP_GROUP, { useAndroidSharedPreferences: true });
    
    if (Platform.OS === 'android' && NativeModules.WidgetUpdater) {
      NativeModules.WidgetUpdater.updateWidget();
    }
  } catch (e) {
    console.warn('Native widget data could not be saved', e);
  }
}

export async function fetchDailyVerse() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  
  try {
    const cached = await AsyncStorage.getItem(DAILY_VERSE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.date === dateStr) {
        updateNativeWidgetData(parsed.data);
        return parsed.data;
      }
    }
  } catch (e) {
    console.warn('Daily verse cache read error', e);
  }

  // Deterministic seed for the day
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const ayahId = (seed * 9301 + 49297) % 233280 % 6236 + 1;

  try {
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahId}/editions/quran-uthmani,tr.diyanet`, { timeout: 10000 });
    const json = await res.json();

    if (json.code === 200 && json.data && json.data.length === 2) {
      const arabicData = json.data[0];
      const trData = json.data[1];
      
      const surahInfo = getSurahById(trData.surah.number);
      const surahTr = surahInfo ? surahInfo.nameTr + ' Suresi' : trData.surah.englishName;

      const verseData = {
        verse: {
          id: `api-${ayahId}`,
          arabicText: arabicData.text,
          translationTr: trData.text,
          surahTr: surahTr,
          ayah: `${trData.surah.number}:${trData.numberInSurah}`,
          aiExplanation: "Bu ayet, günün anlam ve önemine binaen tüm Kur'an-ı Kerim ayetleri arasından seçilmiştir.",
        },
        mood: MOODS.find((m) => m.id === 'peaceful') || MOODS[0],
      };

      try {
        await AsyncStorage.setItem(DAILY_VERSE_CACHE_KEY, JSON.stringify({
          date: dateStr,
          data: verseData
        }));
      } catch (e) {}

      updateNativeWidgetData(verseData);
      return verseData;
    }
  } catch (e) {
    console.warn('Daily verse API error', e);
  }

  // Fallback if API fails
  const fallbackData = {
    verse: {
      id: 'fallback',
      arabicText: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      translationTr: 'Biliniz ki, kalpler ancak Allah\'ı anmakla huzur bulur.',
      surahTr: 'Ra\'d Suresi',
      ayah: '13:28',
      aiExplanation: 'İnternet bağlantısı kurulamadığı için bu ayet gösterilmektedir.'
    },
    mood: MOODS.find((m) => m.id === 'peaceful') || MOODS[0],
  };

  updateNativeWidgetData(fallbackData);
  return fallbackData;
}
