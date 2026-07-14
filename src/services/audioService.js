// AudioService — Ses yönetim servisi
// Kur'an tilaveti ve ambient ses yönetimi (react-native-sound)
// Memory leak prevention ve proper cleanup
// Android Foreground Service ile arka plan ses desteği
import { DeviceEventEmitter, Platform, NativeModules } from 'react-native';
import Sound from 'react-native-sound';
import { findCurrentVerse, getVerseTimelines } from '../utils/verseDurations';
import { getVerseTimings, findVerseFromTimings } from './verseTimingApi';
import { getSurahById } from '../data/surahs';

// Android foreground service bridge
const { AudioServiceModule } = NativeModules || {};

/**
 * Android: Foreground service başlat — bildirim çubuğunda "çalıyor" gösterir
 * ve sistem tarafından öldürülmesini engeller.
 */
function startForegroundService(title, description, options = {}) {
  if (Platform.OS === 'android' && AudioServiceModule) {
    try {
      AudioServiceModule.startService(title, description, options);
    } catch (e) {
      console.warn('Foreground service start error:', e);
    }
  }
}

/**
 * Android: Arka planda maksimum verim için pil optimizasyonunu kapatma izni ister.
 */
export function requestBatteryOptimization() {
  if (Platform.OS === 'android' && AudioServiceModule) {
    try {
      AudioServiceModule.requestBatteryOptimization();
    } catch (e) {
      console.warn('Battery optimization request error:', e);
    }
  }
}

/**
 * Android: Foreground service bildirim metnini güncelle.
 */
function updateForegroundNotification(title, description, options = {}) {
  if (Platform.OS === 'android' && AudioServiceModule) {
    try {
      AudioServiceModule.updateNotification(title, description, options);
    } catch (e) {
      console.warn('Foreground notification update error:', e);
    }
  }
}

/**
 * Android: Foreground service durdur.
 */
function stopForegroundService() {
  if (Platform.OS === 'android' && AudioServiceModule) {
    try {
      AudioServiceModule.stopService();
    } catch (e) {
      console.warn('Foreground service stop error:', e);
    }
  }
}

// Ses dosyalarını bellekten yüklemek için enable
// mixWithOthers=true → ambient + tilavet aynı anda çalabilir
Sound.setCategory('Playback', true);

// Aktif ses referansları
let recitationSound = null;
let radioSound = null;
let ambientSounds = {};

// Memory tracking
const soundRefs = new Set();
const soundLoadTimeouts = new Map();

// Retry & liveness watchdog
const MAX_PLAY_RETRIES = 2;
const RETRY_DELAY_MS = 2000;
let livenessInterval = null;
let lastKnownTime = -1;
let livenessStallCount = 0;
const LIVENESS_CHECK_INTERVAL_MS = 3000;
const LIVENESS_STALL_THRESHOLD = 2; // after 2 consecutive stalls → retry

// Active retry context so watchdog / play-failure can re-trigger playback
let activeRetryContext = null; // { fn, args, retriesLeft }
let isAudioLoading = false;

/**
 * Safe wrapper: sound.isPlaying() — native çağrı release edilmiş
 * objelerde crash verebilir, try-catch ile koruma altına alıyoruz.
 */
export function safeIsPlaying(sound) {
  if (!sound) return false;
  try {
    return sound.isPlaying();
  } catch (e) {
    console.warn('safeIsPlaying error (sound likely released):', e);
    return false;
  }
}

/**
 * Safe wrapper: sound.isLoaded() — aynı sebepten koruma.
 */
export function safeIsLoaded(sound) {
  if (!sound) return false;
  try {
    return typeof sound.isLoaded === 'function' ? sound.isLoaded() : false;
  } catch (e) {
    console.warn('safeIsLoaded error (sound likely released):', e);
    return false;
  }
}

// Verse tracking
let currentPlayingContext = null; // { surahId, verses, isPlaying }
let activeSurahId = null; // Eklendi: Oynatılan son sure kimliğini tutar
let verseTrackingInterval = null;
let verseChangeSubscribers = [];
let audioControlSubscribers = [];
let nativeAudioControlSubscription = null;

const AUDIO_CONTROL_EVENT = 'HuzurAudioControl';
export const AUDIO_CONTROL_ACTIONS = {
  STOP: 'stop',
  NEXT: 'next',
  PREVIOUS: 'previous',
  PLAY: 'play',
  PAUSE: 'pause',
};

