'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useChatSession, useSendMessage, useStandardAnalysis } from '@/hooks';
import { useChatStore, useAuthStore } from '@/stores';
import { ChatInput, ChatMessage } from '@/components/chat';
import { LoadingScreen, Spinner } from '@/components/ui';

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.session_id as string;
  const { user } = useAuthStore();
  const { pendingMessages, clearPendingMessages, setCurrentSessionId } = useChatStore();
  const { data: session, isLoading, error } = useChatSession(sessionId);
  const sendMessage = useSendMessage();
  const standardAnalysis = useStandardAnalysis();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 세션 ID 설정
  useEffect(() => {
    setCurrentSessionId(sessionId);
    clearPendingMessages();
    return () => setCurrentSessionId(null);
  }, [sessionId, setCurrentSessionId, clearPendingMessages]);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, pendingMessages]);

  const handleSubmit = async (content: string, type: 'chat' | 'analysis') => {
    try {
      if (type === 'analysis') {
        await standardAnalysis.mutateAsync({
          url: content,
          sessionId,
        });
      } else {
        await sendMessage.mutateAsync({
          sessionId,
          content,
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Session not found</p>
      </div>
    );
  }

  const allMessages = [
    ...(session.messages || []),
    ...pendingMessages.filter((pm) => pm.sessionId === sessionId),
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {allMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-400">Start the conversation...</p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl pb-4">
            {allMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                userName={user?.name || undefined}
                userAvatar={user?.avatarUrl}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mx-auto w-full max-w-3xl">
        <ChatInput
          onSubmit={handleSubmit}
          isLoading={sendMessage.isPending || standardAnalysis.isPending}
          placeholder="YouTube URL or message..."
        />
      </div>
    </div>
  );
}
