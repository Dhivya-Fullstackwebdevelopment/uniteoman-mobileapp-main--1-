export const Colors = {
  // Primary: Deep Indigo — premium & trustworthy
  primary: '#4338CA',
  primaryLight: '#6366F1',
  primaryDark: '#3730A3',
  primaryBg: '#EEF2FF',
  primaryBgDeep: '#E0E7FF',

  // Accent: Warm Amber — luxury & attention
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentBg: '#FFFBEB',

  // Secondary alias (keeps existing references working)
  secondary: '#F59E0B',
  secondaryLight: '#FCD34D',

  // Backgrounds — warm off-white feels premium
  background: '#F8F8F6',
  surface: '#FAFAF9',
  card: '#FFFFFF',

  // Text hierarchy
  text: '#0F172A',          // Slate 900 — near black
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8',     // Slate 400

  // Borders & dividers
  border: '#E2E8F0',        // Slate 200
  divider: '#F1F5F9',       // Slate 100

  // Status
  success: '#059669',
  successBg: '#D1FAE5',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  warning: '#D97706',
  warningBg: '#FEF3C7',

  // Decoration
  star: '#F59E0B',
  shadow: 'rgba(67, 56, 202, 0.12)',
  shadowNeutral: 'rgba(15, 23, 42, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.58)',

  // Gradient endpoints
  gradientStart: '#4338CA',
  gradientEnd: '#6366F1',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarActive: '#4338CA',
  tabBarInactive: '#94A3B8',

  // Badges
  featuredBadge: '#F59E0B',
  verifiedBadge: '#059669',
  dealBadge: '#DC2626',
  sponsoredBadge: '#6366F1',
  heart: '#EF4444',
  mint: '#ECFDF5',
  mintText: '#065F46',
};

export const Gradients = {
  primary: ['#4338CA', '#6366F1'] as [string, string],
  hero: ['#3730A3', '#4338CA'] as [string, string],
  sunset: ['#F59E0B', '#FBBF24'] as [string, string],
  success: ['#059669', '#10B981'] as [string, string],
  overlay: ['transparent', 'rgba(0,0,0,0.75)'] as [string, string],
  card: ['#4338CA', '#6366F1'] as [string, string],
  booking: ['#4338CA', '#4F46E5'] as [string, string],
  dark: ['#0F172A', '#1E293B'] as [string, string],
};
