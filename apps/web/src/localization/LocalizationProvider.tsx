import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type LocalizationContextValue = {
  language: string;
  translations: Record<string, string>;
  loading: boolean;
  error: string | null;
  setLanguage: (language: string) => void;
  reload: () => Promise<void>;
  t: (key: string, fallback?: string) => string;
};

const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

const fallbackTranslations: Record<string, Record<string, string>> = {
  'tr-TR': {
    'app.header.title': 'Agnostic Rezervasyon Paneli',
    'app.header.subtitle': 'Tenant bazlı yönetim ve çeviri kontrolü',
    'localization.admin.title': 'Çoklu Dil Yönetimi',
    'localization.admin.description': 'Anahtar bazında farklı diller için metinleri buradan güncelleyebilirsiniz.',
    'localization.admin.addButton': 'Yeni çeviri ekle',
    'localization.admin.keyLabel': 'Anahtar',
    'localization.admin.languageLabel': 'Dil',
    'localization.admin.valueLabel': 'Metin',
    'localization.admin.infoLabel': 'Bilgi',
    'localization.admin.descriptionPlaceholder': 'İsteğe bağlı açıklama',
    'localization.admin.keyPlaceholder': 'Örn: app.header.title',
    'localization.admin.valuePlaceholder': 'Çeviri metnini girin',
    'localization.admin.tableDescription': 'Açıklama',
    'localization.admin.emptyState': 'Henüz tanımlanmış bir çeviri bulunmuyor.',
    'localization.admin.toastSaved': 'Çeviri kaydedildi.',
    'localization.admin.toastCleared': 'Çeviri önbelleği temizlendi.',
    'localization.admin.searchPlaceholder': 'Anahtar ara...',
    'localization.admin.validation': 'Anahtar, dil ve metin alanları zorunludur.',
    'localization.admin.loading': 'Yükleniyor...',
    'localization.admin.loadingShort': 'Yenileniyor...',
    'localization.admin.reloadButton': 'Çevirileri yenile',
    'localization.admin.invalidateButton': 'Önbelleği temizle',
    'localization.admin.resetButton': 'Formu sıfırla',
    'localization.admin.dismissToast': 'Kapat',
    'localization.admin.errorLoad': 'Çeviri listesi yüklenemedi.',
    'localization.admin.errorSave': 'Çeviri kaydedilirken hata oluştu.',
    'localization.admin.errorInvalidate': 'Önbellek temizlenirken hata oluştu.',
    'localization.admin.errorGeneric': 'Bilinmeyen bir hata oluştu.',
    'localization.admin.notAvailable': 'Mevcut değil'
  },
  'en-US': {
    'app.header.title': 'Agnostic Reservation Console',
    'app.header.subtitle': 'Tenant-specific management and localization control',
    'localization.admin.title': 'Multi-language Management',
    'localization.admin.description': 'Update every language variant for a key from this screen.',
    'localization.admin.addButton': 'Add translation',
    'localization.admin.keyLabel': 'Key',
    'localization.admin.languageLabel': 'Language',
    'localization.admin.valueLabel': 'Text',
    'localization.admin.infoLabel': 'Details',
    'localization.admin.descriptionPlaceholder': 'Optional description',
    'localization.admin.keyPlaceholder': 'e.g., app.header.title',
    'localization.admin.valuePlaceholder': 'Enter translation text',
    'localization.admin.tableDescription': 'Description',
    'localization.admin.emptyState': 'No translations defined yet.',
    'localization.admin.toastSaved': 'Translation saved.',
    'localization.admin.toastCleared': 'Localization cache cleared.',
    'localization.admin.searchPlaceholder': 'Search key...',
    'localization.admin.validation': 'Key, language and text fields are required.',
    'localization.admin.loading': 'Loading...',
    'localization.admin.loadingShort': 'Refreshing...',
    'localization.admin.reloadButton': 'Reload translations',
    'localization.admin.invalidateButton': 'Clear cache',
    'localization.admin.resetButton': 'Reset form',
    'localization.admin.dismissToast': 'Dismiss',
    'localization.admin.errorLoad': 'Failed to load translations.',
    'localization.admin.errorSave': 'An error occurred while saving the translation.',
    'localization.admin.errorInvalidate': 'An error occurred while clearing the cache.',
    'localization.admin.errorGeneric': 'An unknown error occurred.',
    'localization.admin.notAvailable': 'Not available'
  },
  'en-GB': {
    'app.header.title': 'Agnostic Reservation Console',
    'app.header.subtitle': 'Tenant-specific management and localisation control',
    'localization.admin.title': 'Multi-language Management',
    'localization.admin.description': 'Update every language variant for a key from this screen.',
    'localization.admin.addButton': 'Add translation',
    'localization.admin.keyLabel': 'Key',
    'localization.admin.languageLabel': 'Language',
    'localization.admin.valueLabel': 'Text',
    'localization.admin.infoLabel': 'Details',
    'localization.admin.descriptionPlaceholder': 'Optional description',
    'localization.admin.keyPlaceholder': 'e.g., app.header.title',
    'localization.admin.valuePlaceholder': 'Enter translation text',
    'localization.admin.tableDescription': 'Description',
    'localization.admin.emptyState': 'No translations defined yet.',
    'localization.admin.toastSaved': 'Translation saved.',
    'localization.admin.toastCleared': 'Localization cache cleared.',
    'localization.admin.searchPlaceholder': 'Search key...',
    'localization.admin.validation': 'Key, language and text fields are required.',
    'localization.admin.loading': 'Loading...',
    'localization.admin.loadingShort': 'Refreshing...',
    'localization.admin.reloadButton': 'Reload translations',
    'localization.admin.invalidateButton': 'Clear cache',
    'localization.admin.resetButton': 'Reset form',
    'localization.admin.dismissToast': 'Dismiss',
    'localization.admin.errorLoad': 'Failed to load translations.',
    'localization.admin.errorSave': 'An error occurred while saving the translation.',
    'localization.admin.errorInvalidate': 'An error occurred while clearing the cache.',
    'localization.admin.errorGeneric': 'An unknown error occurred.',
    'localization.admin.notAvailable': 'Not available'
  },
  'de-DE': {
    'app.header.title': 'Agnostic Reservierungs-Konsole',
    'app.header.subtitle': 'Mandantenspezifische Verwaltung und Übersetzungssteuerung',
    'localization.admin.title': 'Mehrsprachenverwaltung',
    'localization.admin.description': 'Aktualisieren Sie hier die Texte pro Sprache und Schlüssel.',
    'localization.admin.addButton': 'Übersetzung hinzufügen',
    'localization.admin.keyLabel': 'Schlüssel',
    'localization.admin.languageLabel': 'Sprache',
    'localization.admin.valueLabel': 'Text',
    'localization.admin.infoLabel': 'Hinweis',
    'localization.admin.descriptionPlaceholder': 'Optionale Beschreibung',
    'localization.admin.keyPlaceholder': 'z. B. app.header.title',
    'localization.admin.valuePlaceholder': 'Übersetzungstext eingeben',
    'localization.admin.tableDescription': 'Beschreibung',
    'localization.admin.emptyState': 'Noch keine Übersetzungen vorhanden.',
    'localization.admin.toastSaved': 'Übersetzung gespeichert.',
    'localization.admin.toastCleared': 'Übersetzungs-Cache geleert.',
    'localization.admin.searchPlaceholder': 'Schlüssel suchen...',
    'localization.admin.validation': 'Schlüssel, Sprache und Text sind Pflichtfelder.',
    'localization.admin.loading': 'Wird geladen...',
    'localization.admin.loadingShort': 'Aktualisiere...',
    'localization.admin.reloadButton': 'Übersetzungen neu laden',
    'localization.admin.invalidateButton': 'Cache leeren',
    'localization.admin.resetButton': 'Formular zurücksetzen',
    'localization.admin.dismissToast': 'Schließen',
    'localization.admin.errorLoad': 'Übersetzungen konnten nicht geladen werden.',
    'localization.admin.errorSave': 'Beim Speichern der Übersetzung ist ein Fehler aufgetreten.',
    'localization.admin.errorInvalidate': 'Beim Leeren des Caches ist ein Fehler aufgetreten.',
    'localization.admin.errorGeneric': 'Es ist ein unbekannter Fehler aufgetreten.',
    'localization.admin.notAvailable': 'Nicht verfügbar'
  },
};

