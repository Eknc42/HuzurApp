import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Spacing, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { PlayIcon, PauseIcon, SkipNextIcon, SkipPreviousIcon } from './Icons';
import { HeadphonesIcon } from './IconsExtra';

export default function PlayerBar({
  surah,
  currentReciter,
  isPlaying,
  isPaused,
  playingVerseId,
  currentTime,
  dragTime,
  duration,
  showSleepPicker,
  sleepMinutes,
  SLEEP_OPTIONS,
  playPulse,
  progressPanResponder,
  progressBarWidthRef,
  onReciterPress,
  onPrevPress,
  onPlayPress,
  onNextPress,
  onCycleSleepTimer,
  onSelectSleepTimer,
  formatTime,
}) {
  return (
    <View style={styles.playerBar}>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)', '#000000']}
        style={styles.playerBarGradient}
        pointerEvents="none"
      />
      <View style={styles.playerBarInner}>
        {/* Reciter Selection Bar */}
        <TouchableOpacity
          style={[styles.reciterBar, { marginHorizontal: 0, marginBottom: 4 }]}
          activeOpacity={0.7}
          onPress={onReciterPress}
        >
          <HeadphonesIcon size={14} color={Colors.emerald} />
          <Text style={styles.reciterName} numberOfLines={1}>
            {currentReciter?.name || 'Abdülbasit Abdüssamed'}
          </Text>
          <Text style={styles.reciterChange}>Değiştir</Text>
        </TouchableOpacity>

        {/* Top row: title + status */}
        <View style={styles.playerTopRow}>
          <View style={[styles.playerStatusDot, isPlaying && !isPaused && styles.playerStatusDotActive]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.playerBarTitle} numberOfLines={1}>
              {surah.nameTr} Suresi
            </Text>
            <Text style={styles.playerBarSub} numberOfLines={1}>
              {isPlaying
                ? (isPaused ? 'Duraklatıldı' : `Çalıyor${playingVerseId ? ` · Ayet ${playingVerseId}` : ''}`)
                : (currentReciter?.name || 'Abdülbasit Abdüssamed')}
            </Text>
          </View>
          <Text style={styles.playerTime}>
            {formatTime(dragTime !== null ? dragTime : currentTime)} / {formatTime(duration)}
          </Text>
        </View>

        {/* Interactive progress bar (tap or drag to seek) */}
        <View
          style={styles.progressHitArea}
          onLayout={(e) => { progressBarWidthRef.current = e.nativeEvent.layout.width; }}
          {...progressPanResponder.panHandlers}
        >
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    duration > 0
                      ? Math.min(100, ((dragTime !== null ? dragTime : currentTime) / duration) * 100)
                      : 0
                  }%`,
                },
              ]}
            />
            {duration > 0 && (
              <View
                style={[
                  styles.progressThumb,
                  {
                    left: `${Math.min(100, ((dragTime !== null ? dragTime : currentTime) / duration) * 100)}%`,
                  },
                  dragTime !== null && styles.progressThumbActive,
                ]}
              />
            )}
          </View>
        </View>

        {/* Controls row: prev / play / next / sleep */}
        <View style={styles.playerControls}>
          {surah.id > 1 && (
            <TouchableOpacity
              onPress={onPrevPress}
              activeOpacity={0.7}
              style={styles.playerStopBtn}
            >
              <SkipPreviousIcon size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.playerPlayBtn, isPlaying && !isPaused && styles.playerPlayBtnActive]}
            activeOpacity={0.7}
            onPress={onPlayPress}
          >
            <Animated.View style={{ transform: [{ scale: isPlaying && !isPaused ? playPulse : 1 }] }}>
              {isPlaying && !isPaused ? (
                <PauseIcon size={20} color={Colors.white} />
              ) : (
                <PlayIcon size={20} color={Colors.white} />
              )}
            </Animated.View>
          </TouchableOpacity>

          {surah.id < 114 && (
            <TouchableOpacity
              onPress={onNextPress}
              activeOpacity={0.7}
              style={styles.playerStopBtn}
            >
              <SkipNextIcon size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Sleep timer button */}
          <TouchableOpacity onPress={onCycleSleepTimer} activeOpacity={0.7} style={styles.sleepBtn}>
            <Text style={[styles.sleepBtnIcon, sleepMinutes > 0 && styles.sleepBtnIconActive]}>🌙</Text>
            {sleepMinutes > 0 && (
              <Text style={styles.sleepBtnLabel}>{sleepMinutes}dk</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sleep timer picker */}
        {showSleepPicker && (
          <View style={styles.sleepPickerRow}>
            {SLEEP_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => onSelectSleepTimer(m)}
                activeOpacity={0.7}
                style={[styles.sleepChip, sleepMinutes === m && m > 0 && styles.sleepChipActive]}
              >
                <Text style={[styles.sleepChipText, sleepMinutes === m && m > 0 && styles.sleepChipTextActive]}>
                  {m === 0 ? 'Kapalı' : `${m} dk`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: Spacing.xl,
  },
  playerBarGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  playerBarInner: {
    backgroundColor: Colors.bgCardSolid,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  playerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  playerStatusDotActive: {
    backgroundColor: Colors.emerald,
  },
  playerBarTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  playerBarSub: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 1,
  },
  playerTime: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  progressHitArea: {
    paddingVertical: 10,
    marginVertical: -8,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.emerald,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.emerald,
    marginLeft: -7,
    borderWidth: 2,
    borderColor: '#0a120e',
  },
  progressThumbActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    top: -7,
    marginLeft: -9,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  playerStopBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginLeft: 4,
  },
  playerPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.emeraldDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  playerPlayBtnActive: {
    backgroundColor: Colors.emerald,
  },
  sleepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginLeft: 4,
  },
  sleepBtnIcon: {
    fontSize: 14,
    opacity: 0.5,
  },
  sleepBtnIconActive: {
    opacity: 1,
  },
  sleepBtnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emerald,
  },
  sleepPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  sleepChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sleepChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: Colors.emerald,
  },
  sleepChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  sleepChipTextActive: {
    color: Colors.emerald,
  },
  reciterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  reciterName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reciterChange: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 0.3,
  },
});
