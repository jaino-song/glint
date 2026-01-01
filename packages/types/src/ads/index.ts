/**
 * 광고 플랫폼
 */
export type AdPlatform = 'web' | 'ios' | 'android';

/**
 * 광고 배치 타입
 */
export type AdPlacementType = 'banner' | 'interstitial' | 'rewarded' | 'native';

/**
 * 광고 위치
 */
export type AdPosition = 'bottom_anchor' | 'feed_inline' | 'post_action' | 'content_between';

/**
 * 광고 이벤트 타입
 */
export type AdEventType = 'loaded' | 'impression' | 'clicked' | 'failed' | 'rewarded';

/**
 * 광고 배치 설정
 */
export interface AdPlacement {
  id: string;
  type: AdPlacementType;
  position: AdPosition;
  unitId: string;
  priority: number;
}

/**
 * 광고 빈도 설정
 */
export interface AdFrequencyConfig {
  interstitialCooldownMs: number;
  maxAdsPerSession: number;
  feedAdInterval: number;
}

/**
 * 광고 설정
 */
export interface AdConfig {
  platform: AdPlatform;
  placements: AdPlacement[];
  frequency: AdFrequencyConfig;
  enabled: boolean;
}

/**
 * 광고 설정 응답
 */
export interface AdConfigResponse {
  config: AdConfig | null;
  showAds: boolean;
}

/**
 * 광고 리워드
 */
export interface AdReward {
  type: string;
  amount: number;
}

/**
 * 광고 이벤트
 */
export interface AdEvent {
  type: AdEventType;
  platform: AdPlatform;
  placementId: string;
  unitId?: string;
  errorMessage?: string;
  reward?: AdReward;
}

/**
 * 입력 검증 패턴
 */
export const AD_VALIDATION_PATTERNS = {
  PLACEMENT_ID: /^[a-zA-Z0-9-_]{1,100}$/,
  UNIT_ID: /^[a-zA-Z0-9-_/]{1,100}$/,
  SESSION_ID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;
