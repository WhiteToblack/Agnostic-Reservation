import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signIn } from '../../services/api';

const SignInScreen: React.FC<NativeStackScreenProps<any>> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await signIn({ email, password, tenantId });
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Sign in failed', 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <TextInput value={tenantId} onChangeText={setTenantId} style={styles.input} placeholder="Tenant ID" autoCapitalize="none" />
      <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Password" secureTextEntry />
      <Button title={loading ? 'Signing in...' : 'Sign In'} onPress={onSubmit} disabled={loading} />
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Need an account? Sign up</Text>
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
