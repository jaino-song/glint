import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'glint_access_token';
const REFRESH_TOKEN_KEY = 'glint_refresh_token';

/**
 * SecureStore wrapper for token storage
 * Falls back to in-memory storage for web
 */
class TokenStorageImpl {
  private memoryStorage: Map<string, string> = new Map();

  private isSecureStoreAvailable(): boolean {
    return Platform.OS !== 'web';
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isSecureStoreAvailable()) {
        return await SecureStore.getItemAsync(key);
      }
      return this.memoryStorage.get(key) ?? null;
    } catch (error) {
      console.error('TokenStorage.getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(key, value);
      } else {
        this.memoryStorage.set(key, value);
      }
    } catch (error) {
      console.error('TokenStorage.setItem error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isSecureStoreAvailable()) {
        await SecureStore.deleteItemAsync(key);
      } else {
        this.memoryStorage.delete(key);
      }
    } catch (error) {
      console.error('TokenStorage.removeItem error:', error);
    }
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setItem(ACCESS_TOKEN_KEY, accessToken),
      this.setItem(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  }

  async getAccessToken(): Promise<string | null> {
    return this.getItem(ACCESS_TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.getItem(REFRESH_TOKEN_KEY);
  }

  async clearTokens(): Promise<void> {
    await Promise.all([
      this.removeItem(ACCESS_TOKEN_KEY),
      this.removeItem(REFRESH_TOKEN_KEY),
    ]);
  }
}

export const TokenStorage = new TokenStorageImpl();