function ensureNativeAudioControlListener() {
  if (Platform.OS !== 'android' || nativeAudioControlSubscription) return;

  nativeAudioControlSubscription = DeviceEventEmitter.addListener(AUDIO_CONTROL_EVENT, (event) => {
    const action = event?.action;
    if (action === AUDIO_CONTROL_ACTIONS.STOP) {
      stopRecitation();
      stopRadio();
    }

    audioControlSubscribers.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        console.warn('Audio control callback error:', e);
      }
    });
  });
}

export function subscribeToAudioControlActions(callback) {
  ensureNativeAudioControlListener();
  audioControlSubscribers.push(callback);
  return () => {
    audioControlSubscribers = audioControlSubscribers.filter(cb => cb !== callback);
  };
}

// Hafız ses URL'leri (AlQuran Cloud CDN — ayet bazlı)
// Format: https://cdn.islamic.network/quran/audio/{bitrate}/{reciterId}/{verseNumber}.mp3
// verseNumber: 1-6236 arası global ayet numarası

const AUDIO_BASE = 'https://cdn.islamic.network/quran/audio/128';

// Sure'nin ilk ayetinin global numarasını hesapla
const SURAH_START_VERSES = [
  0, 1, 8, 294, 494, 670, 790, 955, 1161, 1236, 1365, 1474, 1597, 1708, 1751,
  1803, 1902, 2030, 2141, 2251, 2349, 2484, 2596, 2674, 2792, 2856, 2933,
  3160, 3253, 3341, 3410, 3470, 3504, 3534, 3607, 3661, 3706, 3789, 3971,
  4059, 4134, 4219, 4273, 4326, 4415, 4474, 4511, 4546, 4584, 4613, 4631,
  4676, 4736, 4785, 4847, 4902, 4980, 5076, 5105, 5127, 5151, 5164, 5178,
  5189, 5200, 5218, 5230, 5242, 5272, 5324, 5376, 5420, 5448, 5476, 5496,
  5552, 5608, 5658, 5698, 5744, 5786, 5815, 5834, 5870, 5895, 5917, 5939,
  5956, 5975, 6005, 6035, 6055, 6070, 6091, 6102, 6110, 6118, 6137, 6142,
  6150, 6158, 6169, 6180, 6188, 6191, 6200, 6205, 6209, 6213, 6219, 6225,
  6228, 6233, 6237, 6242, 6248
];

/**
 * Internal: Sound instance'ı properly release et
 */
function releaseSound(sound, sourceId) {
  if (!sound) return;
  try {
    if (safeIsPlaying(sound)) {
      sound.stop();
    }
  } catch (e) {
    console.warn(`Error stopping sound ${sourceId}:`, e);
  }
  try {
    sound.release();
  } catch (e) {
    console.warn(`Error releasing sound ${sourceId}:`, e);
  }
  soundRefs.delete(sourceId);
}

/**
 * Internal: Timeout'ı cancel et ve cleanup yap
 */
function cancelSoundTimeout(soundId) {
  if (soundLoadTimeouts.has(soundId)) {
    clearTimeout(soundLoadTimeouts.get(soundId));
    soundLoadTimeouts.delete(soundId);
  }
}

/**
 * Global ayet numarası hesapla
 * @param {number} surahId - Sure numarası (1-114)
 * @param {number} verseId - Sure içi ayet numarası (1-N)
 * @returns {number} Global ayet numarası
 */
export function getGlobalVerseNumber(surahId, verseId) {
  return SURAH_START_VERSES[surahId] + verseId - 1;
}

/**
 * Kur'an ayeti ses URL'si oluştur
 * Özel reciterId 'yasser_dussary' → everyayah.com CDN kullanılır
 * (alquran.cloud'da Yasser Ad-Dussary yok, everyayah.com'da var)
 */
export function getVerseAudioUrl(surahId, verseId, reciterId = 'ar.alafasy') {
  if (reciterId === 'yasser_dussary') {
    const s = String(surahId).padStart(3, '0');
    const v = String(verseId).padStart(3, '0');
    return `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${s}${v}.mp3`;
  }
  const globalVerse = getGlobalVerseNumber(surahId, verseId);
  return `${AUDIO_BASE}/${reciterId}/${globalVerse}.mp3`;
}

/**
 * Kur'an tilavetini başlat
 */
