# Implementation Plan: Glint

> **Gemini 3.0 Pro 기반 초정밀 영상 분석 및 지식 관리 SaaS**
> *"Capture every spark of insight."*

---

## 1. Project Overview

| Field | Value |
|-------|-------|
| **Project Name** | Glint (글린트) |
| **Project Path** | `/Users/jaino/Development/glint` |
| **Description** | Gemini 3.0 Pro (Thinking Mode) 기반 초정밀 영상 분석 및 지식 관리 SaaS |
| **Target Users** | Pro/Biz: 리서처, 크리에이터 / Light: 학생, 직장인 |
| **UX Concept** | Chat-First Interface + Notion-style Structured Report |

### 1-1. Success Metrics (KPIs)

| Metric | Description | Target |
|--------|-------------|--------|
| DAU | 일일 활성 사용자 | Launch +3개월: 1,000 |
| Analysis Completion Rate | 분석 시작 → 완료 비율 | > 95% |
| Paid Conversion Rate | Free → 유료 전환율 | > 5% |
| Churn Rate | 월간 이탈율 | < 5% |
| NPS | 순추천지수 | > 50 |
| ARPU | 유저당 평균 매출 | $10+ |

---

## 2. Tech Stack

### 2-1. Main App (Next.js + Supabase)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Auth & DB | Supabase (Auth, PostgreSQL, RLS) |
| Styling | Tailwind CSS |
| State Management | TanStack Query + Zustand |
| Form | React Hook Form + Zod |
| AI SDK | Vercel AI SDK (Chat Streaming) |
| i18n | next-intl |
| Ads | Google AdSense |
| Feature Flags | Vercel Edge Config / PostHog |

### 2-2. Worker App (Python)

| Layer | Technology |
|-------|------------|
| Framework | FastAPI |
| Task Queue | Celery + Redis (Upstash) |
| Video Download | yt-dlp |
| AI | Google Gemini API (3.0 Pro, File API) |

### 2-3. Mobile App (Expo)

| Layer | Technology |
|-------|------------|
| Framework | Expo Router (SDK 50+) |
| State | TanStack Query + Zustand |
| Secure Storage | expo-secure-store |
| Auth | Supabase Auth |
| Ads | Google AdMob |
| Push Notifications | Expo Notifications |

### 2-4. Payments

| Provider | Target |
|----------|--------|
| Stripe | 글로벌 결제 |
| Toss Payments | 국내 결제 |

### 2-5. External Services

| Service | Purpose |
|---------|---------|
| Supabase | DB, Auth, Storage, Realtime |
| Upstash Redis | Queue, Rate Limiting, Caching |
| Google Gemini API | LLM (3.0 Pro & Flash) |
| Notion API | 분석 결과 내보내기/동기화 |
| Stripe | 글로벌 결제 |
| Toss Payments | 국내 결제 |
| Google AdSense | 웹 광고 (배너, 네이티브) |
| Google AdMob | 모바일 광고 (배너, 전면, 리워드) |
| Sentry | 에러 모니터링 |
| PostHog | Analytics, Feature Flags |
| Resend | 이메일 알림 |

---

## 3. Project Structure

