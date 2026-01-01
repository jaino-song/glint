import { create } from 'zustand';
import type { ChatSession, ChatMessage } from '@glint/types';

interface ChatState {
  // 현재 세션
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;

  // 로컬 메시지 (스트리밍용)
  pendingMessages: ChatMessage[];
  addPendingMessage: (message: ChatMessage) => void;
  updatePendingMessage: (id: string, content: string) => void;
  clearPendingMessages: () => void;

  // 입력 상태
  inputValue: string;
  setInputValue: (value: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // 현재 세션
  currentSessionId: null,
  setCurrentSessionId: (id) => set({ currentSessionId: id }),

  // 로컬 메시지
  pendingMessages: [],
  addPendingMessage: (message) =>
    set((state) => ({ pendingMessages: [...state.pendingMessages, message] })),
  updatePendingMessage: (id, content) =>
    set((state) => ({
      pendingMessages: state.pendingMessages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    })),
  clearPendingMessages: () => set({ pendingMessages: [] }),

  // 입력 상태
  inputValue: '',
  setInputValue: (value) => set({ inputValue: value }),
  isSubmitting: false,
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
}));
