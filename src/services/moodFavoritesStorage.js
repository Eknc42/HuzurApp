import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOODS } from '../data/moods';
import { VERSES } from '../data/verses';

const STORAGE_KEY = 'huzur_mood_favorites_v1';

export async function getMoodFavoriteEntries() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function isMoodFavorite(verseId) {
  const list = await getMoodFavoriteEntries();
  return list.some((x) => x.verseId === verseId);
}

export async function toggleMoodFavorite(moodId, verse) {
  if (!verse?.id) return [];
  let list = await getMoodFavoriteEntries();
  const idx = list.findIndex((x) => x.verseId === verse.id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list = [{ moodId, verseId: verse.id, savedAt: Date.now(), verseData: verse }, ...list];
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Favoriler kaydedilemedi:', e);
  }
  return list;
}

/**
 * Liste ekranı için { verse, mood } dizisi
 */
export async function hydrateMoodFavorites() {
  const entries = await getMoodFavoriteEntries();
  const result = [];
  for (const e of entries) {
    const mood = MOODS.find((m) => m.id === e.moodId) || MOODS[0]; // Fallback mood
    
    let verse = e.verseData;
    
    // Fallback for legacy static verses that only saved ID
    if (!verse && e.moodId && VERSES[e.moodId]) {
      verse = VERSES[e.moodId].find((v) => v.id === e.verseId);
    }
    
    if (mood && verse) {
      result.push({ verse, mood });
    }
  }
  return result;
}
