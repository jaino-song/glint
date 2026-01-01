import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdsService, LogAdEventDto } from './ads.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { adEventSchema, adConfigQuerySchema } from '@glint/validators';
import { AdConfigResponse, AdPlatform } from '@glint/types';

@ApiTags('Ads')
@Controller('api/v1/ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get ad configuration for platform' })
  @ApiQuery({ name: 'platform', enum: ['web', 'ios', 'android'] })
  @UsePipes(new ZodValidationPipe(adConfigQuerySchema))
  async getConfig(
    @Query('platform') platform: AdPlatform,
    @Headers('x-user-id') userId?: string,
  ): Promise<AdConfigResponse> {
    return this.adsService.getConfig(platform, userId);
  }

  @Post('events')
  @ApiOperation({ summary: 'Log ad event' })
  async logEvent(
    @Body(new ZodValidationPipe(adEventSchema)) event: LogAdEventDto,
    @Headers('x-user-id') userId?: string,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<{ logged: boolean }> {
    await this.adsService.logEvent(event, userId, sessionId);
    return { logged: true };
  }
}
