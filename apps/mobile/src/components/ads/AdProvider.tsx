import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { useAuth } from '@/lib/auth/auth-provider';
import type { AdConfig, AdFrequencyConfig } from '@glint/types';

interface AdContextValue {
  isInitialized: boolean;
  shouldShowAds: boolean;
  config: AdConfig | null;
  frequency: AdFrequencyConfig | null;
  lastInterstitialTime: number;
  setLastInterstitialTime: (time: number) => void;
  canShowInterstitial: () => boolean;
}

const AdContext = createContext<AdContextValue | null>(null);

interface AdProviderProps {
  children: React.ReactNode;
}

const DEFAULT_FREQUENCY: AdFrequencyConfig = {
  interstitialCooldownMs: 60000,
  maxAdsPerSession: 10,
  feedAdInterval: 5,
};

export function AdProvider({ children }: AdProviderProps) {
  const { profile } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfig] = useState<AdConfig | null>(null);
  const [lastInterstitialTime, setLastInterstitialTime] = useState(0);

  // Check if user should see ads (FREE plan only)
  const shouldShowAds = profile?.plan === 'FREE';

  const frequency = config?.frequency ?? DEFAULT_FREQUENCY;

  // Initialize Mobile Ads SDK
  useEffect(() => {
    const initAds = async () => {
      if (!shouldShowAds) {
        setIsInitialized(true);
        return;
      }

      try {
        await mobileAds().initialize();
        setIsInitialized(true);
        console.log('AdMob initialized successfully');
      } catch (error) {
        console.error('Failed to initialize AdMob:', error);
        setIsInitialized(true); // Continue even if failed
      }
    };

    initAds();
  }, [shouldShowAds]);

  // Fetch ad config from server
  useEffect(() => {
    const fetchConfig = async () => {
      if (!shouldShowAds) return;

      try {
        const platform = Platform.OS as 'ios' | 'android';
        // TODO: Fetch from API when available
        // const response = await api.get<AdConfigResponse>('/ads/config', { platform });
        // if (response.data?.config) {
        //   setConfig(response.data.config);
        // }
      } catch (error) {
        console.error('Failed to fetch ad config:', error);
      }
    };

    fetchConfig();
  }, [shouldShowAds]);

  const canShowInterstitial = useCallback(() => {
    if (!shouldShowAds) return false;

    const now = Date.now();
    const cooldown = frequency.interstitialCooldownMs;

    return now - lastInterstitialTime >= cooldown;
  }, [shouldShowAds, frequency.interstitialCooldownMs, lastInterstitialTime]);

  const value: AdContextValue = {
    isInitialized,
    shouldShowAds,
    config,
    frequency,
    lastInterstitialTime,
    setLastInterstitialTime,
    canShowInterstitial,
  };

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

export function useAds() {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
}
