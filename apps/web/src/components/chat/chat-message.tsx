'use client';

import { cn } from '@/lib/utils';
import { Avatar, Markdown } from '@/components/ui';
import { AnalysisCard } from './analysis-card';
import type { ChatMessage as ChatMessageType } from '@glint/types';
import { Bot } from 'lucide-react';
import { useMemo } from 'react';

interface ChatMessageProps {
  message: ChatMessageType;
  userName?: string;
  userAvatar?: string | null;
}

export function ChatMessage({ message, userName, userAvatar }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAnalysisCard = message.type === 'analysis_card';
  const isError = message.type === 'error';

  // For analysis_card messages, get the ID from analysisRefId or parse from content JSON
  const analysisId = useMemo(() => {
    if (!isAnalysisCard) return null;
    if (message.analysisRefId) return message.analysisRefId;
    // Parse jobId from content JSON for pending jobs
    try {
      const content = JSON.parse(message.content || '{}');
      return content.jobId || null;
    } catch {
      return null;
    }
  }, [isAnalysisCard, message.analysisRefId, message.content]);

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar src={userAvatar} fallback={userName} size="sm" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'max-w-[70%]',
          isUser ? 'flex justify-end' : ''
        )}
      >
        {isAnalysisCard && analysisId ? (
          <AnalysisCard analysisId={analysisId} />
        ) : (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5',
              isUser
                ? 'bg-primary text-primary-foreground'
                : isError
                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                : 'bg-muted text-foreground'
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
            ) : (
              <Markdown
                content={message.content || ''}
                className="text-sm [&_p]:text-foreground [&_li]:text-foreground [&_code]:bg-background/50"
              />
            )}
          </div>
        )}
        <p
          className={cn(
            'mt-1 text-xs text-muted-foreground',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
