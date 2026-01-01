import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdConfig,
  AdConfigResponse,
  AdPlacement,
  AdFrequencyConfig,
  AdPlatform,
  AdEventType,
} from '@glint/types';

type PrismaAdConfig = Prisma.AdConfigGetPayload<object>;

export interface LogAdEventDto {
  type: AdEventType;
  platform: AdPlatform;
  placementId: string;
  unitId?: string;
  errorMessage?: string;
  reward?: {
    type: string;
    amount: number;
  };
}

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(private prisma: PrismaService) {}

  async getConfig(platform: AdPlatform, userId?: string): Promise<AdConfigResponse> {
    // Check if user should see ads
    let showAds = true;

    if (userId) {
      const result = await this.prisma.$queryRaw<Array<{ should_show_ads: boolean }>>`
        SELECT should_show_ads(${userId}::uuid) as should_show_ads
      `;
      showAds = result[0]?.should_show_ads ?? true;
    }

    if (!showAds) {
      return {
        config: null,
        showAds: false,
      };
    }

    // Get ad configs for platform
    const [configs, frequencyConfig] = await Promise.all([
      this.prisma.adConfig.findMany({
        where: {
          platform,
          enabled: true,
        },
        orderBy: { priority: 'desc' },
      }),
      this.prisma.adFrequencyConfig.findUnique({
        where: { platform },
      }),
    ]);

    if (configs.length === 0) {
      return {
        config: null,
        showAds: true,
      };
    }

    const placements: AdPlacement[] = configs.map((config: PrismaAdConfig) => ({
      id: config.id,
      type: config.placementType as AdPlacement['type'],
      position: config.position as AdPlacement['position'],
      unitId: config.unitId,
      priority: config.priority,
    }));

    const frequency: AdFrequencyConfig = frequencyConfig
      ? {
          interstitialCooldownMs: frequencyConfig.interstitialCooldownMs,
          maxAdsPerSession: frequencyConfig.maxAdsPerSession,
          feedAdInterval: frequencyConfig.feedAdInterval,
        }
      : {
          interstitialCooldownMs: 60000,
          maxAdsPerSession: 10,
          feedAdInterval: 5,
        };

    const config: AdConfig = {
      platform,
      placements,
      frequency,
      enabled: true,
    };

    return {
      config,
      showAds: true,
    };
  }

  async logEvent(event: LogAdEventDto, userId?: string, sessionId?: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO ad_events (
          user_id,
          session_id,
          platform,
          event_type,
          placement_id,
          unit_id,
          error_message,
          reward_type,
          reward_amount,
          created_at
        ) VALUES (
          ${userId ? userId : null}::uuid,
          ${sessionId || null},
          ${event.platform},
          ${event.type},
          ${event.placementId},
          ${event.unitId || null},
          ${event.errorMessage || null},
          ${event.reward?.type || null},
          ${event.reward?.amount || null},
          NOW()
        )
      `;

      // If rewarded event, grant temporary premium
      if (event.type === 'rewarded' && userId && event.reward) {
        await this.grantAdReward(userId, event.reward.type);
      }
    } catch (error) {
      this.logger.error(`Failed to log ad event: ${error}`);
      // Don't throw - ad event logging should not break the app
    }
  }

  async grantAdReward(userId: string, rewardType: string): Promise<string> {
    const result = await this.prisma.$queryRaw<Array<{ grant_ad_reward: string }>>`
      SELECT grant_ad_reward(
        ${userId}::uuid,
        ${rewardType},
        24
      )
    `;

    return result[0].grant_ad_reward;
  }

  async checkShouldShowAds(userId: string): Promise<boolean> {
    const result = await this.prisma.$queryRaw<Array<{ should_show_ads: boolean }>>`
      SELECT should_show_ads(${userId}::uuid) as should_show_ads
    `;

    return result[0]?.should_show_ads ?? true;
  }
}
