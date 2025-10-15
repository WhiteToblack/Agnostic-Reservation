import { useState, type FC } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { useLocalization } from '../../../../shared/localization';
import { saveSession, clearSession } from '../../storage/sessionStorage';
import type { RootStackParamList } from '../../navigation/types';

const formatDateTime = (value: string, locale: string) =>
  new Date(value).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

type SessionResumeScreenProps = NativeStackScreenProps<RootStackParamList, 'SessionResume'>;

const SessionResumeScreen: FC<SessionResumeScreenProps> = ({ navigation, route }) => {
  const { session, deviceId } = route.params;
  const { theme, setMode } = useTheme();
  const { locale, t } = useLocalization();
  const [loading, setLoading] = useState(false);

  const continueSession = async () => {
    setLoading(true);
    await saveSession(session);
    const preferredTheme = (session.session.user?.preferredTheme ?? session.preferredTheme)?.toLowerCase();
    setMode(preferredTheme === 'dark' ? 'dark' : 'light');
    navigation.replace('Main');
  };

  const switchAccount = async () => {
    setLoading(true);
    await clearSession();
    navigation.replace('SignIn', { deviceId });
  };

  const lastSeen = formatDateTime(session.lastActivityUtc, locale ?? 'tr-TR');
  const fullName = session.fullName ?? session.session.user?.fullName ?? session.email;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.label, { color: theme.colors.muted }]}>{t('sessionResume.activeSession', 'Aktif oturum bulundu')}</Text>
        <Text style={[styles.name, { color: theme.colors.text }]}>{fullName}</Text>
        <Text style={[styles.email, { color: theme.colors.muted }]}>{session.email}</Text>
        <View style={[styles.infoRow, { backgroundColor: theme.colors.surfaceMuted }]}> 
          <Text style={[styles.infoLabel, { color: theme.colors.muted }]}>{t('sessionResume.lastActivity', 'Son işlem')}</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{lastSeen}</Text>
        </View>
        <View style={[styles.infoRow, { backgroundColor: theme.colors.surfaceMuted }]}> 
          <Text style={[styles.infoLabel, { color: theme.colors.muted }]}>{t('sessionResume.device', 'Cihaz')}</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{deviceId}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={continueSession}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{t('sessionResume.continue', 'Devam et')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
          onPress={switchAccount}
          disabled={loading}
        >
          <Text style={[styles.secondaryText, { color: theme.colors.text }]}>{t('sessionResume.switchAccount', 'Farklı hesapla giriş yap')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  email: {
    fontSize: 16,
  },
  infoRow: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SessionResumeScreen;
