/**
 * Notion 연동 정보
 */
export interface NotionIntegration {
  id: string;
  userId: string;
  workspaceId: string | null;
  workspaceName: string | null;
  workspaceIcon: string | null;
  botId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Notion 내보내기 정보
 */
export interface NotionExport {
  id: string;
  userId: string;
  analysisId: string;
  notionPageId: string;
  notionPageUrl: string | null;
  lastSyncedAt: string | null;
  syncVersion: number;
  createdAt: string;
}

/**
 * Notion 연동 상태
 */
export interface NotionStatus {
  connected: boolean;
  workspaceName: string | null;
  workspaceIcon: string | null;
}

/**
 * Notion 동기화 결과
 */
export interface NotionSyncResult {
  action: 'CREATED' | 'UPDATED';
  pageUrl: string;
}
