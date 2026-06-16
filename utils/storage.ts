import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { StorageKeys } from '@/constants/storage';

export const cacheStorage = {
  async getString(key: string): Promise<string | null> {
    return AsyncStorage.getItem(`cache:${key}`);
  },
  async set(key: string, value: string | number | boolean) {
    await AsyncStorage.setItem(`cache:${key}`, String(value));
  },
  async delete(key: string) {
    await AsyncStorage.removeItem(`cache:${key}`);
  },
};

export const secureStorage = {
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(StorageKeys.accessToken);
    } catch {
      return null;
    }
  },
  async setToken(token: string) {
    await SecureStore.setItemAsync(StorageKeys.accessToken, token);
  },
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(StorageKeys.refreshToken);
    } catch {
      return null;
    }
  },
  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync(StorageKeys.refreshToken, token);
  },
  async clearTokens() {
    await SecureStore.deleteItemAsync(StorageKeys.accessToken);
    await SecureStore.deleteItemAsync(StorageKeys.refreshToken);
  },
};

export const persistentStorage = {
  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },
  async set(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
  async getBoolean(key: string): Promise<boolean> {
    const val = await AsyncStorage.getItem(key);
    return val === 'true';
  },
  async setBoolean(key: string, value: boolean) {
    await AsyncStorage.setItem(key, value.toString());
  },
};
