import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signUp } from '../../services/api';

const SignUpScreen: React.FC<NativeStackScreenProps<any>> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [fullName, setFullName] = useState('');
  const [preferredTheme, setPreferredTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await signUp({ email, password, tenantId, fullName, preferredTheme });
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Sign up failed', 'Please review your details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput value={tenantId} onChangeText={setTenantId} style={styles.input} placeholder="Tenant ID" />
      <TextInput value={fullName} onChangeText={setFullName} style={styles.input} placeholder="Full Name" />
      <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Password" secureTextEntry />
      <View style={styles.toggleRow}>
        <Text>Theme</Text>
        <View style={styles.toggleGroup}>
          <Button title="Light" onPress={() => setPreferredTheme('light')} color={preferredTheme === 'light' ? '#6366F1' : undefined} />
          <Button title="Dark" onPress={() => setPreferredTheme('dark')} color={preferredTheme === 'dark' ? '#6366F1' : undefined} />
        </View>
      </View>
      <Button title={loading ? 'Signing up...' : 'Sign Up'} onPress={onSubmit} disabled={loading} />
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