export function playRecitation(surahId, verseId, reciterId = 'ar.alafasy', callbacks = {}) {
  // Önceki sesi durdur
  stopRadio();
  stopRecitation();

  activeSurahId = surahId;

  const url = getVerseAudioUrl(surahId, verseId, reciterId);
  const soundId = `recitation_${surahId}_${verseId}`;

  // (Kullanıcı talebi üzerine Kur'an tilavetinde bildirim kapatıldı)
  // startForegroundService('Kur\'an Dinle', `Ayet ${surahId}:${verseId}`, ...);

  // Load timeout (10 saniye)
  const timeoutId = setTimeout(() => {
    console.warn(`Sound load timeout: ${soundId}`);
    releaseSound(recitationSound, soundId);
    recitationSound = null;
    if (callbacks.onError) {
      callbacks.onError(new Error('Sound load timeout'));
    }
  }, 10000);

  try {
    recitationSound = new Sound(url, null, (error) => {
      cancelSoundTimeout(soundId);

      if (error) {
        console.warn('Ses yükleme hatası:', error);
        releaseSound(recitationSound, soundId);
        recitationSound = null;
        if (callbacks.onError) callbacks.onError(error);
        return;
      }

      soundRefs.add(soundId);

      if (callbacks.onLoaded) {
        try {
          callbacks.onLoaded({
            duration: recitationSound.getDuration(),
          });
        } catch (e) {
          console.warn('onLoaded callback error:', e);
        }
      }

      try {
        recitationSound.play((success) => {
          if (success && callbacks.onEnd) {
            callbacks.onEnd();
          }
        });
      } catch (e) {
        console.warn('Sound play error:', e);
        if (callbacks.onError) callbacks.onError(e);
      }
    });
  } catch (e) {
    console.warn('Sound creation error:', e);
    cancelSoundTimeout(soundId);
    if (callbacks.onError) callbacks.onError(e);
  }

  soundLoadTimeouts.set(soundId, timeoutId);
  return recitationSound;
}

/**
 * mp3quran.net sunucusundan sure çal
 * @param {string} serverUrl - Hafız sunucu URL'si (örn: https://server8.mp3quran.net/afs/)
 * @param {number} surahId - Sure numarası (1-114)
 * @param {object} callbacks - { onLoaded, onEnd, onError }
 * @param {number} _retryCount - Internal retry counter
 */
export function playSurahFromServer(serverUrl, surahId, callbacks = {}, _retryCount = 0) {
  stopRadio();
  stopRecitation();

  activeSurahId = surahId;

  const paddedId = String(surahId).padStart(3, '0');
  const url = `${serverUrl}${paddedId}.mp3`;

  // Tüm sure çalınırken Android arka planda kapatmasın diye bildirimi açıyoruz.
  const surahName = getSurahById(surahId)?.nameTr || `${surahId}.`;
  startForegroundService('Kur\'an Dinle', `${surahName} Suresi`, {
    mediaType: 'quran',
    canSkipNext: surahId < 114,
    canSkipPrev: surahId > 1,
  });

  // Retry helper
  const retryPlayback = () => {
    if (_retryCount < MAX_PLAY_RETRIES) {
      console.warn(`playSurahFromServer retry ${_retryCount + 1}/${MAX_PLAY_RETRIES} for surah ${surahId}`);
      setTimeout(() => {
        playSurahFromServer(serverUrl, surahId, callbacks, _retryCount + 1);
      }, RETRY_DELAY_MS);
    } else {
      console.warn('playSurahFromServer: max retries exceeded');
      if (callbacks.onError) callbacks.onError(new Error('Max retries exceeded'));
    }
  };

  let currentSound = null;
  currentSound = new Sound(url, null, (error) => {
    if (recitationSound !== currentSound) {
      if (currentSound) currentSound.release();
      return;
    }

    if (error) {
      console.warn('mp3quran ses hatası:', error);
      retryPlayback();
      return;
    }

    if (callbacks.onLoaded) {
      callbacks.onLoaded({ duration: currentSound.getDuration() });
    }

    currentSound.play((success) => {
      if (success) {
        if (callbacks.onEnd) callbacks.onEnd();
      } else {
        console.warn('playSurahFromServer: play() returned success=false');
        retryPlayback();
      }
    });
  });
  
  recitationSound = currentSound;
  return recitationSound;
}

// ==========================================
// RADYO STREAMING
// ==========================================

/**
 * Canlı radyo başlat
 */
