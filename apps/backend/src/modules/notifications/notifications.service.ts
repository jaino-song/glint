import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCode, ErrorMessages } from '@glint/types';

export interface Notification {
  id: string;
  userId: string;
  type: 'ANALYSIS_COMPLETE' | 'CREDIT_LOW' | 'SUBSCRIPTION' | 'SYSTEM';
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  sentAt: string | null;
  channel: 'PUSH' | 'EMAIL' | 'IN_APP' | null;
  createdAt: string;
}

export interface PaginatedNotifications {
  data: Notification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    unreadCount: number;
  };
}

export interface RegisterPushTokenDto {
  token: string;
  platform: 'ios' | 'android';
  deviceId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async listNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ): Promise<PaginatedNotifications> {
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly && { readAt: null }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return {
      data: notifications.map(this.mapToNotification),
      meta: {
        page,
        limit,
        total,
        hasMore: skip + notifications.length < total,
        unreadCount,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Notification not found',
      });
    }

    if (notification.userId !== userId) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Notification not found',
      });
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return this.mapToNotification(updated);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { count: result.count };
  }

  async registerPushToken(
    userId: string,
    data: RegisterPushTokenDto,
  ): Promise<{ registered: boolean }> {
    await this.prisma.pushToken.upsert({
      where: {
        userId_token: {
          userId,
          token: data.token,
        },
      },
      update: {
        platform: data.platform,
        deviceId: data.deviceId,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token: data.token,
        platform: data.platform,
        deviceId: data.deviceId,
      },
    });

    return { registered: true };
  }

  async unregisterPushToken(userId: string, token: string): Promise<{ unregistered: boolean }> {
    await this.prisma.pushToken.deleteMany({
      where: {
        userId,
        token,
      },
    });

    return { unregistered: true };
  }

  async createNotification(data: {
    userId: string;
    type: Notification['type'];
    title: string;
    body: string;
    data?: Record<string, unknown>;
    channel?: Notification['channel'];
  }): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data
          ? (data.data as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        channel: data.channel || 'IN_APP',
      },
    });

    return this.mapToNotification(notification);
  }

  private mapToNotification(notification: {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    data: unknown;
    readAt: Date | null;
    sentAt: Date | null;
    channel: string | null;
    createdAt: Date;
  }): Notification {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as Notification['type'],
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, unknown> | null,
      readAt: notification.readAt?.toISOString() || null,
      sentAt: notification.sentAt?.toISOString() || null,
      channel: notification.channel as Notification['channel'],
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
