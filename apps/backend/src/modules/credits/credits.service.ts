import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditTransaction, ErrorCode, ErrorMessages } from '@glint/types';

export interface CreditBalance {
  balance: number;
  plan: string;
}

export interface PaginatedTransactions {
  data: CreditTransaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string): Promise<CreditBalance> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { credits: true, plan: true },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: ErrorMessages[ErrorCode.NOT_FOUND],
      });
    }

    return {
      balance: profile.credits,
      plan: profile.plan,
    };
  }

  async getTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedTransactions> {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.creditTransaction.count({ where: { userId } }),
    ]);

    return {
      data: transactions.map(this.mapToTransaction),
      meta: {
        page,
        limit,
        total,
        hasMore: skip + transactions.length < total,
      },
    };
  }

  async deductCredits(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<{ success: boolean; newBalance: number }> {
    const result = await this.prisma.$queryRaw<
      Array<{ success: boolean; new_balance: number; message: string }>
    >`
      SELECT * FROM deduct_credits(
        ${userId}::uuid,
        ${amount},
        ${description},
        ${referenceId ? referenceId : null}::uuid,
        ${referenceType || null}
      )
    `;

    if (result.length === 0 || !result[0].success) {
      return { success: false, newBalance: result[0]?.new_balance || 0 };
    }

    return { success: true, newBalance: result[0].new_balance };
  }

  async refundCredits(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
  ): Promise<number> {
    const result = await this.prisma.$queryRaw<Array<{ refund_credits: number }>>`
      SELECT refund_credits(
        ${userId}::uuid,
        ${amount},
        ${description},
        ${referenceId || null}::uuid
      )
    `;

    return result[0].refund_credits;
  }

  async addBonusCredits(
    userId: string,
    amount: number,
    description: string,
  ): Promise<CreditTransaction> {
    // Get current balance
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: ErrorMessages[ErrorCode.NOT_FOUND],
      });
    }

    const newBalance = profile.credits + amount;

    // Update balance and create transaction
    const [, transaction] = await this.prisma.$transaction([
      this.prisma.profile.update({
        where: { id: userId },
        data: { credits: newBalance },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          amount,
          type: 'BONUS',
          description,
          balanceAfter: newBalance,
        },
      }),
    ]);

    return this.mapToTransaction(transaction);
  }

  private mapToTransaction(transaction: {
    id: string;
    userId: string;
    amount: number;
    type: string;
    description: string | null;
    referenceId: string | null;
    referenceType: string | null;
    balanceAfter: number;
    createdAt: Date;
  }): CreditTransaction {
    return {
      id: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount,
      type: transaction.type as
        | 'CHARGE'
        | 'USE'
        | 'REFUND'
        | 'EXPIRE'
        | 'BONUS'
        | 'REWARD',
      description: transaction.description,
      referenceId: transaction.referenceId,
      referenceType: transaction.referenceType,
      balanceAfter: transaction.balanceAfter,
      createdAt: transaction.createdAt.toISOString(),
    };
  }
}
