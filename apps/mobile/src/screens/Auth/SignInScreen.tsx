import { useState, type FC } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signIn } from '../../services/api';
import { useLocalization } from '../../../../shared/localization';
import type { RootStackParamList } from '../../navigation/types';

type SignInScreenProps = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const SignInScreen: FC<SignInScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLocalization();

  const onSubmit = async () => {
    setLoading(true);
    try {
      await signIn({ email, password, tenantId });
      navigation.replace('Main');
    } catch (error) {
      Alert.alert(t('auth.signIn.errorTitle', 'Sign in failed'), t('auth.signIn.errorDescription', 'Please check your credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.signIn.title', 'Welcome Back')}</Text>
      <TextInput
        value={tenantId}
        onChangeText={setTenantId}
        style={styles.input}
        placeholder={t('auth.signIn.tenantPlaceholder', 'Tenant ID')}
        autoCapitalize="none"
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder={t('auth.signIn.emailPlaceholder', 'Email')}
        autoCapitalize="none"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder={t('auth.signIn.passwordPlaceholder', 'Password')}
        secureTextEntry
      />
      <Button
        title={loading ? t('auth.signIn.loading', 'Signing in...') : t('auth.signIn.submit', 'Sign In')}
        onPress={onSubmit}
        disabled={loading}
      />
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>{t('auth.signIn.navigateToSignUp', 'Need an account? Sign up')}</Text>
      </TouchableOpacity>
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
  link: {
    marginTop: 12,
    textAlign: 'center',
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default SignInScreen;
