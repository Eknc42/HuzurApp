// Huzur — SVG Icon Components
import React from 'react';
import Svg, {
  Path, Circle, Rect, Line, Polygon,
  Defs, LinearGradient as SvgGradient, Stop, G,
} from 'react-native-svg';

// ============================================================
// CRESCENT MOON — App Logo
// ============================================================
export function CrescentIcon({ size = 24, color = '#10b981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// STAR — Islamic geometric accent
// ============================================================
export function StarIcon({ size = 24, color = '#d4a574' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.09 6.26L20.18 9l-4.91 4.12L16.54 20 12 16.77 7.46 20l1.27-6.88L3.82 9l6.09-.74L12 2z"
        fill={color}
        stroke={color}
        strokeWidth="0.3"
      />
    </Svg>
  );
}

// ============================================================
// HEART — Favorite
// ============================================================
export function HeartIcon({ size = 24, color = '#f5f5f0', filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// SHARE — Export
// ============================================================
export function ShareIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 6l-4-4-4 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="2" x2="12" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// ============================================================
// PLAY — Audio
// ============================================================
export function PlayIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="5,3 19,12 5,21"
        fill={color}
        stroke={color}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PauseIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="4" width="4" height="16" rx="1" fill={color} />
      <Rect x="14" y="4" width="4" height="16" rx="1" fill={color} />
    </Svg>
  );
}

// ============================================================
// SPARKLE — AI
// ============================================================
export function SparkleIcon({ size = 24, color = '#10b981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
      />
      <Path
        d="M19 14L19.75 16.25L22 17L19.75 17.75L19 20L18.25 17.75L16 17L18.25 16.25L19 14Z"
        fill={color}
        opacity="0.6"
      />
    </Svg>
  );
}

// ============================================================
// BOOKMARK — Save
// ============================================================
export function BookmarkIcon({ size = 24, color = '#f5f5f0', filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// BACK ARROW
// ============================================================
export function BackIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================
// WAVE — Anxious mood
// ============================================================
export function WaveIcon({ size = 24, color = '#60a5fa' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </Svg>
  );
}

// ============================================================
// COMPASS — Lost mood
// ============================================================
export function CompassIcon({ size = 24, color = '#9ca3af' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <Polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill={color} />
    </Svg>
  );
}

// ============================================================
// FLAME — Unmotivated mood
// ============================================================
export function FlameIcon({ size = 24, color = '#fb923c' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c-4.97 0-7-3.58-7-7 0-2.8 1.56-5.3 2.7-6.9.4-.56 1.3-.24 1.3.46V10c0 .55.45 1 1 1s1-.45 1-1V3.5c0-.55.45-1 1-1s1 .45 1 1V8c0 .55.45 1 1 1s1-.45 1-1V5.5c.9 1 2 2.4 2.7 4 .5 1.2.8 2.3.8 3.5 0 3.42-2.03 7-5.5 9z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
      />
    </Svg>
  );
}

// ============================================================
// DOVE — Peaceful mood
// ============================================================
export function DoveIcon({ size = 24, color = '#10b981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c-1.5 2-3 3.5-3 6 0 2.5 1.3 4 3 4s3-1.5 3-4c0-2.5-1.5-4-3-6z"
        fill={color}
        opacity="0.8"
      />
      <Path
        d="M8 9c-2 0-4 1-5 3 1.5 0 3 .5 4 1.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M16 9c2 0 4 1 5 3-1.5 0-3 .5-4 1.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M12 13v7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M9 20h6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ============================================================
// MENU / FAVORITES ICON
// ============================================================
export function FavoritesIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8v4M10 10h4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ============================================================
// SKIP NEXT
// ============================================================
export function SkipNextIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="6,4 16,12 6,20" fill={color} />
      <Rect x="17" y="4" width="2" height="16" rx="0.5" fill={color} />
    </Svg>
  );
}

// ============================================================
// SKIP PREVIOUS
// ============================================================
export function SkipPreviousIcon({ size = 24, color = '#f5f5f0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="2" height="16" rx="0.5" fill={color} />
      <Polygon points="18,4 8,12 18,20" fill={color} />
    </Svg>
  );
}



