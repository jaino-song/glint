'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useLogout, useNotionStatus, useNotionConnect, useNotionDisconnect } from '@/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Avatar,
  Badge,
} from '@/components/ui';
import { User, Globe, Bell, CreditCard, LogOut, Link2, Unlink, CheckCircle2, AlertCircle } from 'lucide-react';

// Notion 아이콘 (공식 로고 스타일)
function NotionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 2.282c-.42-.326-.98-.7-2.055-.607L3.01 2.867c-.466.046-.56.28-.374.466l1.823 1.875zm.792 3.6v13.404c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.933-.56.933-1.166V6.854c0-.606-.233-.933-.747-.886l-15.177.886c-.56.047-.746.327-.746.886v.068zm14.337.746c.093.42 0 .84-.42.888l-.7.14v9.89c-.608.327-1.167.514-1.634.514-.747 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.447.327s0 .84-1.167.84l-3.22.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.47 9.714c-.094-.42.14-1.027.793-1.073l3.453-.233 4.764 7.28v-6.44l-1.213-.14c-.094-.513.28-.886.746-.933l3.573-.233zm-16.49-5.6L16.96.95c1.353-.112 1.727-.037 2.593.606l3.547 2.471c.84.606.7 1.353 0 1.353l-14.197.84c-1.353.093-2.053-.28-2.66-.84L4.52 3.8c-.28-.21-.047-.327.047-.373.187-.094.374-.14.56-.14l-.047.047z"/>
    </svg>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const logout = useLogout();

  // Notion 훅들
  const { data: notionStatus, isLoading: isNotionLoading, refetch: refetchNotionStatus } = useNotionStatus();
  const notionConnect = useNotionConnect();
  const notionDisconnect = useNotionDisconnect();

  // OAuth 콜백 결과 표시
  const [notionMessage, setNotionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const connected = searchParams.get('notion_connected');
    const error = searchParams.get('notion_error');

    if (connected === 'true') {
      setNotionMessage({ type: 'success', text: 'Notion 연동이 완료되었습니다!' });
      refetchNotionStatus();
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/settings');
    } else if (error) {
      setNotionMessage({ type: 'error', text: `Notion 연동 실패: ${error}` });
      window.history.replaceState({}, '', '/settings');
    }

    // 5초 후 메시지 자동 제거
    if (connected || error) {
      const timer = setTimeout(() => setNotionMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, refetchNotionStatus]);

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your account preferences</p>
        </div>

        {/* Notion 연동 상태 메시지 */}
        {notionMessage && (
          <div
            className={`flex items-center gap-2 rounded-lg p-4 ${
              notionMessage.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {notionMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {notionMessage.text}
          </div>
        )}

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={user.avatarUrl}
                fallback={user.name || user.email}
                size="lg"
              />
              <div>
                <p className="font-medium text-foreground">
                  {user.name || 'No name set'}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={user.plan === 'FREE' ? 'default' : 'primary'}>
                {user.plan} Plan
              </Badge>
              <Badge variant="secondary">{user.credits} credits</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notion Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotionIcon className="h-5 w-5" />
              Notion Integration
            </CardTitle>
            <CardDescription>
              분석 결과를 Notion에 자동으로 저장하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isNotionLoading ? (
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-muted-foreground/20" />
                  ) : notionStatus?.connected ? (
                    <>
                      {notionStatus.workspaceIcon ? (
                        <img
                          src={notionStatus.workspaceIcon}
                          alt="Workspace"
                          className="h-10 w-10 rounded-lg"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/10">
                          <NotionIcon className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {notionStatus.workspaceName || 'Notion Workspace'}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          연결됨
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted-foreground/10">
                        <NotionIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Notion 연동하기
                        </p>
                        <p className="text-sm text-muted-foreground">
                          분석 결과를 Notion 페이지로 내보내기
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {notionStatus?.connected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => notionDisconnect.mutate()}
                    isLoading={notionDisconnect.isPending}
                    leftIcon={<Unlink className="h-4 w-4" />}
                  >
                    연결 해제
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => notionConnect.mutate()}
                    isLoading={notionConnect.isPending}
                    leftIcon={<Link2 className="h-4 w-4" />}
                  >
                    연결하기
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>Manage your plan and billing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{user.plan} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {user.plan === 'FREE'
                      ? '30 credits/day'
                      : `${user.credits} credits remaining`}
                  </p>
                </div>
                {user.plan === 'FREE' && (
                  <Button size="sm">Upgrade</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language
            </CardTitle>
            <CardDescription>Choose your preferred language</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              defaultValue={user.language}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ko">Korean</option>
              <option value="en">English</option>
              <option value="ja">Japanese</option>
            </select>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked={user.notificationEmail}
                className="h-4 w-4 rounded border-input text-primary accent-primary focus:ring-ring"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Push notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked={user.notificationPush}
                className="h-4 w-4 rounded border-input text-primary accent-primary focus:ring-ring"
              />
            </label>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="py-4">
            <Button
              variant="destructive"
              onClick={() => logout.mutate()}
              isLoading={logout.isPending}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
