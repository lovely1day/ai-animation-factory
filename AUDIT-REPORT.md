# AI Animation Factory — Audit Report
**Date:** 2026-03-11
**Auditor:** Claude Code
**Scope:** Full monorepo — API, Web, Packages, Config, Security

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Health Score** | 5.5 / 10 |
| **Critical Issues** | 6 |
| **High Priority Issues** | 8 |
| **Medium Priority Issues** | 7 |
| **TypeScript Errors (API)** | 43 |
| **Security Vulnerabilities** | 2 (1 high, 1 moderate) |
| **Ready for Production?** | ❌ No |

**Summary:** The architecture is solid and the AI pipeline design is well thought out. All 9 worker queues are implemented with real API calls (no mocks). However, the project cannot start in its current state: the API will crash at startup due to missing `bcryptjs`, the shared package cannot be resolved (43 TypeScript errors), the `.env` file contains only placeholder values, and the `create/page.tsx` page is completely broken (wrong port + corrupted Arabic encoding). These issues must be fixed before any production use.

---

## 1. Code Quality

### 1a. Encoding Issues

| File | Status | Problem |
|------|--------|---------|
| `apps/web/src/app/page.tsx` | ✅ Correct UTF-8 | Arabic translations intact |
| `apps/web/src/app/create/page.tsx` | ❌ **CORRUPTED** | ALL Arabic strings replaced with `?` characters (73 occurrences). File was saved in non-Unicode encoding (Windows-1252). Also: hardcoded `localhost:3002` wrong port. |
| `apps/api/src/services/aiService.ts` | ✅ Fixed | Rebuilt with Unicode escape sequences |
| `# 📊 تقرير تفصيلي - مشروع AI Animat.txt` | ⚠️ Harmless | Arabic filename in root — not a source file |

### 1b. TypeScript Errors

**API (`apps/api`) — 43 errors from `tsc --noEmit`:**

| Error Category | Count | Root Cause |
|----------------|-------|------------|
| `Cannot find module '@ai-animation-factory/shared'` | 22 | Shared package not built / workspace link not resolved |
| `Cannot find module 'bcryptjs'` | 1 | Package missing from dependencies |
| `Cannot find module '@aws-sdk/s3-request-presigner'` | 1 | Package not installed |
| `fluent-ffmpeg` Promise callback signature mismatch | 4 | Wrong callback type in `video-assembly.service.ts` |
| `IORedis` namespace usage (should be `Redis`) | 1 | ioredis v5 changed the default export |
| `analytics.routes.ts` type cast on Supabase join | 1 | Incorrect type assertion |
| `test.routes.ts` spread type missing | 4 | `getJobCounts()` returns object, spread loses types |
| JWT `expiresIn` option key | 1 | Wrong option key in `sign()` call |
| `implicit any` in workers/services | 5 | Missing type annotations in callbacks |
| Other | 4 | Miscellaneous strict mode violations |

**Web (`apps/web`) — 0 errors** (build passes cleanly after previous fixes)

### 1c. ESLint

| App | Errors | Warnings | Status |
|-----|--------|----------|--------|
| `apps/web` | 0 | ~15 (unused imports, console) | ✅ Build passes |
| `apps/api` | N/A | N/A | No ESLint configured |

---

## 2. Dependencies

### 2a. Missing Packages

| Package | Where Needed | Impact |
|---------|-------------|--------|
| `bcryptjs` | `apps/api` — `src/middleware/auth.ts` | **CRITICAL** — login will throw `Cannot find module 'bcryptjs'` at runtime |
| `@aws-sdk/s3-request-presigner` | `apps/api` — `src/services/storage.service.ts` | Storage service fails to compile |
| `@types/bcryptjs` | `apps/api` | Type declarations for above |

### 2b. Version Inconsistencies

| Package | API Version | Web Version | Risk |
|---------|------------|-------------|------|
| `@supabase/supabase-js` | `^2.39.0` | `^2.99.1` | Minor — API surface compatible |

### 2c. Security Vulnerabilities (`pnpm audit`)

| Severity | Package | CVE | Description | Fix |
|----------|---------|-----|-------------|-----|
| 🔴 **HIGH** | `next@14.2.35` | GHSA-h25m-26qc-wcjf | HTTP request deserialization DoS via React Server Components | Upgrade to `next@15.0.8+` |
| 🟡 **MODERATE** | `next@14.2.35` | GHSA-9g9p-9gw9-jx7f | Image Optimizer DoS via `remotePatterns` wildcard config | Upgrade to `next@15.5.10+` — also tighten `remotePatterns` |

