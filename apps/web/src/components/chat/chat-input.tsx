'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Loader2, Link } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { determineInputType } from '@glint/validators';

interface ChatInputProps {
  onSubmit: (content: string, type: 'chat' | 'analysis') => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  isLoading,
  disabled,
  placeholder = 'YouTube URL or message...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const inputType = determineInputType(value);
  const isUrl = inputType === 'analysis';

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isLoading || disabled) return;
    onSubmit(value.trim(), inputType);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isLoading, disabled, inputType, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div
        className={cn(
          'flex items-end gap-2 rounded-xl border bg-background px-4 py-3 transition-all',
          isUrl ? 'border-primary ring-2 ring-primary/20' : 'border-input',
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'
        )}
      >
        {isUrl && (
          <div className="flex h-6 items-center">
            <Link className="h-4 w-4 text-primary" />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          rows={1}
          className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading || disabled}
          size="icon-sm"
          variant={isUrl ? 'primary' : 'ghost'}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isUrl && (
        <p className="mt-2 text-xs text-primary">
          YouTube URL detected - Press Enter to analyze
        </p>
      )}
    </div>
  );
}
