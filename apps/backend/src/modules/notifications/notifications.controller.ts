import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  NotificationsService,
  Notification,
  PaginatedNotifications,
  RegisterPushTokenDto,
} from './notifications.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async listNotifications(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ): Promise<PaginatedNotifications> {
    return this.notificationsService.listNotifications(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      unreadOnly === 'true',
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @CurrentUserId() userId: string,
    @Param('id') notificationId: string,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(
    @CurrentUserId() userId: string,
  ): Promise<{ count: number }> {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('push-token')
  @ApiOperation({ summary: 'Register push notification token' })
  async registerPushToken(
    @CurrentUserId() userId: string,
    @Body() data: RegisterPushTokenDto,
  ): Promise<{ registered: boolean }> {
    return this.notificationsService.registerPushToken(userId, data);
  }

  @Delete('push-token/:token')
  @ApiOperation({ summary: 'Unregister push notification token' })
  async unregisterPushToken(
    @CurrentUserId() userId: string,
    @Param('token') token: string,
  ): Promise<{ unregistered: boolean }> {
    return this.notificationsService.unregisterPushToken(userId, token);
  }
}