### 2d. Notable Outdated Packages

| Package | Current | Latest Major | Notes |
|---------|---------|-------------|-------|
| `next` | 14.2.35 | 15.x | Contains security fixes |
| `openai` | ^4.28.0 | 4.x current | Minor updates available |
| `bullmq` | ^5.1.0 | 5.x current | Check patch releases |

---

## 3. Configuration

### 3a. Environment Variables

**9 required variables have placeholder values — API WILL NOT START:**

```
SUPABASE_URL          → https://your-project.supabase.co
SUPABASE_SERVICE_KEY  → your-service-role-key
R2_ENDPOINT           → https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID      → your-r2-access-key
R2_SECRET_ACCESS_KEY  → your-r2-secret-key
R2_PUBLIC_URL         → https://pub-xxxx.r2.dev
OPENAI_API_KEY        → sk-your-openai-key
RUNWAY_API_KEY        → your-runway-key
ELEVENLABS_API_KEY    → your-elevenlabs-key
MUBERT_API_KEY        → your-mubert-key
JWT_SECRET            → your-super-secret-jwt-key-min-32-chars
```

The `env.ts` `required()` helper throws at startup if these are not set. Additionally, `SENTRY_DSN`, `MUBERT_LICENSE`, and `NEXT_PUBLIC_SUPABASE_*` also need real values.

### 3b. Next.js Configuration

| Setting | Current Value | Issue |
|---------|---------------|-------|
| `reactStrictMode` | `true` | ✅ Good |
| `images.remotePatterns` | `hostname: '**'` (wildcard) | ⚠️ Overly permissive — triggers the moderate CVE |
| `compiler.removeConsole` | production only | ✅ Good |
| `i18n` | Not configured (removed — App Router incompatible) | ✅ Fixed |
| `turbo.json globalDependencies` | `.env.*local` only | ⚠️ `.env` changes don't bust Turbo cache |

### 3c. API Configuration Issues

- `queue.service.ts` reads `process.env.SCENE_COUNT` directly, bypassing validated `env` config object
- `redis.ts` uses `IORedis.RedisOptions` namespace (ioredis v5 changed namespace to `Redis`)
- `server.ts` does **not** call `scheduler.start()` — the scheduler is instantiated but never started
- `apps/web/src/app/create/page.tsx` hardcodes `http://localhost:3002` (API runs on 3001)

---

## 4. Database Schema

### Tables & Coverage

| Table | PKs | Indexes | FK Constraints | RLS | Policies |
|-------|-----|---------|----------------|-----|----------|
| `users` | ✅ UUID | None extra | N/A | ❌ Off | N/A |
| `episodes` | ✅ UUID | 5 indexes | `users` (created_by) | ✅ On | ✅ 2 policies |
| `scenes` | ✅ UUID + UNIQUE | 2 indexes | `episodes` CASCADE | ✅ On | ❌ **None** |
| `assets` | ✅ UUID | 3 indexes | `episodes`, `scenes` CASCADE | ✅ On | ❌ **None** |
| `generation_jobs` | ✅ UUID | 4 indexes | `episodes` CASCADE | ✅ On | ❌ **None** |
| `analytics` | ✅ UUID | 3 indexes | `episodes`, `users` | ✅ On | ❌ **None** |
| `scheduler_config` | ✅ UUID + UNIQUE key | None | `users` (updated_by) | ❌ Off | N/A |
| `api_keys` | ✅ UUID | None extra | `users` CASCADE | ❌ Off | N/A |

**Critical RLS Gap:** `scenes`, `assets`, `generation_jobs`, and `analytics` have RLS enabled but **zero policies defined**. This means all access to these tables through the Supabase client (anon/user key) is blocked — the API will fail to read or write scenes, assets, and jobs.

**Missing:** The `scheduler_config` table has no RLS but is accessed by the backend service role key — this is acceptable. However, `users` has no RLS, meaning any authenticated user can read all users.

---

## 5. File Structure

### 5a. Monorepo Config

| File | Status |
|------|--------|
| `pnpm-workspace.yaml` | ✅ Correct — `apps/*` and `packages/*` |
| `turbo.json` | ✅ Valid — build/dev/start/lint/clean tasks |
| `packages/shared` | ✅ Built — `dist/` exists with compiled JS + types |
| `packages/database` | ✅ `schema.sql` present |

