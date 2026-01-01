'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores';
import { useUser } from '@/hooks';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, clearAuth } = useAuthStore();
  const supabase = createClient();

  // 초기 사용자 로드
  useUser();

  useEffect(() => {
    // Auth 상태 변화 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        clearAuth();
      } else if (event === 'SIGNED_IN' && session?.user) {
        // 프로필 가져오기는 useUser hook에서 처리
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setLoading, clearAuth]);

  return <>{children}</>;
}