```
glint/
├── apps/
│   ├── web/                      # Next.js 웹 앱
│   │   ├── src/
│   │   │   ├── app/              # App Router
│   │   │   │   ├── (public)/     # 공개 페이지
│   │   │   │   │   ├── page.tsx              # 랜딩
│   │   │   │   │   ├── pricing/
│   │   │   │   │   └── docs/
│   │   │   │   ├── (protected)/  # 인증 필요
│   │   │   │   │   ├── chat/
│   │   │   │   │   │   ├── page.tsx          # 새 채팅
│   │   │   │   │   │   └── [session_id]/
│   │   │   │   │   ├── library/
│   │   │   │   │   ├── settings/
│   │   │   │   │   └── onboarding/           # 온보딩 플로우
│   │   │   │   ├── (admin)/      # 관리자
│   │   │   │   │   └── admin/
│   │   │   │   │       ├── page.tsx          # 대시보드
│   │   │   │   │       ├── users/
│   │   │   │   │       ├── prompts/
│   │   │   │   │       └── ads/
│   │   │   │   └── api/
│   │   │   │       └── v1/                   # API 버저닝
│   │   │   │           ├── auth/
│   │   │   │           ├── chat/
│   │   │   │           ├── analysis/
│   │   │   │           ├── notion/
│   │   │   │           ├── subscription/
│   │   │   │           ├── credits/
│   │   │   │           ├── ads/
│   │   │   │           ├── notifications/
│   │   │   │           └── admin/
│   │   │   ├── components/
│   │   │   │   ├── ads/
│   │   │   │   ├── chat/
│   │   │   │   ├── common/
│   │   │   │   └── onboarding/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── ads/
│   │   │   │   ├── supabase/
│   │   │   │   └── utils/
│   │   │   ├── stores/
│   │   │   └── types/
│   │   │       └── supabase.ts               # 자동 생성된 Supabase 타입
│   │   └── public/
│   │
│   ├── worker/                   # Python Worker
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   └── routes/
│   │   │   ├── services/
│   │   │   │   ├── video_downloader.py
│   │   │   │   ├── gemini_analyzer.py
│   │   │   │   ├── transcript_extractor.py
│   │   │   │   └── url_validator.py          # YouTube URL 검증
│   │   │   ├── tasks/
│   │   │   │   └── analysis_tasks.py
│   │   │   └── core/
│   │   │       ├── config.py
│   │   │       ├── security.py               # API Key 검증
│   │   │       └── celery_app.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── mobile/                   # Expo 모바일 앱
│       ├── app/
│       │   ├── _layout.tsx
│       │   ├── (auth)/
│       │   ├── (tabs)/
│       │   ├── chat/
│       │   └── onboarding/                   # 모바일 온보딩
│       ├── src/
│       │   ├── components/
│       │   │   ├── ads/
│       │   │   └── onboarding/
│       │   ├── hooks/
│       │   │   └── ads/
│       │   ├── lib/
│       │   ├── stores/
│       │   └── types/
│       └── app.config.ts
│
├── packages/
│   ├── types/                    # 공유 TypeScript 타입
│   │   └── src/
│   │       ├── entities/
│   │       ├── api/
│   │       ├── ads/
│   │       ├── errors.ts                     # 에러 코드 체계
│   │       └── index.ts
│   └── validators/               # 공유 Zod 스키마
│       └── src/
│           ├── auth.ts
│           ├── chat.ts
│           ├── analysis.ts
│           ├── ads.ts
│           └── index.ts
│
├── docs/
│   ├── implementation-plan.md
│   ├── dev-context.md
│   └── runbooks/                             # 운영 가이드
│       ├── incident-response.md
│       └── database-recovery.md
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-web.yml
│       ├── deploy-worker.yml
│       └── db-migration.yml
│
├── docker/
│   ├── worker.Dockerfile
│   └── docker-compose.yml
│
├── scripts/
│   ├── generate-types.sh                     # Supabase 타입 생성
│   └── rotate-api-keys.sh                    # API Key 로테이션
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── .nvmrc
```

---

## 4. Database Schema (Supabase)

### 4-1. Core Tables

