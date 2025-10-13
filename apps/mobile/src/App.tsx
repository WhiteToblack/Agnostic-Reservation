import React from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import AppNavigator from './navigation/AppNavigator';
import { useThemePreference } from './hooks/useThemePreference';

const App = () => {
  const { mode, setMode } = useThemePreference();
  return (
    <ThemeProvider initialMode={mode} onModeChange={setMode}>
      <AppNavigator />
    </ThemeProvider>
  );
};

export default App;
