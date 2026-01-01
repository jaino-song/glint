import { Injectable, NotFoundException, ForbiddenException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatSession, ChatMessage, ErrorCode, ErrorMessages } from '@glint/types';
import { GeminiChatService } from './gemini-chat.service';

export interface CreateSessionDto {
  title?: string;
}

export interface UpdateSessionDto {
  title: string;
}

export interface SendMessageDto {
  content: string;
}

export interface SessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

export interface PaginatedSessions {
  data: ChatSession[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private geminiChatService: GeminiChatService,
  ) {}

  async listSessions(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedSessions> {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.chatSession.count({ where: { userId } }),
    ]);

    return {
      data: sessions.map(this.mapToSession),
      meta: {
        page,
        limit,
        total,
        hasMore: skip + sessions.length < total,
      },
    };
  }

  async createSession(userId: string, data: CreateSessionDto): Promise<ChatSession> {
    const session = await this.prisma.chatSession.create({
      data: {
        userId,
        title: data.title || null,
      },
    });

    return this.mapToSession(session);
  }

  async getSession(userId: string, sessionId: string): Promise<SessionWithMessages> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Session not found',
      });
    }

    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_UNAUTHORIZED,
        message: ErrorMessages[ErrorCode.AUTH_UNAUTHORIZED],
      });
    }

    return {
      ...this.mapToSession(session),
      messages: session.messages.map(this.mapToMessage),
    };
  }

  async updateSession(
    userId: string,
    sessionId: string,
    data: UpdateSessionDto,
  ): Promise<ChatSession> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Session not found',
      });
    }

    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_UNAUTHORIZED,
        message: ErrorMessages[ErrorCode.AUTH_UNAUTHORIZED],
      });
    }

    const updated = await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: data.title },
    });

    return this.mapToSession(updated);
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Session not found',
      });
    }

    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_UNAUTHORIZED,
        message: ErrorMessages[ErrorCode.AUTH_UNAUTHORIZED],
      });
    }

    await this.prisma.chatSession.delete({
      where: { id: sessionId },
    });
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    data: SendMessageDto,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Session not found',
      });
    }

    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_UNAUTHORIZED,
        message: ErrorMessages[ErrorCode.AUTH_UNAUTHORIZED],
      });
    }

    // Create user message
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        type: 'text',
        content: data.content,
      },
    });

    // Update session title if first message
    const messageCount = await this.prisma.chatMessage.count({
      where: { sessionId },
    });

    if (messageCount === 1 && !session.title) {
      const title = data.content.slice(0, 50) + (data.content.length > 50 ? '...' : '');
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title },
      });
    }

    // Generate AI response
    let assistantContent: string;
    try {
      assistantContent = await this.geminiChatService.generateResponse(
        sessionId,
        data.content,
      );
    } catch (error) {
      this.logger.error(`Failed to generate AI response: ${error}`);
      assistantContent = '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }

    // Save assistant message
    const assistantMessage = await this.addAssistantMessage(
      sessionId,
      assistantContent,
      'text',
    );

    return {
      userMessage: this.mapToMessage(userMessage),
      assistantMessage,
    };
  }

  async addAssistantMessage(
    sessionId: string,
    content: string,
    type: 'text' | 'analysis_card' | 'error' = 'text',
    analysisRefId?: string,
  ): Promise<ChatMessage> {
    const message = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        type,
        content,
        analysisRefId,
      },
    });

    return this.mapToMessage(message);
  }

  private mapToSession(session: {
    id: string;
    userId: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ChatSession {
    return {
      id: session.id,
      userId: session.userId,
      title: session.title,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private mapToMessage(message: {
    id: string;
    sessionId: string;
    role: string;
    type: string;
    content: string | null;
    analysisRefId: string | null;
    createdAt: Date;
  }): ChatMessage {
    return {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role as 'user' | 'assistant' | 'system',
      type: message.type as 'text' | 'analysis_card' | 'error',
      content: message.content,
      analysisRefId: message.analysisRefId,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
