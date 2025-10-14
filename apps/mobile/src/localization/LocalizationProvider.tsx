import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  LocalizationContext,
  fallbackTranslations,
  supportedLanguages,
  defaultLanguage,
  formatTranslation,
} from '../../../shared/localization';
import type { LanguageCode, LocalizationContextValue, TranslationParams } from '../../../shared/localization';

type LocalizationProviderProps = {
  tenantId: string;
  initialLanguage: string;
  children: ReactNode;
  apiBaseUrl?: string;
};

const isSupportedLanguage = (language: string): language is LanguageCode =>
  supportedLanguages.includes(language as LanguageCode);

const defaultApiBase = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5243/api').replace(/\/$/, '');

export const LocalizationProvider = ({
  tenantId,
  initialLanguage,
  apiBaseUrl = defaultApiBase,
  children,
}: LocalizationProviderProps) => {
  const initialLanguageCode: LanguageCode = isSupportedLanguage(initialLanguage)
    ? (initialLanguage as LanguageCode)
    : defaultLanguage;
  const [language, setLanguageState] = useState<string>(initialLanguageCode);
  const [translations, setTranslations] = useState<Record<string, string>>(() => ({ ...fallbackTranslations[initialLanguageCode] }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTranslations = useCallback(
    async (targetLanguage: string) => {
      setLoading(true);
      setError(null);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const normalizedBase = apiBaseUrl.replace(/\/$/, '');
        const url = `${normalizedBase}/localization?tenantId=${encodeURIComponent(tenantId)}&language=${encodeURIComponent(
          targetLanguage
        )}`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as { language: string; translations: Record<string, string> };
        const baseLanguage: LanguageCode = isSupportedLanguage(payload.language)
          ? (payload.language as LanguageCode)
          : defaultLanguage;
        const base = fallbackTranslations[baseLanguage] ?? {};
        setTranslations({ ...base, ...payload.translations });
      } catch (err) {
        console.warn('Localization fetch failed, using fallback dataset.', err);
        const fallbackLanguage: LanguageCode = isSupportedLanguage(targetLanguage)
          ? (targetLanguage as LanguageCode)
          : defaultLanguage;
        const fallback = fallbackTranslations[fallbackLanguage] ?? {};
        setTranslations(fallback);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl, tenantId]
  );

  useEffect(() => {
    void fetchTranslations(language);
    return () => abortRef.current?.abort();
  }, [fetchTranslations, language]);

  const setLanguage = useCallback((next: string) => {
    setLanguageState(next);
  }, []);

  const reload = useCallback(async () => {
    await fetchTranslations(language);
  }, [fetchTranslations, language]);

  const value = useMemo<LocalizationContextValue>(
    () => ({
      language,
      translations,
      loading,
      error,
      setLanguage,
      reload,
      t: (key: string, fallback?: string, params?: TranslationParams) =>
        formatTranslation(translations[key] ?? fallback ?? key, params),
    }),
    [language, translations, loading, error, setLanguage, reload]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};

export { useLocalization } from '../../../shared/localization';
