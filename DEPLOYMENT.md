# 🚀 Deployment Guide

## Prerequisites
- Node.js 20+
- pnpm 10+
- Git

---

## 1️⃣ GitHub (Already Done ✅)

Repository: `https://github.com/lovely1day/ai-animation-factory`

Latest commit: `47bfc55` - Phase 2: Add comprehensive tests

---

## 2️⃣ Vercel Deployment

### Option A: Deploy Web Only (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy Web (from project root)
cd apps/web
vercel --prod
```

**Environment Variables needed in Vercel Dashboard:**
```
NEXT_PUBLIC_API_URL=https://your-api-url.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://ebroeczeulacxtcwnrll.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Option B: Deploy API (Backend)

```bash
cd apps/api
vercel --prod
```

**Environment Variables needed:**
```
SUPABASE_URL=https://ebroeczeulacxtcwnrll.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
REDIS_HOST=your-redis-host
REDIS_PORT=6379
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
RUNWAY_API_KEY=...
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

---

## 3️⃣ Supabase Setup

### Database Schema

1. Go to: https://supabase.com/dashboard/org/skzecvzuuckavsjjsdbe

2. Create new project or use existing

3. Run SQL migrations in this order:
```sql
-- File: packages/database/schema.sql
-- Copy contents from: apps/api/schema.sql
```

4. Set Environment Variables in Supabase:
   - Go to Project Settings → API
   - Copy `service_role key` for API backend
   - Copy `anon key` for Web frontend

---

## 4️⃣ Docker Deployment (Alternative)

```bash
# Build and run all services
docker compose up -d

# Check logs
docker compose logs -f

# Scale workers
docker compose up -d --scale workers=3
```

---

## 📋 Environment Variables Checklist

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### API (.env)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_ANON_KEY=
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
RUNWAY_API_KEY=
MUBERT_API_KEY=
JWT_SECRET=
STORAGE_BUCKET=
```

---

## 🔗 Deployed URLs

After deployment, update these:

| Service | URL |
|---------|-----|
| Web (Vercel) | `https://ai-animation-factory.vercel.app` |
| API (Vercel) | `https://api-ai-animation-factory.vercel.app` |
| Supabase | `https://ebroeczeulacxtcwnrll.supabase.co` |

---

## ✅ Post-Deployment Checklist

- [ ] Web loads correctly
- [ ] API health endpoint responds
- [ ] Database connection works
- [ ] Redis connection works
- [ ] Image generation works
- [ ] CI/CD pipeline passes
