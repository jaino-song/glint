import { useEffect, useState, useCallback } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { useAds } from '@/components/ads/AdProvider';
import type { AdReward } from '@glint/types';

const adUnitId = __DEV__
  ? TestIds.REWARDED
  : Constants.expoConfig?.extra?.admobRewardedUnitId || TestIds.REWARDED;

interface UseRewardedAdOptions {
  onRewarded?: (reward: AdReward) => void;
  onDismissed?: () => void;
  onError?: (error: Error) => void;
}

export function useRewardedAd(options: UseRewardedAdOptions = {}) {
  const { onRewarded, onDismissed, onError } = options;
  const { shouldShowAds, isInitialized } = useAds();
  const [rewarded, setRewarded] = useState<RewardedAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (!shouldShowAds || !isInitialized) return;

    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setIsLoaded(true);
        console.log('Rewarded ad loaded');
      }
    );

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('User earned reward:', reward);
        const adReward: AdReward = {
          type: reward.type,
          amount: reward.amount,
        };
        onRewarded?.(adReward);
      }
    );

    const unsubscribeClosed = ad.addAdEventListener('closed', () => {
      setIsShowing(false);
      setIsLoaded(false);
      onDismissed?.();
      // Reload for next time
      ad.load();
    });

    ad.load();
    setRewarded(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
    };
  }, [shouldShowAds, isInitialized, onRewarded, onDismissed]);

  const show = useCallback(async () => {
    if (!isLoaded || isShowing || !rewarded) {
      return false;
    }

    try {
      setIsShowing(true);
      await rewarded.show();
      return true;
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      setIsShowing(false);
      onError?.(error as Error);
      return false;
    }
  }, [isLoaded, isShowing, rewarded, onError]);

  return {
    isLoaded,
    isShowing,
    show,
    canShow: isLoaded && !isShowing,
  };
}
