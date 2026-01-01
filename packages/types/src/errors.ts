/**
 * 표준 에러 코드 체계
 */
export enum ErrorCode {
  // General (ERR_0xx)
  UNKNOWN_ERROR = 'ERR_000',
  VALIDATION_ERROR = 'ERR_001',
  NOT_FOUND = 'ERR_002',
  RATE_LIMITED = 'ERR_003',
  INTERNAL_ERROR = 'ERR_004',

  // Auth (AUTH_0xx)
  AUTH_INVALID_TOKEN = 'AUTH_001',
  AUTH_SESSION_EXPIRED = 'AUTH_002',
  AUTH_UNAUTHORIZED = 'AUTH_003',
  AUTH_INVALID_CREDENTIALS = 'AUTH_004',
  AUTH_EMAIL_EXISTS = 'AUTH_005',

  // Credits (CREDITS_0xx)
  CREDITS_INSUFFICIENT = 'CREDITS_001',
  CREDITS_TRANSACTION_FAILED = 'CREDITS_002',

  // Analysis (ANALYSIS_0xx)
  ANALYSIS_URL_INVALID = 'ANALYSIS_001',
  ANALYSIS_VIDEO_TOO_LONG = 'ANALYSIS_002',
  ANALYSIS_DEEP_MODE_UNAVAILABLE = 'ANALYSIS_003',
  ANALYSIS_DAILY_LIMIT_REACHED = 'ANALYSIS_004',
  ANALYSIS_ALREADY_EXISTS = 'ANALYSIS_005',
  ANALYSIS_JOB_FAILED = 'ANALYSIS_006',
  ANALYSIS_JOB_NOT_FOUND = 'ANALYSIS_007',

  // Notion (NOTION_0xx)
  NOTION_NOT_CONNECTED = 'NOTION_001',
  NOTION_SYNC_CONFLICT = 'NOTION_002',
  NOTION_TOKEN_EXPIRED = 'NOTION_003',
  NOTION_PAGE_NOT_FOUND = 'NOTION_004',

  // Subscription (SUB_0xx)
  SUBSCRIPTION_INVALID_PLAN = 'SUB_001',
  SUBSCRIPTION_PAYMENT_FAILED = 'SUB_002',
  SUBSCRIPTION_ALREADY_EXISTS = 'SUB_003',
  SUBSCRIPTION_NOT_FOUND = 'SUB_004',

  // Ads (AD_0xx)
  AD_REWARD_FAILED = 'AD_001',
  AD_CONFIG_NOT_FOUND = 'AD_002',
}

/**
 * 에러 코드별 기본 메시지
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred',
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please try again later',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',

  [ErrorCode.AUTH_INVALID_TOKEN]: 'Invalid or expired token',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Session has expired. Please login again',
  [ErrorCode.AUTH_UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.AUTH_EMAIL_EXISTS]: 'Email already registered',

  [ErrorCode.CREDITS_INSUFFICIENT]: 'Insufficient credits',
  [ErrorCode.CREDITS_TRANSACTION_FAILED]: 'Credit transaction failed',

  [ErrorCode.ANALYSIS_URL_INVALID]: 'Invalid YouTube URL',
  [ErrorCode.ANALYSIS_VIDEO_TOO_LONG]: 'Video exceeds maximum duration for your plan',
  [ErrorCode.ANALYSIS_DEEP_MODE_UNAVAILABLE]: 'Deep Mode requires Pro or Business plan',
  [ErrorCode.ANALYSIS_DAILY_LIMIT_REACHED]: 'Daily analysis limit reached',
  [ErrorCode.ANALYSIS_ALREADY_EXISTS]: 'Analysis already exists for this video',
  [ErrorCode.ANALYSIS_JOB_FAILED]: 'Analysis job failed',
  [ErrorCode.ANALYSIS_JOB_NOT_FOUND]: 'Analysis job not found',

  [ErrorCode.NOTION_NOT_CONNECTED]: 'Notion is not connected',
  [ErrorCode.NOTION_SYNC_CONFLICT]: 'Sync conflict detected. Please try again',
  [ErrorCode.NOTION_TOKEN_EXPIRED]: 'Notion token expired. Please reconnect',
  [ErrorCode.NOTION_PAGE_NOT_FOUND]: 'Notion page not found',

  [ErrorCode.SUBSCRIPTION_INVALID_PLAN]: 'Invalid subscription plan',
  [ErrorCode.SUBSCRIPTION_PAYMENT_FAILED]: 'Payment failed',
  [ErrorCode.SUBSCRIPTION_ALREADY_EXISTS]: 'Subscription already exists',
  [ErrorCode.SUBSCRIPTION_NOT_FOUND]: 'Subscription not found',

  [ErrorCode.AD_REWARD_FAILED]: 'Failed to process ad reward',
  [ErrorCode.AD_CONFIG_NOT_FOUND]: 'Ad configuration not found',
};
