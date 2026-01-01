# Mobile Structure

> 생성일: 2025-12-31
> 기반: implementation-plan.md

## 기술 스택

- **프레임워크**: Expo (SDK 51)
- **라우팅**: Expo Router v3
- **상태관리**: TanStack Query v5 + Zustand v4
- **인증 저장**: expo-secure-store
- **인증**: Supabase Auth
- **광고**: react-native-google-mobile-ads (AdMob)

## 화면 구조

| Route | 접근 | Description |
|-------|------|-------------|
| / | Public | 스플래시/라우팅 |
| /(auth)/login | Public | 로그인 |
| /(auth)/register | Public | 회원가입 |
| /(tabs)/index | Protected | 채팅 (메인) |
| /(tabs)/library | Protected | 분석 라이브러리 |
| /(tabs)/settings | Protected | 설정 |
| /chat/[session_id] | Protected | 채팅방 |

## 네비게이션 구조

```
app/
├── _layout.tsx           # Root layout (Providers)
├── index.tsx             # Entry point (redirect)
├── (auth)/               # Auth group (공개)
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/               # Tab group (보호)
│   ├── _layout.tsx
│   ├── index.tsx         # Chat list
│   ├── library.tsx       # Analysis library
│   └── settings.tsx      # Settings
└── chat/
    └── [session_id].tsx  # Chat room
```

## 디렉토리 구조

```
apps/mobile/
├── app/                          # Expo Router pages
├── src/
│   ├── components/
│   │   ├── ads/
│   │   │   ├── AdProvider.tsx   # Ad context
│   │   │   └── AdBanner.tsx     # Banner component
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── AnalysisCard.tsx
│   │   │   └── SessionList.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── LoadingScreen.tsx
│   ├── hooks/
│   │   └── ads/
│   │       ├── useInterstitialAd.ts
│   │       └── useRewardedAd.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts        # Axios client
│   │   │   ├── chat.ts          # Chat API
│   │   │   └── analysis.ts      # Analysis API
│   │   ├── auth/
│   │   │   ├── auth-provider.tsx
│   │   │   └── token-storage.ts # SecureStore wrapper
│   │   └── supabase/
│   │       └── client.ts        # Supabase client
│   └── stores/
│       ├── auth-store.ts
│       └── chat-store.ts
├── assets/
│   └── images/
├── app.config.ts                 # Expo config
├── app.json
├── babel.config.js
├── metro.config.js               # Monorepo support
├── package.json
├── tsconfig.json
└── docs/
    └── mobile-structure.md
```

## 인증 흐름

1. 앱 시작 -> AuthProvider 초기화
2. supabase.auth.getSession() 호출
3. 토큰 있음 -> 유효성 검증 -> (tabs)로 이동
4. 토큰 없음/만료 -> (auth)/login으로 이동
5. 토큰 저장: expo-secure-store 사용 (안전한 저장)
6. 토큰 갱신: Supabase Auth 자동 처리

## API 연동

- 기본 URL: `EXPO_PUBLIC_API_URL/api/v1`
- 인증: Authorization Bearer 토큰 (Supabase JWT)
- 토큰 자동 갱신: Axios interceptor에서 처리
- 공유 타입: `@glint/types` 패키지 사용

## 광고 시스템

### 광고 타입
| Type | Component/Hook | 설명 |
|------|----------------|------|
| Banner | `<AdBanner />` | 화면 하단 고정 |
| Interstitial | `useInterstitialAd()` | 전환 시 표시 (쿨다운 60초) |
| Rewarded | `useRewardedAd()` | 24시간 광고 제거 보상 |

### 광고 정책
- FREE 플랜: 광고 표시
- LIGHT/PRO/BUSINESS: 광고 없음
- 리워드 광고 시청: 24시간 임시 프리미엄

## 공유 패키지 사용

```typescript
// 타입 가져오기
import type { Profile, ChatSession, AnalysisResult } from '@glint/types';
import { ErrorCode, ErrorMessages } from '@glint/types';
```

## 환경변수

```bash
# .env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=
EXPO_PUBLIC_ADMOB_IOS_APP_ID=
EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID=
EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID=
EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID=
```

## 실행 방법

```bash
# 의존성 설치
cd apps/mobile
pnpm install

# 개발 서버 시작
pnpm start

# iOS 시뮬레이터
pnpm ios

# Android 에뮬레이터
pnpm android
```

## 보안 체크리스트

- [x] 토큰 저장: `expo-secure-store` 사용
- [x] API Key: 환경변수로 관리 (하드코딩 X)
- [x] 인증 체크: 보호된 화면 접근 전 확인
- [x] 토큰 갱신: Axios interceptor에서 자동 처리
- [ ] 프로덕션 로그: 민감정보 로깅 제거 필요

## 추가 구현 필요

- [ ] Push 알림 (expo-notifications)
- [ ] 온보딩 플로우
- [ ] 에러 바운더리
- [ ] 오프라인 지원
- [ ] 딥링크 처리
- [ ] 앱 아이콘/스플래시 이미지

## 빌드

```bash
# EAS Build 설정
eas build:configure

# 개발 빌드
eas build --platform ios --profile development
eas build --platform android --profile development

# 프로덕션 빌드
eas build --platform all --profile production
```
