import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { encrypt, decrypt } from '../../common/utils/crypto';
import { ErrorCode, ErrorMessages } from '@glint/types';
import type { NotionIntegration, NotionStatus, NotionSyncResult } from '@glint/types';

interface NotionOAuthResponse {
  access_token: string;
  bot_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string | null;
}

interface NotionPageCreateResponse {
  id: string;
  url: string;
}

@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name);
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly redirectUri: string | undefined;
  private readonly isConfigured: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.get<string>('NOTION_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('NOTION_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('NOTION_REDIRECT_URI');
    this.isConfigured = !!(this.clientId && this.clientSecret && this.redirectUri);

    if (!this.isConfigured) {
      this.logger.warn('Notion OAuth is not configured. Set NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, and NOTION_REDIRECT_URI to enable.');
    }
  }

  /**
   * Notion 연동이 설정되어 있는지 확인
   */
  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new BadRequestException({
        code: ErrorCode.NOTION_NOT_CONNECTED,
        message: 'Notion integration is not configured on this server',
      });
    }
  }

  /**
   * OAuth 인증 URL 생성
   */
  getAuthUrl(state: string): string {
    this.ensureConfigured();

    const params = new URLSearchParams({
      client_id: this.clientId!,
      redirect_uri: this.redirectUri!,
      response_type: 'code',
      owner: 'user',
      state,
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  }

  /**
   * OAuth 콜백 처리 - 액세스 토큰 교환 및 저장
   */
  async handleCallback(userId: string, code: string): Promise<NotionIntegration> {
    this.ensureConfigured();

    // 토큰 교환
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Notion OAuth token exchange failed: ${error}`);
      throw new BadRequestException({
        code: ErrorCode.NOTION_TOKEN_EXPIRED,
        message: 'Failed to exchange OAuth code for token',
      });
    }

    const tokenData: NotionOAuthResponse = await response.json();

    // 토큰 암호화
    const { encrypted: encryptedToken, iv: tokenIv } = encrypt(tokenData.access_token);

    // 기존 연동 삭제 후 새로 생성 (upsert)
    const integration = await this.prisma.integrationNotion.upsert({
      where: { userId },
      update: {
        encryptedToken,
        tokenIv,
        workspaceId: tokenData.workspace_id,
        workspaceName: tokenData.workspace_name,
        workspaceIcon: tokenData.workspace_icon,
        botId: tokenData.bot_id,
      },
      create: {
        userId,
        encryptedToken,
        tokenIv,
        workspaceId: tokenData.workspace_id,
        workspaceName: tokenData.workspace_name,
        workspaceIcon: tokenData.workspace_icon,
        botId: tokenData.bot_id,
      },
    });

    this.logger.log(`Notion integration created for user ${userId}`);

    return this.mapToIntegration(integration);
  }

  /**
   * 연동 상태 조회
   */
  async getStatus(userId: string): Promise<NotionStatus> {
    const integration = await this.prisma.integrationNotion.findUnique({
      where: { userId },
    });

    if (!integration) {
      return {
        connected: false,
        workspaceName: null,
        workspaceIcon: null,
      };
    }

    return {
      connected: true,
      workspaceName: integration.workspaceName,
      workspaceIcon: integration.workspaceIcon,
    };
  }

  /**
   * 연동 해제
   */
  async disconnect(userId: string): Promise<void> {
    const integration = await this.prisma.integrationNotion.findUnique({
      where: { userId },
    });

    if (!integration) {
      throw new NotFoundException({
        code: ErrorCode.NOTION_NOT_CONNECTED,
        message: ErrorMessages[ErrorCode.NOTION_NOT_CONNECTED],
      });
    }

    // 관련 exports도 함께 삭제
    await this.prisma.$transaction([
      this.prisma.notionExport.deleteMany({ where: { userId } }),
      this.prisma.integrationNotion.delete({ where: { userId } }),
    ]);

    this.logger.log(`Notion integration disconnected for user ${userId}`);
  }

  /**
   * 세션 기반 Notion 내보내기
   * - 세션에 연결된 Notion 페이지가 없으면 새로 생성
   * - 있으면 기존 페이지에 새 분석 내용 추가
   */
  async exportToSession(
    userId: string,
    sessionId: string,
    analysisId: string,
  ): Promise<NotionSyncResult> {
    // 세션 조회
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Chat session not found',
      });
    }

    // Notion 연동 정보 조회
    const integration = await this.getIntegrationWithToken(userId);

    // 분석 결과 조회
    const analysis = await this.prisma.analysisResult.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Analysis result not found',
      });
    }

    // 세션에 이미 연결된 Notion 페이지가 있는지 확인
    if (session.notionPageId && session.notionPageUrl) {
      // 기존 페이지에 새 분석 내용 추가
      await this.appendToNotionPage(
        integration.accessToken,
        session.notionPageId,
        analysis,
      );

      this.logger.log(`Analysis ${analysisId} appended to existing Notion page for session ${sessionId}`);

      return {
        action: 'UPDATED',
        pageUrl: session.notionPageUrl,
      };
    }

    // 새 Notion 페이지 생성
    const pageResponse = await this.createNotionPage(integration.accessToken, analysis);

    // 세션에 Notion 페이지 정보 저장
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        notionPageId: pageResponse.id,
        notionPageUrl: pageResponse.url,
      },
    });

    // NotionExport 기록도 저장 (분석별 추적용)
    await this.prisma.notionExport.upsert({
      where: {
        userId_analysisId: { userId, analysisId },
      },
      update: {
        notionPageId: pageResponse.id,
        notionPageUrl: pageResponse.url,
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        analysisId,
        notionPageId: pageResponse.id,
        notionPageUrl: pageResponse.url,
        lastSyncedAt: new Date(),
        syncVersion: 1,
      },
    });

    this.logger.log(`Analysis ${analysisId} exported to new Notion page for session ${sessionId}`);

    return {
      action: 'CREATED',
      pageUrl: pageResponse.url,
    };
  }

  /**
   * 분석 결과를 Notion 페이지로 내보내기 (레거시 - analysisId 기반)
   */
  async exportAnalysis(userId: string, analysisId: string): Promise<NotionSyncResult> {
    // 기존 export 확인
    const existingExport = await this.prisma.notionExport.findUnique({
      where: {
        userId_analysisId: { userId, analysisId },
      },
    });

    if (existingExport) {
      // 이미 내보낸 경우 동기화로 전환
      return this.syncAnalysis(userId, analysisId);
    }

    // Notion 연동 정보 조회
    const integration = await this.getIntegrationWithToken(userId);

    // 분석 결과 조회
    const analysis = await this.prisma.analysisResult.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Analysis result not found',
      });
    }

    // Notion 페이지 생성
    const pageResponse = await this.createNotionPage(integration.accessToken, analysis);

    // Export 기록 저장
    await this.prisma.notionExport.create({
      data: {
        userId,
        analysisId,
        notionPageId: pageResponse.id,
        notionPageUrl: pageResponse.url,
        lastSyncedAt: new Date(),
        syncVersion: 1,
      },
    });

    this.logger.log(`Analysis ${analysisId} exported to Notion for user ${userId}`);

    return {
      action: 'CREATED',
      pageUrl: pageResponse.url,
    };
  }

  /**
   * 분석 결과 Notion 페이지 동기화 (업데이트)
   */
  async syncAnalysis(userId: string, analysisId: string): Promise<NotionSyncResult> {
    // 기존 export 확인
    const existingExport = await this.prisma.notionExport.findUnique({
      where: {
        userId_analysisId: { userId, analysisId },
      },
    });

    if (!existingExport) {
      // 내보낸 적 없으면 새로 내보내기
      return this.exportAnalysis(userId, analysisId);
    }

    // Notion 연동 정보 조회
    const integration = await this.getIntegrationWithToken(userId);

    // 분석 결과 조회
    const analysis = await this.prisma.analysisResult.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Analysis result not found',
      });
    }

    // Notion 페이지 업데이트
    await this.updateNotionPage(
      integration.accessToken,
      existingExport.notionPageId,
      analysis,
    );

    // Export 기록 업데이트 (Optimistic Lock)
    const updated = await this.prisma.notionExport.updateMany({
      where: {
        id: existingExport.id,
        syncVersion: existingExport.syncVersion,
      },
      data: {
        lastSyncedAt: new Date(),
        syncVersion: existingExport.syncVersion + 1,
      },
    });

    if (updated.count === 0) {
      throw new ConflictException({
        code: ErrorCode.NOTION_SYNC_CONFLICT,
        message: ErrorMessages[ErrorCode.NOTION_SYNC_CONFLICT],
      });
    }

    this.logger.log(`Analysis ${analysisId} synced to Notion for user ${userId}`);

    return {
      action: 'UPDATED',
      pageUrl: existingExport.notionPageUrl || '',
    };
  }

  /**
   * 연동 정보와 복호화된 토큰 조회
   */
  private async getIntegrationWithToken(userId: string): Promise<{
    integration: NotionIntegration;
    accessToken: string;
  }> {
    const integration = await this.prisma.integrationNotion.findUnique({
      where: { userId },
    });

    if (!integration) {
      throw new NotFoundException({
        code: ErrorCode.NOTION_NOT_CONNECTED,
        message: ErrorMessages[ErrorCode.NOTION_NOT_CONNECTED],
      });
    }

    try {
      const accessToken = decrypt(integration.encryptedToken, integration.tokenIv);
      return {
        integration: this.mapToIntegration(integration),
        accessToken,
      };
    } catch (error) {
      this.logger.error(`Failed to decrypt Notion token for user ${userId}`);
      throw new BadRequestException({
        code: ErrorCode.NOTION_TOKEN_EXPIRED,
        message: 'Notion token is invalid. Please reconnect.',
      });
    }
  }

  /**
   * Notion 페이지 생성
   */
  private async createNotionPage(
    accessToken: string,
    analysis: {
      videoTitle: string | null;
      videoUrl: string;
      videoThumbnail: string | null;
      mode: string;
      resultJson: unknown;
      createdAt: Date;
    },
  ): Promise<NotionPageCreateResponse> {
    const resultData = analysis.resultJson as {
      summary?: string;
      keyPoints?: string[];
      timestamps?: { time: string; content: string }[];
    } | null;

    // 페이지 콘텐츠 블록 생성
    const children: unknown[] = [
      // 영상 정보 헤더
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '📹 영상 정보' } }],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: '원본 영상: ' } },
            { type: 'text', text: { content: analysis.videoUrl, link: { url: analysis.videoUrl } } },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: `분석 모드: ${analysis.mode === 'DEEP' ? '🔬 Deep Analysis' : '⚡ Standard'}` } },
          ],
        },
      },
      { object: 'block', type: 'divider', divider: {} },
    ];

    // 요약
    if (resultData?.summary) {
      children.push(
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: '📝 요약' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: resultData.summary } }],
          },
        },
      );
    }

    // 핵심 포인트
    if (resultData?.keyPoints && resultData.keyPoints.length > 0) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '💡 핵심 포인트' } }],
        },
      });

      for (const point of resultData.keyPoints) {
        children.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: point } }],
          },
        });
      }
    }

    // 타임스탬프
    if (resultData?.timestamps && resultData.timestamps.length > 0) {
      children.push(
        { object: 'block', type: 'divider', divider: {} },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: '⏱️ 타임스탬프' } }],
          },
        },
      );

      for (const ts of resultData.timestamps) {
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: `[${ts.time}] `, annotations: { bold: true } } },
              { type: 'text', text: { content: ts.content } },
            ],
          },
        });
      }
    }

    // Glint 워터마크
    children.push(
      { object: 'block', type: 'divider', divider: {} },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: '✨ Analyzed by ' }, annotations: { italic: true, color: 'gray' } },
            { type: 'text', text: { content: 'Glint', link: { url: 'https://glint.app' } }, annotations: { italic: true, color: 'gray' } },
          ],
        },
      },
    );

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { type: 'workspace', workspace: true },
        icon: { type: 'emoji', emoji: '✨' },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: analysis.videoTitle || 'Glint 분석 결과',
                },
              },
            ],
          },
        },
        children,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to create Notion page: ${error}`);
      throw new BadRequestException({
        code: ErrorCode.NOTION_TOKEN_EXPIRED,
        message: 'Failed to create Notion page. Please reconnect.',
      });
    }

    const data = await response.json();
    return { id: data.id, url: data.url };
  }

  /**
   * 기존 Notion 페이지에 새 분석 내용 추가 (append)
   */
  private async appendToNotionPage(
    accessToken: string,
    pageId: string,
    analysis: {
      videoTitle: string | null;
      videoUrl: string;
      videoThumbnail: string | null;
      mode: string;
      resultJson: unknown;
      createdAt: Date;
    },
  ): Promise<void> {
    const resultData = analysis.resultJson as {
      summary?: string;
      keyPoints?: string[];
      timestamps?: { time: string; content: string }[];
    } | null;

    // 추가할 콘텐츠 블록
    const children: unknown[] = [
      // 구분선
      { object: 'block', type: 'divider', divider: {} },
      // 새 영상 헤더
      {
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: `📹 ${analysis.videoTitle || '추가 영상'}` } }],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: '원본 영상: ' } },
            { type: 'text', text: { content: analysis.videoUrl, link: { url: analysis.videoUrl } } },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: `분석 모드: ${analysis.mode === 'DEEP' ? '🔬 Deep Analysis' : '⚡ Standard'}` } },
          ],
        },
      },
    ];

    // 요약 추가
    if (resultData?.summary) {
      children.push(
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: '📝 요약' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: resultData.summary } }],
          },
        },
      );
    }

    // 핵심 포인트 추가
    if (resultData?.keyPoints && resultData.keyPoints.length > 0) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '💡 핵심 포인트' } }],
        },
      });

      for (const point of resultData.keyPoints) {
        children.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: point } }],
          },
        });
      }
    }

    // 타임스탬프 추가
    if (resultData?.timestamps && resultData.timestamps.length > 0) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '⏱️ 타임스탬프' } }],
        },
      });

      for (const ts of resultData.timestamps) {
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: `[${ts.time}] ` }, annotations: { bold: true } },
              { type: 'text', text: { content: ts.content } },
            ],
          },
        });
      }
    }

    // 페이지에 블록 추가 (append)
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ children }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to append to Notion page: ${error}`);
      throw new BadRequestException({
        code: ErrorCode.NOTION_TOKEN_EXPIRED,
        message: 'Failed to update Notion page. Please reconnect.',
      });
    }
  }

  /**
   * Notion 페이지 업데이트
   */
  private async updateNotionPage(
    accessToken: string,
    pageId: string,
    analysis: {
      videoTitle: string | null;
      videoUrl: string;
      resultJson: unknown;
    },
  ): Promise<void> {
    // 먼저 기존 블록 삭제 (첫 100개)
    const blocksResponse = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28',
        },
      },
    );

    if (blocksResponse.ok) {
      const blocksData = await blocksResponse.json();
      // 각 블록 삭제
      for (const block of blocksData.results || []) {
        await fetch(`https://api.notion.com/v1/blocks/${block.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Notion-Version': '2022-06-28',
          },
        });
      }
    }

    // 새 콘텐츠로 페이지 업데이트 (createNotionPage의 children 로직 재사용)
    const resultData = analysis.resultJson as {
      summary?: string;
      keyPoints?: string[];
      timestamps?: { time: string; content: string }[];
    } | null;

    const children: unknown[] = [];

    if (resultData?.summary) {
      children.push(
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: '📝 요약' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: resultData.summary } }],
          },
        },
      );
    }

    if (children.length > 0) {
      await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({ children }),
      });
    }

    // 페이지 제목 업데이트
    await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        properties: {
          title: {
            title: [
              {
                text: {
                  content: `${analysis.videoTitle || 'Glint 분석 결과'} (Updated)`,
                },
              },
            ],
          },
        },
      }),
    });
  }

  private mapToIntegration(prismaIntegration: {
    id: string;
    userId: string;
    workspaceId: string | null;
    workspaceName: string | null;
    workspaceIcon: string | null;
    botId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): NotionIntegration {
    return {
      id: prismaIntegration.id,
      userId: prismaIntegration.userId,
      workspaceId: prismaIntegration.workspaceId,
      workspaceName: prismaIntegration.workspaceName,
      workspaceIcon: prismaIntegration.workspaceIcon,
      botId: prismaIntegration.botId,
      createdAt: prismaIntegration.createdAt.toISOString(),
      updatedAt: prismaIntegration.updatedAt.toISOString(),
    };
  }
}
