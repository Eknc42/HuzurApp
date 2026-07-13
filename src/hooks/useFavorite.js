// useFavorite — Encapsulates favorite toggle + state check
import { useState, useEffect, useCallback } from 'react';
import { isMoodFavorite, toggleMoodFavorite } from '../services/moodFavoritesStorage';

/**
 * @param {string} verseId
 * @param {string} moodId
 * @param {object} verse - Full verse object for toggling
 * @returns {{ saved: boolean, toggle: function, loading: boolean }}
 */
export default function useFavorite(verseId, moodId, verse) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSaved(await isMoodFavorite(verseId));
    } catch { setSaved(false); }
  }, [verseId]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await toggleMoodFavorite(moodId, verse);
      await refresh();
    } catch (e) {
      console.warn('Favorite toggle failed:', e);
    } finally { setLoading(false); }
  }, [loading, moodId, verse, refresh]);

  return { saved, toggle, loading };
}
