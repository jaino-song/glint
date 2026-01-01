'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquarePlus,
  MessageSquare,
  Library,
  Settings,
  ChevronLeft,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Avatar, Spinner } from '@/components/ui';
import { useChatSessions, useDeleteSession, useCreateSession } from '@/hooks';
import { useUIStore, useAuthStore } from '@/stores';
import { groupByDate } from '@/lib/utils';

export function ChatSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const { data: sessions, isLoading } = useChatSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const groupedSessions = sessions ? groupByDate(
    sessions.map(s => ({ ...s, createdAt: s.createdAt }))
  ) : [];

  const handleNewChat = () => {
    createSession.mutate(undefined);
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm('Delete this conversation?')) {
      deleteSession.mutate(id);
    }
    setMenuOpenId(null);
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <h1 className="text-lg font-bold text-sidebar-foreground">Glint</h1>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-sidebar-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={handleNewChat}
          isLoading={createSession.isPending}
          className="w-full justify-start bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
          leftIcon={<MessageSquarePlus className="h-4 w-4" />}
        >
          New Chat
        </Button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-thin">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : groupedSessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No conversations yet
          </p>
        ) : (
          groupedSessions.map((group) => (
            <div key={group.label} className="mb-4">
              <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground uppercase">
                {group.label}
              </h3>
              <ul className="space-y-1">
                {group.items.map((session) => {
                  const isActive = pathname === `/chat/${session.id}`;
                  return (
                    <li key={session.id} className="relative">
                      <Link
                        href={`/chat/${session.id}`}
                        className={cn(
                          'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-accent'
                        )}
                      >
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 truncate">
                          {session.title || 'Untitled'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setMenuOpenId(menuOpenId === session.id ? null : session.id);
                          }}
                          className="invisible rounded p-1 text-muted-foreground hover:bg-accent group-hover:visible"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      {/* Dropdown Menu */}
                      {menuOpenId === session.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-border bg-popover py-1 shadow-lg animate-scale-in">
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Navigation */}
      <nav className="border-t border-sidebar-border p-3">
        <ul className="space-y-1">
          <li>
            <Link
              href="/library"
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === '/library'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-accent'
              )}
            >
              <Library className="h-4 w-4" />
              Library
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === '/settings'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-accent'
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      {/* User */}
      {user && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar
              src={user.avatarUrl}
              fallback={user.name || user.email}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.name || 'User'}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