### 5b. Missing / Problem Files

| File | Status | Impact |
|------|--------|--------|
| `apps/api/src/index.ts` | ⚠️ Now re-exports from `server.ts` | Fixed in this session |
| `apps/api` no `@ai-animation-factory/shared` in deps | ❌ Missing workspace dependency declaration | 22 TypeScript errors |
| `apps/api/package.json` no `bcryptjs` | ❌ Missing | Runtime crash on login |
| `apps/web/src/app/create/page.tsx` | ❌ Corrupted Arabic + wrong port | Create page broken |
| `scheduler.start()` call | ❌ Missing from `server.ts` | Auto-generation never runs |

### 5c. Potentially Unused Files

| File | Assessment |
|------|------------|
| `apps/api/src/services/aiService.ts` | Legacy demo — not imported by any route or worker. Dead code. |
| `docs/` directory | Likely documentation — not audited |
| `scripts/` directory | Not audited |
| `logs/` directory | Log output directory — fine |

---

## 6. API Endpoints

### Authentication Coverage

| Router | Auth Level | Coverage |
|--------|-----------|----------|
| `/api/auth` | Public (rate-limited) | ✅ Login only |
| `/api/episodes` | Mixed — reads public, writes admin/editor | ✅ Correct |
| `/api/generation` | All authenticated | ✅ Role-based |
| `/api/analytics` | All authenticated | ✅ But `/track` has no Zod validation |
| `/api/test` | **No auth** | ⚠️ Intended (diagnostic) |

### Validation Gaps

| Endpoint | Issue |
|----------|-------|
| `POST /api/analytics/track` | No Zod schema — `episode_id`, `event_type` accepted without validation |
| `GET /api/generation/jobs` | Query params `page`/`limit` parsed with `Number()` not Zod — NaN possible |
| `GET /api/episodes/:id` | No UUID format validation on `:id` param |
| `DELETE /api/episodes/:id` | No UUID format validation on `:id` param |

---

## 7. Frontend Components

| Component | Used | Types | Error Handling | Notes |
|-----------|------|-------|----------------|-------|
| `EpisodeCard.tsx` | ✅ Yes | ✅ Full | Minimal (display only) | Uses `next/image` ✅ |
| `EpisodeGrid.tsx` | ✅ Yes | ✅ Full | Empty state only | Simple wrapper |
| `JobMonitor.tsx` | ✅ Yes | ✅ Full | ❌ No `.catch()` on Supabase | Realtime subscription |
| `QueueManager.tsx` | ✅ Yes | ✅ Full | ✅ Try/catch + toast | Polls every 10s |
| `VideoPlayer.tsx` | ✅ Yes | ✅ Full | ❌ No `onError` on `<video>` | Missing error state |
| `EpisodeCard.tsx` | ✅ Yes | ✅ Yes | N/A | Unused `Clock` import |
| All `ui/` components | ✅ Yes | ✅ Yes | N/A | Standard shadcn/ui |

**Page Issues:**

| Page | Issue |
|------|-------|
| `create/page.tsx` | ❌ Arabic corrupted + wrong port 3002 + wrong API endpoint path |
| `watch/[id]/page.tsx` | ⚠️ Uses `<img>` instead of Next.js `<Image>` for related episodes |
| `page.tsx` (home) | ⚠️ "Watch Now" button has no navigation target |
| `analytics/page.tsx` | ⚠️ Silent error catch — failures show as empty dashboard |
| `cms/settings/page.tsx` | ⚠️ Bypasses API, calls Supabase directly from frontend |

---

## 8. AI Integration Status

| Service | Status | Real API Calls | Notes |
|---------|--------|----------------|-------|
| **OpenAI GPT-4o** (ideas/scripts) | ✅ Fully Integrated | Yes | `gpt-4o` model, JSON response format |
| **OpenAI DALL-E 3** (images/thumbnails) | ✅ Fully Integrated | Yes | `1792x1024`, downloads + stores to R2 |
| **OpenAI Whisper** (subtitles) | ✅ Fully Integrated | Yes | `whisper-1`, verbose JSON with segments |
| **Runway Gen-3 Turbo** (animation) | ✅ Fully Integrated | Yes | `gen3a_turbo`, polls up to 5 min |
| **ElevenLabs** (voice) | ✅ Fully Integrated | Yes | `eleven_turbo_v2`, but **voice job never dispatched** (see bug below) |
| **Mubert B2B** (music) | ✅ Fully Integrated | Yes | 3-step flow with PAT token + polling; `email=apiKey` usage may be wrong |
| **FFmpeg** (video assembly) | ✅ Fully Integrated | Yes (local) | Full concat/mix pipeline via `fluent-ffmpeg` |

