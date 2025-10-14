import React, { createContext, useContext } from 'react';
import type { LocalizationContextValue, TranslationParams } from './types';

export const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const formatTranslation = (template: string, params?: TranslationParams): string => {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((acc, [key, rawValue]) => {
    const value = String(rawValue);
    const pattern = new RegExp(`{{\s*${escapeRegExp(key)}\s*}}`, 'g');
    return acc.replace(pattern, value);
  }, template);
};

export const useLocalization = (): LocalizationContextValue => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
