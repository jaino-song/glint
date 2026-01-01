import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Glint',
  slug: 'glint',
  extra: {
    // API
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',

    // Supabase
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

    // AdMob
    admobAndroidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID,
    admobIosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID,
    admobBannerUnitId: process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID,
    admobInterstitialUnitId: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID,
    admobRewardedUnitId: process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID,

    // PostHog
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,

    // EAS
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
});