```sql
-- =============================================
-- 1. 사용자 프로필 (Supabase Auth 연동)
-- =============================================
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

-- =============================================
-- 2. 채팅 세션
-- =============================================
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. 채팅 메시지
-- =============================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    type TEXT NOT NULL CHECK (type IN ('text', 'analysis_card', 'error')),
    content TEXT,
    analysis_ref_id UUID REFERENCES analysis_results(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. 분석 결과 (캐싱용) - 복합 유니크 키 적용
-- =============================================
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT NOT NULL,
    video_url TEXT NOT NULL,
    video_title TEXT,
    video_thumbnail TEXT,
    video_duration_seconds INT,                -- 영상 길이 (제한 체크용)
    mode TEXT NOT NULL CHECK (mode IN ('STANDARD', 'DEEP')),
    result_json JSONB,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, mode)
);

-- =============================================
-- 5. 분석 작업 상태 추적 (비동기 처리용)
-- =============================================
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
    error_code TEXT,                           -- 에러 코드 (ErrorCode enum)
    progress INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. Notion OAuth 연동 (토큰 암호화 저장)
-- =============================================
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

-- =============================================
-- 7. Notion 내보내기 매핑 (Optimistic Lock 적용)
-- =============================================
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

-- =============================================
-- 8. 구독 정보
-- =============================================
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

-- =============================================
-- 9. 크레딧 트랜잭션 (원자적 차감/환불)
-- =============================================
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

-- =============================================
-- 10. 시스템 프롬프트 (Admin 관리, 버전 관리)
-- =============================================
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

-- =============================================
-- 11. 감사 로그 (보안 - 모든 중요 작업 기록)
-- =============================================
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

-- =============================================
-- 12. Webhook 이벤트 로그 (중복 처리 방지)
-- =============================================
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

-- =============================================
-- 13. 광고 설정 (플랫폼별)
-- =============================================
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

-- =============================================
-- 14. 광고 빈도 설정
-- =============================================
CREATE TABLE ad_frequency_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL UNIQUE CHECK (platform IN ('web', 'ios', 'android')),
    interstitial_cooldown_ms INT DEFAULT 60000,
    max_ads_per_session INT DEFAULT 10,
    feed_ad_interval INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 15. 광고 이벤트 (파티셔닝 적용)
-- =============================================
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

-- 월별 파티션
CREATE TABLE ad_events_2025_01 PARTITION OF ad_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE ad_events_2025_02 PARTITION OF ad_events
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE ad_events_2025_03 PARTITION OF ad_events
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- =============================================
-- 16. 임시 프리미엄 액세스 (리워드 광고용)
-- =============================================
CREATE TABLE temporary_premium_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('AD_REWARD', 'PROMOTION', 'TRIAL')),
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- 17. 일일 사용량 추적 (제한 체크용)
-- =============================================
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

-- =============================================
-- 18. 사용자 활동 분석 (Analytics)
-- =============================================
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    session_id TEXT,
    event_name TEXT NOT NULL,
    properties JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 19. 알림 (Push/Email)
-- =============================================
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

-- =============================================
-- 20. Push 토큰 (모바일용)
-- =============================================
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

-- =============================================
-- 21. API Key 관리 (Worker 통신용)
-- =============================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    prefix TEXT NOT NULL,              -- 키의 앞 8자 (식별용)
    scopes TEXT[] DEFAULT '{}',        -- 허용된 작업 범위
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rotated_at TIMESTAMPTZ
);

-- =============================================
-- 22. 피드백 (인앱 피드백)
-- =============================================
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    type TEXT NOT NULL CHECK (type IN ('BUG', 'FEATURE', 'GENERAL', 'ANALYSIS_QUALITY')),
    content TEXT NOT NULL,
    metadata JSONB,
    status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4-2. Indexes

```sql
-- Core indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_analysis_results_video_id ON analysis_results(video_id);
CREATE INDEX idx_analysis_results_video_mode ON analysis_results(video_id, mode);
CREATE INDEX idx_analysis_jobs_user_id_status ON analysis_jobs(user_id, status);
CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status) WHERE status IN ('PENDING', 'PROCESSING');
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Security indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_webhook_events_provider_event ON webhook_events(provider, event_id);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- Ads indexes
CREATE INDEX idx_ad_configs_platform ON ad_configs(platform);
CREATE INDEX idx_ad_configs_platform_enabled ON ad_configs(platform, enabled) WHERE enabled = TRUE;
CREATE INDEX idx_ad_events_user_id ON ad_events(user_id);
CREATE INDEX idx_ad_events_created_at ON ad_events(created_at);
CREATE INDEX idx_ad_events_event_type ON ad_events(event_type);
CREATE INDEX idx_temporary_premium_user ON temporary_premium_access(user_id, is_active) WHERE is_active = TRUE;

-- Usage & Analytics indexes
CREATE INDEX idx_daily_usage_user_date ON daily_usage(user_id, date);
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_event ON user_analytics(event_name);
CREATE INDEX idx_user_analytics_created ON user_analytics(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### 4-3. RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_notion ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_frequency_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_premium_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- User Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own sessions" ON chat_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages" ON chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
);

CREATE POLICY "Anyone can read analysis results" ON analysis_results FOR SELECT USING (true);
CREATE POLICY "Authenticated can create analysis" ON analysis_results FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own jobs" ON analysis_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notion" ON integration_notion FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own exports" ON notion_exports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage" ON daily_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own push tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own premium access" ON temporary_premium_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create feedback" ON user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Public Policies
CREATE POLICY "Anyone can read active prompts" ON system_prompts FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read ad configs" ON ad_configs FOR SELECT USING (true);
CREATE POLICY "Anyone can read ad frequency" ON ad_frequency_configs FOR SELECT USING (true);

