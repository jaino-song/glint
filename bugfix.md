# Bugfix Log

## 2026-01-01: Backend & Frontend Dev Server Fixes

### Backend TypeScript Errors

#### 1. `ads.service.ts` - Implicit 'any' type for Prisma config
**File:** `apps/backend/src/modules/notifications/notifications.service.ts:72`
**Error:** `Parameter 'config' implicitly has an 'any' type`

**Fix:** Added Prisma type alias using `Prisma.AdConfigGetPayload<object>`:
```typescript
import { Prisma } from '@prisma/client';

type PrismaAdConfig = Prisma.AdConfigGetPayload<object>;

// Usage
const placements: AdPlacement[] = configs.map((config: PrismaAdConfig) => ({
```

---

#### 2. `notifications.service.ts` - Prisma JSON null handling
**File:** `apps/backend/src/modules/notifications/notifications.service.ts:169`
**Error:** `Type 'Record<string, unknown>' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue'`

**Fix:** Cast to `Prisma.InputJsonValue` and use `Prisma.JsonNull` for null values:
```typescript
import { Prisma } from '@prisma/client';

// Before
data: data.data || null,

// After
data: data.data
  ? (data.data as Prisma.InputJsonValue)
  : Prisma.JsonNull,
```

---

### Node.js 23 ESM Module Resolution

#### 3. Workspace packages not resolving at runtime
**Error:** `ERR_MODULE_NOT_FOUND: Cannot find module '.../packages/types/src/errors'`

**Cause:** Node.js 23 has stricter ESM module resolution. TypeScript source files with `moduleResolution: "bundler"` don't work at runtime.

**Fix:**
1. Updated `packages/types/package.json` and `packages/validators/package.json`:
   - Changed `main` and `types` to point to `./dist/` (compiled output)
   - Added `exports` field with proper type definitions
   - Added `build` script

2. Updated `tsconfig.json` for both packages:
   - Changed `module` from `ESNext` to `CommonJS`
   - Changed `moduleResolution` from `bundler` to `node`

3. Built both packages:
   ```bash
   cd packages/types && pnpm build
   cd packages/validators && pnpm build
   ```

---

### Frontend CSS & Import Errors

#### 4. Tailwind CSS v4/v3 syntax mismatch
**File:** `apps/web/src/app/globals.css`
**Error:** `@layer base is used but no matching @tailwind base directive is present`

**Fix:** Replaced Tailwind v4 syntax with v3:
```css
/* Before (v4) */
@import "tailwindcss";
@theme inline { ... }

/* After (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

#### 5. Invalid Tailwind opacity class
**File:** `apps/web/src/app/globals.css:165`
**Error:** `The 'bg-muted-foreground/30' class does not exist`

**Fix:** Used raw OKLCH value instead of Tailwind class:
```css
/* Before */
@apply bg-muted-foreground/30;

/* After */
background-color: oklch(0.5 0.013 58.071 / 30%);
```

---

#### 6. Server component imported in client context
**File:** `apps/web/src/lib/api/index.ts`
**Error:** `You're importing a component that needs next/headers. That only works in a Server Component`

**Cause:** `lib/api/index.ts` re-exported `helpers.ts` which imports `next/headers` (server-only). This was then imported by client components via the barrel export.

**Fix:** Removed server-only exports from the barrel file:
```typescript
// Before
export * from './client';
export * from './helpers';  // Server-only!
export * from './rate-limit';
export * from './proxy';

// After
export * from './client';
// Note: helpers.ts, rate-limit.ts, proxy.ts are for API routes only (use next/headers)
```

---

### Environment Configuration

#### 7. Invalid Supabase URL format
**Files:** `apps/backend/.env.local`, `apps/web/.env.local`
**Error:** `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL`

**Fix:** Changed from publishable key format to full URL:
```bash
# Before
SUPABASE_URL=sb_publishable_kmbPyRLWvLX_O-edkm0rHw_yRzH7KYg

# After
SUPABASE_URL=https://bpggnjaxnflyaxovtpfu.supabase.co
```

---

## 2026-01-01: Database Error Logging & Profile Creation Fallback

### Issue: "Database error saving new user" with no backend logs

**Symptom:** Frontend shows database error when saving new user, but backend logs show nothing.

**Root Cause:**
- Profile creation happens via Supabase Auth database trigger (`handle_new_user`)
- When trigger fails, error goes directly from PostgreSQL → Supabase → Frontend
- NestJS backend never sees the error because it's not involved in the trigger execution

---

#### 8. Missing Prisma error event logging
**File:** `apps/backend/src/prisma/prisma.service.ts`
**Issue:** Prisma errors were configured to emit events but no event handlers were attached

