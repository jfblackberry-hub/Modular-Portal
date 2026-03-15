export const colors = {
  primary: '#2F6FED',
  secondary: '#4DA3FF',
  background: '#F7F9FC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280'
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48
} as const;

export const borderRadius = {
  small: 6,
  medium: 10,
  large: 16
} as const;

export const shadows = {
  card: '0 8px 24px rgba(31, 41, 55, 0.08)',
  modal: '0 20px 50px rgba(31, 41, 55, 0.18)'
} as const;

export const typography = {
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  fontSize: {
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    caption: 14
  }
} as const;

export const tokens = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography
} as const;

export type DesignTokens = typeof tokens;
