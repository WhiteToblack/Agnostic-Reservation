export type LanguageCode = 'tr-TR' | 'en-US' | 'en-GB' | 'de-DE';

export type TranslationParams = Record<string, string | number>;

export type Translations = Record<string, string>;

export type LocalizationContextValue = {
  language: string;
  translations: Translations;
  loading: boolean;
  error: string | null;
  setLanguage: (language: string) => void;
  reload: () => Promise<void>;
  t: (key: string, fallback?: string, params?: TranslationParams) => string;
};
