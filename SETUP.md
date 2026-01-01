# Glint Setup Guide

> 서비스 실행을 위한 외부 서비스 세팅 가이드

---

## 필요한 외부 서비스

### 1. 필수 (서비스 실행에 반드시 필요)

| 서비스 | 세팅 내용 | 얻을 정보 |
|--------|----------|----------|
| **Supabase** | 프로젝트 생성 | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` |
| **Supabase DB** | SQL 마이그레이션 실행 | 테이블, RLS, Functions 생성 |
| **Upstash Redis** | 계정/DB 생성 | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |

### 2. 선택 (해당 기능 사용 시)

| 서비스 | 기능 | 얻을 정보 |
|--------|------|----------|
| **Google AdMob** | 모바일 광고 | `ADMOB_APP_ID`, `ADMOB_BANNER_UNIT_ID`, `ADMOB_INTERSTITIAL_UNIT_ID`, `ADMOB_REWARDED_UNIT_ID` |
| **Google AdSense** | 웹 광고 | `ADSENSE_PUBLISHER_ID` |
| **Stripe** | 글로벌 결제 | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Toss Payments** | 국내 결제 | `TOSS_SECRET_KEY`, `TOSS_CLIENT_KEY`, `TOSS_WEBHOOK_SECRET` |
| **Notion API** | 노션 연동 | `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET` |
| **Google Gemini API** | AI 분석 | `GEMINI_API_KEY` |
| **Sentry** | 에러 모니터링 | `SENTRY_DSN` |
| **PostHog** | 분석/Feature Flags | `POSTHOG_KEY`, `POSTHOG_HOST` |
| **Resend** | 이메일 발송 | `RESEND_API_KEY` |

---

## 단계별 세팅 가이드

### Step 1: Supabase 프로젝트 생성 (필수)

1. [https://supabase.com](https://supabase.com) 접속
2. 새 프로젝트 생성
3. **Project Settings → API**에서 복사:
   - Project URL → `SUPABASE_URL`
   - anon public → `SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`
4. **Project Settings → Database → Connection string**에서 복사:
   - URI → `DATABASE_URL` (비밀번호 포함)
5. **SQL Editor**에서 마이그레이션 실행 (순서대로):
   - `supabase/migrations/00001_initial_schema.sql`
   - `supabase/migrations/00002_rls_policies.sql`
   - `supabase/migrations/00003_functions.sql`

### Step 2: Upstash Redis 생성 (필수)

1. [https://upstash.com](https://upstash.com) 접속
2. 새 Redis DB 생성
3. **Details**에서 복사:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Step 3: Google AdMob 설정 (모바일 광고 사용 시)

1. [https://admob.google.com](https://admob.google.com) 접속
2. 앱 등록 (iOS, Android 각각)
3. 광고 단위 생성:
   - Banner → `ADMOB_BANNER_UNIT_ID`
   - Interstitial → `ADMOB_INTERSTITIAL_UNIT_ID`
   - Rewarded → `ADMOB_REWARDED_UNIT_ID`
4. 앱 ID 복사:
   - iOS → `ADMOB_IOS_APP_ID`
   - Android → `ADMOB_ANDROID_APP_ID`

### Step 4: Google Gemini API 설정 (AI 분석 사용 시)

1. [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) 접속
2. API Key 생성 → `GEMINI_API_KEY`

### Step 5: Stripe 설정 (글로벌 결제 사용 시)

1. [https://stripe.com](https://stripe.com) 접속
2. Developers → API keys에서:
   - Secret key → `STRIPE_SECRET_KEY`
   - Publishable key → `STRIPE_PUBLISHABLE_KEY`
3. Developers → Webhooks에서 엔드포인트 생성:
   - URL: `https://your-domain.com/api/v1/webhooks/stripe`
   - Signing secret → `STRIPE_WEBHOOK_SECRET`

### Step 6: Toss Payments 설정 (국내 결제 사용 시)

