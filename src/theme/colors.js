// Huzur — Premium Islamic-Inspired Design System
// Refined AMOLED palette: deeper blacks, layered surfaces, jewel-toned emerald,
// warm beige for sacred text, and accessibility-grade typography ramps.

export const Colors = {
  // Backgrounds — True AMOLED with layered surfaces for depth
  bgPrimary: '#000000',
  bgSecondary: '#050505',
  bgTertiary: '#0a0a0a',
  bgElevated: '#111111',
  bgCard: 'rgba(255, 255, 255, 0.03)',
  bgCardSolid: '#111111',
  bgCardHover: 'rgba(255, 255, 255, 0.05)',
  bgGlass: 'rgba(20, 20, 20, 0.65)',
  bgGlassHigh: 'rgba(30, 30, 30, 0.85)',
  bgSurface: 'rgba(255, 255, 255, 0.02)',

  // Emerald — Primary Accent (jewel-grade, less neon)
  emerald: '#10b981',
  emeraldLight: '#34d399',
  emeraldBright: '#6ee7b7',
  emeraldDark: '#059669',
  emeraldDeep: '#047857',
  emeraldGlow: 'rgba(16, 185, 129, 0.12)', // softer
  emeraldGlowStrong: 'rgba(16, 185, 129, 0.22)', // softer
  emeraldBorder: 'rgba(16, 185, 129, 0.15)', // softer
  emeraldBorderStrong: 'rgba(16, 185, 129, 0.3)',
  emeraldMuted: 'rgba(16, 185, 129, 0.06)',
  emeraldTint: 'rgba(16, 185, 129, 0.03)',

  // Warm Beige — Arabic Text & Warm Accents
  beige: '#d4a574',
  beigeLight: '#e8d5b7',
  beigePale: '#f0e6d6',
  beigeWarm: '#c69769',
  beigeMuted: 'rgba(212, 165, 116, 0.3)',
  beigeBorder: 'rgba(212, 165, 116, 0.12)',
  beigeBorderStrong: 'rgba(212, 165, 116, 0.25)',
  beigeGlow: 'rgba(212, 165, 116, 0.08)',
  beigeTint: 'rgba(212, 165, 116, 0.03)',

  // Text — refined contrast ladder
  textPrimary: '#f6f6f1',
  textSecondary: '#a3a39a',
  textTertiary: '#6c6c63',
  textMuted: '#4a4a45',
  textDim: '#2e2e2a',
  textArabic: '#ecd9bc',
  textArabicSoft: '#d4c19a',

  // Borders — layered for elevation
  borderSubtle: 'rgba(255, 255, 255, 0.03)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  borderMedium: 'rgba(255, 255, 255, 0.1)',
  borderEmerald: 'rgba(16, 185, 129, 0.15)',

  // Mood — refined jewel tones
  moodAnxious: '#7dd3fc',      // soft sky
  moodLonely: '#c4b5fd',       // gentle violet
  moodGrateful: '#fbbf24',     // honey gold
  moodLost: '#94a3b8',         // slate
  moodUnmotivated: '#fb923c',  // warm ember
  moodPeaceful: '#34d399',     // sage emerald

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  // Utility
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.55)',
  overlayDark: 'rgba(0, 0, 0, 0.82)',
  shimmer: 'rgba(255, 255, 255, 0.06)',
};

export const Gradients = {
  // Ambient backgrounds
  appBackground: ['#000000', '#030604', '#010302', '#000000'],
  emeraldFade: ['#000000', '#02120b'],
  emeraldHalo: ['rgba(16, 185, 129, 0.06)', 'rgba(16, 185, 129, 0)'],
  warmFade: ['#000000', '#0d0a04'],
  cinematic: ['#000000', '#050505', '#000000'],

  // Surface shine for cards (top-bright → bottom-fade)
  cardShine: ['rgba(255,255,255,0.025)', 'rgba(255,255,255,0)'],
  cardSurface: ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'],
  cardHero: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0)'],
  cardGlass: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.005)'],

  // Buttons
  primaryButton: ['#10b981', '#059669'],
  primaryButtonHover: ['#34d399', '#10b981'],
  ghostButton: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)'],

  // Mood — soft jewel halos
  anxious: ['rgba(125, 211, 252, 0.08)', 'rgba(125, 211, 252, 0)'],
  lonely: ['rgba(196, 181, 253, 0.08)', 'rgba(196, 181, 253, 0)'],
  grateful: ['rgba(251, 191, 36, 0.08)', 'rgba(251, 191, 36, 0)'],
  lost: ['rgba(148, 163, 184, 0.07)', 'rgba(148, 163, 184, 0)'],
  unmotivated: ['rgba(251, 146, 60, 0.08)', 'rgba(251, 146, 60, 0)'],
  peaceful: ['rgba(52, 211, 153, 0.08)', 'rgba(52, 211, 153, 0)'],
};

// Spacing — keeps legacy keys (md=16, lg=24, xl=32) for backward compatibility
// while adding finer grain (xxs, base, comfy, xxxl, huge) for new screens.
export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  base: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
  xxxl: 64,
  huge: 80,
};

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  full: 9999,
};

export const Shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 12,
  },
  glowEmerald: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  glowEmeraldSoft: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  glowBeige: {
    shadowColor: '#d4a574',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Animation timing — premium feel
export const Motion = {
  instant: 100,
  fast: 180,
  base: 280,
  slow: 480,
  cinematic: 800,
  stagger: 60, // delay between staggered list items
};

// Opacity system — consistent transparency
export const Opacity = {
  disabled: 0.4,
  hover: 0.08,
  pressed: 0.12,
  muted: 0.55,
  overlay: 0.55,
  overlayDark: 0.82,
  ghost: 0.06,
  tint: 0.04,
};

// Icon sizing — consistent icon dimensions
export const IconSize = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  xxl: 40,
};

// Component sizing — consistent interactive element dimensions
export const ComponentSize = {
  touchTarget: 44,       // minimum accessible touch target
  buttonHeight: 48,
  buttonSmallHeight: 36,
  buttonLargeHeight: 56,
  inputHeight: 48,
  avatarSm: 32,
  avatarMd: 44,
  avatarLg: 64,
  navBarHeight: 64,
  headerHeight: 56,
  tabBarItemWidth: 64,
  iconButtonSm: 36,
  iconButtonMd: 44,
  iconButtonLg: 52,
};
