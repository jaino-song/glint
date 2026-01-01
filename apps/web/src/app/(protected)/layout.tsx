'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/stores';
import { useUser, useCredits } from '@/hooks';
import { ChatSidebar } from '@/components/chat';
import { LoadingScreen, Button, Badge } from '@/components/ui';
import { Menu, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { isLoading: userLoading, error } = useUser();
  const { data: credits } = useCredits();

  useEffect(() => {
    if (!userLoading && !user && error) {
      router.push('/login');
    }
  }, [user, userLoading, error, router]);

  if (isLoading || userLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!user) {
    return <LoadingScreen message="Redirecting..." />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleSidebar}
                className="text-gray-500"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            {!sidebarOpen && (
              <span className="text-lg font-bold text-gray-900">Glint</span>
            )}
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