1. [https://developers.tosspayments.com](https://developers.tosspayments.com) 접속
2. 상점 등록 후 API 키 발급:
   - 시크릿 키 → `TOSS_SECRET_KEY`
   - 클라이언트 키 → `TOSS_CLIENT_KEY`
3. 웹훅 설정:
   - URL: `https://your-domain.com/api/v1/webhooks/toss`
   - 시크릿 → `TOSS_WEBHOOK_SECRET`

---

## 환경변수 설정

### Backend (`apps/backend/.env.local`)

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server
PORT=4000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
```

### Web (`apps/web/.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend
BACKEND_URL=http://localhost:4000

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://[DB_NAME]-[REGION].upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional - Gemini (AI 분석)
GEMINI_API_KEY=

# Optional - Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
TOSS_SECRET_KEY=
TOSS_CLIENT_KEY=
TOSS_WEBHOOK_SECRET=

# Optional - Ads
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=

# Optional - Monitoring
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

### Mobile (`apps/mobile/.env`)

```env
# API
EXPO_PUBLIC_API_URL=http://localhost:4000

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AdMob (테스트 ID는 개발용)
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID=ca-app-pub-3940256099942544/6300978111
EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID=ca-app-pub-3940256099942544/1033173712
EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID=ca-app-pub-3940256099942544/5224354917
```

---

## 최소 실행 체크리스트

서비스를 최소한으로 실행하기 위한 체크리스트:

```
□ Supabase 프로젝트 생성
□ Supabase SQL Editor에서 마이그레이션 3개 실행
  □ 00001_initial_schema.sql
  □ 00002_rls_policies.sql
  □ 00003_functions.sql
□ Upstash Redis DB 생성
□ apps/backend/.env.local 작성
□ apps/web/.env.local 작성
□ 루트에서 pnpm install
□ cd apps/backend && pnpm prisma generate
□ pnpm dev (전체 실행)
```

이것만 완료하면 **기본 기능**이 동작합니다:
- 회원가입 / 로그인
- 채팅 세션 생성
- 분석 요청 (목업 결과 반환)

---

## 기능별 추가 세팅

| 기능 | 필요한 세팅 |
|------|------------|
| 실제 AI 분석 | Gemini API Key + Python Worker 구현 |
| 모바일 광고 | AdMob 앱 등록 + 광고 단위 생성 |
| 웹 광고 | AdSense 계정 + 사이트 승인 |
| 결제 (글로벌) | Stripe 계정 + Webhook 설정 |
| 결제 (국내) | Toss Payments 상점 등록 |
| 노션 연동 | Notion Integration 생성 |
| 이메일 알림 | Resend 계정 + 도메인 인증 |
| 에러 모니터링 | Sentry 프로젝트 생성 |
| 분석/Feature Flags | PostHog 프로젝트 생성 |

---

## 프로덕션 배포 시 추가 고려사항

### 1. 환경변수 보안
- 절대 `.env` 파일을 Git에 커밋하지 마세요
- Vercel, Railway 등 호스팅 서비스의 환경변수 설정 사용

### 2. CORS 설정
- Backend의 `CORS_ORIGINS`를 실제 도메인으로 변경
- Mobile의 `EXPO_PUBLIC_API_URL`을 실제 Backend URL로 변경

### 3. Supabase 보안
- RLS 정책이 제대로 적용되었는지 확인
- Service Role Key는 서버에서만 사용

### 4. Rate Limiting
- Upstash Redis Plan 확인 (요청 제한)
- 필요시 유료 플랜으로 업그레이드

### 5. 도메인 설정
- SSL 인증서 설정
- Webhook URL을 실제 도메인으로 변경

---

## 문제 해결

### Supabase 연결 오류
```
Error: connection refused
```
- `DATABASE_URL`의 비밀번호 확인
- Supabase 대시보드에서 Database 탭 → Connection Pooling 확인

### Prisma 오류
```
Error: @prisma/client did not initialize
```
```bash
cd apps/backend
pnpm prisma generate
```

### Rate Limit 오류
```
Error: Too many requests
```
- Upstash 대시보드에서 요청 현황 확인
- 개발 중에는 `rate-limit.ts`의 limit 값 조정

### AdMob 광고 미표시
- 테스트 기기 등록 확인
- 개발 모드에서는 테스트 광고만 표시됨
- 프로덕션에서는 실제 Unit ID 사용

---

## 참고 링크

- [Supabase Docs](https://supabase.com/docs)
- [Upstash Docs](https://docs.upstash.com/)
- [Google AdMob](https://developers.google.com/admob)
- [Stripe Docs](https://stripe.com/docs)
- [Toss Payments Docs](https://docs.tosspayments.com/)
- [Gemini API](https://ai.google.dev/docs)