export function playRadio(streamUrl, callbacks = {}) {
  stopRecitation();
  stopRadio();

  const soundId = 'radio';

  // Android: Foreground service başlat
  startForegroundService('Canlı Radyo', 'Kur\'an radyosu dinleniyor...', {
    mediaType: 'radio',
    canSkipNext: false,
    canSkipPrev: false,
  });

  // Radyo stream timeout (15 saniye) — bozuk URL'lerde sonsuz beklemeyi önler
  const timeoutId = setTimeout(() => {
    console.warn('Radio stream load timeout');
    releaseSound(radioSound, soundId);
    radioSound = null;
    stopForegroundService();
    if (callbacks.onError) {
      callbacks.onError(new Error('Radio stream load timeout'));
    }
  }, 15000);

  soundLoadTimeouts.set(soundId, timeoutId);

  try {
    radioSound = new Sound(streamUrl, null, (error) => {
      cancelSoundTimeout(soundId);

      if (error) {
        console.warn('Radyo stream hatası:', error);
        releaseSound(radioSound, soundId);
        radioSound = null;
        stopForegroundService();
        if (callbacks.onError) callbacks.onError(error);
        return;
      }

      soundRefs.add(soundId);

      if (callbacks.onLoaded) callbacks.onLoaded();
      try {
        radioSound.play();
      } catch (e) {
        console.warn('Radio play error:', e);
        stopForegroundService();
        if (callbacks.onError) callbacks.onError(e);
      }
    });
  } catch (e) {
    console.warn('Radio sound creation error:', e);
    cancelSoundTimeout(soundId);
    stopForegroundService();
    if (callbacks.onError) callbacks.onError(e);
  }

  return radioSound;
}

/**
 * Radyoyu durdur
 */
export function stopRadio() {
  cancelSoundTimeout('radio');
  releaseSound(radioSound, 'radio');
  radioSound = null;
  // Update notification to show stopped state
  updateForegroundNotification('Canlı Radyo', 'Durduruldu', {
    mediaType: 'radio',
    canSkipNext: false,
    canSkipPrev: false,
    isPlaying: false,
  });
}

/**
 * Radyo çalıyor mu?
 */
export function isRadioPlaying() {
  return safeIsPlaying(radioSound);
}

/**
 * Tilaveti durdur
 */
export function stopRecitation() {
  stopLivenessWatchdog();
  activeRetryContext = null;
  soundLoadTimeouts.forEach((_, key) => {
    if (key.startsWith('recitation_') || key.startsWith('surah_')) {
      cancelSoundTimeout(key);
    }
  });
  releaseSound(recitationSound, 'recitation');
  recitationSound = null;

  // Update notification to show stopped state
  const surahId = activeSurahId || currentPlayingContext?.surahId;
  updateForegroundNotification('Kur\'an Dinle', 'Durduruldu', {
    mediaType: 'quran',
    canSkipNext: surahId ? surahId < 114 : false,
    canSkipPrev: surahId ? surahId > 1 : false,
    isPlaying: false,
  });
  activeSurahId = null;
}

/**
 * Bildirimi ve foreground servisi tamamen kapat.
 * Sadece ekrandan çıkılırken çağrılmalı.
 */
export function dismissNotification() {
  stopForegroundService();
}

/**
 * Tilaveti duraklat
 */
export function pauseRecitation() {
  stopLivenessWatchdog();
  if (recitationSound) {
    try {
      recitationSound.pause();
      // Update notification to show paused state
      const surahId = activeSurahId || currentPlayingContext?.surahId;
      updateForegroundNotification('Kur\'an Dinle', 'Duraklatıldı', {
        mediaType: 'quran',
        canSkipNext: surahId ? surahId < 114 : false,
        canSkipPrev: surahId ? surahId > 1 : false,
        isPlaying: false,
      });
    } catch (e) {
      console.warn('Pause error:', e);
    }
  }
}

/**
 * Tilavete devam et
 */
export function resumeRecitation() {
  if (isAudioLoading) {
    console.warn('resumeRecitation: audio is currently loading, ignoring resume to prevent race conditions.');
    return;
  }
  
  if (!recitationSound) {
    console.warn('resumeRecitation: sound is null, attempting retry via activeRetryContext');
    // Sound was released/lost — try to re-play from retry context
    if (activeRetryContext) {
      const { fn, args } = activeRetryContext;
      fn(...args);
    }
    return;
  }
  try {
    if (!safeIsLoaded(recitationSound)) {
      console.warn('resumeRecitation: sound not loaded, attempting retry');
      if (activeRetryContext) {
        const { fn, args } = activeRetryContext;
        fn(...args);
      }
      return;
    }
    recitationSound.play((success) => {
      if (!success) {
        console.warn('resumeRecitation: play() returned success=false');
        if (activeRetryContext) {
          const { fn, args } = activeRetryContext;
          fn(...args);
        }
      }
    });
    startLivenessWatchdog();
    // Update notification to show playing state
    const surahId = activeSurahId || currentPlayingContext?.surahId;
    updateForegroundNotification('Kur\'an Dinle', 'Çalıyor', {
      mediaType: 'quran',
      canSkipNext: surahId ? surahId < 114 : true,
      canSkipPrev: surahId ? surahId > 1 : false,
      isPlaying: true,
    });
  } catch (e) {
    console.warn('resumeRecitation error:', e);
    if (activeRetryContext) {
      const { fn, args } = activeRetryContext;
      fn(...args);
    }
  }
}