**Critical Pipeline Bug — Voice Generation Never Triggered:**
`script-worker.ts` dispatches image jobs with payload `{ visual_prompt, genre, target_audience, scene_number }`. The image worker checks `if (job.data.dialogue || job.data.narration)` before dispatching voice. Since these fields are never in the payload, voice jobs are never created. Every episode will be generated silently (no voice acting).

**Estimated API Cost Per Episode (8 scenes, ~60 seconds):**

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| GPT-4o (idea + script) | ~2,500 tokens | ~$0.02 |
| DALL-E 3 (8 scenes + 1 thumbnail) | 9 images × $0.04 | $0.36 |
| Runway Gen-3 Turbo (8 clips × 5s) | 40 seconds video | ~$0.40 |
| ElevenLabs (8 scenes × ~150 words) | ~1,200 chars | ~$0.02 |
| Mubert (1 track, ~60s) | 60 seconds | ~$0.01 |
| OpenAI Whisper (transcription) | ~60s audio | ~$0.01 |
| **Total per episode** | | **~$0.82** |
| **At 5 eps/hour × 24h** | 120 episodes/day | **~$98/day** |
| **Monthly (at full throughput)** | 3,600 episodes | **~$2,950/month** |

---

## 9. Performance

### Web Bundle Size (from last build)

| Route | Bundle Size | First Load JS |
|-------|------------|---------------|
| `/` (home) | 6.66 kB | 143 kB |
| `/cms/analytics` | **117 kB** | 213 kB |
| `/browse` | 2 kB | 152 kB |
| `/watch/[id]` | 2.56 kB | 98.8 kB |
| Shared JS | — | 87.3 kB |

`/cms/analytics` is large (117 kB) due to Recharts being bundled fully into the analytics page. Recharts should be lazy-loaded.

### Scheduler Performance Issue

The metrics cron job (every 5 min) loads **all** view analytics rows with no date filter, then runs one `UPDATE` per episode. At scale (millions of analytics rows, thousands of episodes) this will be very slow. Should be replaced with a single SQL aggregation query.

---

## 10. Security

### Hardcoded Secrets
✅ No hardcoded API keys found in source code.
✅ `.env` is in `.gitignore`.

### Security Issues Found

| Issue | Severity | Location |
|-------|----------|----------|
| JWT stored in `localStorage` (XSS vulnerable) | 🔴 High | `login/page.tsx`, all CMS pages |
| Next.js 14.2.35 DoS via RSC deserialization | 🔴 High | `apps/web/package.json` |
| `remotePatterns: hostname: '**'` wildcard | 🟡 Medium | `next.config.js` |
| `/api/test/*` exposes queue internals publicly | 🟡 Medium | `test.routes.ts` |
| `users` table has no RLS | 🟡 Medium | `schema.sql` |
| `scenes/assets/jobs/analytics` RLS enabled, no policies | 🔴 High | `schema.sql` |
| `settings/page.tsx` calls Supabase directly (bypasses API auth) | 🟡 Medium | Frontend |

---

## Priority Action Items

### 🔴 Critical (Fix immediately — app does not work without these)

1. **Install `bcryptjs` in API** — `pnpm --filter @ai-animation-factory/api add bcryptjs @types/bcryptjs`
   *Impact:* Login endpoint throws `Cannot find module 'bcryptjs'` — authentication completely broken.

2. **Add `@ai-animation-factory/shared` to API dependencies** — Add `"@ai-animation-factory/shared": "workspace:*"` to `apps/api/package.json`
   *Impact:* 22 TypeScript errors — all workers and services fail to resolve types.

3. **Add RLS policies for `scenes`, `assets`, `generation_jobs`, `analytics`** — All 4 tables have RLS enabled but zero policies, blocking all Supabase client access.
   *Impact:* API cannot create scenes, store assets, track jobs, or record analytics.

4. **Fix `create/page.tsx`** — Restore corrupted Arabic strings from `.env.example` reference text + fix port from `3002` → `3001` + fix API endpoint from `/episodes/create` → `/api/episodes`
   *Impact:* Create page is completely non-functional.

5. **Call `scheduler.start()` in `server.ts`** — The scheduler is instantiated but never started.
   *Impact:* Automatic episode generation (the core business function) never runs.

