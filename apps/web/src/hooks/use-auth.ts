'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Provider } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import type { Profile } from '@glint/types';

// Supabase에서 지원하는 OAuth Provider 타입
export type OAuthProvider = 'google' | 'kakao';

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

export function useUser() {
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      const response = await api.auth.me();
      if (response.success && response.data) {
        setUser(response.data);
        return response.data;
      }
      // Throw error so useQuery sets error state, enabling redirect logic
      setUser(null);
      throw new Error(response.error?.message || 'Not authenticated');
    },
    staleTime: 5 * 60 * 1000, // 5분
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
      router.push('/chat');
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name?: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
      router.push('/chat');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = createClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
  });
}

/**
 * OAuth 로그인 훅 (Google, Kakao)
 * Naver는 Supabase에서 기본 지원하지 않아 별도 OIDC 설정 필요
 */
export function useOAuthLogin() {
  const supabase = createClient();

  return useMutation({
    mutationFn: async (provider: OAuthProvider) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
          } : undefined,
        },
      });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * OAuth 세션 확인 (콜백 후 호출)
 */
export function useOAuthSession() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = createClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
    onSuccess: (session) => {
      if (session) {
        queryClient.invalidateQueries({ queryKey: authKeys.user() });
        router.push('/chat');
      }
    },
  });
}