-- Admin Policies (apply to all tables that need admin access)
CREATE POLICY "Admins have full access" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
-- (Repeat for other tables requiring admin access)
```

### 4-4. Functions & Triggers

```sql
-- =============================================
-- Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_chat_sessions_updated BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_analysis_results_updated BEFORE UPDATE ON analysis_results FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_integration_notion_updated BEFORE UPDATE ON integration_notion FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_system_prompts_updated BEFORE UPDATE ON system_prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_ad_configs_updated BEFORE UPDATE ON ad_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_ad_frequency_updated BEFORE UPDATE ON ad_frequency_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_daily_usage_updated BEFORE UPDATE ON daily_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 크레딧 차감 함수 (원자적 처리)
-- =============================================
CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id UUID,
    p_amount INT,
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INT, message TEXT) AS $$
DECLARE
    v_current_balance INT;
    v_new_balance INT;
BEGIN
    SELECT credits INTO v_current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;

    IF v_current_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, v_current_balance, 'CREDITS_INSUFFICIENT'::TEXT;
        RETURN;
    END IF;

    v_new_balance := v_current_balance - p_amount;
    UPDATE profiles SET credits = v_new_balance WHERE id = p_user_id;

    INSERT INTO credit_transactions (user_id, amount, type, description, reference_id, reference_type, balance_after)
    VALUES (p_user_id, -p_amount, 'USE', p_description, p_reference_id, p_reference_type, v_new_balance);

    RETURN QUERY SELECT TRUE, v_new_balance, 'SUCCESS'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 크레딧 환불 함수
