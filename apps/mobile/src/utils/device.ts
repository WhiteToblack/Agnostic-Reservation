import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'agnostic:deviceId';
let inMemoryDeviceId: string | null = null;

const randomId = () => `device-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

export const getOrCreateDeviceId = async (): Promise<string> => {
  if (inMemoryDeviceId) {
    return inMemoryDeviceId;
  }

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    inMemoryDeviceId = stored;
    return stored;
  }

  const generated = randomId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
  inMemoryDeviceId = generated;
  return generated;
};
