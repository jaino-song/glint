import { Plan } from './user';

/**
 * 결제 제공자
 */
export type PaymentProvider = 'STRIPE' | 'TOSS';

/**
 * 구독 상태
 */
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'EXPIRED';

/**
 * 구독 정보
 */
export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  provider: PaymentProvider | null;
  customerId: string | null;
  subscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 크레딧 트랜잭션 타입
 */
export type CreditTransactionType = 'CHARGE' | 'USE' | 'REFUND' | 'EXPIRE' | 'BONUS' | 'REWARD';

/**
 * 크레딧 트랜잭션
 */
export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: CreditTransactionType;
  description: string | null;
  referenceId: string | null;
  referenceType: string | null;
  balanceAfter: number;
  createdAt: string;
}

/**
 * 플랜별 가격 (USD)
 */
export const PLAN_PRICES: Record<Exclude<Plan, 'FREE'>, number> = {
  LIGHT: 6.9,
  PRO: 14.9,
  BUSINESS: 49.9,
};
