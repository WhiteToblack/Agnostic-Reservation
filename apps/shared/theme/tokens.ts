export const baseTokens = {
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    primary: '#6366F1',
    danger: '#dc2626',
    warning: '#f59e0b',
    success: '#16a34a',
    text: '#0f172a',
    muted: '#64748b',
    surfaceMuted: '#e2e8f0',
    border: '#cbd5f5',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 8,
    md: 16,
    lg: 24,
  },
};

export type ThemeTokens = typeof baseTokens & { mode: 'light' | 'dark' };

export const lightTheme: ThemeTokens = {
  ...baseTokens,
  mode: 'light',
};

export const darkTheme: ThemeTokens = {
  ...baseTokens,
  mode: 'dark',
  colors: {
    ...baseTokens.colors,
    background: '#0f172a',
    surface: '#111827',
    text: '#f8fafc',
    muted: '#94a3b8',
    surfaceMuted: '#1f2937',
    border: '#1e293b',
  },
};
