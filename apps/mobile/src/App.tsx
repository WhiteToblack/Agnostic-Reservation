import React from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import AppNavigator from './navigation/AppNavigator';
import { useThemePreference } from './hooks/useThemePreference';
import { LocalizationProvider } from './localization/LocalizationProvider';
import { defaultLanguage } from '../../shared/localization';

const tenantId = 'demo-tenant';

const App = () => {
  const { mode, setMode } = useThemePreference();
  return (
    <LocalizationProvider tenantId={tenantId} initialLanguage={defaultLanguage}>
      <ThemeProvider initialMode={mode} onModeChange={setMode}>
        <AppNavigator />
      </ThemeProvider>
    </LocalizationProvider>
  );
};

export default App;