**Fix:** Added event listeners for query, error, warn, and info levels:
```typescript
// 에러 로그 (항상 출력)
(this as any).$on('error', (e: Prisma.LogEvent) => {
  this.logger.error(`Prisma Error: ${e.message}`, e.target);
});

// 쿼리 로그 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  (this as any).$on('query', (e: Prisma.QueryEvent) => {
    this.logger.debug(`Query: ${e.query}`);
  });
}
```

Also added `formatPrismaError()` static method for human-readable error messages.

---

#### 9. HttpExceptionFilter not catching Prisma errors
**File:** `apps/backend/src/common/filters/http-exception.filter.ts`
**Issue:** Prisma errors were logged as generic "Unhandled error" with minimal details

**Fix:** Added Prisma-specific error detection and detailed logging:
```typescript
if (this.isPrismaError(exception)) {
  const prismaError = PrismaService.formatPrismaError(exception);
  this.logger.error(
    `[Prisma Error] ${prismaError.code}: ${prismaError.message}`,
    JSON.stringify({
      path: request.url,
      method: request.method,
      userId: request.user?.id,
      details: prismaError.details,
      stack: exception.stack,
    }),
  );
}
```

Added proper HTTP status code mapping for Prisma errors:
- P2002 (Unique violation) → 409 Conflict
- P2003/P2025 (FK/Not found) → 404 Not Found
- Validation errors → 400 Bad Request

---

#### 10. No fallback for failed Supabase auth trigger
**File:** `apps/backend/src/modules/auth/auth.service.ts`
**Issue:** If Supabase `handle_new_user` trigger fails, user has valid JWT but no profile in DB

**Fix:** Added `ensureProfile()` method as fallback:
```typescript
async ensureProfile(userData: CreateProfileDto): Promise<Profile> {
  const existingProfile = await this.prisma.profile.findUnique({
    where: { id: userData.id },
  });

  if (existingProfile) {
    return this.mapToProfile(existingProfile);
  }

  // Fallback: create profile if trigger failed
  this.logger.warn(
    `Profile not found for user ${userData.id}, creating fallback profile.`
  );

  const newProfile = await this.prisma.profile.create({
    data: { id: userData.id, email: userData.email, ... }
  });
  return this.mapToProfile(newProfile);
}
```

Updated `GET /api/v1/auth/me` to use `ensureProfile()` instead of `getProfile()`.

---

## 2026-01-01: Missing OAuth Implementation

### Issue: OAuth authentication not implemented despite spec requirement

**Symptom:** Users can only sign in with email/password. No social login options available.

**Root Cause:**
- The Fullstack Generator skill created the implementation plan specifying Supabase Auth
- However, only email/password authentication was implemented in `apps/web/src/hooks/use-auth.ts`
- OAuth providers (Google, Kakao, Naver) were never added

**Spec Reference:** `docs/implementation-plan.md` Section 8-1:
> - Supabase Auth (JWT-based)

The implementation plan mentions Supabase Auth but the code generation only produced email/password flow.

---

#### 11. OAuth hooks not implemented
**File:** `apps/web/src/hooks/use-auth.ts`
**Issue:** Only `useLogin()` with `signInWithPassword` exists, no `signInWithOAuth`

**Fix:** Added `useOAuthLogin()` hook supporting Google, Kakao, Naver:
```typescript
export function useOAuthLogin() {
  return useMutation({
    mutationFn: async (provider: 'google' | 'kakao' | 'naver') => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
      return data;
    },
  });
}
```

---

#### 12. OAuth callback route missing
**File:** `apps/web/src/app/auth/callback/route.ts`
**Issue:** No route to handle OAuth redirect callback from Supabase

**Fix:** Created callback route to exchange code for session.

---

#### 13. OAuth UI buttons missing
**Files:** Login and Register pages
**Issue:** No UI for social login options

**Fix:** Added `OAuthButtons` component with Google, Kakao, Naver buttons.

---

#### 14. Hydration error with useSearchParams
**File:** `apps/web/src/app/(public)/login/page.tsx`
**Issue:** React hydration mismatch error: "Expected server HTML to contain a matching `<a>` in `<div>`"

**Root Cause:**
- `useSearchParams()` causes dynamic rendering
- Server doesn't know URL params, client does
- Mismatch between server and client HTML causes hydration failure

**Fix:** Wrapped the LoginForm component in `<Suspense>` boundary:
```typescript
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />
    </Suspense>
  );
}
```

---

#### 15. OAuth trigger fails for Google users
**File:** `supabase/migrations/00003_functions.sql`
**Issue:** "Database error saving new user" when signing in with Google OAuth

