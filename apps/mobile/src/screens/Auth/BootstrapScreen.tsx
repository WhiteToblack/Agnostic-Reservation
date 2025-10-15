import { useEffect, type FC } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getOrCreateDeviceId } from '../../utils/device';
import { getSession } from '../../services/api';
import { saveSession, clearSession } from '../../storage/sessionStorage';
import { defaultTenantId } from '../../config/constants';
import { useTheme } from '../../theme/ThemeProvider';
import { useLocalization } from '../../../../shared/localization';
import type { RootStackParamList } from '../../navigation/types';

const BootstrapScreen: FC<NativeStackScreenProps<RootStackParamList, 'Bootstrap'>> = ({ navigation }) => {
  const { theme, setMode } = useTheme();
  const { t } = useLocalization();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const deviceId = await getOrCreateDeviceId();
      try {
        const session = await getSession(defaultTenantId, deviceId);
        if (cancelled) {
          return;
        }
        await saveSession(session);
        const preferredTheme = (session.session.user?.preferredTheme ?? session.preferredTheme)?.toLowerCase();
        setMode(preferredTheme === 'dark' ? 'dark' : 'light');
        navigation.replace('SessionResume', { session, deviceId });
      } catch (error) {
        if (cancelled) {
          return;
        }
        await clearSession();
        navigation.replace('Onboarding', { deviceId });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.muted }]}>{t('bootstrap.loading', 'Profiliniz hazırlanıyor...')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: 16,
  },
});

export default BootstrapScreen;
