// Huzur — Additional Icon Components for complete app
import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';

// ============================================================
// PERSON — Lonely mood (replacing Heart to avoid confusion with Favorite)
// ============================================================
export function PersonIcon({ size = 24, color = '#a78bfa' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.5" fill="none" />
      <Path
        d="M5.5 21c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Line x1="2" y1="14" x2="6" y2="14" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <Line x1="18" y1="14" x2="22" y2="14" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </Svg>
  );
}

// ============================================================
// HOME — Tab bar icon
// ============================================================
export function HomeIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// SEARCH — Explore icon
// ============================================================
export function SearchIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
      <Path
        d="M16 16l4 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ============================================================
// SETTINGS — Gear icon
// ============================================================
export function SettingsIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      <Path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ============================================================
// CLOCK — Recent/history icon
// ============================================================
export function ClockIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path
        d="M12 7v5l3 3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// REFRESH — New verse
// ============================================================
export function RefreshIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 4v6h6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51 15a9 9 0 102.13-9.36L1 10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// WIDGET — Lock screen concept icon
// ============================================================
export function WidgetIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="17" cy="17" r="3" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

// ============================================================
// RADIO TOWER — Canlı yayın / Radyo sekmesi
// ============================================================
export function RadioTowerIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.93 19.07a15.9 15.9 0 010-14.14M9.31 17.66a11.5 11.5 0 010-11.31M13.71 14.93a8.2 8.2 0 010-5.87"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="19" r="2" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

// ============================================================
// BOOK OPEN — Quran tab icon
// ============================================================
export function BookOpenIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// CHEVRON RIGHT — List navigation
// ============================================================
export function ChevronRightIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// MOON — Sleep mode / Night
// ============================================================
export function MoonIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// HEADPHONES — Audio/Reciter
// ============================================================
export function HeadphonesIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18v-6a9 9 0 0118 0v6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// MIXER — Ambient Sounds / Equalizer
// ============================================================
export function MixerIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// USER — Anonymous / Profile
// ============================================================
export function UserIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="7"
        r="4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// TRASH — Delete/Clear
// ============================================================
export function TrashIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// PLUS — Add/New
// ============================================================
export function PlusIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// RAIN — Ambient Sound
// ============================================================
export function RainIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 20l-2-2m4 2l-2-2m4 2l-2-2m4 2l-2-2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M6.04 14.5a5.5 5.5 0 011.08-10.85 7.5 7.5 0 0113.82 2.7 4 4 0 01-1.34 7.65"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


// ============================================================
// SHUFFLE — Random play
// ============================================================
export function ShuffleIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// LIGHTBULB — Idea, Explanation, Guide
// ============================================================
export function LightbulbIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18h6M10 21h4M15 8.5a3 3 0 11-6 0c0-2.5 2-4.5 3-4.5s3 2 3 4.5zM9 15c0-1.5-2-3-2-5.5a5 5 0 0110 0c0 2.5-2 4-2 5.5v3H9v-3z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
