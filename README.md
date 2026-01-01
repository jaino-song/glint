# Glint

> **Gemini 3.0 Pro 기반 초정밀 영상 분석 및 지식 관리 SaaS**
> *"Capture every spark of insight."*

## Overview

- **목적**: YouTube 영상을 AI로 분석하여 구조화된 인사이트 제공
- **대상 사용자**: 리서처, 크리에이터, 학생, 직장인
- **주요 기능**: Chat-First 인터페이스, Standard/Deep 분석, Notion 연동, 크레딧 시스템

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Web (Next.js) │     │  Mobile (Expo)  │
│   :3000         │     │                 │
└────────┬────────┘     └────────┬────────┘
         │ proxy                  │ direct
         ▼                        ▼
┌─────────────────────────────────────────┐
│         Backend (NestJS) :4000          │
│    Prisma + Supabase Auth Verification  │
└────────────────────┬────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    Supabase     │     │  Python Worker  │
│ (PostgreSQL,    │     │  (Deep Mode)    │
│  Auth, Storage) │     │  추후 구현       │
└─────────────────┘     └─────────────────┘
```

## Tech Stack

### Backend (NestJS)
| Layer | Technology |
|-------|------------|
| Framework | NestJS 10 + Prisma 5 |
| Auth | Supabase JWT Verification |
| Database | Supabase PostgreSQL |
| Documentation | Swagger |

### Web (Next.js)
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Auth | Supabase SSR |
| API | Proxy to Backend |
| Styling | Tailwind CSS + CVA |
| State | TanStack Query v5 + Zustand v4 |
| Form | React Hook Form + Zod |
| i18n | next-intl (ko, en, ja) |
| Rate Limiting | Upstash Redis |

### Mobile (Expo)
| Layer | Technology |
|-------|------------|
| Framework | Expo Router v3 (SDK 51) |
| State | TanStack Query v5 + Zustand v4 |
| Secure Storage | expo-secure-store |
| Ads | Google AdMob |

### Worker (추후 구현)
| Layer | Technology |
|-------|------------|
| Framework | FastAPI |
| Task Queue | Celery + Redis |
| AI | Google Gemini API |

## Project Structure

```
glint/
├── apps/
│   ├── backend/                 # NestJS API 서버
│   │   ├── src/
│   │   │   ├── common/          # Guards, Decorators, Filters
│   │   │   ├── modules/         # Auth, Chat, Analysis, Credits, Ads
│   │   │   └── prisma/          # Prisma service
│   │   ├── prisma/schema.prisma # DB Schema
│   │   └── docs/
│   │       └── backend-structure.md
│   ├── web/                     # Next.js 웹 앱 (Frontend + Proxy)
│   │   ├── src/
│   │   │   ├── app/             # App Router (pages + api proxy)
│   │   │   ├── components/      # UI, Chat, Providers
│   │   │   ├── hooks/           # React Query hooks
│   │   │   ├── lib/             # Supabase, API Proxy, Utils
│   │   │   ├── stores/          # Zustand stores
│   │   │   └── messages/        # i18n translations
│   │   └── docs/
│   │       └── frontend-structure.md
│   └── mobile/                  # Expo 모바일 앱
│       ├── app/                 # Expo Router
│       ├── src/
│       │   ├── components/      # Ads, Chat, Common
│       │   ├── hooks/           # Ad hooks
│       │   ├── lib/             # Auth, API, Supabase
│       │   └── stores/          # Zustand stores
│       └── docs/
│           └── mobile-structure.md
├── packages/
│   ├── types/                   # 공유 TypeScript 타입
│   │   └── src/
│   │       ├── entities/        # Entity 타입
│   │       ├── api/             # API Response 타입
│   │       └── errors/          # ErrorCode, ErrorMessages
│   └── validators/              # 공유 Zod 스키마
│       └── src/
│           ├── auth.ts          # 인증 스키마
│           ├── chat.ts          # 채팅 스키마
│           ├── analysis.ts      # 분석 스키마
│           └── ads.ts           # 광고 스키마
├── supabase/
│   └── migrations/              # SQL 마이그레이션
│       ├── 00001_initial_schema.sql
│       ├── 00002_rls_policies.sql
│       └── 00003_functions.sql
├── docs/
│   ├── implementation-plan.md   # 전체 구현 계획
│   └── dev-context.md           # 개발 컨텍스트
├── package.json                 # Root package.json
├── pnpm-workspace.yaml          # pnpm workspace 설정
└── turbo.json                   # Turborepo 설정
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase CLI (선택)

### Installation

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env

# 환경 변수 편집
# - Supabase URL & Keys
# - Upstash Redis credentials
# - AdMob Unit IDs (모바일)
```

### Development

```bash
# 전체 앱 실행 (Turborepo)
pnpm dev

