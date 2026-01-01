import 'react-native-url-polyfill/dist/polyfill';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { TokenStorage } from '../auth/token-storage';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: async (key: string) => {
        return TokenStorage.getItem(key);
      },
      setItem: async (key: string, value: string) => {
        await TokenStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        await TokenStorage.removeItem(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