**Root Cause:**
- `handle_new_user()` trigger used `raw_user_meta_data->>'name'`
- Google OAuth stores name in `full_name` or `given_name`, not `name`
- Trigger failed to extract name, causing INSERT to fail

**Fix:** Updated trigger to check multiple name fields with COALESCE:
```sql
v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',  -- Google OAuth
    NEW.raw_user_meta_data->>'name',       -- Kakao OAuth
    NEW.raw_user_meta_data->>'given_name'  -- Fallback
);
```

Added exception handling to prevent trigger failure from blocking user creation.

---

#### 16. Browser extension hydration errors
**File:** `apps/web/src/app/layout.tsx`
**Issue:** Hydration mismatch errors: "Extra attributes from the server: data-new-gr-c-s-check-loaded, data-gr-ext-installed"

**Root Cause:**
- Browser extensions (Grammarly, etc.) inject `data-` attributes into the DOM
- These attributes exist on client but not in server-rendered HTML
- React sees the mismatch and throws hydration error

**Fix:** Added `suppressHydrationWarning` to `<body>` tag (already present on `<html>`):
```tsx
<html lang={locale} suppressHydrationWarning>
  <body suppressHydrationWarning>
```

---

#### 17. Middleware wrong cookie names for session check
**File:** `apps/web/src/middleware.ts`
**Issue:** OAuth login redirects back to `/login?redirect=/chat` instead of `/chat`

**Root Cause:**
- Middleware checked for `sb-access-token` and `sb-refresh-token`
- Supabase SSR uses chunked format: `sb-<project-ref>-auth-token.0`, `.1`, etc.
- Session was never detected, so user was always redirected to login

**Fix:** Updated cookie detection to use dynamic project ref pattern:
```typescript
const SUPABASE_PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
  /https:\/\/([^.]+)\.supabase\.co/
)?.[1];

const hasSession = cookieNames.some(
  (name) => name.startsWith(`sb-${SUPABASE_PROJECT_REF}-auth-token`)
);
```

---

#### 18. Middleware intercepts OAuth callback
**File:** `apps/web/src/middleware.ts`
**Issue:** OAuth callback route was being processed by auth middleware, causing redirect loops

**Fix:** Added early return for `/auth/callback` path:
```typescript
if (pathname === '/auth/callback') {
  return response;
}
```

---

#### 19. LoadingScreen SVG hydration mismatch
**File:** `apps/web/src/components/ui/spinner.tsx`
**Issue:** "Expected server HTML to contain a matching `<svg>` in `<div>`" in ProtectedLayout

**Root Cause:**
- `ProtectedLayout` conditionally renders `LoadingScreen` based on auth state
- Server doesn't know auth state, renders loading screen
- Client knows auth state, may render different content
- Lucide `Loader2` SVG icon doesn't match between server/client

**Fix:** Used mounted state pattern to render CSS spinner on server, Lucide icon on client:
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <div className="animate-spin rounded-full border-4..." />;
}

return <Spinner size="lg" />;
```

---

#### 20. Chat session creation fails with 400 Bad Request (partial fix)
**File:** `apps/web/src/lib/api/client.ts`, `apps/web/src/lib/api/proxy.ts`
**Issue:** Clicking "New Chat" button returns 400 Bad Request

**Initial Investigation:**
- `createSession()` passed `undefined` when no title provided
- API client sent request with no body
- Assumed backend Zod validation expected an object

**Partial Fix (insufficient):** API client always sends empty object:
```typescript
createSession: (data?: { title?: string }) =>
  apiClient.post('/chat/sessions', data ?? {}),
```

**Note:** This fix was incomplete. See issue #21 for the real root cause.

---

#### 21. @UsePipes decorator validates ALL parameters, not just @Body()
**File:** `apps/backend/src/modules/chat/chat.controller.ts`
**Issue:** Chat session creation (and other endpoints) still returned 400 validation error

**Root Cause:**
- `@UsePipes(new ZodValidationPipe(schema))` was applied at method level
- NestJS method-level pipes run on ALL parameters, not just `@Body()`
- The `ZodValidationPipe` tried to validate `userId` (a string) against `createSessionSchema` (expects object)
- Zod threw: "Expected object, received string"

```typescript
// BEFORE (wrong):
@Post('sessions')
@UsePipes(new ZodValidationPipe(createSessionSchema))  // Validates ALL params!
async createSession(
  @CurrentUserId() userId: string,  // ← String validated as object schema = ERROR
  @Body() data: CreateSessionDto,
) { ... }

