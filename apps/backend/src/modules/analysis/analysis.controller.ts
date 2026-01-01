import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  AnalysisService,
  StartAnalysisDto,
  PaginatedJobs,
} from './analysis.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { standardAnalysisSchema } from '@glint/validators';
import { AnalysisResult, AnalysisJob } from '@glint/types';

@ApiTags('Analysis')
@Controller('api/v1/analysis')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('standard')
  @ApiOperation({ summary: 'Start standard analysis' })
  async startStandardAnalysis(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(standardAnalysisSchema)) data: StartAnalysisDto,
  ): Promise<AnalysisJob> {
    return this.analysisService.startStandardAnalysis(userId, data);
  }

  // Specific routes MUST come before wildcard :id route
  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get analysis job status' })
  async getAnalysisJob(
    @CurrentUserId() userId: string,
    @Param('id') jobId: string,
  ): Promise<AnalysisJob> {
    return this.analysisService.getAnalysisJob(userId, jobId);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List analysis jobs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listJobs(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedJobs> {
    return this.analysisService.listJobs(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('video/:videoId')
  @ApiOperation({ summary: 'Get analysis by video ID' })
  @ApiQuery({ name: 'mode', required: false, enum: ['STANDARD', 'DEEP'] })
  async getByVideoId(
    @Param('videoId') videoId: string,
    @Query('mode') mode?: 'STANDARD' | 'DEEP',
  ): Promise<AnalysisResult | null> {
    return this.analysisService.getAnalysisByVideoId(videoId, mode || 'STANDARD');
  }

  // Wildcard route MUST be last
  @Get(':id')
  @ApiOperation({ summary: 'Get analysis result' })
  async getAnalysisResult(
    @CurrentUserId() userId: string,
    @Param('id') resultId: string,
  ): Promise<AnalysisResult> {
    return this.analysisService.getAnalysisResult(userId, resultId);
  }
}
