-- =============================================
-- Glint Initial Schema Migration
-- =============================================

-- 1. profiles (사용자 프로필)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'LIGHT', 'PRO', 'BUSINESS')),
    credits INT DEFAULT 30,
    language TEXT DEFAULT 'ko',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INT DEFAULT 0,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_push BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. chat_sessions (채팅 세션)
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. analysis_results (분석 결과)
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT NOT NULL,
    video_url TEXT NOT NULL,
    video_title TEXT,
    video_thumbnail TEXT,
    video_duration_seconds INT,
    mode TEXT NOT NULL CHECK (mode IN ('STANDARD', 'DEEP')),
    result_json JSONB,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, mode)
);

-- 4. chat_messages (채팅 메시지)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    type TEXT NOT NULL CHECK (type IN ('text', 'analysis_card', 'error')),
    content TEXT,
    analysis_ref_id UUID REFERENCES analysis_results(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. analysis_jobs (분석 작업)
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id),
    video_url TEXT NOT NULL,
    video_id TEXT,
    mode TEXT NOT NULL CHECK (mode IN ('STANDARD', 'DEEP')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    credits_reserved INT NOT NULL DEFAULT 0,
    result_id UUID REFERENCES analysis_results(id),
    error_message TEXT,
    error_code TEXT,
    progress INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. integration_notion (Notion 연동)
CREATE TABLE integration_notion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    encrypted_token TEXT NOT NULL,
    token_iv TEXT NOT NULL,
    workspace_id TEXT,
    workspace_name TEXT,
    workspace_icon TEXT,
    bot_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. notion_exports (Notion 내보내기)
CREATE TABLE notion_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    analysis_id UUID NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,
    notion_page_id TEXT NOT NULL,
    notion_page_url TEXT,
    last_synced_at TIMESTAMPTZ,
    sync_version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, analysis_id)
);

-- 8. subscriptions (구독)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    plan TEXT NOT NULL CHECK (plan IN ('FREE', 'LIGHT', 'PRO', 'BUSINESS')),
    provider TEXT CHECK (provider IN ('STRIPE', 'TOSS')),
    customer_id TEXT,
    subscription_id TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELED', 'PAST_DUE', 'EXPIRED')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. credit_transactions (크레딧 트랜잭션)
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CHARGE', 'USE', 'REFUND', 'EXPIRE', 'BONUS', 'REWARD')),
    description TEXT,
    reference_id UUID,
    reference_type TEXT,
    balance_after INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. system_prompts (시스템 프롬프트)
CREATE TABLE system_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, version)
);

-- 11. audit_logs (감사 로그)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. webhook_events (Webhook 이벤트)
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('STRIPE', 'TOSS')),
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    signature_verified BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, event_id)
);

-- 13. ad_configs (광고 설정)
CREATE TABLE ad_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    placement_type TEXT NOT NULL CHECK (placement_type IN ('banner', 'interstitial', 'rewarded', 'native')),
    position TEXT NOT NULL,
    unit_id TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, position)
);

-- 14. ad_frequency_configs (광고 빈도 설정)
CREATE TABLE ad_frequency_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL UNIQUE CHECK (platform IN ('web', 'ios', 'android')),
    interstitial_cooldown_ms INT DEFAULT 60000,
    max_ads_per_session INT DEFAULT 10,
    feed_ad_interval INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ad_events (광고 이벤트 - 파티셔닝)
CREATE TABLE ad_events (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id TEXT,
    platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    event_type TEXT NOT NULL CHECK (event_type IN ('loaded', 'impression', 'clicked', 'failed', 'rewarded')),
    placement_id TEXT,
    unit_id TEXT,
    error_message TEXT,
    reward_type TEXT,
    reward_amount INT,
    trace_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 파티션 생성 (2025년)
CREATE TABLE ad_events_2025_01 PARTITION OF ad_events FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE ad_events_2025_02 PARTITION OF ad_events FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE ad_events_2025_03 PARTITION OF ad_events FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE ad_events_2025_04 PARTITION OF ad_events FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE ad_events_2025_05 PARTITION OF ad_events FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE ad_events_2025_06 PARTITION OF ad_events FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

-- 16. temporary_premium_access (임시 프리미엄)
CREATE TABLE temporary_premium_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('AD_REWARD', 'PROMOTION', 'TRIAL')),
    is_active BOOLEAN DEFAULT TRUE
);

-- 17. daily_usage (일일 사용량)
CREATE TABLE daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    standard_analyses INT DEFAULT 0,
    deep_analyses INT DEFAULT 0,
    chat_messages INT DEFAULT 0,
    total_video_minutes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 18. user_analytics (사용자 분석)
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    session_id TEXT,
    event_name TEXT NOT NULL,
    properties JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. notifications (알림)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('ANALYSIS_COMPLETE', 'CREDIT_LOW', 'SUBSCRIPTION', 'SYSTEM')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    channel TEXT CHECK (channel IN ('PUSH', 'EMAIL', 'IN_APP')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. push_tokens (Push 토큰)
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    device_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- 21. api_keys (API Key)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    prefix TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rotated_at TIMESTAMPTZ
);

-- 22. user_feedback (피드백)
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    type TEXT NOT NULL CHECK (type IN ('BUG', 'FEATURE', 'GENERAL', 'ANALYSIS_QUALITY')),
    content TEXT NOT NULL,
    metadata JSONB,
    status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_analysis_results_video_id ON analysis_results(video_id);
CREATE INDEX idx_analysis_results_video_mode ON analysis_results(video_id, mode);
CREATE INDEX idx_analysis_jobs_user_id_status ON analysis_jobs(user_id, status);
CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status) WHERE status IN ('PENDING', 'PROCESSING');
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_webhook_events_provider_event ON webhook_events(provider, event_id);
CREATE INDEX idx_ad_configs_platform ON ad_configs(platform);
CREATE INDEX idx_ad_configs_platform_enabled ON ad_configs(platform, enabled) WHERE enabled = TRUE;
CREATE INDEX idx_ad_events_user_id ON ad_events(user_id);
CREATE INDEX idx_ad_events_created_at ON ad_events(created_at);
CREATE INDEX idx_temporary_premium_user ON temporary_premium_access(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_daily_usage_user_date ON daily_usage(user_id, date);
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_event ON user_analytics(event_name);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
