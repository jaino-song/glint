import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-provider';
import { LoadingScreen } from '@/components/common';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
