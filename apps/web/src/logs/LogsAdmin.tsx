import React, { useCallback, useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 25;

type RequestLogItem = {
  id: string;
  tenantId?: string | null;
  userId?: string | null;
  method: string;
  path: string;
  query?: string | null;
  statusCode: number;
  durationMilliseconds: number;
  headers: Record<string, string | null>;
  isAccountingOperation: boolean;
  correlationId?: string | null;
  endpointDisplayName?: string | null;
  uiComponent?: string | null;
  hasError: boolean;
  errorType?: string | null;
  errorMessage?: string | null;
  stackTrace?: string | null;
  createdAt: string;
  errorAt?: string | null;
};

type RequestLogPage = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: RequestLogItem[];
};

type LogsAdminProps = {
  tenantId: string;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export const LogsAdmin: React.FC<LogsAdminProps> = ({ tenantId }) => {
  const [page, setPage] = useState(1);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [search, setSearch] = useState('');
  const [pageData, setPageData] = useState<RequestLogPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tenantId,
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      });

      if (onlyErrors) {
        params.set('errorsOnly', 'true');
      }

      const response = await fetch(`/api/admin/logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as RequestLogPage;
      setPageData(payload);
      if (payload.page !== page) {
        setPage(payload.page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      setPageData(null);
    } finally {
      setLoading(false);
    }
  }, [onlyErrors, page, tenantId]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs, refreshToken]);

  useEffect(() => {
    setPage(1);
  }, [tenantId]);

  const filteredItems = useMemo(() => {
    if (!pageData?.items) {
      return [];
    }

    const trimmed = search.trim().toLowerCase();
    if (!trimmed) {
      return pageData.items;
    }

    return pageData.items.filter((item) => {
      const haystack = [
        item.method,
        item.path,
        item.query ?? '',
        item.errorMessage ?? '',
        item.errorType ?? '',
        item.uiComponent ?? '',
        item.endpointDisplayName ?? '',
        item.correlationId ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(trimmed);
    });
  }, [pageData, search]);

  const totalPages = useMemo(() => {
    if (!pageData) {
      return 1;
    }

    return Math.max(1, Math.ceil(pageData.totalCount / PAGE_SIZE));
  }, [pageData]);

  const triggerRefresh = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  return (
    <div className="log-admin admin-card">
      <header className="log-admin__header">
        <div>
          <h1>MongoDB Log İzleme</h1>
          <p>Hata ve işlem loglarını gerçek zamanlı olarak takip edin.</p>
        </div>
        <div className="log-admin__header-actions">
          <label className="log-admin__toggle">
            <input
              type="checkbox"
              checked={onlyErrors}
              onChange={(event) => {
                setPage(1);
                setOnlyErrors(event.target.checked);
              }}
            />
            <span>Yalnızca hatalar</span>
          </label>
          <button className="log-admin__refresh" onClick={triggerRefresh} disabled={loading}>
            Yenile
          </button>
        </div>
      </header>

      <div className="log-admin__filters">
        <input
          className="log-admin__search"
          placeholder="Yol, mesaj veya komponent ara..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="log-admin__pagination">
          <button
            className="log-admin__page"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={loading || page <= 1}
          >
            Önceki
          </button>
          <span className="log-admin__page-status">
            Sayfa {page} / {totalPages}
          </span>
          <button
            className="log-admin__page"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={loading || page >= totalPages}
          >
            Sonraki
          </button>
        </div>
      </div>

      {error && <div className="log-admin__error">{error}</div>}
      {loading && <div className="log-admin__status">Loglar yükleniyor...</div>}

      {!loading && filteredItems.length === 0 && !error && (
        <div className="log-admin__empty">Henüz görüntülenecek log bulunmuyor.</div>
      )}

      <div className="log-admin__list">
        {filteredItems.map((item) => {
          const isError = item.hasError || item.statusCode >= 500;
          return (
            <article key={item.id} className={`log-card ${isError ? 'log-card--error' : 'log-card--info'}`}>
              <header className="log-card__header">
                <span className="log-card__method">{item.method}</span>
                <span className="log-card__path">{item.path}</span>
                <span className="log-card__status">{item.statusCode}</span>
                <span className="log-card__time">{formatDate(item.createdAt)}</span>
              </header>

              <div className="log-card__meta">
                <div>
                  <span className="log-card__label">Tenant</span>
                  <span>{item.tenantId ?? '—'}</span>
                </div>
                <div>
                  <span className="log-card__label">Kullanıcı</span>
                  <span>{item.userId ?? '—'}</span>
                </div>
                <div>
                  <span className="log-card__label">Süre</span>
                  <span>{item.durationMilliseconds} ms</span>
                </div>
                <div>
                  <span className="log-card__label">UI Komponenti</span>
                  <span>{item.uiComponent ?? '—'}</span>
                </div>
              </div>

              <div className="log-card__details">
                <div>
                  <span className="log-card__label">Endpoint</span>
                  <span>{item.endpointDisplayName ?? '—'}</span>
                </div>
                <div>
                  <span className="log-card__label">Sorgu</span>
                  <span>{item.query ?? '—'}</span>
                </div>
                <div>
                  <span className="log-card__label">Correlation ID</span>
                  <span>{item.correlationId ?? '—'}</span>
                </div>
              </div>

              {isError && (
                <section className="log-card__error">
                  <h3>Hata Detayı</h3>
                  <div className="log-card__error-grid">
                    <div>
                      <span className="log-card__label">Sınıf</span>
                      <span>{item.errorType ?? '—'}</span>
                    </div>
                    <div>
                      <span className="log-card__label">Mesaj</span>
                      <span>{item.errorMessage ?? '—'}</span>
                    </div>
                    <div>
                      <span className="log-card__label">Hata Zamanı</span>
                      <span>{formatDate(item.errorAt ?? item.createdAt)}</span>
                    </div>
                  </div>
                  {item.stackTrace && <pre className="log-card__stacktrace">{item.stackTrace}</pre>}
                </section>
              )}

              <details className="log-card__extra">
                <summary>Başlıklar &amp; Ham Veri</summary>
                <div className="log-card__extra-grid">
                  <div>
                    <strong>İstek Başlıkları</strong>
                    <pre className="log-card__headers">
                      {Object.entries(item.headers)
                        .map(([key, value]) => `${key}: ${value ?? ''}`)
                        .join('\n') || '—'}
                    </pre>
                  </div>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
};
