import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AnalysisResult,
  AnalysisJob,
  AnalysisResultJson,
  ErrorCode,
  ErrorMessages,
  CREDIT_COSTS,
  calculateDeepModeCredits,
  PLAN_LIMITS,
  Plan,
} from '@glint/types';
import { extractVideoId, isValidYoutubeUrl } from '@glint/validators';
import { ChatService } from '../chat/chat.service';

export interface StartAnalysisDto {
  url: string;
  sessionId?: string;
}

export interface PaginatedJobs {
  data: AnalysisJob[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

@Injectable()
export class AnalysisService {
  constructor(
    private prisma: PrismaService,
    private chatService: ChatService,
  ) {}

  async startStandardAnalysis(
    userId: string,
    data: StartAnalysisDto,
  ): Promise<AnalysisJob> {
    // Validate URL
    if (!isValidYoutubeUrl(data.url)) {
      throw new BadRequestException({
        code: ErrorCode.ANALYSIS_URL_INVALID,
        message: ErrorMessages[ErrorCode.ANALYSIS_URL_INVALID],
      });
    }

    const videoId = extractVideoId(data.url);
    if (!videoId) {
      throw new BadRequestException({
        code: ErrorCode.ANALYSIS_URL_INVALID,
        message: ErrorMessages[ErrorCode.ANALYSIS_URL_INVALID],
      });
    }

    // Get user profile to check limits and credits
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'User not found',
      });
    }

    // Check daily limits
    await this.checkDailyLimits(userId, profile.plan as Plan, 'STANDARD');

    // Check credits
    const creditCost = CREDIT_COSTS.STANDARD;
    if (profile.credits < creditCost) {
      throw new BadRequestException({
        code: ErrorCode.CREDITS_INSUFFICIENT,
        message: ErrorMessages[ErrorCode.CREDITS_INSUFFICIENT],
      });
    }

    // Check if analysis already exists
    const existingResult = await this.prisma.analysisResult.findUnique({
      where: {
        analysis_results_video_id_mode_key: {
          videoId,
          mode: 'STANDARD',
        },
      },
    });

    if (existingResult) {
      // Return existing result without charging credits
      const job = await this.prisma.analysisJob.create({
        data: {
          userId,
          sessionId: data.sessionId,
          videoUrl: data.url,
          videoId,
          mode: 'STANDARD',
          status: 'COMPLETED',
          creditsReserved: 0,
          resultId: existingResult.id,
          completedAt: new Date(),
        },
      });

      // Add chat message for cached result
      if (data.sessionId) {
        await this.chatService.addAssistantMessage(
          data.sessionId,
          JSON.stringify({
            jobId: job.id,
            videoId,
            status: 'COMPLETED',
            resultId: existingResult.id,
          }),
          'analysis_card',
          existingResult.id,
        );
      }

      return this.mapToJob(job);
    }

    // Deduct credits
    await this.prisma.$executeRaw`
      SELECT * FROM deduct_credits(
        ${userId}::uuid,
        ${creditCost}::int,
        ${'Standard analysis for ' + videoId}::text,
        NULL::uuid,
        ${'analysis_job'}::text
      )
    `;

    // Create job
    const job = await this.prisma.analysisJob.create({
      data: {
        userId,
        sessionId: data.sessionId,
        videoUrl: data.url,
        videoId,
        mode: 'STANDARD',
        status: 'PENDING',
        creditsReserved: creditCost,
      },
    });

    // Increment daily usage
    await this.prisma.$executeRaw`
      SELECT increment_daily_usage(${userId}::uuid, 'standard'::text, 0::int)
    `;

    // Add chat message if sessionId provided
    // Note: analysisRefId is undefined for PENDING jobs (no result yet)
    // The content JSON contains the jobId which the frontend uses for polling
    if (data.sessionId) {
      await this.chatService.addAssistantMessage(
        data.sessionId,
        JSON.stringify({ jobId: job.id, videoId, status: 'PENDING' }),
        'analysis_card',
        undefined,
      );
    }

