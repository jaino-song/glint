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
