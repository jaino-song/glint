'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { useOAuthLogin, type OAuthProvider } from '@/hooks';
import { AlertCircle } from 'lucide-react';

// OAuth Provider 설정
const providers: { id: OAuthProvider; name: string; icon: React.ReactNode; bgColor: string; textColor: string }[] = [
  {
    id: 'google',
    name: 'Google',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    bgColor: 'bg-white hover:bg-gray-50',
    textColor: 'text-gray-700',
  },
  {
    id: 'kakao',
    name: 'Kakao',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.678l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222v2.222a.472.472 0 1 0 .944 0v-1.552l.478-.46 1.57 2.22a.472.472 0 0 0 .77-.544l-1.704-2.41zm-4.282-1.452a.472.472 0 0 0-.472.472v4.317a.472.472 0 0 0 .944 0v-4.317a.472.472 0 0 0-.472-.472zm-2.08 0c-.26 0-.472.21-.472.472v4.317c0 .26.211.472.472.472h1.993a.472.472 0 0 0 0-.944h-1.52V10.08a.472.472 0 0 0-.473-.472zm-3.29 0a.472.472 0 0 0-.472.472v4.317a.472.472 0 1 0 .944 0v-1.528l1.682 1.88a.472.472 0 1 0 .704-.63l-1.464-1.635 1.306-1.459a.472.472 0 0 0-.704-.63l-1.524 1.702v-1.017a.472.472 0 0 0-.472-.472z"
        />
      </svg>
    ),
    bgColor: 'bg-[#FEE500] hover:bg-[#FDD800]',
    textColor: 'text-[#191919]',
  },
];

interface OAuthButtonsProps {
  mode?: 'login' | 'register';
}

export function OAuthButtons({ mode = 'login' }: OAuthButtonsProps) {
  const oauthLogin = useOAuthLogin();
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setError(null);
    try {
      await oauthLogin.mutateAsync(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} login failed`);
    }
  };

  const actionText = mode === 'login' ? 'Sign in' : 'Sign up';

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {providers.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className={`w-full justify-center gap-3 border-gray-300 ${provider.bgColor} ${provider.textColor}`}
          onClick={() => handleOAuthLogin(provider.id)}
          disabled={oauthLogin.isPending}
        >
          {provider.icon}
          {actionText} with {provider.name}
        </Button>
      ))}

      {/* Naver 지원 안내 */}
      <p className="text-center text-xs text-gray-400">
        Naver login coming soon
      </p>
    </div>
  );
}
