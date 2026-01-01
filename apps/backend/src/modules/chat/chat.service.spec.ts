import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockSessionId = '223e4567-e89b-12d3-a456-426614174001';

  const mockSession = {
    id: mockSessionId,
    userId: mockUserId,
    title: 'Test Session',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessage = {
    id: '323e4567-e89b-12d3-a456-426614174002',
    sessionId: mockSessionId,
    role: 'user',
    type: 'text',
    content: 'Hello',
    analysisRefId: null,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    chatSession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listSessions', () => {
    it('should return paginated sessions', async () => {
      mockPrismaService.chatSession.findMany.mockResolvedValue([mockSession]);
      mockPrismaService.chatSession.count.mockResolvedValue(1);

      const result = await service.listSessions(mockUserId);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.hasMore).toBe(false);
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      mockPrismaService.chatSession.create.mockResolvedValue(mockSession);

      const result = await service.createSession(mockUserId, {
        title: 'Test Session',
      });

      expect(result.title).toBe('Test Session');
    });
  });

  describe('getSession', () => {
    it('should return session with messages', async () => {
      mockPrismaService.chatSession.findUnique.mockResolvedValue({
        ...mockSession,
        messages: [mockMessage],
      });

      const result = await service.getSession(mockUserId, mockSessionId);

      expect(result.id).toBe(mockSessionId);
      expect(result.messages).toHaveLength(1);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrismaService.chatSession.findUnique.mockResolvedValue(null);

      await expect(
        service.getSession(mockUserId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when session belongs to another user', async () => {
      mockPrismaService.chatSession.findUnique.mockResolvedValue({
        ...mockSession,
        userId: 'different-user-id',
        messages: [],
      });

      await expect(
        service.getSession(mockUserId, mockSessionId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendMessage', () => {
    it('should create a user message', async () => {
      mockPrismaService.chatSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.chatMessage.create.mockResolvedValue(mockMessage);
      mockPrismaService.chatMessage.count.mockResolvedValue(2);

      const result = await service.sendMessage(mockUserId, mockSessionId, {
        content: 'Hello',
      });

      expect(result.content).toBe('Hello');
      expect(result.role).toBe('user');
    });
  });
});