    return this.mapToJob(job);
  }

  async getAnalysisResult(userId: string, resultId: string): Promise<AnalysisResult> {
    const result = await this.prisma.analysisResult.findUnique({
      where: { id: resultId },
    });

    if (!result) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Analysis result not found',
      });
    }

    return this.mapToResult(result);
  }

  async getAnalysisJob(userId: string, jobId: string): Promise<AnalysisJob> {
    const job = await this.prisma.analysisJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException({
        code: ErrorCode.ANALYSIS_JOB_NOT_FOUND,
        message: ErrorMessages[ErrorCode.ANALYSIS_JOB_NOT_FOUND],
      });
    }

    if (job.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_UNAUTHORIZED,
        message: ErrorMessages[ErrorCode.AUTH_UNAUTHORIZED],
      });
    }

    return this.mapToJob(job);
  }

  async getAnalysisByVideoId(
    videoId: string,
    mode: 'STANDARD' | 'DEEP',
  ): Promise<AnalysisResult | null> {
    const result = await this.prisma.analysisResult.findUnique({
      where: {
        analysis_results_video_id_mode_key: {
          videoId,
          mode,
        },
      },
    });

    if (!result) {
      return null;
    }

    return this.mapToResult(result);
  }

  async listJobs(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedJobs> {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      this.prisma.analysisJob.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.analysisJob.count({ where: { userId } }),
    ]);

    return {
      data: jobs.map(this.mapToJob),
      meta: {
        page,
        limit,
        total,
        hasMore: skip + jobs.length < total,
      },
    };
  }

  async updateJobStatus(
    jobId: string,
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    resultId?: string,
    errorMessage?: string,
    errorCode?: string,
  ): Promise<AnalysisJob> {
    const updateData: Record<string, unknown> = {
      status,
    };

    if (status === 'PROCESSING') {
      updateData.startedAt = new Date();
    }

    if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.completedAt = new Date();
    }

    if (resultId) {
      updateData.resultId = resultId;
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    if (errorCode) {
      updateData.errorCode = errorCode;
    }

    const job = await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: updateData,
    });

    // Refund credits if failed
    if (status === 'FAILED' && job.creditsReserved > 0) {
      await this.prisma.$executeRaw`
        SELECT refund_credits(
          ${job.userId}::uuid,
          ${job.creditsReserved}::int,
          ${'Refund for failed analysis job ' + jobId}::text,
          ${jobId}::uuid
        )
      `;
    }

    return this.mapToJob(job);
  }

  async updateJobProgress(jobId: string, progress: number): Promise<void> {
    await this.prisma.analysisJob.update({
      where: { id: jobId },
      data: { progress },
    });
  }

  async createAnalysisResult(data: {
    videoId: string;
    videoUrl: string;
    videoTitle?: string;
    videoThumbnail?: string;
    videoDurationSeconds?: number;
    mode: 'STANDARD' | 'DEEP';
    resultJson: AnalysisResultJson;
    transcript?: string;
  }): Promise<AnalysisResult> {
    const result = await this.prisma.analysisResult.upsert({
      where: {
        analysis_results_video_id_mode_key: {
          videoId: data.videoId,
          mode: data.mode,
        },
      },
      update: {
        resultJson: data.resultJson as object,
        transcript: data.transcript,
        videoTitle: data.videoTitle,
        videoThumbnail: data.videoThumbnail,
        videoDurationSeconds: data.videoDurationSeconds,
      },
      create: {
        videoId: data.videoId,
        videoUrl: data.videoUrl,
        videoTitle: data.videoTitle,
        videoThumbnail: data.videoThumbnail,
        videoDurationSeconds: data.videoDurationSeconds,
        mode: data.mode,
        resultJson: data.resultJson as object,
        transcript: data.transcript,
      },
    });

    return this.mapToResult(result);
  }

  private async checkDailyLimits(
    userId: string,
    plan: Plan,
    mode: 'STANDARD' | 'DEEP',
  ): Promise<void> {
    const limits = PLAN_LIMITS[plan];

    // Check if deep mode is available
    if (mode === 'DEEP' && !limits.deepModeEnabled) {
      throw new BadRequestException({
        code: ErrorCode.ANALYSIS_DEEP_MODE_UNAVAILABLE,
        message: ErrorMessages[ErrorCode.ANALYSIS_DEEP_MODE_UNAVAILABLE],
      });
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.dailyUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (usage) {
      const totalAnalyses = usage.standardAnalyses + usage.deepAnalyses;
      if (totalAnalyses >= limits.dailyAnalysisLimit) {
        throw new BadRequestException({
          code: ErrorCode.ANALYSIS_DAILY_LIMIT_REACHED,
          message: ErrorMessages[ErrorCode.ANALYSIS_DAILY_LIMIT_REACHED],
        });
      }
    }
  }

  private mapToResult(result: {
    id: string;
    videoId: string;
    videoUrl: string;
    videoTitle: string | null;
    videoThumbnail: string | null;
    videoDurationSeconds: number | null;
    mode: string;
    resultJson: unknown;
    transcript: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AnalysisResult {
    return {
      id: result.id,
      videoId: result.videoId,
      videoUrl: result.videoUrl,
      videoTitle: result.videoTitle,
      videoThumbnail: result.videoThumbnail,
      videoDurationSeconds: result.videoDurationSeconds,
      mode: result.mode as 'STANDARD' | 'DEEP',
      resultJson: result.resultJson as AnalysisResultJson | null,
      transcript: result.transcript,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  }

  private mapToJob(job: {
    id: string;
    userId: string;
    sessionId: string | null;
    videoUrl: string;
    videoId: string | null;
    mode: string;
    status: string;
    creditsReserved: number;
    resultId: string | null;
    errorMessage: string | null;
    errorCode: string | null;
    progress: number;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
  }): AnalysisJob {
    return {
      id: job.id,
      userId: job.userId,
      sessionId: job.sessionId,
      videoUrl: job.videoUrl,
      videoId: job.videoId,
      mode: job.mode as 'STANDARD' | 'DEEP',
      status: job.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
      creditsReserved: job.creditsReserved,
      resultId: job.resultId,
      errorMessage: job.errorMessage,
      errorCode: job.errorCode,
      progress: job.progress,
      startedAt: job.startedAt?.toISOString() || null,
      completedAt: job.completedAt?.toISOString() || null,
      createdAt: job.createdAt.toISOString(),
    };
  }
}
