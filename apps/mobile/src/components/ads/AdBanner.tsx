import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { useAds } from './AdProvider';

interface AdBannerProps {
  size?: BannerAdSize;
  style?: ViewStyle;
}

export function AdBanner({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  style,
}: AdBannerProps) {
  const { shouldShowAds, isInitialized } = useAds();

  if (!shouldShowAds || !isInitialized) {
    return null;
  }

  const adUnitId = __DEV__
    ? TestIds.BANNER
    : Constants.expoConfig?.extra?.admobBannerUnitId || TestIds.BANNER;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded');
        }}
        onAdFailedToLoad={(error) => {
          console.error('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
});
