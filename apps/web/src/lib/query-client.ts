'use client';

import { QueryClient } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 기본 stale time: 1분
        staleTime: 60 * 1000,
        // 재시도 횟수
        retry: 1,
        // 윈도우 포커스 시 리페치
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // 서버: 항상 새 QueryClient 생성
    return makeQueryClient();
  } else {
    // 브라우저: 싱글톤 사용
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
