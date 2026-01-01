import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Profile } from '@glint/types';
import { ErrorCode, ErrorMessages } from '@glint/types';

export interface UpdateProfileDto {
  name?: string;
  language?: string;
  notificationEmail?: boolean;
  notificationPush?: boolean;
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