// AFTER (correct):
@Post('sessions')
async createSession(
  @CurrentUserId() userId: string,
  @Body(new ZodValidationPipe(createSessionSchema)) data: CreateSessionDto,  // ← Pipe only on @Body()
) { ... }
```

**Fix:** Applied `ZodValidationPipe` directly to `@Body()` decorator instead of method level:
- `createSession`: `@Body(new ZodValidationPipe(createSessionSchema))`
- `updateSession`: `@Body(new ZodValidationPipe(updateSessionSchema))`
- `sendMessage`: `@Body(new ZodValidationPipe(sendMessageSchema))`

---

#### 22. Chat sidebar shrinks main content instead of overlaying
**Files:** `apps/web/src/app/(protected)/layout.tsx`, `apps/web/src/components/chat/chat-sidebar.tsx`
**Issue:** Sidebar pushed main content aside instead of overlaying. No way to close sidebar by clicking outside. Both "New Chat" and a session could appear active simultaneously.

**Root Cause:**
- Layout used `flex` container where sidebar took width from main content
- No backdrop to capture outside clicks
- Session active state checked `pathname === /chat/${id}` but didn't account for `/chat` (new chat page)

**Fix:**
1. **Overlay mode**: Changed sidebar to `position: fixed` with `z-index: 30`, uses `translate-x` for show/hide
2. **Backdrop**: Added semi-transparent backdrop (`z-index: 20`) that closes sidebar on click
3. **Active state logic**:
   - New Chat button now shows active state when on `/chat`
   - Session items only show active when NOT on `/chat` page
4. **Auto-close**: Sidebar closes when clicking any navigation link

```tsx
// Layout - Overlay approach
{sidebarOpen && (
  <div
    className="fixed inset-0 z-20 bg-black/30"
    onClick={() => setSidebarOpen(false)}
  />
)}
<div className={cn(
  'fixed left-0 top-0 z-30 h-full transition-transform',
  sidebarOpen ? 'translate-x-0' : '-translate-x-full'
)}>
  <ChatSidebar />
</div>

// Sidebar - Active state
const isNewChatPage = pathname === '/chat';
const isSessionActive = !isNewChatPage && pathname === `/chat/${session.id}`;
```

---

#### 23. Authentication redirect loop between /chat and /login
**Files:** `apps/web/src/middleware.ts`, `apps/web/src/lib/supabase/middleware.ts`, `apps/web/src/hooks/use-auth.ts`, `apps/web/src/app/(protected)/layout.tsx`
**Issue:** After OAuth login, user gets stuck in redirect loop between /chat and /login

**Root Cause (multiple issues):**
1. **Middleware checked cookie existence, not validity**: Even with expired/invalid cookies, middleware thought user was authenticated
2. **useUser hook returned null instead of throwing**: React Query's `error` state was never set, preventing redirect logic
3. **router.push unreliable for redirect**: Next.js router sometimes failed to navigate from protected layout

**Fix:**

1. **Middleware validates actual user** - Changed from cookie check to `supabase.auth.getUser()`:
```typescript
// middleware.ts - BEFORE (wrong)
const hasSession = cookieNames.some(name => name.startsWith(`sb-${ref}-auth-token`));
const isAuthenticated = hasSession;

// middleware.ts - AFTER (correct)
const { response, user } = await updateSession(request);
const isAuthenticated = !!user;
```

2. **updateSession returns user object**:
```typescript
// lib/supabase/middleware.ts
const { data: { user } } = await supabase.auth.getUser();
return { response, user };
```

3. **useUser throws error on auth failure**:
```typescript
// hooks/use-auth.ts - BEFORE
if (!response.success) {
  setUser(null);
  return null;  // Never triggers error state!
}

// AFTER
if (!response.success) {
  setUser(null);
  throw new Error(response.error?.message || 'Not authenticated');
}
```

4. **window.location.href for reliable redirect**:
```typescript
// (protected)/layout.tsx
if (!userLoading && !user && error && !hasRedirected.current) {
  hasRedirected.current = true;
  window.location.href = '/login';  // More reliable than router.push
}
```

---

#### 24. New Chat button styling issues when inactive
**File:** `apps/web/src/components/chat/chat-sidebar.tsx`
**Issue:** New Chat button had multiple styling problems when not on `/chat` page:
1. Button was nearly invisible due to low contrast colors
2. Border visible when inactive (unwanted outline)

**Root Cause:**
- Inactive state used `bg-sidebar-accent/50` (50% opacity of accent color)
- When sidebar background is similar to accent color, button blends in
- `outline` variant adds a visible border by design

**Fix:** Changed to `ghost` variant (no border, no background):
```tsx
// BEFORE (border visible)
<Button
  variant={isNewChatPage ? 'default' : 'outline'}
  className={cn(
    'w-full justify-start',
    isNewChatPage
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/20'
  )}
