import { useState, type FC } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signIn } from '../../services/api';
import { useLocalization } from '../../../../shared/localization';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { useDeviceId } from '../../hooks/useDeviceId';
import { appConfig } from '../../config/appConfig';
import { saveSession } from '../../storage/sessionStorage';

type SignInScreenProps = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const SignInScreen: FC<SignInScreenProps> = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState(appConfig.defaultTenantId);
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
      const session = await signIn({ email, password, tenantId, deviceId });
      await saveSession(session);
      const preferredTheme = (session.session.user?.preferredTheme ?? session.preferredTheme)?.toLowerCase();
      setMode(preferredTheme === 'dark' ? 'dark' : 'light');
      navigation.replace('Main');
    } catch (error) {
      Alert.alert(t('auth.signIn.errorTitle', 'Sign in failed'), t('auth.signIn.errorDescription', 'Please check your credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('auth.signIn.title', 'Tekrar hoş geldiniz')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>{t('auth.signIn.subtitle', 'Panelinize erişmek için bilgilerinizi girin')}</Text>
      </View>
      <View style={[styles.form, { backgroundColor: theme.colors.surface }]}> 
        <TextInput
          value={tenantId}
          onChangeText={setTenantId}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder={t('auth.signIn.tenantPlaceholder', 'Tenant ID')}
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder={t('auth.signIn.emailPlaceholder', 'E-posta')}
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder={t('auth.signIn.passwordPlaceholder', 'Şifre')}
          placeholderTextColor={theme.colors.muted}
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={onSubmit}
          disabled={loading || deviceLoading}
        >
          {loading || deviceLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>{t('auth.signIn.submit', 'Giriş yap')}</Text>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('SignUp', { deviceId })}>
        <Text style={[styles.link, { color: theme.colors.primary }]}>{t('auth.signIn.navigateToSignUp', 'Hesabın yok mu? Kayıt ol')}</Text>
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

export default SignInScreen;
