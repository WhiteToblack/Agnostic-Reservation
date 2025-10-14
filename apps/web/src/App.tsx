import React, { useState } from 'react';
import './App.css';
import { LocalizationProvider } from './localization/LocalizationProvider';
import { LocalizationAdmin } from './localization/LocalizationAdmin';
import { LogsAdmin } from './logs/LogsAdmin';

const fallbackTenantId = '00000000-0000-0000-0000-000000000000';
const tenantId = (import.meta.env.VITE_TENANT_ID as string | undefined) ?? fallbackTenantId;
const preferredLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || 'tr-TR';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'localization' | 'logs'>('localization');

  return (
    <LocalizationProvider tenantId={tenantId} initialLanguage={preferredLanguage}>
      <div className="app-shell">
        <div className="admin-layout">
          <nav className="admin-layout__tabs" aria-label="Yönetim sekmeleri">
            <button
              type="button"
              className={`admin-layout__tab ${activeView === 'localization' ? 'admin-layout__tab--active' : ''}`}
              onClick={() => setActiveView('localization')}
            >
              Lokalizasyon
            </button>
            <button
              type="button"
              className={`admin-layout__tab ${activeView === 'logs' ? 'admin-layout__tab--active' : ''}`}
              onClick={() => setActiveView('logs')}
            >
              Mongo Logları
            </button>
          </nav>

          <div className="admin-layout__content">
            {activeView === 'localization' ? (
              <LocalizationAdmin tenantId={tenantId} />
            ) : (
              <LogsAdmin tenantId={tenantId} />
            )}
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default App;
