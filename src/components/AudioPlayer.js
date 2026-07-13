// AudioPlayer — Ayet için gerçek tilavet (islamic.network CDN, Alafası)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { PlayIcon, PauseIcon } from './Icons';
import { Colors, Radius, Shadows } from '../theme/colors';
import {
  playRecitation,
  stopRecitation,
  pauseRecitation,
  resumeRecitation,
  getActiveRecitationSound,
  safeIsPlaying,
  safeIsLoaded,
} from '../services/audioService';
import { parseAyahRef } from '../utils/parseAyahRef';

function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AudioPlayer({ verse }) {
  const parsed = verse?.ayah ? parseAyahRef(verse.ayah) : null;
  const hasAudio = !!parsed;

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [soundDuration, setSoundDuration] = useState(0);
  const [loadError, setLoadError] = useState(null);

  const barAnim = useRef(new Animated.Value(0)).current;
  const tickRef = useRef(null);

  const progressRatio =
    soundDuration > 0 ? Math.min(1, elapsed / soundDuration) : 0;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: progressRatio,
      duration: 120,
      useNativeDriver: false,
    }).start();
  }, [progressRatio, barAnim]);

  const clearTicker = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const pollPosition = useCallback(() => {
    const s = getActiveRecitationSound();
    if (safeIsLoaded(s)) {
      try {
        s.getCurrentTime((sec) => {
          setElapsed(sec);
          const dur = s.getDuration();
          if (dur && dur > 0) setSoundDuration(dur);
        });
      } catch (e) {
        /* noop */
      }
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      tickRef.current = setInterval(pollPosition, 320);
      return clearTicker;
    }
    clearTicker();
  }, [isPlaying, pollPosition]);

  useEffect(() => {
    return () => {
      clearTicker();
      stopRecitation();
    };
  }, []);

  useEffect(() => {
    stopRecitation();
    setIsPlaying(false);
    setElapsed(0);
    setSoundDuration(0);
    setLoadError(null);
    barAnim.setValue(0);
    clearTicker();
    // verse değişince önceki sesi temizler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verse?.id]);

  const togglePlay = () => {
    if (!hasAudio) return;

    const active = getActiveRecitationSound();
    const playingNow = !!(safeIsLoaded(active) && safeIsPlaying(active));

    if (playingNow) {
      pauseRecitation();
      setIsPlaying(false);
      pollPosition();
      return;
    }

    if (safeIsLoaded(active)) {
      resumeRecitation();
      setIsPlaying(true);
      return;
    }

    stopRecitation();
    setElapsed(0);
    setSoundDuration(0);
    setLoadError(null);

    playRecitation(parsed.surahId, parsed.verseId, 'yasser_dussary', {
      onLoaded: ({ duration }) => {
        if (duration && duration > 0) setSoundDuration(duration);
      },
      onEnd: () => {
        setIsPlaying(false);
        setElapsed(0);
        barAnim.setValue(0);
        stopRecitation();
      },
      onError: () => {
        setIsPlaying(false);
        setLoadError('Ses yüklenemedi.');
        stopRecitation();
      },
    });
    setIsPlaying(true);
  };

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!hasAudio) {
    return (
      <View style={[styles.container, styles.inactiveNotice]}>
        <Text style={styles.inactiveText}>
          Bu ayet kartı için sure/ayet numarası okunamadı; ses çalınamıyor.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={togglePlay}
        style={styles.playButton}
        android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: true, radius: 28 }}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[Colors.emeraldLight, Colors.emeraldDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.playButtonInner}
        >
          <View style={styles.playSheen} pointerEvents="none" />
          {isPlaying ? (
            <PauseIcon size={20} color={Colors.white} />
          ) : (
            <PlayIcon size={20} color={Colors.white} />
          )}
        </LinearGradient>
      </Pressable>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]}>
            <LinearGradient
              colors={[Colors.emeraldLight, Colors.emerald]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </View>
        {loadError ? (
          <Text style={styles.errorText}>{loadError}</Text>
        ) : (
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{fmtTime(elapsed)}</Text>
            <Text style={styles.timeText}>
              {soundDuration > 0 ? fmtTime(soundDuration) : '—'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  inactiveNotice: {
    paddingVertical: 22,
    paddingHorizontal: 22,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
  },
  inactiveText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  playButton: {
    marginRight: 18,
    borderRadius: 28,
    overflow: 'hidden',
  },
  playButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.glowEmerald,
  },
  playSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  progressContainer: {
    flex: 1,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },
});