/**
 * Tilavet çalıyor mu?
 */
export function isRecitationPlaying() {
  return safeIsPlaying(recitationSound);
}

/**
 * Herhangi bir MP3 URL'sini tilavet kanalında çal (ayrı sesler için)
 */
export function playAudioFromUrl(url, callbacks = {}) {
  stopRecitation();
  recitationSound = new Sound(url, null, (error) => {
    if (error) {
      console.warn('playAudioFromUrl error:', error);
      if (callbacks.onError) callbacks.onError(error);
      return;
    }
    if (callbacks.onLoaded) {
      try {
        callbacks.onLoaded({ duration: recitationSound.getDuration() });
      } catch (e) {}
    }
    try {
      recitationSound.play((success) => {
        if (success && callbacks.onEnd) callbacks.onEnd();
      });
    } catch (e) {
      if (callbacks.onError) callbacks.onError(e);
    }
  });
  return recitationSound;
}

/**
 * Tilavet sesinin toplam süresi (saniye)
 */
export function getRecitationDuration() {
  if (!recitationSound) return 0;
  try {
    return recitationSound.getDuration() || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Tilavetin anlık konumunu döndürür (Promise<seconds>)
 */
export function getRecitationCurrentTime() {
  return new Promise((resolve) => {
    if (!recitationSound) return resolve(0);
    try {
      recitationSound.getCurrentTime((seconds) => resolve(seconds || 0));
    } catch (e) {
      resolve(0);
    }
  });
}

/**
 * Tilavet sesini belirli saniyeye sar
 */
export function seekRecitation(seconds) {
  if (!recitationSound) return;
  try {
    const dur = recitationSound.getDuration() || 0;
    const target = Math.max(0, Math.min(dur, seconds));
    recitationSound.setCurrentTime(target);
  } catch (e) {
    console.warn('Seek error:', e);
  }
}

// ==========================================
// AMBIENT SESLER
// ==========================================

// Lokal ambient ses dosyaları
// Android: android/app/src/main/res/raw/*.mp3
// iOS:     iOS bundle (Xcode'a eklenmeli)
// react-native-sound MAIN_BUNDLE ile platform-native dosya yükler
const AMBIENT_FILES = ['rain', 'ocean', 'forest', 'wind', 'night', 'fire'];

/**
 * Ambient ses başlat (loop)
 * @param {string} soundId
 * @param {number} volume
 * @param {object} callbacks - { onLoaded, onError }
 */
export function playAmbientSound(soundId, volume = 0.5, callbacks = {}) {
  // Zaten çalıyorsa durdur
  stopAmbientSound(soundId);

  if (!AMBIENT_FILES.includes(soundId)) {
    callbacks.onError && callbacks.onError(new Error('Bilinmeyen ses: ' + soundId));
    return;
  }

  // Android: 'rain' (uzantısız, raw klasöründen)
  // iOS:     'rain.mp3' (main bundle'dan)
  const filename = Platform.OS === 'android' ? soundId : `${soundId}.mp3`;
  const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
    if (error) {
      console.warn(`Ambient ses hatası (${soundId}):`, error);
      callbacks.onError && callbacks.onError(error);
      return;
    }

    sound.setVolume(volume);
    sound.setNumberOfLoops(-1); // Sonsuz döngü
    sound.play((success) => {
      if (!success) {
        console.warn(`Ambient playback failed (${soundId})`);
      }
    });
    callbacks.onLoaded && callbacks.onLoaded();
  });

  ambientSounds[soundId] = sound;
  return sound;
}

/**
 * Ambient ses durdur
 */
export function stopAmbientSound(soundId) {
  if (ambientSounds[soundId]) {
    releaseSound(ambientSounds[soundId], `ambient_${soundId}`);
    delete ambientSounds[soundId];
  }
}

/**
 * Ambient ses seviyesini ayarla
 */
