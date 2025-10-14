import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalization, supportedLanguages } from '../../../shared/localization';

type LocalizationKeyDto = {
  id: string;
  key: string;
  description?: string | null;
  translations: Record<string, string>;
};

type LocalizationAdminProps = {
  tenantId: string;
  userId?: string;
};

export const LocalizationAdmin: React.FC<LocalizationAdminProps> = ({ tenantId }) => {
  const { t, language, setLanguage, translations, reload, loading: localizationLoading } = useLocalization();
  const [items, setItems] = useState<LocalizationKeyDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [languageValue, setLanguageValue] = useState<string>(language);
  const [textValue, setTextValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');

  const filteredItems = useMemo(() => {
    if (!search.trim()) {
      return items;
    }

    const query = search.trim().toLowerCase();
    return items.filter((item) =>
      item.key.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      Object.entries(item.translations).some(([lang, value]) =>
        lang.toLowerCase().includes(query) || value.toLowerCase().includes(query)
      )
    );
  }, [items, search]);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/localization?tenantId=${encodeURIComponent(tenantId)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as LocalizationKeyDto[];
      setItems(payload);
    } catch (err) {
      console.warn('Localization key fetch failed, using in-memory fallback.', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      const fallbackItems: LocalizationKeyDto[] = Object.entries(translations).map(([key, value]) => ({
        id: key,
        key,
        translations: { [language]: value },
      }));
      setItems(fallbackItems);
    } finally {
      setLoading(false);
    }
  }, [language, tenantId, translations]);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  useEffect(() => {
    setLanguageValue(language);
  }, [language]);

  const resetForm = () => {
    setKeyValue('');
    setLanguageValue(language);
    setTextValue('');
    setDescriptionValue('');
  };

  const upsertTranslation = useCallback(async () => {
    if (!keyValue.trim() || !languageValue.trim() || !textValue.trim()) {
      setToast(t('localization.admin.validation'));
      return;
    }

    setError(null);
    setToast(null);
    try {
      const response = await fetch(`/api/admin/localization?tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: keyValue.trim(),
          language: languageValue.trim(),
          value: textValue,
          description: descriptionValue.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setToast(t('localization.admin.toastSaved'));
      resetForm();
      await Promise.all([loadKeys(), reload()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [descriptionValue, keyValue, languageValue, loadKeys, reload, t, tenantId, textValue]);

  const invalidateCache = useCallback(async () => {
    setError(null);
    setToast(null);
    try {
      const response = await fetch(`/api/admin/localization/invalidate?tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setToast(t('localization.admin.toastCleared'));
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [reload, t, tenantId]);

  return (
    <div className="ml-admin">
      <header className="ml-admin__header">
        <div>
          <h1>{t('app.header.title')}</h1>
          <p>{t('app.header.subtitle')}</p>
        </div>
        <div className="ml-admin__header-actions">
          <label className="ml-admin__select">
            <span>{t('localization.admin.languageLabel')}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {supportedLanguages.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          <button className="ml-admin__button" onClick={() => void reload()} disabled={localizationLoading}>
            {localizationLoading ? '…' : '↻'}
          </button>
          <button className="ml-admin__button" onClick={() => void invalidateCache()}>
            🧹
          </button>
        </div>
      </header>

      <section className="ml-admin__form">
        <div className="ml-admin__form-field">
          <label>{t('localization.admin.keyLabel')}</label>
          <input value={keyValue} onChange={(event) => setKeyValue(event.target.value)} placeholder="app.header.title" />
        </div>
        <div className="ml-admin__form-field">
          <label>{t('localization.admin.languageLabel')}</label>
          <select value={languageValue} onChange={(event) => setLanguageValue(event.target.value)}>
            {supportedLanguages.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-admin__form-field">
          <label>{t('localization.admin.valueLabel')}</label>
          <textarea value={textValue} onChange={(event) => setTextValue(event.target.value)} rows={2} />
        </div>
        <div className="ml-admin__form-field">
          <label>{t('localization.admin.infoLabel')}</label>
          <input
            value={descriptionValue}
            onChange={(event) => setDescriptionValue(event.target.value)}
            placeholder={t('localization.admin.descriptionPlaceholder')}
          />
        </div>
        <div className="ml-admin__form-actions">
          <button className="ml-admin__primary" onClick={() => void upsertTranslation()}>
            {t('localization.admin.addButton')}
          </button>
          <button className="ml-admin__ghost" onClick={resetForm}>
            ✖
          </button>
        </div>
      </section>

      <section className="ml-admin__panel">
        <div className="ml-admin__panel-header">
          <input
            className="ml-admin__search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('localization.admin.searchPlaceholder')}
          />
          {(loading || localizationLoading) && (
            <span className="ml-admin__status">{t('localization.admin.loading')}</span>
          )}
        </div>

        {toast && (
          <div className="ml-admin__toast" role="status">
            {toast}
            <button onClick={() => setToast(null)}>×</button>
          </div>
        )}

        {error && (
          <div className="ml-admin__error" role="alert">
            {error}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="ml-admin__empty">{t('localization.admin.emptyState')}</div>
        ) : (
          <table className="ml-admin__table">
            <thead>
              <tr>
                <th>{t('localization.admin.keyLabel')}</th>
                <th>{t('localization.admin.tableDescription')}</th>
                {supportedLanguages.map((code) => (
                  <th key={code}>{code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="ml-admin__key">
                    <div className="ml-admin__key-main">{item.key}</div>
                    {item.description && <div className="ml-admin__key-note">{item.description}</div>}
                  </td>
                  <td className="ml-admin__description">{item.description ?? '—'}</td>
                  {supportedLanguages.map((code) => (
                    <td key={code} className={code === language ? 'ml-admin__highlight' : undefined}>
                      {item.translations?.[code] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
