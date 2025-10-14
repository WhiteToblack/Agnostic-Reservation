import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './theme/ThemeProvider';
import AppNavigator from './navigation/AppNavigator';
import { useThemePreference } from './hooks/useThemePreference';
import { LocalizationProvider } from './localization/LocalizationProvider';
import { defaultLanguage } from '../../shared/localization';

const tenantId = 'demo-tenant';

const App = () => {
  const { mode, setMode } = useThemePreference();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider tenantId={tenantId} initialLanguage={defaultLanguage}>
        <ThemeProvider initialMode={mode} onModeChange={setMode}>
          <AppNavigator />
        </ThemeProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
};

export default App;