-- =============================================
CREATE OR REPLACE FUNCTION refund_credits(
    p_user_id UUID,
    p_amount INT,
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_new_balance INT;
BEGIN
    UPDATE profiles SET credits = credits + p_amount WHERE id = p_user_id RETURNING credits INTO v_new_balance;

    INSERT INTO credit_transactions (user_id, amount, type, description, reference_id, reference_type, balance_after)
    VALUES (p_user_id, p_amount, 'REFUND', p_description, p_reference_id, 'analysis_job', v_new_balance);

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 리워드 광고 보상 지급 함수
-- =============================================
CREATE OR REPLACE FUNCTION grant_ad_reward(
    p_user_id UUID,
    p_reward_type TEXT,
    p_duration_hours INT DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
    v_access_id UUID;
BEGIN
    UPDATE temporary_premium_access SET is_active = FALSE WHERE user_id = p_user_id AND is_active = TRUE;

    INSERT INTO temporary_premium_access (user_id, expires_at, source)
    VALUES (p_user_id, NOW() + (p_duration_hours || ' hours')::INTERVAL, 'AD_REWARD')
    RETURNING id INTO v_access_id;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_user_id, 'AD_REWARD', 'temporary_premium_access', v_access_id,
            jsonb_build_object('reward_type', p_reward_type, 'duration_hours', p_duration_hours));

    RETURN v_access_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 광고 표시 여부 확인 함수
-- =============================================
CREATE OR REPLACE FUNCTION should_show_ads(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan TEXT;
    v_has_temp_premium BOOLEAN;
BEGIN
    SELECT plan INTO v_plan FROM profiles WHERE id = p_user_id;

    IF v_plan IN ('LIGHT', 'PRO', 'BUSINESS') THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM temporary_premium_access
        WHERE user_id = p_user_id AND is_active = TRUE AND expires_at > NOW()
    ) INTO v_has_temp_premium;

    IF v_has_temp_premium THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 일일 사용량 증가 함수
-- =============================================
CREATE OR REPLACE FUNCTION increment_daily_usage(
    p_user_id UUID,
    p_type TEXT,  -- 'standard', 'deep', 'chat'
    p_video_minutes INT DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_usage (user_id, date, standard_analyses, deep_analyses, chat_messages, total_video_minutes)
    VALUES (p_user_id, CURRENT_DATE,
            CASE WHEN p_type = 'standard' THEN 1 ELSE 0 END,
            CASE WHEN p_type = 'deep' THEN 1 ELSE 0 END,
            CASE WHEN p_type = 'chat' THEN 1 ELSE 0 END,
            p_video_minutes)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        standard_analyses = daily_usage.standard_analyses + CASE WHEN p_type = 'standard' THEN 1 ELSE 0 END,
        deep_analyses = daily_usage.deep_analyses + CASE WHEN p_type = 'deep' THEN 1 ELSE 0 END,
        chat_messages = daily_usage.chat_messages + CASE WHEN p_type = 'chat' THEN 1 ELSE 0 END,
        total_video_minutes = daily_usage.total_video_minutes + p_video_minutes,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 분석 제한 체크 함수
-- =============================================
CREATE OR REPLACE FUNCTION check_analysis_limits(
    p_user_id UUID,
    p_mode TEXT,
    p_video_duration_minutes INT
)
RETURNS TABLE(allowed BOOLEAN, reason TEXT) AS $$
DECLARE
    v_plan TEXT;
    v_today_usage RECORD;
    v_max_duration INT;
    v_daily_limit INT;
BEGIN
    SELECT plan INTO v_plan FROM profiles WHERE id = p_user_id;

    -- 플랜별 제한
    CASE v_plan
        WHEN 'FREE' THEN v_max_duration := 10; v_daily_limit := 3;
        WHEN 'LIGHT' THEN v_max_duration := 30; v_daily_limit := 20;
        WHEN 'PRO' THEN v_max_duration := 60; v_daily_limit := 50;
        WHEN 'BUSINESS' THEN v_max_duration := 120; v_daily_limit := 200;
        ELSE v_max_duration := 10; v_daily_limit := 3;
    END CASE;

    -- Deep Mode 체크
    IF p_mode = 'DEEP' AND v_plan IN ('FREE', 'LIGHT') THEN
        RETURN QUERY SELECT FALSE, 'DEEP_MODE_UNAVAILABLE'::TEXT;
        RETURN;
    END IF;

    -- 영상 길이 체크
    IF p_video_duration_minutes > v_max_duration THEN
        RETURN QUERY SELECT FALSE, 'VIDEO_TOO_LONG'::TEXT;
        RETURN;
    END IF;

    -- 일일 사용량 체크
    SELECT * INTO v_today_usage FROM daily_usage WHERE user_id = p_user_id AND date = CURRENT_DATE;

    IF v_today_usage IS NOT NULL THEN
        IF (v_today_usage.standard_analyses + v_today_usage.deep_analyses) >= v_daily_limit THEN
            RETURN QUERY SELECT FALSE, 'DAILY_LIMIT_REACHED'::TEXT;
            RETURN;
        END IF;
    END IF;

    RETURN QUERY SELECT TRUE, 'OK'::TEXT;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. API Endpoints

### 5-1. API 버저닝 및 에러 응답

```typescript
// packages/types/src/api/response.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// packages/types/src/errors.ts
export enum ErrorCode {
  // General
  UNKNOWN_ERROR = 'ERR_000',
  VALIDATION_ERROR = 'ERR_001',
  NOT_FOUND = 'ERR_002',
  RATE_LIMITED = 'ERR_003',

  // Auth
  AUTH_INVALID_TOKEN = 'AUTH_001',
  AUTH_SESSION_EXPIRED = 'AUTH_002',
  AUTH_UNAUTHORIZED = 'AUTH_003',

  // Credits
  CREDITS_INSUFFICIENT = 'CREDITS_001',
  CREDITS_TRANSACTION_FAILED = 'CREDITS_002',

  // Analysis
  ANALYSIS_URL_INVALID = 'ANALYSIS_001',
  ANALYSIS_VIDEO_TOO_LONG = 'ANALYSIS_002',
  ANALYSIS_DEEP_MODE_UNAVAILABLE = 'ANALYSIS_003',
  ANALYSIS_DAILY_LIMIT_REACHED = 'ANALYSIS_004',
  ANALYSIS_ALREADY_EXISTS = 'ANALYSIS_005',
  ANALYSIS_JOB_FAILED = 'ANALYSIS_006',

  // Notion
  NOTION_NOT_CONNECTED = 'NOTION_001',
  NOTION_SYNC_CONFLICT = 'NOTION_002',
  NOTION_TOKEN_EXPIRED = 'NOTION_003',

  // Subscription
  SUBSCRIPTION_INVALID_PLAN = 'SUB_001',
  SUBSCRIPTION_PAYMENT_FAILED = 'SUB_002',

  // Ads
  AD_REWARD_FAILED = 'AD_001',
}
```

### 5-2. Next.js API Routes (`/api/v1/*`)

#### Auth API
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /api/v1/auth/register | - | 회원가입 |
| POST | /api/v1/auth/login | - | 로그인 |
| POST | /api/v1/auth/logout | ✓ | 로그아웃 |
| POST | /api/v1/auth/refresh | - | 토큰 갱신 |
| GET | /api/v1/auth/me | ✓ | 내 정보 조회 |
| PATCH | /api/v1/auth/me | ✓ | 내 정보 수정 |

#### Chat API
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /api/v1/chat/sessions | ✓ | 세션 목록 |
| POST | /api/v1/chat/sessions | ✓ | 새 세션 생성 |
| GET | /api/v1/chat/sessions/[id] | ✓ | 세션 상세 |
| PATCH | /api/v1/chat/sessions/[id] | ✓ | 세션 수정 |
| DELETE | /api/v1/chat/sessions/[id] | ✓ | 세션 삭제 |
| POST | /api/v1/chat/sessions/[id]/messages | ✓ | 메시지 전송 (스트리밍) |

#### Analysis API
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /api/v1/analysis/standard | ✓ | Standard Mode 분석 |
| POST | /api/v1/analysis/deep | ✓ | Deep Mode 분석 (Pro/Biz) |
| GET | /api/v1/analysis/[id] | ✓ | 분석 결과 조회 |
| GET | /api/v1/analysis/video/[video_id] | ✓ | 영상 ID로 조회 |
| GET | /api/v1/analysis/jobs/[id] | ✓ | 작업 상태 조회 |
| GET | /api/v1/analysis/jobs/[id]/stream | ✓ | 진행률 SSE |
| GET | /api/v1/analysis/check | ✓ | 분석 가능 여부 체크 |

#### Notion API
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /api/v1/notion/auth | ✓ | OAuth 시작 URL |
| GET | /api/v1/notion/callback | - | OAuth 콜백 |
| GET | /api/v1/notion/status | ✓ | 연동 상태 |
| DELETE | /api/v1/notion/disconnect | ✓ | 연동 해제 |
| POST | /api/v1/notion/export/[analysis_id] | ✓ | 내보내기 |
| POST | /api/v1/notion/sync/[analysis_id] | ✓ | 동기화 |

#### Subscription API
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /api/v1/subscription | ✓ | 내 구독 정보 |
| POST | /api/v1/subscription/checkout/stripe | ✓ | Stripe 결제 |
| POST | /api/v1/subscription/checkout/toss | ✓ | Toss 결제 |
| POST | /api/v1/subscription/webhook/stripe | - | Stripe Webhook |
| POST | /api/v1/subscription/webhook/toss | - | Toss Webhook |
| POST | /api/v1/subscription/cancel | ✓ | 구독 취소 |

#### Credits API
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /api/v1/credits | ✓ | 잔액 조회 |
| GET | /api/v1/credits/history | ✓ | 사용 내역 |

#### Ads API
| Method | Path | Auth | Rate Limit |
|--------|------|:----:|:----------:|
| GET | /api/v1/ads/config | Optional | - |
| POST | /api/v1/ads/events | Optional | 100/min |
| GET | /api/v1/ads/health | - | - |

#### Notifications API
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /api/v1/notifications | ✓ | 알림 목록 |
| PATCH | /api/v1/notifications/[id]/read | ✓ | 읽음 처리 |
| POST | /api/v1/notifications/push-token | ✓ | Push 토큰 등록 |

#### Feedback API
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /api/v1/feedback | Optional | 피드백 제출 |

#### Admin API
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /api/v1/admin/dashboard | Admin | 대시보드 |
| GET | /api/v1/admin/users | Admin | 사용자 목록 |
| PATCH | /api/v1/admin/users/[id] | Admin | 사용자 수정 |
| GET | /api/v1/admin/prompts | Admin | 프롬프트 목록 |
| PATCH | /api/v1/admin/prompts/[id] | Admin | 프롬프트 수정 |
| GET | /api/v1/admin/ads/stats | Admin | 광고 통계 |
| GET | /api/v1/admin/analytics | Admin | 사용 분석 |

### 5-3. Python Worker API

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /worker/analysis/deep | Internal | Deep Mode 분석 |
| GET | /worker/jobs/[id] | Internal | 작업 상태 |
| POST | /worker/jobs/[id]/cancel | Internal | 작업 취소 |
| GET | /health | - | 헬스체크 |

---

## 6. Credit & Monetization System

### 6-1. Credit Policy

| Action | Cost | Model | Note |
|--------|------|-------|------|
| Standard Mode | 1 Credit | Flash | 텍스트 요약 |
| Deep Mode | 15 Credits / 5min | Pro | 5분 단위 올림 |
| Chat Q&A | 1 Credit / Turn | Plan별 | Light=Flash, Pro/Biz=Pro |

### 6-2. Subscription Plans & Limits

| Plan | Price | Credits | Deep Mode | Ads | Max Duration | Daily Limit |
|------|-------|---------|:---------:|:---:|:------------:|:-----------:|
| Free | $0 | 30/일 | ❌ | ✅ | 10분 | 3회 |
| Light | $6.90 | 500 | ❌ | ❌ | 30분 | 20회 |
| Pro | $14.90 | 600 | ✅ | ❌ | 60분 | 50회 |
| Business | $49.90 | 2,500 | ✅ | ❌ | 120분 | 200회 |

### 6-3. Credit Transaction Flow

```
1. 분석 요청 → 제한 체크 (check_analysis_limits)
2. 크레딧 선차감 (deduct_credits)
3. analysis_job 생성 (status: PENDING)
4. 분석 진행 (status: PROCESSING)
5-A. 성공 → 결과 저장 (status: COMPLETED)
5-B. 실패 → 크레딧 환불 (refund_credits), 상태 변경 (status: FAILED)
6. 알림 발송 (Push/Email)
```

---

## 7. Ads System

### 7-1. Ad Types & Platforms

| Type | Platform | Position | Trigger |
|------|----------|----------|---------|
| Banner | Web | 화면 하단 | 항상 |
| Native | Web | 피드/라이브러리 | 5개 항목마다 |
| Banner | Mobile | 화면 하단 | 항상 |
| Interstitial | Mobile | 전환 화면 | 쿨다운 60초 |
| Rewarded | Mobile | 설정/분석 카드 | 사용자 선택 |

### 7-2. Ad Display Policy

- **Free 플랜**: 광고 노출
- **유료 플랜**: 광고 비노출
- **리워드 광고 시청**: 24시간 임시 프리미엄

---

## 8. Security Measures

### 8-1. Authentication & Authorization

- Supabase Auth (JWT-based)
- RLS on all tables
- Role-based access (USER, ADMIN)
- Plan-based feature gating

### 8-2. Webhook Security

```typescript
// Stripe Webhook 검증
async function verifyStripeWebhook(req: Request): Promise<Stripe.Event> {
  const signature = req.headers['stripe-signature'];
  const payload = await req.text();

  // 중복 체크
  const eventId = JSON.parse(payload).id;
  const existing = await db.webhookEvents.findUnique({
    where: { provider_event_id: { provider: 'STRIPE', event_id: eventId } }
  });
  if (existing) throw new Error('Duplicate event');

  // 서명 검증
  const event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);

  // 이벤트 로그
  await db.webhookEvents.create({
    data: { provider: 'STRIPE', event_id: eventId, event_type: event.type, signature_verified: true }
  });

  return event;
}
```

### 8-3. API Key Management

- Worker API Key: 환경변수 + DB 해시 저장
- 로테이션 정책: 90일마다 자동 로테이션
- 스크립트: `scripts/rotate-api-keys.sh`

### 8-4. Rate Limiting (Upstash)

| Endpoint | Limit |
|----------|-------|
| `/api/v1/auth/*` | 10 req/min |
| `/api/v1/analysis/*` | 20 req/min |
| `/api/v1/chat/*/messages` | 60 req/min |
| `/api/v1/ads/events` | 100 req/min |

### 8-5. Input Validation

- YouTube URL: 정규식 + URL 파싱 라이브러리 (url-parse)
- Zod 스키마: Client + Server
- SQL Injection: Supabase Prepared Statements

### 8-6. Encryption

- Notion Token: AES-256-GCM (ENCRYPTION_KEY)
- 프로덕션: AWS KMS 또는 HashiCorp Vault 권장

---

## 9. CI/CD & DevOps

### 9-1. GitHub Actions Workflows

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
```

```yaml
# .github/workflows/deploy-web.yml
name: Deploy Web
on:
  push:
    branches: [main]
    paths: ['apps/web/**', 'packages/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
```

```yaml
# .github/workflows/deploy-worker.yml
name: Deploy Worker
on:
  push:
    branches: [main]
    paths: ['apps/worker/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: glint-worker
          region: asia-northeast3
          source: ./apps/worker
```

### 9-2. Environment Management

| Environment | Supabase Project | Vercel | Worker |
|-------------|------------------|--------|--------|
| Development | glint-dev | Preview | Local Docker |
| Staging | glint-staging | Preview | Cloud Run (staging) |
| Production | glint-prod | Production | Cloud Run (prod) |

### 9-3. Monitoring & Alerts

| Tool | Purpose | Alert Channel |
|------|---------|---------------|
| Sentry | Error tracking | Slack #alerts |
| Vercel Analytics | Web performance | Dashboard |
| Upstash | Redis metrics | Email |
| Supabase | DB metrics | Email |
| PostHog | Product analytics | Dashboard |

### 9-4. Scaling Policy (Worker)

```yaml
# Cloud Run 설정
minInstances: 0
maxInstances: 10
cpu: 2
memory: 2Gi
concurrency: 10
timeout: 600s  # Deep Mode용 10분
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] 프로젝트 초기화 (pnpm workspace, turbo)
- [ ] Supabase 프로젝트 및 스키마 마이그레이션
- [ ] Next.js 설정 (App Router, Tailwind, i18n)
- [ ] Supabase Auth 연동
- [ ] Rate Limiting (Upstash)
- [ ] 에러 코드 체계 및 API 응답 표준화
- [ ] CI/CD 파이프라인

### Phase 2: Chat & Standard Analysis (Week 3-4)
- [ ] 채팅 UI 컴포넌트
- [ ] 채팅 세션/메시지 CRUD
- [ ] YouTube URL 검증 로직
- [ ] Standard Mode 분석 (Gemini Flash)
- [ ] Analysis Card 컴포넌트
- [ ] 실시간 스트리밍 (Vercel AI SDK)

### Phase 3: Python Worker & Deep Mode (Week 5-6)
- [ ] FastAPI + Celery 설정
- [ ] Redis (Upstash) 연동
- [ ] yt-dlp 비디오 다운로드
- [ ] Deep Mode 분석 (Gemini Pro)
- [ ] 작업 상태 추적 및 SSE
- [ ] 크레딧 선차감/환불 로직
- [ ] 분석 제한 체크

### Phase 4: Notion Integration (Week 7)
- [ ] Notion OAuth 플로우
- [ ] 토큰 암호화 저장
- [ ] 내보내기/동기화 API
- [ ] Optimistic Lock 적용

### Phase 5: Payments & Credits (Week 8-9)
- [ ] Stripe 연동
- [ ] Toss Payments 연동
- [ ] Webhook 검증 및 중복 처리
- [ ] 구독 관리 UI

### Phase 6: Ads System (Week 10)
- [ ] 광고 DB 및 API
- [ ] Web AdSense 컴포넌트
- [ ] 리워드 광고 처리
- [ ] 임시 프리미엄 지급

### Phase 7: Admin & Analytics (Week 11)
- [ ] Admin 대시보드
- [ ] 사용자/프롬프트 관리
- [ ] 광고 통계
- [ ] 사용 분석 (daily_usage, user_analytics)

### Phase 8: Mobile App (Week 12-14)
- [ ] Expo 프로젝트 설정
- [ ] 인증 플로우
- [ ] 채팅 UI (모바일)
- [ ] AdMob 연동
- [ ] Push 알림
- [ ] 온보딩 플로우

### Phase 9: Polish & Launch (Week 15-16)
- [ ] 랜딩 페이지
- [ ] 문서 페이지
- [ ] 온보딩 투어
- [ ] SEO 최적화
- [ ] 모니터링 설정
- [ ] 프로덕션 배포

---

## 11. Environment Variables

### 11-1. Web App (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GEMINI_API_KEY=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Notion
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Toss
TOSS_SECRET_KEY=
TOSS_CLIENT_KEY=
TOSS_WEBHOOK_SECRET=

# Worker
WORKER_API_URL=
WORKER_API_KEY=

# Encryption
ENCRYPTION_KEY=

# AdSense
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=

# Sentry
SENTRY_DSN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Email (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

### 11-2. Worker App (.env)

```env
REDIS_URL=
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WORKER_API_KEY=
TEMP_STORAGE_PATH=/tmp/glint
SENTRY_DSN=
```

### 11-3. Mobile App (app.config.ts)

```typescript
export default {
  expo: {
    extra: {
      apiUrl: process.env.API_URL,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      posthogKey: process.env.POSTHOG_KEY,
    },
    plugins: [
      ['react-native-google-mobile-ads', {
        androidAppId: process.env.ADMOB_ANDROID_APP_ID,
        iosAppId: process.env.ADMOB_IOS_APP_ID,
      }],
    ],
  },
};
```

---

## 12. Deployment

### 12-1. Infrastructure

| Component | Platform | Region |
|-----------|----------|--------|
| Web App | Vercel | ICN (Seoul) |
| Worker | Cloud Run | asia-northeast3 |
| Database | Supabase | Northeast Asia |
| Redis | Upstash | ap-northeast-1 |

### 12-2. Backup & Recovery

| Item | Strategy | RTO | RPO |
|------|----------|-----|-----|
| Database | Supabase Daily Backup | 4h | 24h |
| File Storage | Supabase Storage | N/A | N/A |
| Redis | Upstash Persistence | 1h | 1h |

---

*Generated by Fullstack Generator Skill*