export function setAmbientVolume(soundId, volume) {
  if (ambientSounds[soundId]) {
    try {
      ambientSounds[soundId].setVolume(Math.max(0, Math.min(1, volume)));
    } catch (e) {
      console.warn(`Error setting volume for ${soundId}:`, e);
    }
  }
}

/**
 * Tüm ambient sesleri durdur
 */
export function stopAllAmbientSounds() {
  Object.keys(ambientSounds).forEach(id => stopAmbientSound(id));
}

/**
 * Şu anda çalan ambient seslerin ID'lerini döndür
 */
export function getActiveAmbientIds() {
  return Object.keys(ambientSounds);
}

/**
 * Liveness watchdog: sesin gerçekten çalıp çalmadığını izler.
 * getCurrentTime ilerlemiyorsa "stalled" sayar, eşik aşılınca retry tetikler.
 */
function startLivenessWatchdog() {
  stopLivenessWatchdog();
  lastKnownTime = -1;
  livenessStallCount = 0;

  livenessInterval = setInterval(() => {
    if (!recitationSound || !safeIsPlaying(recitationSound)) {
      return; // paused veya stopped — kontrol etme
    }
    try {
      recitationSound.getCurrentTime((seconds) => {
        if (lastKnownTime >= 0 && Math.abs(seconds - lastKnownTime) < 0.1) {
          livenessStallCount++;
          console.warn(`Liveness watchdog: stall detected (${livenessStallCount}/${LIVENESS_STALL_THRESHOLD})`);
          if (livenessStallCount >= LIVENESS_STALL_THRESHOLD) {
            console.warn('Liveness watchdog: playback stalled, triggering retry');
            stopLivenessWatchdog();
            if (activeRetryContext) {
              const { fn, args, retriesLeft } = activeRetryContext;
              if (retriesLeft > 0) {
                activeRetryContext.retriesLeft = retriesLeft - 1;
                setTimeout(() => fn(...args), RETRY_DELAY_MS);
              }
            }
          }
        } else {
          livenessStallCount = 0;
        }
        lastKnownTime = seconds;
      });
    } catch (e) {
      console.warn('Liveness watchdog error:', e);
    }
  }, LIVENESS_CHECK_INTERVAL_MS);
}

function stopLivenessWatchdog() {
  if (livenessInterval) {
    clearInterval(livenessInterval);
    livenessInterval = null;
  }
  lastKnownTime = -1;
  livenessStallCount = 0;
}

/**
 * Tüm sesleri durdur ve resources cleanup
 */
export function stopAllSounds() {
  stopRecitation();
  stopRadio();
  stopAllAmbientSounds();
  stopLivenessWatchdog();
  activeRetryContext = null;
  soundLoadTimeouts.clear();
  soundRefs.clear();
}

/**
 * Get memory/resource status
 */
export function getAudioStatus() {
  return {
    activeTimeouts: soundLoadTimeouts.size,
    activeSoundRefs: soundRefs.size,
    isRecitationPlaying: isRecitationPlaying(),
    isRadioPlaying: isRadioPlaying(),
    ambientSoundsCount: Object.keys(ambientSounds).length,
  };
}

// ==========================================
// VERSE TRACKING (Sure oynatırken ayet sync)
// ==========================================

/**
 * Subscribe to verse changes during surah playback
 * @param {function} callback - Called with { verseId, verseIndex, startTime, endTime, duration, surahId }
 * @returns {function} Unsubscribe function
 */
export function subscribeToVerseChanges(callback) {
  verseChangeSubscribers.push(callback);
  return () => {
    verseChangeSubscribers = verseChangeSubscribers.filter(cb => cb !== callback);
  };
}

/**
 * Internal: Notify all subscribers about verse change
 */
function notifyVerseChange(verseInfo) {
  verseChangeSubscribers.forEach(cb => {
    try {
      cb(verseInfo);
    } catch (e) {
      console.warn('Verse callback error:', e);
    }
  });

  // Update notification with current verse info
  if (verseInfo.surahId && verseInfo.verseId) {
    const { getSurahById } = require('../data/surahs');
    const surah = getSurahById(verseInfo.surahId);
    if (surah) {
      updateForegroundNotification(
        `${surah.nameTr} Suresi`,
        `Ayet ${verseInfo.verseId}`,
        { mediaType: 'quran', canSkipNext: verseInfo.surahId < 114, canSkipPrev: verseInfo.surahId > 1, isPlaying: true }
      );
    }
  }
}

/**
 * Internal: Start verse tracking during surah playback
 */
