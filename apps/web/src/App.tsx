import React from 'react';
import './App.css';
import { LocalizationProvider } from './localization/LocalizationProvider';
import { LocalizationAdmin } from './localization/LocalizationAdmin';

const fallbackTenantId = '00000000-0000-0000-0000-000000000000';
const tenantId = (import.meta.env.VITE_TENANT_ID as string | undefined) ?? fallbackTenantId;
const preferredLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || 'tr-TR';

const App: React.FC = () => {
  return (
    <LocalizationProvider tenantId={tenantId} initialLanguage={preferredLanguage}>
      <div className="app-shell">
        <LocalizationAdmin tenantId={tenantId} />
      </div>
    </LocalizationProvider>
  );
};

export default App;
