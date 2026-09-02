import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  user: 'rv.user',
  onboarded: 'rv.onboarded',
  vehicle: 'rv.vehicle',
  monitoring: 'rv.monitoring',
  demoMode: 'rv.demoMode',
};

export async function saveJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const storage = {
  keys: KEYS,
  saveJson,
  loadJson,
  async clearAll() {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
