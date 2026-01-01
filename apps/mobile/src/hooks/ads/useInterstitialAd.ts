import { useEffect, useState, useCallback } from 'react';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { useAds } from '@/components/ads/AdProvider';

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : Constants.expoConfig?.extra?.admobInterstitialUnitId || TestIds.INTERSTITIAL;

export function useInterstitialAd() {
  const { shouldShowAds, isInitialized, canShowInterstitial, setLastInterstitialTime } = useAds();
  const [interstitial, setInterstitial] = useState<InterstitialAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (!shouldShowAds || !isInitialized) return;

    const ad = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setIsLoaded(true);
      console.log('Interstitial ad loaded');
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setIsShowing(false);
      setIsLoaded(false);
      // Reload for next time
      ad.load();
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Interstitial ad error:', error);
      setIsLoaded(false);
    });

    ad.load();
    setInterstitial(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [shouldShowAds, isInitialized]);

  const show = useCallback(async () => {
    if (!shouldShowAds || !canShowInterstitial() || !isLoaded || isShowing || !interstitial) {
      return false;
    }

    try {
      setIsShowing(true);
      await interstitial.show();
      setLastInterstitialTime(Date.now());
      return true;
    } catch (error) {
      console.error('Failed to show interstitial:', error);
      setIsShowing(false);
      return false;
    }
  }, [shouldShowAds, canShowInterstitial, isLoaded, isShowing, interstitial, setLastInterstitialTime]);

  return {
    isLoaded,
    isShowing,
    show,
    canShow: shouldShowAds && isLoaded && !isShowing && canShowInterstitial(),
  };
}
