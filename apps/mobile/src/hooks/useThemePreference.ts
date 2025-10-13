import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'agnosticreservation.theme';

export const useThemePreference = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark') {
        setMode(value);
      }
    });
  }, []);

  const update = (next: 'light' | 'dark') => {
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  };

  return { mode, setMode: update };
};
