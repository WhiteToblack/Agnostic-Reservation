import './utils/polyfills/ensurePlatformConstants';
import 'react-native-gesture-handler';
// eslint-disable-next-line no-duplicate-imports
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './utils/setupErrorHandling';
import { ThemeProvider } from './theme/ThemeProvider';
import { useThemePreference } from './hooks/useThemePreference';
import { LocalizationProvider } from './localization/LocalizationProvider';
import { defaultLanguage } from '../../shared/localization';
import AppNavigator from './navigation/AppNavigator';
import { appConfig } from './config/appConfig';

const App = () => {
  const { mode, setMode } = useThemePreference();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider tenantId={appConfig.defaultTenantId} initialLanguage={defaultLanguage}>
        <ThemeProvider initialMode={mode} onModeChange={setMode}>
          <AppNavigator />
        </ThemeProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
};

export default App;
