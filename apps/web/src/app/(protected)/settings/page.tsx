'use client';

import { useAuthStore } from '@/stores';
import { useLogout } from '@/hooks';
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
import { User, Mail, Globe, Bell, CreditCard, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const logout = useLogout();

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your account preferences</p>
        </div>

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