>

// AFTER (clean, no border)
<Button
  variant={isNewChatPage ? 'primary' : 'ghost'}
  className={cn(
    'w-full justify-start',
    isNewChatPage
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
  )}
>
```

**Notes:**
- `ghost` variant: transparent background, no border, text only
- `primary` instead of `default`: Button component uses semantic variants
- Removed `border-sidebar-border` class since ghost has no border to style

---

#### 25. Chat sessions created for non-YouTube inputs
**File:** `apps/web/src/app/(protected)/chat/page.tsx`
**Issue:** Chat sessions were being created even when user submitted regular text instead of YouTube links

**Root Cause:**
- `handleSubmit` always created a session regardless of input type
- Both 'chat' and 'analysis' types triggered `createSession.mutateAsync()`
- This created orphan sessions with no associated analysis

**Fix:** Early return for non-analysis inputs:
```typescript
// BEFORE (creates session for any input)
const handleSubmit = async (content: string, type: 'chat' | 'analysis') => {
  const session = await createSession.mutateAsync(undefined);
  if (type === 'analysis') {
    await standardAnalysis.mutateAsync({ url: content, sessionId: session.id });
  } else {
    await sendMessage.mutateAsync({ sessionId: session.id, content });
  }
  router.push(`/chat/${session.id}`);
};

// AFTER (only creates session for YouTube links)
const handleSubmit = async (content: string, type: 'chat' | 'analysis') => {
  if (type !== 'analysis') {
    return;  // Early return - no session created
  }
  const session = await createSession.mutateAsync(undefined);
  await standardAnalysis.mutateAsync({ url: content, sessionId: session.id });
  router.push(`/chat/${session.id}`);
};
```

Also removed unused `useSendMessage` import.

---

#### 26. LoadingScreen hydration mismatch with Lucide icon
**File:** `apps/web/src/components/ui/spinner.tsx`
**Issue:** Hydration error: `className did not match. Server: "css-1rld6j7" Client: "h-8 w-8 animate-spin..."`

**Root Cause:**
- Previous fix (#19) used `mounted` state pattern to render CSS spinner on server, Lucide icon on client
- This caused the OPPOSITE mismatch - server rendered Lucide (with CSS-in-JS class), client started with CSS spinner
- The `useState(false)` + `useEffect` pattern doesn't work reliably with SSR in this case

**Fix:** Replace Lucide icon with pure CSS spinner everywhere:
```typescript
// BEFORE (mounted pattern with Lucide)
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-primary', sizeClasses[size], className)}
    />
  );
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="..."><div className="h-8 w-8 animate-spin..." /></div>;
  }
  return <div className="..."><Spinner size="lg" /></div>;
}

// AFTER (CSS-only, no state)
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="...">
      <Spinner size="lg" />
      {message && <p>...</p>}
    </div>
  );
}
```

**Notes:**
- Removed `'use client'` directive (no hooks needed)
- Removed Lucide `Loader2` import
- CSS spinner renders identically on server and client

---

#### 27. ProtectedLayout hydration mismatch with Zustand state
**File:** `apps/web/src/app/(protected)/layout.tsx`
**Issue:** Persistent hydration errors - `css-1rld6j7` (server) vs Tailwind classes (client)

**Root Cause:**
- Layout conditionally renders based on Zustand store state
- Server creates fresh store, client may have different state
- External `LoadingScreen` component import caused caching issues
- Browser cache served stale HTML even after code changes

**Fix:**
1. Inline the loading screen component to avoid import caching
2. Use `mounted` state for consistent initial render

```typescript
// Inline loading - avoids component import caching
function InlineLoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);

if (!mounted || isLoading || userLoading) {
  return <InlineLoadingScreen message="Loading..." />;
}
```

**Browser cache workaround:**
- Hard refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
- Or: DevTools → Network → "Disable cache" → refresh
- Verified working via Playwright test (fresh browser = no errors)

---

#### 28. Analysis endpoint validation fails on YouTube link submission
**File:** `apps/backend/src/modules/analysis/analysis.controller.ts`
**Issue:** POST /api/v1/analysis/standard returns 400 "Validation failed" when submitting YouTube link

**Root Cause:**
- Same issue as #21: `@UsePipes(new ZodValidationPipe(standardAnalysisSchema))` at method level
- NestJS method-level pipes validate ALL parameters
- `userId` (string) validated against `standardAnalysisSchema` (expects object) → fails

**Fix:** Move validation pipe to `@Body()` decorator:
```typescript
// BEFORE (wrong)
@Post('standard')
@UsePipes(new ZodValidationPipe(standardAnalysisSchema))
async startStandardAnalysis(
  @CurrentUserId() userId: string,
  @Body() data: StartAnalysisDto,
) { ... }

