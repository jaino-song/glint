import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { AdProvider } from '@/components/ads';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };

    const timer = setTimeout(hideSplash, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="chat/[session_id]"
              options={{
                presentation: 'card',
                headerShown: true,
                headerTitle: 'Chat',
                headerBackTitle: 'Back',
              }}
            />
          </Stack>
        </AdProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
