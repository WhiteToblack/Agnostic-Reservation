import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResult } from '../../../shared/types/auth';

const SESSION_KEY = 'agnostic:session';

export const saveSession = async (session: AuthResult) => {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const loadSession = async (): Promise<AuthResult | null> => {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResult;
  } catch (error) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const clearSession = async () => {
  await AsyncStorage.removeItem(SESSION_KEY);
};
