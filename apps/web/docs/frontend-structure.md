# Frontend Structure - Glint Web App

> 생성일: 2025-12-31
> 기반: implementation-plan.md (Phase 1-2)

## 기술 스택

| Layer | Technology |
|-------|------------|
| **프레임워크** | Next.js 14 (App Router) |
| **상태관리** | TanStack Query + Zustand |
| **스타일링** | Tailwind CSS + CVA |
| **폼** | React Hook Form + Zod |
| **Auth & DB** | Supabase (Auth, PostgreSQL, RLS) |
| **i18n** | next-intl (ko, en, ja) |
| **Rate Limiting** | Upstash Redis |

## 프로젝트 구조

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (Providers)
│   │   ├── globals.css             # Global styles
│   │   ├── (public)/               # Public pages
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── login/page.tsx      # Login
│   │   │   └── register/page.tsx   # Register
│   │   ├── (protected)/            # Auth required
│   │   │   ├── layout.tsx          # Protected layout + Sidebar
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx        # New chat
│   │   │   │   └── [session_id]/page.tsx  # Chat session
│   │   │   ├── library/page.tsx    # Analysis history
│   │   │   └── settings/page.tsx   # User settings
│   │   └── api/v1/                 # API Routes
│   │       ├── auth/
│   │       │   ├── me/route.ts
│   │       │   └── logout/route.ts
│   │       ├── chat/
│   │       │   └── sessions/
│   │       │       ├── route.ts
│   │       │       └── [id]/
│   │       │           ├── route.ts
│   │       │           └── messages/route.ts
│   │       ├── analysis/
│   │       │   ├── standard/route.ts
│   │       │   └── [id]/route.ts
│   │       ├── credits/route.ts
│   │       └── ads/config/route.ts
│   ├── components/
│   │   ├── ui/                     # 공통 UI 컴포넌트
│   │   │   ├── button.tsx          # CVA 기반 Button
│   │   │   ├── input.tsx           # Form input
│   │   │   ├── card.tsx            # Card variants
│   │   │   ├── avatar.tsx          # User avatar
│   │   │   ├── badge.tsx           # Status badges
│   │   │   ├── spinner.tsx         # Loading states
│   │   │   └── index.ts
│   │   ├── chat/                   # Chat 도메인 컴포넌트
│   │   │   ├── chat-input.tsx      # URL/텍스트 자동 전환
│   │   │   ├── chat-message.tsx    # 메시지 버블
│   │   │   ├── chat-sidebar.tsx    # 세션 히스토리
│   │   │   ├── analysis-card.tsx   # 분석 결과 카드
│   │   │   └── index.ts
│   │   └── providers/              # Context providers
│   │       ├── query-provider.tsx  # TanStack Query
│   │       ├── auth-provider.tsx   # Supabase Auth
│   │       └── index.tsx
│   ├── hooks/                      # Custom hooks
│   │   ├── use-auth.ts             # Auth hooks (useUser, useLogin, etc.)
│   │   ├── use-chat.ts             # Chat hooks (useChatSessions, etc.)
│   │   ├── use-analysis.ts         # Analysis hooks
│   │   ├── use-credits.ts          # Credits hook
│   │   └── index.ts
│   ├── lib/
│   │   ├── supabase/               # Supabase clients
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   ├── middleware.ts       # Session middleware
│   │   │   └── index.ts
│   │   ├── api/                    # API utilities
│   │   │   ├── client.ts           # API client wrapper
│   │   │   ├── helpers.ts          # Response helpers
│   │   │   ├── rate-limit.ts       # Upstash rate limiting
│   │   │   └── index.ts
│   │   ├── utils/                  # Utilities
│   │   │   ├── cn.ts               # Class name merger
│   │   │   └── index.ts
│   │   └── query-client.ts         # TanStack Query client
│   ├── stores/                     # Zustand stores
│   │   ├── ui-store.ts             # UI state (sidebar, theme)
│   │   ├── auth-store.ts           # Auth state
│   │   ├── chat-store.ts           # Chat state
│   │   └── index.ts
│   ├── types/
│   │   └── supabase.ts             # Auto-generated DB types
│   ├── messages/                   # i18n translations
│   │   ├── ko.json
│   │   ├── en.json
│   │   └── ja.json
│   ├── i18n.ts                     # i18n configuration
│   └── middleware.ts               # Next.js middleware
├── public/
│   └── favicon.ico
├── docs/
│   └── frontend-structure.md       # This file
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

## 페이지 구조

| Route | 접근 | Description |
|-------|------|-------------|
| `/` | Public | 랜딩 페이지 |
| `/login` | Public | 로그인 |
| `/register` | Public | 회원가입 |
| `/chat` | Protected | 새 채팅 시작 |
| `/chat/[session_id]` | Protected | 채팅 세션 |
| `/library` | Protected | 분석 히스토리 |
| `/settings` | Protected | 사용자 설정 |

## 컴포넌트 구조

### UI Components (`components/ui/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | variant, size, isLoading, leftIcon, rightIcon | CVA 기반 버튼 |
| `Input` | label, error, helperText, leftIcon, rightIcon | 폼 입력 필드 |
| `Card` | - | 카드 컨테이너 (Header, Content, Footer) |
| `Avatar` | src, fallback, size | 사용자 아바타 |
| `Badge` | variant | 상태 표시 뱃지 |
| `Spinner` | size | 로딩 스피너 |

