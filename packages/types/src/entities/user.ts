/**
 * 사용자 플랜
 */
export type Plan = 'FREE' | 'LIGHT' | 'PRO' | 'BUSINESS';

/**
 * 사용자 역할
 */
export type UserRole = 'USER' | 'ADMIN';

/**
 * 사용자 프로필
 */
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  plan: Plan;
  credits: number;
  language: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  notificationEmail: boolean;
  notificationPush: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 플랜별 제한
 */
export interface PlanLimits {
  maxDurationMinutes: number;
  dailyAnalysisLimit: number;
  deepModeEnabled: boolean;
  monthlyCredits: number;
  adsEnabled: boolean;
}

/**
 * 플랜별 제한 설정
 */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxDurationMinutes: 10,
    dailyAnalysisLimit: 3,
    deepModeEnabled: false,
    monthlyCredits: 30,
    adsEnabled: true,
  },
  LIGHT: {
    maxDurationMinutes: 30,
    dailyAnalysisLimit: 20,
    deepModeEnabled: false,
    monthlyCredits: 500,
    adsEnabled: false,
  },
  PRO: {
    maxDurationMinutes: 60,
    dailyAnalysisLimit: 50,
    deepModeEnabled: true,
    monthlyCredits: 600,
    adsEnabled: false,
  },
  BUSINESS: {
    maxDurationMinutes: 120,
    dailyAnalysisLimit: 200,
    deepModeEnabled: true,
    monthlyCredits: 2500,
    adsEnabled: false,
  },
};
