// Huzur — Premium Typography
// Platform-aware font stack, refined ramp, optical letter-spacing.

import { Platform } from 'react-native';

const SYSTEM = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const SYSTEM_LIGHT = Platform.select({
  ios: 'System',
  android: 'sans-serif-light',
  default: 'System',
});

// Use a slightly serif-leaning fallback for Arabic if available on device.
const ARABIC_FAMILY = Platform.select({
  ios: 'Geeza Pro',
  android: 'sans-serif',
  default: 'System',
});

export const Fonts = {
  system: SYSTEM,
  systemLight: SYSTEM_LIGHT,
  arabic: ARABIC_FAMILY,
};

export const Typography = {
  // Arabic Verse — Sacred typography, generous line-height
  arabicHero: {
    fontFamily: ARABIC_FAMILY,
    fontSize: 36,
    lineHeight: 72,
    color: '#ecd9bc',
    textAlign: 'center',
    fontWeight: '500',
    writingDirection: 'rtl',
    letterSpacing: 0.5,
  },
  arabicLarge: {
    fontFamily: ARABIC_FAMILY,
    fontSize: 30,
    lineHeight: 64,
    color: '#ecd9bc',
    textAlign: 'center',
    fontWeight: '500',
    writingDirection: 'rtl',
    letterSpacing: 0.5,
  },
  arabicMedium: {
    fontFamily: ARABIC_FAMILY,
    fontSize: 22,
    lineHeight: 46,
    color: '#ecd9bc',
    textAlign: 'center',
    fontWeight: '500',
    writingDirection: 'rtl',
    letterSpacing: 0.2,
  },
  arabicSmall: {
    fontFamily: ARABIC_FAMILY,
    fontSize: 18,
    lineHeight: 36,
    color: '#ecd9bc',
    textAlign: 'center',
    fontWeight: '400',
    writingDirection: 'rtl',
  },

  // Display & Headings
  display: {
    fontFamily: SYSTEM,
    fontSize: 40,
    fontWeight: '700',
    color: '#f6f6f1',
    letterSpacing: -1.2,
    lineHeight: 48,
  },
  h1: {
    fontFamily: SYSTEM,
    fontSize: 32,
    fontWeight: '700',
    color: '#f6f6f1',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  h2: {
    fontFamily: SYSTEM,
    fontSize: 24,
    fontWeight: '600',
    color: '#f6f6f1',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  h3: {
    fontFamily: SYSTEM,
    fontSize: 20,
    fontWeight: '600',
    color: '#f6f6f1',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h4: {
    fontFamily: SYSTEM,
    fontSize: 17,
    fontWeight: '600',
    color: '#f6f6f1',
    letterSpacing: -0.2,
    lineHeight: 24,
  },

  // Body
  bodyLarge: {
    fontFamily: SYSTEM,
    fontSize: 17,
    fontWeight: '400',
    color: '#a3a39a',
    lineHeight: 26,
  },
  body: {
    fontFamily: SYSTEM,
    fontSize: 15,
    fontWeight: '400',
    color: '#a3a39a',
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: SYSTEM,
    fontSize: 13,
    fontWeight: '400',
    color: '#a3a39a',
    lineHeight: 20,
  },

  // Labels & Accent
  overline: {
    fontFamily: SYSTEM,
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  label: {
    fontFamily: SYSTEM,
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  labelMuted: {
    fontFamily: SYSTEM,
    fontSize: 11,
    fontWeight: '600',
    color: '#6c6c63',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },

  // Caption
  caption: {
    fontFamily: SYSTEM,
    fontSize: 12,
    fontWeight: '500',
    color: '#6c6c63',
    lineHeight: 16,
  },

  // Buttons
  button: {
    fontFamily: SYSTEM,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  buttonSmall: {
    fontFamily: SYSTEM,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Translation
  translation: {
    fontFamily: SYSTEM,
    fontSize: 16,
    fontWeight: '400',
    color: '#c2c2b9',
    lineHeight: 26,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  translationSmall: {
    fontFamily: SYSTEM,
    fontSize: 14,
    fontWeight: '400',
    color: '#a3a39a',
    lineHeight: 22,
    textAlign: 'center',
  },

  // Brand — Logo wordmark style
  brand: {
    fontFamily: SYSTEM_LIGHT,
    fontSize: 26,
    fontWeight: '300',
    color: '#f6f6f1',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },

  // Subtitle — secondary heading
  subtitle: {
    fontFamily: SYSTEM,
    fontSize: 15,
    fontWeight: '600',
    color: '#a3a39a',
    lineHeight: 22,
    letterSpacing: 0.1,
  },

  // Body Medium — semi-bold body text
  bodyMedium: {
    fontFamily: SYSTEM,
    fontSize: 15,
    fontWeight: '600',
    color: '#f6f6f1',
    lineHeight: 24,
  },

  // Caption Medium — emphasized caption
  captionMedium: {
    fontFamily: SYSTEM,
    fontSize: 12,
    fontWeight: '700',
    color: '#6c6c63',
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  // Button Large — prominent CTA
  buttonLarge: {
    fontFamily: SYSTEM,
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // Tab Label — bottom nav / segmented control
  tabLabel: {
    fontFamily: SYSTEM,
    fontSize: 10,
    fontWeight: '600',
    color: '#6c6c63',
    letterSpacing: 0.4,
  },

  // Badge — small status indicators
  badge: {
    fontFamily: SYSTEM,
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Input — text field content
  input: {
    fontFamily: SYSTEM,
    fontSize: 15,
    fontWeight: '400',
    color: '#f6f6f1',
    lineHeight: 22,
  },
  inputLabel: {
    fontFamily: SYSTEM,
    fontSize: 13,
    fontWeight: '600',
    color: '#a3a39a',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  inputError: {
    fontFamily: SYSTEM,
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
    lineHeight: 16,
    marginTop: 4,
  },

  // Number — tabular figures for counters, times, etc.
  number: {
    fontFamily: SYSTEM,
    fontSize: 13,
    fontWeight: '700',
    color: '#a3a39a',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
};