// Lookahead offset (ms): highlight switches this many ms BEFORE the audio
// actually reaches the next verse, to compensate for polling lag, async
// getCurrentTime latency and audio output buffering. Tune if needed.
const VERSE_HIGHLIGHT_LOOKAHEAD_MS = 250;

function startVerseTracking() {
  if (verseTrackingInterval) {
    clearInterval(verseTrackingInterval);
  }

  let lastVerseIndex = -1;

  verseTrackingInterval = setInterval(() => {
    if (!recitationSound || !currentPlayingContext) {
      return;
    }

    try {
      recitationSound.getCurrentTime((seconds) => {
        // Async callback - context might have been cleared by stopRecitation()
        if (!currentPlayingContext) return;

        // Add lookahead so highlight is slightly ahead of audio playback,
        // making the perceived sync feel exactly aligned.
        const adjustedMs = seconds * 1000 + VERSE_HIGHLIGHT_LOOKAHEAD_MS;
        const adjustedSec = adjustedMs / 1000;

        let verseInfo;

        if (currentPlayingContext.qdcTimings && currentPlayingContext.qdcTimings.length > 0) {
          const timingInfo = findVerseFromTimings(currentPlayingContext.qdcTimings, adjustedMs);
          verseInfo = {
            verseId: timingInfo.verseId,
            verseIndex: timingInfo.verseIndex,
            surahId: currentPlayingContext.surahId,
          };
        } else {
          verseInfo = findCurrentVerse(
            currentPlayingContext.verses,
            adjustedSec,
            currentPlayingContext.surahId,
            currentPlayingContext.totalDuration
          );
        }

        // Notify only when verse changes
        if (verseInfo.verseIndex !== lastVerseIndex) {
          lastVerseIndex = verseInfo.verseIndex;
          notifyVerseChange(verseInfo);
        }
      });
    } catch (e) {
      console.warn('Verse tracking error:', e);
    }
  }, 50); // Tight 50ms polling for sub-frame verse-change accuracy
}

/**
 * Internal: Stop verse tracking
 */
function stopVerseTracking() {
  if (verseTrackingInterval) {
    clearInterval(verseTrackingInterval);
    verseTrackingInterval = null;
  }
  currentPlayingContext = null;
}

/**
 * Play surah from server with verse tracking
 * @param {string} serverUrl - Hafız sunucu URL'si
 * @param {number} surahId - Sure numarası
 * @param {array} verses - Ayet listesi (for verse tracking)
 * @param {object} callbacks - { onLoaded, onEnd, onError }
 * @param {number|null} qdcReciterId - QDC okuyucu ID'si
 * @param {number} _retryCount - Internal retry counter
 */