// AFTER (correct)
@Post('standard')
async startStandardAnalysis(
  @CurrentUserId() userId: string,
  @Body(new ZodValidationPipe(standardAnalysisSchema)) data: StartAnalysisDto,
) { ... }
```

---

## 2026-01-02: Validation Logging & PostgreSQL Type Casting

#### 29. HttpExceptionFilter doesn't log validation error details
**File:** `apps/backend/src/common/filters/http-exception.filter.ts`
**Issue:** Backend log shows `Validation failed` but no details about which field failed or why

**Root Cause:**
- Line 93 only logged `message`, not `details`
- Validation errors from ZodValidationPipe include `details.errors` array
- Developers couldn't debug validation failures without seeing the actual field errors

**Fix:** Include details in 4xx error logs:
```typescript
// BEFORE
this.logger.warn(`[HTTP ${status}] ${request.method} ${request.url}: ${message}`);

// AFTER
const detailsStr = details ? ` | Details: ${JSON.stringify(details)}` : '';
this.logger.warn(`[HTTP ${status}] ${request.method} ${request.url}: ${message}${detailsStr}`);
```

Now logs show: `[HTTP 400] POST /api/v1/analysis/standard: Validation failed | Details: {"errors":[{"field":"url","message":"Invalid YouTube URL"}]}`

---

#### 30. YouTube URL validator rejects valid URL formats
**File:** `packages/validators/src/analysis.ts`
**Issue:** URLs like `https://youtu.be/VIDEO_ID?si=xxx` or `youtube.com/shorts/VIDEO_ID` rejected

**Root Cause:**
- Original regex only supported: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`
- Missing: shorts, live, mobile (m.youtube.com), YouTube Music
- Query param handling used `(&.*)?` which required `&` as first char, not `?`

**Fix:** Expanded URL pattern:
```typescript
// BEFORE
const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]{11}(&.*)?$/;

// AFTER - Supports shorts, live, mobile, music, flexible query params
const youtubeUrlPattern = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[\w-]{11}([?&].*)?$/;
```

Also updated `extractVideoId()` to handle new formats:
```typescript
const patterns = [
  /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,  // NEW
  /(?:youtube\.com\/live\/)([\w-]{11})/,    // NEW
];
```

**Supported formats after fix:**
| Format | Example |
|--------|---------|
| Standard | `youtube.com/watch?v=VIDEO_ID` |
| Short link | `youtu.be/VIDEO_ID?si=xxx` |
| Embed | `youtube.com/embed/VIDEO_ID` |
| Shorts | `youtube.com/shorts/VIDEO_ID` |
| Live | `youtube.com/live/VIDEO_ID` |
| Mobile | `m.youtube.com/watch?v=VIDEO_ID` |
| Music | `music.youtube.com/watch?v=VIDEO_ID` |

**Note:** After modifying shared package, run `pnpm --filter @glint/validators build` and restart backend.

---

#### 31. PostgreSQL function calls fail with type mismatch
**Files:** `analysis.service.ts`, `credits.service.ts`, `ads.service.ts`
**Issue:** `function deduct_credits(uuid, bigint, text, unknown, text) does not exist`

**Root Cause:**
- Prisma `$executeRaw` and `$queryRaw` pass JavaScript values directly to PostgreSQL
- JavaScript `number` becomes PostgreSQL `bigint` by default
- JavaScript `null` becomes PostgreSQL `unknown` type
- PostgreSQL function signatures require exact type matches (no implicit casting for function calls)

**Example:**
```sql
-- Function signature expects:
deduct_credits(p_user_id UUID, p_amount INT, p_description TEXT, p_reference_id UUID, p_reference_type TEXT)

-- But Prisma sent:
deduct_credits(uuid, bigint, text, unknown, text)
--                   ^^^^^^       ^^^^^^^
--                   should be INT, should be UUID
```

**Fix:** Add explicit PostgreSQL type casts in all raw queries:
```typescript
// BEFORE (fails)
await this.prisma.$executeRaw`
  SELECT * FROM deduct_credits(
    ${userId}::uuid,
    ${creditCost},           -- bigint
    ${'description'},        -- text (ok)
    NULL,                    -- unknown
    ${'analysis_job'}        -- text (ok)
  )
`;

