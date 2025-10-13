import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeTokens, lightTheme, darkTheme } from '../../../shared/theme';

interface ThemeContextValue {
  theme: ThemeTokens;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: lightTheme, mode: 'light', setMode: () => undefined });

export const ThemeProvider: React.FC<{ initialMode?: 'light' | 'dark'; onModeChange?: (mode: 'light' | 'dark') => void; children: React.ReactNode }> = ({
  initialMode = 'light',
  onModeChange,
  children,
}) => {
  const [mode, setMode] = useState<'light' | 'dark'>(initialMode);
  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  return <ThemeContext.Provider value={{ theme, mode, setMode }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