6. **Fix voice pipeline bug** — `script-worker.ts` must include `dialogue` and `narration` in image job payloads
   *Impact:* Every episode is generated without voice acting.

---

### 🟡 High Priority (Fix this week)

7. **Upgrade `next` to 15.x** — Fixes 1 high CVE (DoS via RSC) + 1 moderate CVE (Image Optimizer DoS).
   *Fix:* `pnpm --filter @ai-animation-factory/web add next@latest` — test for App Router breaking changes.

8. **Install `@aws-sdk/s3-request-presigner`** — `pnpm --filter @ai-animation-factory/api add @aws-sdk/s3-request-presigner`
   *Impact:* Storage service TypeScript errors; presigned URL generation broken.

9. **Fix `redis.ts` IORedis namespace** — Change `IORedis.RedisOptions` → `import { Redis, RedisOptions }` from `ioredis`
   *Impact:* TypeScript error; Redis config may fail strict compilation.

10. **Fix `auth.ts` JWT `expiresIn` option** — The `sign()` call passes `expiresIn` in the wrong argument position; tokens may not expire correctly.

11. **Provide real `.env` values** — Without real API keys the system cannot generate any content. Minimum needed: `SUPABASE_*`, `OPENAI_API_KEY`, `JWT_SECRET`, `REDIS_*`.

12. **Fix `video-assembly.service.ts` fluent-ffmpeg callbacks** — 4 type errors from Promise constructor callback mismatch. Wrap ffmpeg calls in proper promise-resolving callbacks.

13. **Restrict `next.config.js` image domains** — Replace `hostname: '**'` wildcard with specific domains (`r2.dev`, `cloudflare.com`, etc.) to fix the moderate CVE.

