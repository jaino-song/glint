# Development Context: Glint

> Phase 간 컨텍스트 전달 및 개발 가이드

---

## 1. 프로젝트 핵심 정보

| 항목 | 값 |
|------|-----|
| **Project Name** | Glint |
| **Project Path** | `/Users/jaino/Development/glint` |
| **Architecture** | Hybrid (Next.js + Supabase + Python Worker) |
| **Platforms** | Web + Mobile |
| **Payments** | Stripe + Toss |

---

## 2. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │  Web (Next)  │              │ Mobile (Expo)│                 │
│  │  + AdSense   │              │  + AdMob     │                 │
│  └──────┬───────┘              └──────┬───────┘                 │
└─────────┼──────────────────────────────┼────────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes (/api/v1)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │   Chat   │ │ Analysis │ │ Payments │           │
│  └──────────┘ └──────────┘ └────┬─────┘ └──────────┘           │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│    Supabase      │    │  Redis (Upstash) │    │  Python Worker   │
│  - Auth          │    │  - Queue         │    │  - Deep Mode     │
│  - PostgreSQL    │    │  - Cache         │    │  - Video DL      │
│  - RLS           │    │  - Rate Limit    │    │  - Gemini API    │
│  - Realtime      │    │                  │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 3. 핵심 비즈니스 로직

### 3-1. 분석 모드

| Mode | Model | Cost | 제한 | 대상 |
|------|-------|------|------|------|
| Standard | Gemini 3.0 Flash | 1 Credit | 자막 분석 | 전체 |
| Deep | Gemini 3.0 Pro (Thinking) | 15 Credits/5min | 영상 시각 분석 | Pro/Biz |

### 3-2. 플랜별 제한

| Plan | 영상 최대 길이 | 일일 분석 | Deep Mode |
|------|:-------------:|:---------:|:---------:|
| Free | 10분 | 3회 | ❌ |
| Light | 30분 | 20회 | ❌ |
| Pro | 60분 | 50회 | ✅ |
| Business | 120분 | 200회 | ✅ |

### 3-3. 크레딧 플로우

```
요청 → 제한 체크 → 선차감 → 분석 → 성공/실패(환불)
```

### 3-4. 광고 정책

- Free: 광고 노출
- 유료: 광고 비노출
- 리워드 광고: 24시간 임시 프리미엄

---

## 4. 데이터베이스 핵심 테이블

| 테이블 | 용도 | 비고 |
|--------|------|------|
| `profiles` | 사용자 프로필 | Supabase Auth 연동 |
| `chat_sessions` | 채팅 세션 | |
| `chat_messages` | 채팅 메시지 | analysis_ref_id로 분석 연결 |
| `analysis_results` | 분석 결과 캐시 | (video_id, mode) 유니크 |
| `analysis_jobs` | 비동기 작업 추적 | credits_reserved로 선차감 |
| `integration_notion` | Notion OAuth | 토큰 암호화 저장 |
| `notion_exports` | Notion 내보내기 매핑 | sync_version으로 Optimistic Lock |
| `subscriptions` | 구독 정보 | Stripe/Toss 연동 |
| `credit_transactions` | 크레딧 내역 | 원자적 처리 |
| `daily_usage` | 일일 사용량 | 제한 체크용 |
| `webhook_events` | Webhook 로그 | 중복 처리 방지 |
| `ad_events` | 광고 이벤트 | 파티셔닝 적용 |
| `temporary_premium_access` | 임시 프리미엄 | 리워드 광고용 |

---

## 5. API 버저닝

모든 API는 `/api/v1/` 프리픽스 사용:

```
/api/v1/auth/*
/api/v1/chat/*
/api/v1/analysis/*
/api/v1/notion/*
/api/v1/subscription/*
/api/v1/credits/*
/api/v1/ads/*
/api/v1/notifications/*
/api/v1/admin/*
```

---

## 6. 에러 코드 체계

```typescript
// packages/types/src/errors.ts
export enum ErrorCode {
  // Auth
  AUTH_INVALID_TOKEN = 'AUTH_001',
  AUTH_SESSION_EXPIRED = 'AUTH_002',

  // Credits
  CREDITS_INSUFFICIENT = 'CREDITS_001',

  // Analysis
  ANALYSIS_URL_INVALID = 'ANALYSIS_001',
  ANALYSIS_VIDEO_TOO_LONG = 'ANALYSIS_002',
  ANALYSIS_DEEP_MODE_UNAVAILABLE = 'ANALYSIS_003',
  ANALYSIS_DAILY_LIMIT_REACHED = 'ANALYSIS_004',

  // Notion
  NOTION_NOT_CONNECTED = 'NOTION_001',
  NOTION_SYNC_CONFLICT = 'NOTION_002',
}
```

---

## 7. 보안 체크리스트

- [ ] RLS 정책 모든 테이블 적용
- [ ] Notion Token 암호화 (AES-256-GCM)
- [ ] Webhook 서명 검증 (Stripe/Toss)
- [ ] Rate Limiting (Upstash)
- [ ] YouTube URL 화이트리스트 검증
- [ ] API Key 해시 저장 및 로테이션
- [ ] 감사 로그 기록
- [ ] 민감정보 로깅 금지

---

## 8. Phase 진행 상황

| Phase | 상태 | 설명 |
|-------|:----:|------|
| Phase 0 (Planning) | ✅ | implementation-plan.md 생성 완료 |
| Phase 1 (Foundation) | ⏳ | 대기 중 |
| Phase 2 (Chat & Standard) | ⏳ | 대기 중 |
| Phase 3 (Worker & Deep) | ⏳ | 대기 중 |
| Phase 4 (Notion) | ⏳ | 대기 중 |
| Phase 5 (Payments) | ⏳ | 대기 중 |
| Phase 6 (Ads) | ⏳ | 대기 중 |
| Phase 7 (Admin) | ⏳ | 대기 중 |
| Phase 8 (Mobile) | ⏳ | 대기 중 |
| Phase 9 (Launch) | ⏳ | 대기 중 |

---

## 9. 환경 구성

### 개발 환경
```bash
# 의존성 설치
pnpm install

# Supabase 타입 생성
pnpm run generate:types

# 개발 서버
pnpm dev
```

### 환경별 Supabase
| 환경 | 프로젝트 |
|------|----------|
| Development | glint-dev |
| Staging | glint-staging |
| Production | glint-prod |

---

## 10. 다음 단계

**Phase 1 시작 전 준비:**
1. Supabase 프로젝트 생성
2. 환경 변수 설정
3. `pnpm create turbo@latest` 실행
4. Supabase CLI로 마이그레이션 실행

**Phase 1 시작 명령:**
```
"Backend 시작해줘" 또는 "구현 시작해줘"
```

---

*이 문서는 Phase 진행에 따라 업데이트됩니다.*
