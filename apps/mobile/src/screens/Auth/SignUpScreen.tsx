import { useState, type FC } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signUp } from '../../services/api';
import { useLocalization } from '../../../../shared/localization';
import type { RootStackParamList } from '../../navigation/types';

type SignUpScreenProps = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUpScreen: FC<SignUpScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [fullName, setFullName] = useState('');
  const [preferredTheme, setPreferredTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(false);
  const { t } = useLocalization();

  const onSubmit = async () => {
    setLoading(true);
    try {
      await signUp({ email, password, tenantId, fullName, preferredTheme });
      navigation.replace('Main');
    } catch (error) {
      Alert.alert(t('auth.signUp.errorTitle', 'Sign up failed'), t('auth.signUp.errorDescription', 'Please review your details'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.signUp.title', 'Create Account')}</Text>
      <TextInput
        value={tenantId}
        onChangeText={setTenantId}
        style={styles.input}
        placeholder={t('auth.signUp.tenantPlaceholder', 'Tenant ID')}
      />
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        placeholder={t('auth.signUp.fullNamePlaceholder', 'Full Name')}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder={t('auth.signUp.emailPlaceholder', 'Email')}
        autoCapitalize="none"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder={t('auth.signUp.passwordPlaceholder', 'Password')}
        secureTextEntry
      />
      <View style={styles.toggleRow}>
        <Text>{t('auth.signUp.themeLabel', 'Theme')}</Text>
        <View style={styles.toggleGroup}>
          <Button
            title={t('auth.signUp.themeLight', 'Light')}
            onPress={() => setPreferredTheme('light')}
            color={preferredTheme === 'light' ? '#6366F1' : undefined}
          />
          <Button
            title={t('auth.signUp.themeDark', 'Dark')}
            onPress={() => setPreferredTheme('dark')}
            color={preferredTheme === 'dark' ? '#6366F1' : undefined}
          />
        </View>
      </View>
      <Button
        title={loading ? t('auth.signUp.loading', 'Signing up...') : t('auth.signUp.submit', 'Sign Up')}
        onPress={onSubmit}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    padding: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default SignUpScreen;
