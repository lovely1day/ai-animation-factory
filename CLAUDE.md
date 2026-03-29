# AI Animation Factory — Project Rules

## Security Rules (MANDATORY — NEVER BYPASS)

### Secrets
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET` are **required()** in `apps/api/src/config/env.ts` — NEVER change to optional()
- NEVER add fallback defaults for any secret (e.g., `?? "default-key"`)
- NEVER commit `.env` or `.env.local` files

### Database (Supabase)
- RLS (Row Level Security) is **ENABLED** on all tables — NEVER disable it
- Every new table MUST have RLS + policies using `auth.uid()`
- NEVER write `USING (true) WITH CHECK (true)` — this gives everyone access
- Production migration: `supabase/migrations/20260329000001_enforce_rls_production.sql`

### API Routes
- Every route (except `/health` and `/auth`) MUST have `authenticate` middleware
- Every route MUST have rate limiting (`apiRateLimit` or `generationRateLimit`)
- Route protection is in `apps/api/src/routes/index.ts` — new routes go there with both middlewares

### CORS
- NEVER use `cors()` without explicit origin list
- localhost origins are for development only (`NODE_ENV !== 'production'`)
- Configuration is in `apps/api/src/server.ts`

### Error Handling
- NEVER send `error.message` directly to client — use `safeErrorMessage(error, 'fallback')`
- Error handler middleware MUST be last in `server.ts`
- `safeErrorMessage()` is in `apps/api/src/middleware/error-handler.ts`

### CSP Headers
- Helmet CSP is enabled in production in `server.ts`
- Vercel CSP headers are in `vercel.json`
- NEVER set `contentSecurityPolicy: false` in production

## Stack
- pnpm monorepo (apps/api + apps/web + packages/*)
- `pnpm dev` to run all
- `pnpm --filter @ai-animation-factory/api test` to run API tests
- TypeScript strict mode everywhere

## Full Standards
See `C:\Users\asaid\.claude\JL-PROJECT-STANDARDS.md` for the complete checklist.
