# AI Animation Factory — Project Rules

## Stack
- pnpm monorepo (apps/api + apps/web + packages/*)
- `pnpm dev` to run all
- `pnpm --filter @ai-animation-factory/api test` to run API tests
- TypeScript strict mode everywhere

## Security — File locations (project-specific)

> **القواعد العامة في `C:\Users\asaid\.claude\JL-PROJECT-STANDARDS.md`.** هذا القسم للأماكن الفعلية في الكود.

| ما تحتاجه | وين في الكود |
|-----------|---------------|
| Required secrets validation | `apps/api/src/config/env.ts` |
| RLS production migration | `supabase/migrations/20260329000001_enforce_rls_production.sql` |
| Route middleware (authenticate + rate limit) | `apps/api/src/routes/index.ts` |
| CORS + Helmet CSP config | `apps/api/src/server.ts` |
| Safe error handler | `apps/api/src/middleware/error-handler.ts` (`safeErrorMessage()`) |
| Vercel CSP headers | `vercel.json` |

**ملاحظة:** أي route جديد لازم يمر عبر `routes/index.ts` ويكون عليه `authenticate` + rate limit middleware.
