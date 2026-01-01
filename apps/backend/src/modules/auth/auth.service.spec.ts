import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockProfile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    role: 'USER',
    plan: 'FREE',
    credits: 30,
    language: 'ko',
    onboardingCompleted: false,
    onboardingStep: 0,
    notificationEmail: true,
    notificationPush: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return a profile when found', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile(mockProfile.id);

      expect(result).toEqual({
        id: mockProfile.id,
        email: mockProfile.email,
        name: mockProfile.name,
        avatarUrl: mockProfile.avatarUrl,
        role: mockProfile.role,
        plan: mockProfile.plan,
        credits: mockProfile.credits,
        language: mockProfile.language,
        onboardingCompleted: mockProfile.onboardingCompleted,
        onboardingStep: mockProfile.onboardingStep,
        notificationEmail: mockProfile.notificationEmail,
        notificationPush: mockProfile.notificationPush,
        createdAt: mockProfile.createdAt.toISOString(),
        updatedAt: mockProfile.updatedAt.toISOString(),
      });
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update and return the profile', async () => {
      const updatedProfile = { ...mockProfile, name: 'Updated Name' };
      mockPrismaService.profile.update.mockResolvedValue(updatedProfile);

      const result = await service.updateProfile(mockProfile.id, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(mockPrismaService.profile.update).toHaveBeenCalledWith({
        where: { id: mockProfile.id },
        data: { name: 'Updated Name' },
      });
    });
  });
});
