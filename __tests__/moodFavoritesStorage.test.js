import {
  toggleMoodFavorite,
  hydrateMoodFavorites,
  isMoodFavorite,
} from '../src/services/moodFavoritesStorage';

const moodId = 'anxious';
const verseStub = require('../src/data/verses').VERSES[moodId][0];

describe('moodFavoritesStorage', () => {
  beforeEach(async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.clear();
  });

  it('hydrates persisted favorites linked to moods and verses', async () => {
    expect(await hydrateMoodFavorites()).toEqual([]);

    await toggleMoodFavorite(moodId, verseStub);
    expect(await isMoodFavorite(verseStub.id)).toBe(true);

    const list = await hydrateMoodFavorites();
    expect(list).toHaveLength(1);
    expect(list[0].verse.id).toBe(verseStub.id);
    expect(list[0].mood.id).toBe(moodId);

    await toggleMoodFavorite(moodId, verseStub);
    expect(await isMoodFavorite(verseStub.id)).toBe(false);
    expect(await hydrateMoodFavorites()).toEqual([]);
  });
});
