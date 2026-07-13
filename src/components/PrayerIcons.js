// PrayerIcons — SVG icons for each prayer time
// Follows the same pattern as Icons.js / IconsExtra.js
import React from 'react';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';

// ============================================================
// FAJR — Pre-dawn crescent with horizon
// ============================================================
export function FajrIcon({ size = 24, color = '#7dd3fc' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 18H7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M19 21H5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <Path
        d="M15.5 11a5.5 5.5 0 1 0-7 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M12 3v1M4.22 10.22l.7.7M19.78 10.22l-.7.7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </Svg>
  );
}

// ============================================================
// SUNRISE — Half sun rising
// ============================================================
export function SunriseIcon({ size = 24, color = '#fbbf24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 18H7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M12 9V2M4.22 10.22l1.42 1.42M18.36 11.64l1.42-1.42"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Path
        d="M16 14a4 4 0 1 0-8 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path d="M3 18h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </Svg>
  );
}

// ============================================================
// DHUHR — Full sun at zenith
// ============================================================
export function DhuhrIcon({ size = 24, color = '#fb923c' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5" />
      <Path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M6.34 6.34L4.93 4.93M17.66 6.34l1.41-1.41M6.34 17.66l-1.41 1.41M17.66 17.66l1.41 1.41"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ============================================================
// ASR — Afternoon sun (lower position)
// ============================================================
export function AsrIcon({ size = 24, color = '#f97316' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="10" r="4" stroke={color} strokeWidth="1.5" />
      <Path
        d="M12 2v2M4 10H2M22 10h-2M5.64 5.64L4.22 4.22M18.36 5.64l1.42-1.42"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Path d="M3 18h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M6 21h12" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </Svg>
  );
}

// ============================================================
// MAGHRIB — Sunset with crescent hint
// ============================================================
export function MaghribIcon({ size = 24, color = '#c4b5fd' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 14a4 4 0 1 0-8 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path d="M3 14h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path
        d="M12 10V6M8 12l-1.5-1.5M16 12l1.5-1.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <Path d="M5 18h14" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </Svg>
  );
}

// ============================================================
// ISHA — Night crescent with stars
// ============================================================
export function IshaIcon({ size = 24, color = '#94a3b8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="18" cy="5" r="1" fill={color} opacity="0.5" />
      <Circle cx="20" cy="9" r="0.5" fill={color} opacity="0.4" />
    </Svg>
  );
}

// ============================================================
// LOCATION PIN — For location display
// ============================================================
export function LocationIcon({ size = 24, color = '#a3a39a' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

// ============================================================
// CLOCK — For countdown
// ============================================================
export function ClockIcon({ size = 24, color = '#a3a39a' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <Path
        d="M12 6v6l4 2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Returns the right prayer icon component for a given prayer key.
 */
export function getPrayerIcon(key, { size = 22, color } = {}) {
  switch (key) {
    case 'Fajr': return <FajrIcon size={size} color={color} />;
    case 'Sunrise': return <SunriseIcon size={size} color={color} />;
    case 'Dhuhr': return <DhuhrIcon size={size} color={color} />;
    case 'Asr': return <AsrIcon size={size} color={color} />;
    case 'Maghrib': return <MaghribIcon size={size} color={color} />;
    case 'Isha': return <IshaIcon size={size} color={color} />;
    default: return <ClockIcon size={size} color={color} />;
  }
}
