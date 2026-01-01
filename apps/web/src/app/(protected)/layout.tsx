'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore, useUIStore } from '@/stores';
import { useUser, useCredits } from '@/hooks';
import { ChatSidebar } from '@/components/chat';
import { Button, Badge } from '@/components/ui';
import { Menu, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

// 인라인 로딩 화면 - hydration mismatch 방지를 위해 직접 정의
function InlineLoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { user, isLoading } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { isLoading: userLoading, error } = useUser();
  const { data: credits } = useCredits();
  const hasRedirected = useRef(false);

  // 마운트 후에만 조건부 렌더링 수행 (hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !userLoading && !user && error && !hasRedirected.current) {
      hasRedirected.current = true;
      window.location.href = '/login';
    }
  }, [mounted, user, userLoading, error]);

  // 서버와 클라이언트 모두 동일하게 로딩 화면 렌더링
  if (!mounted || isLoading || userLoading) {
    return <InlineLoadingScreen message="Loading..." />;
  }

  if (!user) {
    return <InlineLoadingScreen message="Redirecting..." />;
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Backdrop - closes sidebar when clicked */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - overlay mode */}
      <div
        className={cn(
          'fixed left-0 top-0 z-30 h-full transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ChatSidebar />
      </div>

      {/* Main Content - full width, not affected by sidebar */}
      <div className="flex h-full flex-col">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span className="text-lg font-bold text-gray-900">Glint</span>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {credits?.credits ?? user.credits} credits
            </Badge>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
