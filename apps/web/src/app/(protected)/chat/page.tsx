'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateSession, useStandardAnalysis } from '@/hooks';
import { useChatStore, useAuthStore } from '@/stores';
import { ChatInput, ChatMessage } from '@/components/chat';
import { Bot, Sparkles } from 'lucide-react';

export default function NewChatPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { pendingMessages, clearPendingMessages, isSubmitting, setIsSubmitting } = useChatStore();
  const createSession = useCreateSession();
  const standardAnalysis = useStandardAnalysis();

  // 새 채팅 페이지 진입 시 pending messages 초기화
  useEffect(() => {
    clearPendingMessages();
  }, [clearPendingMessages]);

  const handleSubmit = async (content: string, type: 'chat' | 'analysis') => {
    // YouTube 링크가 아닌 경우 세션 생성하지 않음
    if (type !== 'analysis') {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 새 세션 생성
      const session = await createSession.mutateAsync(undefined);

      // 2. 분석 요청
      await standardAnalysis.mutateAsync({
        url: content,
        sessionId: session.id,
      });

      // 3. 새 세션 페이지로 이동
      router.push(`/chat/${session.id}`);
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Empty State */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500">
          <Bot className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          How can I help you today?
        </h1>
        <p className="mb-8 max-w-md text-center text-gray-500">
          Paste a YouTube URL for instant video analysis, or start a
          conversation about any topic.
        </p>

        {/* Quick Actions */}
        <div className="grid max-w-lg gap-3 sm:grid-cols-2">
          <button
            onClick={() => {
              const input = document.querySelector('textarea');
              if (input) {
                input.focus();
                input.placeholder = 'Paste YouTube URL here...';
              }
            }}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100">
              <Sparkles className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Analyze Video</p>
              <p className="text-sm text-gray-500">Paste a YouTube URL</p>
            </div>
          </button>
          <button
            onClick={() => {
              const input = document.querySelector('textarea');
              if (input) {
                input.focus();
                input.placeholder = 'Ask me anything...';
              }
            }}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Bot className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Start Chat</p>
              <p className="text-sm text-gray-500">Ask any question</p>
            </div>
          </button>
        </div>
      </div>

      {/* Pending Messages */}
      {pendingMessages.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
          {pendingMessages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              userName={user?.name || undefined}
              userAvatar={user?.avatarUrl}
            />
          ))}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        placeholder="YouTube URL or message..."
      />
    </div>
  );
}
