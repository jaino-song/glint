import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotionService } from './notion.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@glint/types';
import type { NotionStatus, NotionSyncResult } from '@glint/types';
import * as crypto from 'crypto';

// State 저장을 위한 임시 메모리 스토어 (프로덕션에서는 Redis 사용 권장)
const stateStore = new Map<string, { userId: string; expiresAt: number }>();

@ApiTags('Notion')
@Controller('api/v1/notion')
export class NotionController {
  private readonly appUrl: string;

  constructor(
    private readonly notionService: NotionService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
  }

  @Get('auth')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Notion OAuth authorization URL' })
  getAuthUrl(@CurrentUserId() userId: string): { authUrl: string } {
    // CSRF 방지를 위한 state 생성
    const state = crypto.randomBytes(32).toString('hex');

    // State 저장 (5분 유효)
    stateStore.set(state, {
      userId,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    const authUrl = this.notionService.getAuthUrl(state);
    return { authUrl };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Notion OAuth callback' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ): Promise<void> {
    const redirectBase = `${this.appUrl}/settings`;

    // 에러 처리
    if (error) {
      res.redirect(`${redirectBase}?notion_error=${encodeURIComponent(error)}`);
      return;
    }

    // State 검증
    const stateData = stateStore.get(state);
    if (!stateData) {
      res.redirect(`${redirectBase}?notion_error=invalid_state`);
      return;
    }

    // 만료 체크
    if (Date.now() > stateData.expiresAt) {
      stateStore.delete(state);
      res.redirect(`${redirectBase}?notion_error=state_expired`);
      return;
    }

    // State 사용 후 삭제
    stateStore.delete(state);

    try {
      await this.notionService.handleCallback(stateData.userId, code);
      res.redirect(`${redirectBase}?notion_connected=true`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'unknown_error';
      res.redirect(`${redirectBase}?notion_error=${encodeURIComponent(errorMessage)}`);
    }
  }

  @Get('status')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Notion integration status' })
  async getStatus(@CurrentUserId() userId: string): Promise<NotionStatus> {
    return this.notionService.getStatus(userId);
  }

  @Delete('disconnect')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Notion integration' })
  async disconnect(@CurrentUserId() userId: string): Promise<{ success: boolean }> {
    await this.notionService.disconnect(userId);
    return { success: true };
  }

  @Post('export/:analysisId')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export analysis result to Notion' })
  async exportAnalysis(
    @CurrentUserId() userId: string,
    @Param('analysisId') analysisId: string,
  ): Promise<NotionSyncResult> {
    if (!analysisId) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Analysis ID is required',
      });
    }

    return this.notionService.exportAnalysis(userId, analysisId);
  }

  @Post('sync/:analysisId')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync analysis result to existing Notion page' })
  async syncAnalysis(
    @CurrentUserId() userId: string,
    @Param('analysisId') analysisId: string,
  ): Promise<NotionSyncResult> {
    if (!analysisId) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Analysis ID is required',
      });
    }

    return this.notionService.syncAnalysis(userId, analysisId);
  }
}
