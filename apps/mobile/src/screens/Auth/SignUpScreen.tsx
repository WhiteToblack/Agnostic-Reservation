import { useState, type FC } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signUp } from '../../services/api';
import { useLocalization } from '../../../../shared/localization';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { useDeviceId } from '../../hooks/useDeviceId';
import { appConfig } from '../../config/appConfig';
import { saveSession } from '../../storage/sessionStorage';

type SignUpScreenProps = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUpScreen: FC<SignUpScreenProps> = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState(appConfig.defaultTenantId);
  const [fullName, setFullName] = useState('');
  const [preferredTheme, setPreferredTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(false);
  const { t } = useLocalization();
  const { theme, setMode } = useTheme();
  const { deviceId: storedDeviceId, loading: deviceLoading } = useDeviceId();
  const deviceId = route.params?.deviceId ?? storedDeviceId ?? '';

  const onSubmit = async () => {
    if (!deviceId) {
      Alert.alert(t('auth.device.missingTitle', 'Cihaz bilgisi bulunamadı'), t('auth.device.missingBody', 'Tekrar deneyiniz.'));
      return;
    }
    setLoading(true);
    try {
      const session = await signUp({ email, password, tenantId, fullName, preferredTheme, deviceId });
      await saveSession(session);
      setMode(preferredTheme);
      navigation.replace('Main');
    } catch (error) {
      Alert.alert(t('auth.signUp.errorTitle', 'Sign up failed'), t('auth.signUp.errorDescription', 'Please review your details'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('auth.signUp.title', 'Yeni hesap oluştur')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>{t('auth.signUp.subtitle', 'Rezervasyon yönetimini tek panelde toplayın')}</Text>
      </View>
      <View style={[styles.form, { backgroundColor: theme.colors.surface }]}> 
        <TextInput
          value={tenantId}
          onChangeText={setTenantId}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder={t('auth.signUp.tenantPlaceholder', 'Tenant ID')}
          placeholderTextColor={theme.colors.muted}
        />
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder={t('auth.signUp.fullNamePlaceholder', 'Ad soyad')}
          placeholderTextColor={theme.colors.muted}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder={t('auth.signUp.emailPlaceholder', 'E-posta')}
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder={t('auth.signUp.passwordPlaceholder', 'Şifre')}
          placeholderTextColor={theme.colors.muted}
          secureTextEntry
        />
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.colors.muted }]}>{t('auth.signUp.themeLabel', 'Tema tercihi')}</Text>
          <View style={styles.toggleGroup}>
            {(['light', 'dark'] as const).map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: preferredTheme === value ? theme.colors.primary : theme.colors.surfaceMuted,
                  },
                ]}
                onPress={() => setPreferredTheme(value)}
              >
                <Text style={[styles.toggleText, { color: preferredTheme === value ? '#fff' : theme.colors.text }]}>
                  {value === 'light'
                    ? t('auth.signUp.themeLight', 'Açık')
                    : t('auth.signUp.themeDark', 'Koyu')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={onSubmit}
          disabled={loading || deviceLoading}
        >
          {loading || deviceLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>{t('auth.signUp.submit', 'Kayıt ol')}</Text>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('SignIn', { deviceId })}>
        <Text style={[styles.link, { color: theme.colors.primary }]}>{t('auth.signUp.navigateToSignIn', 'Zaten hesabın var mı? Giriş yap')}</Text>
      </TouchableOpacity>
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
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  form: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  toggleRow: {
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  toggleText: {
    fontWeight: '600',
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
  footerLink: {
    alignItems: 'center',
  },
  link: {
    fontWeight: '600',
    fontSize: 15,
  },
});

export default SignUpScreen;
