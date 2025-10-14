import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { lightTheme, darkTheme } from '../../../shared/theme';
import type { ThemeTokens } from '../../../shared/theme';

interface ThemeContextValue {
  theme: ThemeTokens;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: lightTheme, mode: 'light', setMode: () => undefined });

type ThemeProviderProps = {
  initialMode?: 'light' | 'dark';
  onModeChange?: (mode: 'light' | 'dark') => void;
  children: ReactNode;
};

export const ThemeProvider = ({ initialMode = 'light', onModeChange, children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<'light' | 'dark'>(initialMode);
  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  return <ThemeContext.Provider value={{ theme, mode, setMode }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