// AFTER (works)
await this.prisma.$executeRaw`
  SELECT * FROM deduct_credits(
    ${userId}::uuid,
    ${creditCost}::int,      -- explicit INT
    ${'description'}::text,
    NULL::uuid,              -- explicit UUID
    ${'analysis_job'}::text
  )
`;
```

**Files updated:**
| File | Functions Fixed |
|------|-----------------|
| `analysis.service.ts` | `deduct_credits`, `refund_credits`, `increment_daily_usage` |
| `credits.service.ts` | `deduct_credits`, `refund_credits` |
| `ads.service.ts` | `grant_ad_reward`, `INSERT ad_events` |

**Best Practice:** Always use explicit type casts (`::int`, `::text`, `::uuid`) in Prisma raw queries to avoid function signature mismatches.

---

#### 32. NestJS wildcard route catches specific routes
**File:** `apps/backend/src/modules/analysis/analysis.controller.ts`
**Issue:** GET `/api/v1/analysis/jobs/:id` returns 404 because `:id` wildcard catches "jobs" first

**Root Cause:**
- NestJS matches routes in declaration order
- `@Get(':id')` was declared before `@Get('jobs/:id')`
- Request to `/analysis/jobs/abc123` matched `:id = "jobs"` first
- Then tried to find analysis result with id="jobs" → 404

**Fix:** Reorder routes so specific paths come before wildcards:
```typescript
// CORRECT ORDER:
@Post('standard')           // 1. POST endpoints first
@Get('jobs/:id')            // 2. Specific paths
@Get('jobs')                // 3. Collection endpoints
@Get('video/:videoId')      // 4. Other specific paths
@Get(':id')                 // 5. Wildcard LAST
```

**Rule:** In NestJS controllers, always declare routes from most specific to least specific.

---

#### 33. Missing Next.js API route for /analysis/jobs/[id]
**File:** `apps/web/src/app/api/v1/analysis/jobs/[id]/route.ts` (created)
**Issue:** Frontend calls `/api/v1/analysis/jobs/{id}` but route didn't exist

**Root Cause:**
- Added `getJob()` to frontend API client in client.ts
- Added `useAnalysisJob()` hook in use-analysis.ts
- But never created the Next.js API route to proxy to backend

**Fix:** Created the missing route file:
```typescript
// apps/web/src/app/api/v1/analysis/jobs/[id]/route.ts
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/v1/analysis/jobs/${id}`);
}
```

---

#### 34. Foreign key error when creating analysis chat message
**File:** `apps/backend/src/modules/analysis/analysis.service.ts`
**Issue:** `Foreign key constraint violated: chat_messages_analysis_ref_id_fkey`

**Root Cause:**
- `chat_messages.analysis_ref_id` references `analysis_results.id`
- Code was passing `job.id` (AnalysisJob ID) as `analysisRefId`
- But the foreign key expects an `AnalysisResult` ID
- For pending jobs, no result exists yet → FK violation

```typescript
// BEFORE (wrong - job.id is not a valid analysis_results.id)
await this.chatService.addAssistantMessage(
  data.sessionId,
  JSON.stringify({ jobId: job.id, videoId, status: 'PENDING' }),
  'analysis_card',
  job.id,  // ← AnalysisJob ID passed to analysisRefId
);

// AFTER (correct - undefined for pending, resultId for completed)
await this.chatService.addAssistantMessage(
  data.sessionId,
  JSON.stringify({ jobId: job.id, videoId, status: 'PENDING' }),
  'analysis_card',
  undefined,  // ← No result yet, jobId is in content JSON
);
```

**Design Pattern:**
- `analysisRefId`: Set only when analysis is COMPLETED (references actual result)
- `content` JSON: Contains `jobId` for frontend to poll job status

---

#### 35. ChatMessage component requires analysisRefId to render AnalysisCard
**File:** `apps/web/src/components/chat/chat-message.tsx`
**Issue:** AnalysisCard not rendered for pending jobs because `analysisRefId` is null

**Root Cause:**
- Condition was `{isAnalysisCard && message.analysisRefId ? <AnalysisCard ... />}`
- After fix #34, pending jobs have `analysisRefId = null`
- Card never rendered even though `jobId` is in content JSON

**Fix:** Parse `jobId` from content JSON as fallback:
```typescript
const analysisId = useMemo(() => {
  if (!isAnalysisCard) return null;
  if (message.analysisRefId) return message.analysisRefId;
  // Parse jobId from content JSON for pending jobs
  try {
    const content = JSON.parse(message.content || '{}');
    return content.jobId || null;
  } catch {
    return null;
  }
}, [isAnalysisCard, message.analysisRefId, message.content]);

// Use analysisId instead of message.analysisRefId
{isAnalysisCard && analysisId ? (
  <AnalysisCard analysisId={analysisId} />
) : (...)}
```

---