const resolveFallback = (language: string, key: string, fallback?: string): string => {
  const normalized = fallbackTranslations[language]?.[key];
  if (normalized) {
    return normalized;
  }

  const fallbackValue = fallbackTranslations['en-US']?.[key];
  if (fallbackValue) {
    return fallbackValue;
  }

  return fallback ?? key;
};

type LocalizationProviderProps = {
  tenantId: string;
  initialLanguage: string;
  children: React.ReactNode;
};

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ tenantId, initialLanguage, children }) => {
  const [language, setLanguageState] = useState(initialLanguage);
  const [translations, setTranslations] = useState<Record<string, string>>(
    fallbackTranslations[initialLanguage] ?? fallbackTranslations['en-US'] ?? {}
  );
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
        const response = await fetch(
          `/api/localization?tenantId=${encodeURIComponent(tenantId)}&language=${encodeURIComponent(targetLanguage)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as { language: string; translations: Record<string, string> };
        const base = fallbackTranslations[payload.language] ?? fallbackTranslations['en-US'] ?? {};
        setTranslations({ ...base, ...payload.translations });
      } catch (err) {
        console.warn('Localization fetch failed, using fallback dataset.', err);
        const fallback = fallbackTranslations[targetLanguage] ?? fallbackTranslations['en-US'] ?? {};
        setTranslations(fallback);
        setError(resolveFallback(targetLanguage, 'localization.admin.errorGeneric', 'Unknown error'));
      } finally {
        setLoading(false);
      }
    },
    [tenantId]
  );

  useEffect(() => {
    void fetchTranslations(language);
    return () => abortRef.current?.abort();
  }, [fetchTranslations, language]);

  const setLanguage = useCallback(
    (next: string) => {
      setLanguageState(next);
    },
    []
  );

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
      t: (key: string, fallback?: string) => translations[key] ?? fallback ?? key,
    }),
    [language, translations, loading, error, setLanguage, reload]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};

export const useLocalization = (): LocalizationContextValue => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