# 개별 실행
pnpm --filter @glint/backend start:dev  # Backend (localhost:4000)
pnpm --filter @glint/web dev            # Web (localhost:3000)
pnpm --filter @glint/mobile start       # Mobile
```

### Backend Setup

```bash
cd apps/backend

# Prisma 클라이언트 생성
pnpm prisma generate

# 환경 변수 설정
cp .env.example .env.local
```

### Database Setup

```bash
# Supabase 마이그레이션 적용
cd supabase
supabase db push
# 또는 Supabase Dashboard에서 SQL 실행
```

## Documentation

| Document | Description |
|----------|-------------|
| [Implementation Plan](./docs/implementation-plan.md) | 전체 구현 계획 |
| [Backend Structure](./apps/backend/docs/backend-structure.md) | API 서버 구조 |
| [Frontend Structure](./apps/web/docs/frontend-structure.md) | 웹 앱 구조 |
| [Mobile Structure](./apps/mobile/docs/mobile-structure.md) | 모바일 앱 구조 |

## Environment Variables

### Backend (.env.local)

| Key | Description | Required |
|-----|-------------|:--------:|
| `DATABASE_URL` | Supabase PostgreSQL URL | Yes |
| `SUPABASE_URL` | Supabase 프로젝트 URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Yes |
| `PORT` | Server port (default: 4000) | No |

### Web (.env.local)

| Key | Description | Required |
|-----|-------------|:--------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Yes |
| `BACKEND_URL` | Backend API URL (default: localhost:4000) | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | Yes |
| `NEXT_PUBLIC_APP_URL` | App URL | Yes |

### Mobile (.env)

| Key | Description | Required |
|-----|-------------|:--------:|
| `EXPO_PUBLIC_API_URL` | Backend API URL | Yes |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | Yes |
| `EXPO_PUBLIC_ADMOB_*` | AdMob Unit IDs | Yes |

## API Routes (Web)

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /api/v1/auth/me | Yes | 내 정보 조회 |
| PATCH | /api/v1/auth/me | Yes | 내 정보 수정 |
| POST | /api/v1/auth/logout | Yes | 로그아웃 |
| GET | /api/v1/chat/sessions | Yes | 세션 목록 |
| POST | /api/v1/chat/sessions | Yes | 세션 생성 |
| GET | /api/v1/chat/sessions/[id] | Yes | 세션 상세 |
| POST | /api/v1/chat/sessions/[id]/messages | Yes | 메시지 전송 |
| POST | /api/v1/analysis/standard | Yes | Standard 분석 |
| GET | /api/v1/analysis/[id] | Yes | 분석 결과 |
| GET | /api/v1/credits | Yes | 크레딧 조회 |
| GET | /api/v1/ads/config | No | 광고 설정 |

## Database Schema

주요 테이블:

- `profiles` - 사용자 프로필 (credits, plan)
- `chat_sessions` - 채팅 세션
- `chat_messages` - 채팅 메시지
- `analysis_results` - 분석 결과 (video_id, mode, result_json)
- `analysis_jobs` - 분석 작업 큐
- `credit_transactions` - 크레딧 트랜잭션
- `subscriptions` - 구독 정보
- `daily_usage` - 일일 사용량
- `ad_configs` - 광고 설정
- `ad_events` - 광고 이벤트 (파티셔닝)

상세 스키마: [`supabase/migrations/`](./supabase/migrations/)

## Security Features

- **RLS (Row Level Security)**: 모든 테이블에 적용
- **Atomic Credits**: `deduct_credits()` 함수로 원자적 처리
- **Token Storage**:
  - Web: httpOnly 쿠키 (Supabase SSR)
  - Mobile: expo-secure-store
- **Rate Limiting**: Upstash Redis 기반 sliding window
- **Input Validation**: Zod 스키마 (클라이언트 + 서버)

## Ads System

| Platform | Type | Component/Hook |
|----------|------|----------------|
| Web | Banner | AdSense (추후) |
| Mobile | Banner | `<AdBanner />` |
| Mobile | Interstitial | `useInterstitialAd()` (60초 쿨다운) |
| Mobile | Rewarded | `useRewardedAd()` (24시간 광고 제거) |

## Roadmap

- [x] Phase 1: Core Structure (Monorepo, Types, Validators, Migrations)
- [x] Phase 2: Backend (NestJS + Prisma + Supabase Auth)
- [x] Phase 3: Web App (Next.js + API Proxy)
- [x] Phase 4: Mobile App (Expo Router + AdMob)
- [ ] Phase 5: Python Worker (Gemini API Integration)
- [ ] Phase 6: Payments (Stripe, Toss)
- [ ] Phase 7: Notion Integration
- [ ] Phase 8: Push Notifications

## Contributing

```bash
# 새 브랜치 생성
git checkout -b feature/your-feature

# 변경사항 커밋
git commit -m "feat: add your feature"

# PR 생성
gh pr create
```

## License

Private - All Rights Reserved

---

*Generated by Fullstack Generator Skill*