### Chat Components (`components/chat/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `ChatInput` | onSubmit, isLoading, placeholder | URL/텍스트 자동 감지 입력 |
| `ChatMessage` | message, userName, userAvatar | 메시지 버블 (user/assistant) |
| `ChatSidebar` | - | 세션 목록 + 네비게이션 |
| `AnalysisCard` | analysisId | 분석 결과 카드 |

## 상태 관리 전략

| 상태 유형 | 도구 | 예시 |
|----------|------|------|
| 서버 상태 | TanStack Query | 사용자 정보, 세션 목록, 분석 결과 |
| 클라이언트 상태 | Zustand | 사이드바 열림/닫힘, 현재 세션 ID |
| 폼 상태 | React Hook Form | 로그인 폼, 설정 폼 |
| URL 상태 | Next.js Router | 페이지 파라미터 |

### Zustand Stores

| Store | State | Description |
|-------|-------|-------------|
| `useUIStore` | sidebarOpen, theme, mobileMenuOpen | UI 상태 |
| `useAuthStore` | user, isLoading | 인증 상태 |
| `useChatStore` | currentSessionId, pendingMessages, inputValue | 채팅 상태 |

## API 연동 (React Query Hooks)

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useUser` | GET /api/v1/auth/me | 현재 사용자 정보 |
| `useLogin` | Supabase Auth | 로그인 |
| `useRegister` | Supabase Auth | 회원가입 |
| `useLogout` | Supabase Auth + POST /api/v1/auth/logout | 로그아웃 |
| `useChatSessions` | GET /api/v1/chat/sessions | 세션 목록 |
| `useChatSession` | GET /api/v1/chat/sessions/[id] | 세션 상세 + 메시지 |
| `useCreateSession` | POST /api/v1/chat/sessions | 새 세션 생성 |
| `useSendMessage` | POST /api/v1/chat/sessions/[id]/messages | 메시지 전송 |
| `useStandardAnalysis` | POST /api/v1/analysis/standard | Standard 분석 |
| `useAnalysisResult` | GET /api/v1/analysis/[id] | 분석 결과 조회 |
| `useCredits` | GET /api/v1/credits | 크레딧 조회 |

## API Routes

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /api/v1/auth/me | Required | 내 정보 조회 |
| PATCH | /api/v1/auth/me | Required | 내 정보 수정 |
| POST | /api/v1/auth/logout | Required | 로그아웃 |
| GET | /api/v1/chat/sessions | Required | 세션 목록 |
| POST | /api/v1/chat/sessions | Required | 세션 생성 |
| GET | /api/v1/chat/sessions/[id] | Required | 세션 상세 |
| PATCH | /api/v1/chat/sessions/[id] | Required | 세션 수정 |
| DELETE | /api/v1/chat/sessions/[id] | Required | 세션 삭제 |
| POST | /api/v1/chat/sessions/[id]/messages | Required | 메시지 전송 |
| POST | /api/v1/analysis/standard | Required | Standard 분석 |
| GET | /api/v1/analysis/[id] | Required | 분석 결과 조회 |
| GET | /api/v1/credits | Required | 크레딧 조회 |
| GET | /api/v1/ads/config | Optional | 광고 설정 |

## 환경 변수

| Key | Description | Required |
|-----|-------------|:--------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | Yes |
| `NEXT_PUBLIC_APP_URL` | App URL | Yes |
| `GEMINI_API_KEY` | Gemini API Key | No (Phase 2) |

## 실행 방법

```bash
# 프로젝트 루트에서
cd apps/web

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집

# 의존성 설치
pnpm install

# 개발 서버 시작
pnpm dev
```

## 주요 패턴

### API Response 형식

모든 API는 `@glint/types`의 `ApiResponse` 형식 사용:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}
```

### 입력 검증

`@glint/validators`의 Zod 스키마 사용:

```typescript
import { loginSchema, type LoginInput } from '@glint/validators';

const { data, error } = validateInput(loginSchema, body);
```

### Rate Limiting

Upstash 기반 sliding window:

```typescript
const result = await checkRateLimit(rateLimiters.chat, userId);
if (!result.success) {
  return errorJson(ErrorCode.RATE_LIMITED, 'Too many requests', 429);
}
```

## 향후 구현 예정 (Phase 3+)

- [ ] Deep Mode 분석 (Python Worker 연동)
- [ ] Notion 연동 (OAuth + Export)
- [ ] 결제 시스템 (Stripe/Toss)
- [ ] 리워드 광고 (AdSense)
- [ ] Push 알림
- [ ] Admin 대시보드

## 특이사항

1. **Supabase RLS**: 모든 데이터 접근은 RLS 정책을 통해 보호됨
2. **Optimistic Updates**: 메시지 전송 시 즉각적인 UI 반영
3. **Server Components**: 가능한 경우 서버 컴포넌트 사용 (성능 최적화)
4. **i18n**: 3개 언어 지원 (ko, en, ja)
5. **Rate Limiting**: API별 요청 제한 적용
6. **Credit System**: 분석 시 크레딧 선차감/실패 시 환불

---

*Generated by Frontend Developer Subagent*
