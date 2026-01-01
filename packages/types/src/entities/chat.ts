/**
 * 채팅 메시지 역할
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 채팅 메시지 타입
 */
export type MessageType = 'text' | 'analysis_card' | 'error';

/**
 * 채팅 세션
 */
export interface ChatSession {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 채팅 메시지
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  type: MessageType;
  content: string | null;
  analysisRefId: string | null;
  createdAt: string;
}

/**
 * 세션 그룹 (오늘, 어제, 지난 7일 등)
 */
export interface SessionGroup {
  label: string;
  sessions: ChatSession[];
}
