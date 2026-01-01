import { z } from 'zod';

/**
 * 이메일 스키마
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email is too short')
  .max(255, 'Email is too long');

/**
 * 비밀번호 스키마
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * 회원가입 스키마
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
});

/**
 * 로그인 스키마
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * 프로필 업데이트 스키마
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  language: z.enum(['ko', 'en', 'ja']).optional(),
  notificationEmail: z.boolean().optional(),
  notificationPush: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