14. **Add `@ai-animation-factory/shared: workspace:*` to API `package.json`** *(same as #2)*

---

### 🟢 Medium Priority (Fix this month)

15. **Add Zod validation to `POST /api/analytics/track`** — Currently accepts unvalidated `event_type` values.

16. **Add UUID validation to `GET/DELETE /api/episodes/:id`** — Invalid UUID params cause ugly Supabase errors instead of clean 400 responses.

17. **Fix `analytics/page.tsx` silent errors** — Replace `catch { /* silent */ }` with proper error state + toast.

18. **Fix `watch/[id]/page.tsx`** — Replace `<img>` with Next.js `<Image>` for related episode thumbnails.

19. **Fix Mubert API email field** — `email: this.apiKey` is incorrect; the Mubert API expects an email address for the `GetServiceAccess` call, not the API key.

20. **Fix metrics cron N+1 query** — Replace the per-episode UPDATE loop in `scheduler.ts` with a single SQL aggregation: `UPDATE episodes SET view_count = (SELECT count(*) FROM analytics WHERE episode_id = id AND event_type = 'view')`.

21. **Add `.catch()` to `JobMonitor.tsx` Supabase calls** — Silent failures give users no feedback.

22. **Add `onError` handler to `VideoPlayer.tsx`** — Video load failures show blank screen with no message.

---

### ⚪ Low Priority (Nice to have)

23. **Move JWT from `localStorage` to `httpOnly` cookies** — Eliminates XSS token theft risk. Requires API changes to set/read cookies.

24. **Restrict `/api/test/*` in production** — Add `if (env.NODE_ENV === 'production') return res.status(404).json(...)` guard.

25. **Add `"Watch Now"` navigation** to home page hero button.

26. **Remove dead `aiService.ts`** from `apps/api/src/services/` — Legacy file not imported anywhere.

27. **Add `users` RLS policies** — Current schema allows any authenticated user to read all user records.

28. **Fix `cms/settings/page.tsx`** — Should call `PATCH /api/...` instead of calling Supabase directly from the frontend.

29. **Add Turbo cache invalidation for `.env`** — Add `".env"` to `turbo.json` `globalDependencies` so env changes bust the build cache.

30. **Lazy-load Recharts in analytics page** — Reduce the 117 kB bundle with dynamic import: `const { LineChart } = await import('recharts')`.

---

## Recommendations

### Architecture
- The queue-based pipeline (9 BullMQ queues → workers → AI services) is a good design for resilience. Keep it.
- Consider adding a **Redis Streams or Supabase Realtime** event bus to push live progress to the frontend without polling.
- The `scheduler_config` table pattern is excellent — makes the system configurable without code deploys.
- Add a **dead letter queue** or separate monitoring worker to alert on jobs that fail all 3 retry attempts.

### Performance
- Add **database connection pooling** via Supabase pgBouncer for the API (configure `SUPABASE_DB_URL` with `?pgbouncer=true`).
- The analytics metrics cron runs every 5 minutes against potentially millions of rows — implement with a materialized view or a single aggregate UPDATE instead.
- Add **Redis caching** for frequently-read `GET /api/episodes` responses (TTL: 60 seconds).

### Security
- Migrate JWT auth from `localStorage` to `httpOnly` sameSite cookies to prevent XSS token theft.
- Add **CSRF protection** if cookie-based auth is implemented.
- Add **input sanitization** for the `visual_prompt` field that gets sent to DALL-E and Runway — prompt injection is a real risk.
- Enable **Supabase Row Level Security** policies for all tables, especially `users`.
- Scope the `test.routes.ts` diagnostic endpoints behind an environment guard.

### DevOps
- Add a `Dockerfile` for the API to enable containerized deployment.
- Add **GitHub Actions CI** pipeline: `pnpm install → tsc --noEmit → pnpm build → pnpm test`.
- Add **health monitoring** — the `/health` endpoint exists but nothing monitors it. Consider Uptime Robot or Grafana Cloud free tier.
- Set `NODE_ENV=production` in deployment to activate `removeConsole` compiler option and stricter behavior.
- Add a `CHANGELOG.md` and semantic versioning — the project is at 1.0.0 but has significant in-progress work.

---

## Cost Estimate

### Current State (placeholder env — no API calls possible)
| Item | Cost |
|------|------|
| Infrastructure | $0/month |
| APIs | $0/month |
| **Total** | **$0/month** |

### Development / Testing (real keys, limited generation)
| Item | Cost |
|------|------|
| Supabase (free tier) | $0/month |
| Redis (local Docker) | $0/month |
| Cloudflare R2 (10 GB free) | $0/month |
| OpenAI (~$10 testing budget) | ~$10/month |
| Runway ML (125 credits free trial) | $0–$15/month |
| ElevenLabs (free tier: 10k chars) | $0–$5/month |
| **Total** | **~$10–30/month** |

### Production (5 episodes/hour × 24h = 120/day)
| Item | Cost |
|------|------|
| OpenAI (GPT-4o + DALL-E 3 + Whisper) | ~$1,600/month |
| Runway Gen-3 Turbo (~$0.40/episode) | ~$1,440/month |
| ElevenLabs (Standard plan) | ~$99/month |
| Mubert B2B (licensing) | ~$50–200/month |
| Cloudflare R2 (storage + egress) | ~$50–150/month |
| Supabase Pro | $25/month |
| VPS/cloud server (Node + Redis) | ~$50–100/month |
| **Total** | **~$3,300–3,600/month** |
| **Cost per episode** | **~$0.82** |
| **Cost per episode at scale (1000/day)** | **~$0.75** (bulk discounts) |

---

## Next Steps

| Priority | Action | Owner | Timeline |
|----------|--------|-------|----------|
| 1 | Install `bcryptjs` + `@aws-sdk/s3-request-presigner`, add `@ai-animation-factory/shared` workspace dep | Developer | Day 1 |
| 2 | Fill in real `.env` values (Supabase, OpenAI, JWT_SECRET minimum) | DevOps | Day 1 |
| 3 | Apply database RLS policies for scenes/assets/generation_jobs/analytics | Developer | Day 1–2 |
| 4 | Fix `create/page.tsx` (Arabic encoding + port + API path) | Developer | Day 2 |
| 5 | Add `scheduler.start()` to `server.ts` + fix voice pipeline bug | Developer | Day 2 |
| 6 | Fix remaining 43 TypeScript errors in API | Developer | Day 3–4 |
| 7 | Upgrade Next.js to 15.x to resolve CVEs | Developer | Day 3 |
| 8 | End-to-end test: generate 1 episode manually, verify pipeline | QA | Day 5 |
| 9 | Set up CI pipeline (GitHub Actions) | DevOps | Week 2 |
| 10 | Performance testing at 5 episodes/hour | QA | Week 2 |
| 11 | Production deployment (Docker + managed Redis) | DevOps | Week 3 |
| 12 | Cost monitoring + alerting (OpenAI usage caps) | DevOps | Week 3 |

---

*Report generated by Claude Code — AI Animation Factory Audit — 2026-03-11*
