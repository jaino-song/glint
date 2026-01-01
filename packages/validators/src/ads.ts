import { z } from 'zod';

/**
 * 플랫폼 스키마
 */
export const adPlatformSchema = z.enum(['web', 'ios', 'android']);

/**
 * 광고 이벤트 타입 스키마
 */
export const adEventTypeSchema = z.enum(['loaded', 'impression', 'clicked', 'failed', 'rewarded']);

/**
 * 광고 리워드 스키마
 */
export const adRewardSchema = z.object({
  type: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Invalid reward type format'),
  amount: z.number().int().min(0).max(1000),
});

/**
 * 광고 이벤트 스키마
 */
export const adEventSchema = z.object({
  type: adEventTypeSchema,
  platform: adPlatformSchema,
  placementId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_]{1,100}$/, 'Invalid placementId format'),
  unitId: z.string().max(100).regex(/^[a-zA-Z0-9-_/]{1,100}$/, 'Invalid unitId format').optional(),
  errorMessage: z.string().max(500).optional(),
  reward: adRewardSchema.optional(),
});

/**
 * 광고 설정 조회 스키마
 */
export const adConfigQuerySchema = z.object({
  platform: adPlatformSchema,
});

export type AdEventInput = z.infer<typeof adEventSchema>;
export type AdConfigQuery = z.infer<typeof adConfigQuerySchema>;
