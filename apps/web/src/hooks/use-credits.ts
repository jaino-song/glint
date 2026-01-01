'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const creditsKeys = {
  all: ['credits'] as const,
  current: () => [...creditsKeys.all, 'current'] as const,
};

export function useCredits() {
  return useQuery({
    queryKey: creditsKeys.current(),
    queryFn: async () => {
      const response = await api.credits.get();
      if (response.success && response.data) {
        return response.data;
      }
      return { credits: 0, plan: 'FREE' };
    },
    staleTime: 60 * 1000, // 1분
  });
}
