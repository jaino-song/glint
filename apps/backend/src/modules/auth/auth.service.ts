import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Profile } from '@glint/types';
import { ErrorCode, ErrorMessages } from '@glint/types';

export interface UpdateProfileDto {
  name?: string;
  language?: string;
  notificationEmail?: boolean;
  notificationPush?: boolean;
}

export interface CreateProfileDto {
  id: string;
  email: string;
  name?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 프로필 조회 (없으면 NotFoundException)
   */
  async getProfile(userId: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: ErrorMessages[ErrorCode.NOT_FOUND],
      });
    }

    return this.mapToProfile(profile);
  }

  /**
   * 프로필이 존재하면 조회, 없으면 생성 (Supabase 트리거 실패 대비 fallback)
   * Supabase Auth 트리거가 실패했을 때 프로필을 생성해주는 안전장치
   */
  async ensureProfile(userData: CreateProfileDto): Promise<Profile> {
    try {
      // 먼저 기존 프로필 조회 시도
      const existingProfile = await this.prisma.profile.findUnique({
        where: { id: userData.id },
      });

      if (existingProfile) {
        this.logger.debug(`Profile found for user ${userData.id}`);
        return this.mapToProfile(existingProfile);
      }

      // 프로필이 없으면 생성 (Supabase 트리거 실패 fallback)
      this.logger.warn(
        `Profile not found for user ${userData.id}, creating fallback profile. ` +
          `This indicates the Supabase auth trigger may have failed.`,
      );

      const newProfile = await this.prisma.profile.create({
        data: {
          id: userData.id,
          email: userData.email,
          name: userData.name || null,
          role: 'USER',
          plan: 'FREE',
          credits: 30,
          language: 'ko',
          onboardingCompleted: false,
          onboardingStep: 0,
          notificationEmail: true,
          notificationPush: true,
        },
      });

      this.logger.log(`Created fallback profile for user ${userData.id}`);
      return this.mapToProfile(newProfile);
    } catch (error) {
      // 유니크 제약 조건 에러 (race condition으로 다른 요청이 이미 생성한 경우)
      // P2002: Unique constraint violation
      if ((error as any).code === 'P2002') {
        this.logger.debug(`Profile already created by concurrent request for user ${userData.id}`);
        const profile = await this.prisma.profile.findUnique({
          where: { id: userData.id },
        });

        if (profile) {
          return this.mapToProfile(profile);
        }
      }

      // 다른 에러는 로그 출력 후 재throw
      this.logger.error(
        `Failed to ensure profile for user ${userData.id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<Profile> {
    const profile = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.notificationEmail !== undefined && { notificationEmail: data.notificationEmail }),
        ...(data.notificationPush !== undefined && { notificationPush: data.notificationPush }),
      },
    });

    return this.mapToProfile(profile);
  }

  async completeOnboarding(userId: string): Promise<Profile> {
    const profile = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
      },
    });

    return this.mapToProfile(profile);
  }

  async updateOnboardingStep(userId: string, step: number): Promise<Profile> {
    const profile = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        onboardingStep: step,
      },
    });

    return this.mapToProfile(profile);
  }

  private mapToProfile(prismaProfile: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
    plan: string;
    credits: number;
    language: string;
    onboardingCompleted: boolean;
    onboardingStep: number;
    notificationEmail: boolean;
    notificationPush: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Profile {
    return {
      id: prismaProfile.id,
      email: prismaProfile.email,
      name: prismaProfile.name,
      avatarUrl: prismaProfile.avatarUrl,
      role: prismaProfile.role as 'USER' | 'ADMIN',
      plan: prismaProfile.plan as 'FREE' | 'LIGHT' | 'PRO' | 'BUSINESS',
      credits: prismaProfile.credits,
      language: prismaProfile.language,
      onboardingCompleted: prismaProfile.onboardingCompleted,
      onboardingStep: prismaProfile.onboardingStep,
      notificationEmail: prismaProfile.notificationEmail,
      notificationPush: prismaProfile.notificationPush,
      createdAt: prismaProfile.createdAt.toISOString(),
      updatedAt: prismaProfile.updatedAt.toISOString(),
    };
  }
}