#### 36. AnalysisCard fetches result for pending jobs causing 404
**File:** `apps/web/src/components/chat/analysis-card.tsx`
**Issue:** Console shows 404 errors when AnalysisCard tries to fetch non-existent result

**Root Cause:**
- Logic: `const resultId = job?.resultId || (job?.status === 'COMPLETED' ? undefined : analysisId)`
- When job is PENDING, `resultId` = `analysisId` (which is the jobId)
- `useAnalysisResult(jobId)` → 404 because job ID is not a result ID

**Fix:** Only fetch result when job has resultId or when it's not a job at all:
```typescript
// Determine if we should fetch the result:
// - If job exists and has resultId, use that
// - If job doesn't exist (404 = not a job ID), try analysisId as result ID
// - If job is pending/processing, don't fetch result yet
const shouldFetchResult = job?.resultId || (!job && !jobLoading && jobError);
const resultId = job?.resultId || (shouldFetchResult ? analysisId : '');
const { data: analysis, isLoading: resultLoading, error } = useAnalysisResult(resultId);
```

---

## Summary

| Category | Issue | Status |
|----------|-------|--------|
| Backend TS | Prisma type inference | Fixed |
| Backend TS | JSON null handling | Fixed |
| Node.js 23 | ESM module resolution | Fixed |
| Frontend CSS | Tailwind v4/v3 mismatch | Fixed |
| Frontend CSS | Invalid opacity class | Fixed |
| Frontend | Server/client boundary | Fixed |
| Env Config | Supabase URL format | Fixed |
| Backend | Prisma error event logging | Fixed |
| Backend | HttpExceptionFilter Prisma handling | Fixed |
| Backend | Profile creation fallback | Fixed |
| Frontend | OAuth hooks missing | Fixed |
| Frontend | OAuth callback route missing | Fixed |
| Frontend | OAuth UI buttons missing | Fixed |
| Frontend | Hydration error (useSearchParams) | Fixed |
| Database | OAuth trigger name extraction | Fixed |
| Frontend | Browser extension hydration errors | Fixed |
| Middleware | Wrong cookie names for session | Fixed |
| Middleware | OAuth callback interception | Fixed |
| Frontend | LoadingScreen SVG hydration | Fixed |
| Frontend | Chat session creation 400 error (partial) | Fixed |
| Backend | @UsePipes validates all params | Fixed |
| Frontend | Sidebar overlay and active state | Fixed |
| Auth | Redirect loop (cookie vs user validation) | Fixed |
| Frontend | New Chat button invisible when inactive | Fixed |
| Frontend | Sessions created for non-YouTube inputs | Fixed |
| Frontend | LoadingScreen hydration mismatch | Fixed |
| Frontend | ProtectedLayout Zustand hydration | Fixed |
| Backend | Analysis @UsePipes validates all params | Fixed |
| Backend | HttpExceptionFilter validation detail logging | Fixed |
| Validators | YouTube URL pattern too restrictive | Fixed |
| Backend | PostgreSQL function type mismatch | Fixed |
| Backend | NestJS wildcard route ordering | Fixed |
| Frontend | Missing /analysis/jobs/[id] route | Fixed |
| Backend | FK error - analysisRefId vs jobId | Fixed |
| Frontend | ChatMessage analysisId parsing | Fixed |
| Frontend | AnalysisCard 404 for pending jobs | Fixed |

---

## 2026-01-02: Missing Implementation - Python Worker Architecture

#### 37. Worker missing Celery task queue per implementation plan
**Files:** `apps/worker/`
**Issue:** Python worker implemented with simple asyncio polling instead of Celery + Redis task queue

**Implementation Plan Specification** (`docs/implementation-plan.md` Section 2-2):
> Worker App (Python)
> | Layer | Technology |
> |-------|------------|
> | Framework | FastAPI |
> | Task Queue | **Celery + Redis (Upstash)** |
> | Video Download | yt-dlp |
> | AI | Google Gemini API (3.0 Pro, File API) |

**Current Implementation:**
- ✅ FastAPI
- ❌ No Celery - uses `asyncio.create_task()` polling loop instead
- ❌ No Redis task queue - polls Supabase directly
- ✅ yt-dlp
- ✅ Gemini API

**Impact:**
- No distributed task processing (can't scale horizontally)
- No task persistence (tasks lost on restart)
- No priority queues
- No task retries with exponential backoff at queue level
- No task result storage

**Current Flow (Simplified):**
```
JobRunner polls Supabase → Finds PENDING jobs → Processes in-memory
```

**Expected Flow (Per Spec):**
```
API creates job → Pushes to Redis queue → Celery worker picks up → Processes → Updates DB
```

**Status:** Deferred - current implementation works for MVP, Celery migration planned for scale phase
