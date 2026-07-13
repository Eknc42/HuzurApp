// usePrayerTimes — Custom hook for prayer time management
// Handles fetching, countdown timer, current/next prayer detection, and city persistence
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, NativeModules } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimesForCity, DEFAULT_CITY_KEY, PRAYER_META, PRAYER_ORDER, CITIES } from '../data/prayerTimes';
import { LOCATIONS } from '../data/locations';
import { SELECTED_CITY_STORAGE_KEY } from '../constants/storageKeys';

/**
 * Parse "HH:MM" string into a Date object for today.
 */
function parseTimeToday(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Calculate remaining time in { hours, minutes, seconds }.
 */
function getRemaining(targetDate) {
  const now = new Date();
  let diff = targetDate.getTime() - now.getTime();

  if (diff < 0) {
    // Next prayer is tomorrow — add 24h
    diff += 24 * 60 * 60 * 1000;
  }

  const totalSec = Math.max(0, Math.floor(diff / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return { hours, minutes, seconds, totalSec };
}

/**
 * Determine which prayer is "current" (most recently passed)
 * and which prayer is "next" (upcoming).
 */
function computeCurrentAndNext(times) {
  const now = new Date();

  const entries = PRAYER_ORDER.map((key) => ({
    key,
    date: parseTimeToday(times[key]),
    time: times[key],
    ...PRAYER_META[key],
  }));

  let nextIndex = entries.findIndex((e) => e.date.getTime() > now.getTime());

  if (nextIndex === -1) {
    nextIndex = 0;
  }

  const currentIndex = nextIndex === 0 ? entries.length - 1 : nextIndex - 1;

  return {
    current: entries[currentIndex],
    next: entries[nextIndex],
    allPrayers: entries,
    currentIndex,
    nextIndex,
  };
}

/**
 * usePrayerTimes — Main hook
 *
 * @param {string} [initialCityKey] - Override city key (optional, defaults to persisted or DEFAULT)
 *
 * Returns:
 * - loading: boolean
 * - error: string | null
 * - location: { city, country, plate }
 * - allPrayers: [{ key, labelTr, time, date, color, ... }]
 * - currentPrayer / nextPrayer: prayer object
 * - countdown: { hours, minutes, seconds, totalSec }
 * - currentIndex / nextIndex for highlighting
 * - selectedCityKey: current city key
 * - setCity(key): change city and persist
 * - refetch: force refresh
 */
export default function usePrayerTimes(initialCityKey) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [cityKey, setCityKey] = useState(initialCityKey || DEFAULT_CITY_KEY);
  const [cityLoaded, setCityLoaded] = useState(!!initialCityKey);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, totalSec: 0 });
  const [prayerInfo, setPrayerInfo] = useState(null);
  const timerRef = useRef(null);

  // Load persisted city on mount (only if no initial override)
  useEffect(() => {
    if (initialCityKey) return;
    let alive = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(SELECTED_CITY_STORAGE_KEY);
        if (alive && saved) {
          setCityKey(saved);
        }
      } catch {
        // silently fall back to default
      } finally {
        if (alive) setCityLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, [initialCityKey]);

  // Sync data to native widget when it changes
  useEffect(() => {
    if (data && Platform.OS === 'android') {
      const widgetData = {
        location: data.location.city,
        Fajr: data.times.Fajr,
        Sunrise: data.times.Sunrise,
        Dhuhr: data.times.Dhuhr,
        Asr: data.times.Asr,
        Maghrib: data.times.Maghrib,
        Isha: data.times.Isha,
      };
      
      SharedGroupPreferences.setItem('prayerTimes', JSON.stringify(widgetData), 'group.com.huzurquran.app', { useAndroidSharedPreferences: true })
        .then(() => {
          if (NativeModules.WidgetUpdater) {
            NativeModules.WidgetUpdater.updatePrayerWidget();
          }
        })
        .catch(err => console.log('Widget sync error:', err));
    }
  }, [data]);

  // Fetch prayer times for selected city from API
  const fetchTimes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const safeKey = (cityKey || DEFAULT_CITY_KEY).toLocaleLowerCase('tr-TR');
      const locData = LOCATIONS.find(l => l.key.toLocaleLowerCase('tr-TR') === safeKey) 
                   || LOCATIONS.find(l => l.key.toLocaleLowerCase('tr-TR') === DEFAULT_CITY_KEY.toLocaleLowerCase('tr-TR'))
                   || LOCATIONS[0];
      const addressString = `${locData.display}, Türkiye`;
      const encodedAddress = encodeURIComponent(addressString);
      
      const res = await fetch(`https://api.aladhan.com/v1/timingsByAddress?address=${encodedAddress}&method=13`);
      const json = await res.json();
      
      if (res.ok && json.code === 200 && json.data) {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        setData({
          date: dateStr,
          location: {
            city: locData.display, // "Kadıköy, İstanbul" veya "İstanbul"
            country: 'Türkiye',
            plate: locData.plate,
            latitude: json.data.meta.latitude,
            longitude: json.data.meta.longitude,
          },
          times: {
            Fajr: json.data.timings.Fajr,
            Sunrise: json.data.timings.Sunrise,
            Dhuhr: json.data.timings.Dhuhr,
            Asr: json.data.timings.Asr,
            Maghrib: json.data.timings.Maghrib,
            Isha: json.data.timings.Isha,
          },
        });
      } else {
        // Fallback to static data for the city if API fails
        const cityLower = locData.city.toLocaleLowerCase('tr-TR');
        const fallbackData = getPrayerTimesForCity(cityLower) || getPrayerTimesForCity('istanbul');
        // Update display name for fallback
        fallbackData.location.city = locData.display;
        setData(fallbackData);
      }
    } catch (e) {
      // Fallback to static data if network fails
      const safeKey = (cityKey || DEFAULT_CITY_KEY).toLocaleLowerCase('tr-TR');
      const locData = LOCATIONS.find(l => l.key.toLocaleLowerCase('tr-TR') === safeKey) 
                   || LOCATIONS.find(l => l.key.toLocaleLowerCase('tr-TR') === DEFAULT_CITY_KEY.toLocaleLowerCase('tr-TR'))
                   || LOCATIONS[0];
      const cityLower = locData.city.toLocaleLowerCase('tr-TR');
      const fallbackData = getPrayerTimesForCity(cityLower) || getPrayerTimesForCity('istanbul');
      fallbackData.location.city = locData.display;
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [cityKey]);

  // Re-fetch when city changes and city has been loaded from storage
  useEffect(() => {
    if (cityLoaded) {
      fetchTimes();
    }
  }, [fetchTimes, cityLoaded]);

  // Compute current/next and run countdown
  useEffect(() => {
    if (!data) return;

    const tick = () => {
      const info = computeCurrentAndNext(data.times);
      setPrayerInfo(info);
      setCountdown(getRemaining(info.next.date));
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data]);

  // Change city and persist
  const setCity = useCallback(async (newKey) => {
    setCityKey(newKey);
    try {
      await AsyncStorage.setItem(SELECTED_CITY_STORAGE_KEY, newKey);
    } catch {
      // silently ignore
    }
  }, []);

  return {
    loading,
    error,
    location: data?.location || null,
    allPrayers: prayerInfo?.allPrayers || [],
    currentPrayer: prayerInfo?.current || null,
    nextPrayer: prayerInfo?.next || null,
    countdown,
    currentIndex: prayerInfo?.currentIndex ?? -1,
    nextIndex: prayerInfo?.nextIndex ?? -1,
    selectedCityKey: cityKey,
    setCity,
    refetch: fetchTimes,
  };
}