export async function playSurahFromServerWithVerseTracking(
  serverUrl,
  surahId,
  verses,
  callbacks = {},
  qdcReciterId = null,
  _retryCount = 0
) {
  stopRadio();
  stopRecitation();
  stopVerseTracking();
  isAudioLoading = true;
  activeSurahId = surahId;

  // Android: Foreground service başlat
  const surahName = getSurahById(surahId)?.nameTr || `${surahId}.`;
  startForegroundService('Kur\'an Dinle', `${surahName} Suresi`, {
    mediaType: 'quran',
    canSkipNext: surahId < 114,
    canSkipPrev: surahId > 1,
  });

  const paddedId = String(surahId).padStart(3, '0');
  const fallbackUrl = `${serverUrl}${paddedId}.mp3`;
  const soundId = `surah_${surahId}`;

  // Retry helper for load errors and play failures
  const retryPlayback = () => {
    if (_retryCount < MAX_PLAY_RETRIES) {
      console.warn(`playSurahFromServerWithVerseTracking retry ${_retryCount + 1}/${MAX_PLAY_RETRIES} for surah ${surahId}`);
      setTimeout(() => {
        playSurahFromServerWithVerseTracking(
          serverUrl, surahId, verses, callbacks, qdcReciterId, _retryCount + 1
        );
      }, RETRY_DELAY_MS);
    } else {
      console.warn('playSurahFromServerWithVerseTracking: max retries exceeded');
      stopForegroundService();
      if (callbacks.onError) callbacks.onError(new Error('Max retries exceeded'));
    }
  };

  // Store retry context so watchdog / resumeRecitation can re-trigger
  activeRetryContext = {
    fn: playSurahFromServerWithVerseTracking,
    args: [serverUrl, surahId, verses, callbacks, qdcReciterId, 0],
    retriesLeft: MAX_PLAY_RETRIES,
  };

  // STEP 1: Pre-fetch QDC timings + matching audio URL.
  // The reciter list is pre-filtered to QDC-supported reciters, so qdcReciterId
  // should be present. We use QDC's own audio so playback and timings align
  // to the exact same recording → frame-perfect sync.
  let qdcTimings = null;
  let audioUrl = fallbackUrl;
  if (qdcReciterId) {
    try {
      qdcTimings = await getVerseTimings(surahId, qdcReciterId);
      if (qdcTimings && qdcTimings.audioUrl) {
        // Normalize URL: collapse any accidental double slashes that aren't
        // part of the scheme (e.g. "//file.mp3" → "/file.mp3"). Some QDC
        // entries (e.g. Yasser Ad-Dussary) return malformed URLs that fail
        // to load in react-native-sound.
        audioUrl = qdcTimings.audioUrl.replace(/([^:])\/{2,}/g, '$1/');
        console.log(`Using QDC audio (qdcId=${qdcReciterId}): ${audioUrl}`);
      } else {
        console.log('QDC audio_url missing, falling back to mp3quran URL:', fallbackUrl);
      }
    } catch (e) {
      console.warn('QDC pre-fetch failed:', e);
    }
  }

  const timeoutId = setTimeout(() => {
    console.warn(`Server sound load timeout: ${soundId}`);
    if (recitationSound) {
      releaseSound(recitationSound, soundId);
      recitationSound = null;
    }
    // Timeout durumunda da retry dene
    retryPlayback();
  }, 15000);

  try {
    let currentSound = null;
    currentSound = new Sound(audioUrl, null, (error) => {
      cancelSoundTimeout(soundId);

    // If recitationSound was set to null by timeout, or a new play request started, abort.
    if (recitationSound !== currentSound) {
      console.warn('Sound load aborted: new sound started or timeout fired');
      if (currentSound) currentSound.release();
      isAudioLoading = false;
      return;
    }

    if (error) {
      console.warn('Audio load error:', error);
      releaseSound(recitationSound, soundId);
      recitationSound = null;
      isAudioLoading = false;
      retryPlayback();
      return;
    }

    soundRefs.add(soundId);

    // Setup verse tracking context with timings already loaded
    const audioDuration = currentSound.getDuration();
      currentPlayingContext = {
        surahId,
        verses,
        isPlaying: false,
        totalDuration: audioDuration > 0 ? audioDuration : null,
        qdcTimings: qdcTimings && qdcTimings.length > 0 ? qdcTimings : null,
      };

      if (callbacks.onLoaded) {
        try {
          callbacks.onLoaded({ duration: audioDuration });
        } catch (e) {
          console.warn('onLoaded error:', e);
        }
      }

      try {
        currentSound.play((success) => {
          stopVerseTracking();
          stopLivenessWatchdog();
          if (success) {
            if (callbacks.onEnd) callbacks.onEnd();
          } else {
            console.warn('playSurahFromServerWithVerseTracking: play() returned success=false');
            retryPlayback();
          }
        });
        currentPlayingContext.isPlaying = true;
        startVerseTracking();
        startLivenessWatchdog();
      } catch (e) {
        console.warn('Play error:', e);
        isAudioLoading = false;
        retryPlayback();
      }
    });
    recitationSound = currentSound;
    isAudioLoading = false;
  } catch (e) {
    console.warn('Sound creation error:', e);
    cancelSoundTimeout(soundId);
    isAudioLoading = false;
    retryPlayback();
  }

  soundLoadTimeouts.set(soundId, timeoutId);
  return recitationSound;
}

/**
 * Get current verse info during playback
 * @returns {object|null} Current verse info or null if not playing
 */
export function getCurrentVerseInfo() {
  if (!recitationSound || !currentPlayingContext) {
    return null;
  }

  try {
    let currentTime = 0;
    recitationSound.getCurrentTime((seconds) => {
      currentTime = seconds;
    });

    return findCurrentVerse(
      currentPlayingContext.verses,
      currentTime,
      currentPlayingContext.surahId
    );
  } catch (e) {
    console.warn('Error getting current verse:', e);
    return null;
  }
}

/**
 * Get verse timeline info (all verses with timings)
 * @returns {array|null} Array of verse timelines or null
 */
export function getVerseTimelineInfo() {
  if (!currentPlayingContext) {
    return null;
  }

  return getVerseTimelines(
    currentPlayingContext.verses,
    currentPlayingContext.surahId
  );
}

/** Tilavette aktif Sound örneği (ilerleme okuması için) */
export function getActiveRecitationSound() {
  return recitationSound;
}
