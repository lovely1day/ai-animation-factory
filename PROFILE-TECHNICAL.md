# AI Animation Factory — Technical Profile

## Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Backend | Express 4, TypeScript |
| Queue | BullMQ + Redis (local) or Upstash (production) |
| Database | Supabase (PostgreSQL + RLS) |
| AI Providers | Anthropic Claude, Google Gemini, Ollama (local) |
| Image Gen | ComfyUI (SDXL) |
| Video | FFmpeg (fluent-ffmpeg) |
| Hosting | Vercel (web + API) |
| Tunnel | Cloudflare Tunnel (ComfyUI + API) |
| Package Manager | pnpm |

## Architecture

pnpm monorepo with Turborepo orchestration:

```
apps/
  api/              — Express backend (port 3001)
  web/              — Next.js frontend (port 3000)
  character-studio/ — Character DNA management UI
packages/
  database/         — PostgreSQL schema + migrations
  shared/           — Shared TypeScript types and utils
  prompts/          — Shared AI prompt library (personas, compression, formatters)
```

### Pipeline Order

```
idea → script → [images x8 + music + thumbnail] (parallel) → animations → assembly → subtitles
```

Each stage is a BullMQ job processed by dedicated workers.

### API Routes

| Route | Purpose |
|-------|---------|
| `GET /health` | Health check (no auth) |
| `POST /api/auth/*` | Authentication |
| `GET/POST /api/projects/*` | Project CRUD |
| `GET/POST /api/episodes/*` | Episode management |
| `POST /api/generation/*` | Trigger generation stages |
| `GET /api/jobs/*` | Job status and monitoring |
| `GET /api/analytics/*` | Usage analytics |
| `POST /api/approval/*` | Human approval workflow |
| `GET/POST /api/characters/*` | Character DNA system |
| `POST /api/creative/*` | Creative pipeline (4 stages + full) |
| `GET /api/ollama/*` | Ollama model management |
| `GET /api/scenes/*` | Scene management |
| `GET /api/universe/*` | Universe/world building |

All routes (except `/health` and `/auth`) require `authenticate` middleware + rate limiting.

### Workers (9 total)

idea, script, image, music, thumbnail, animation, assembly, subtitles, scheduler

### Database Schema

- `projects` — Animation projects with config
- `episodes` — Generated episodes per project
- `scenes` — Individual scenes within episodes
- `characters` — Character DNA definitions
- `jobs` — BullMQ job tracking
- `analytics` — Usage metrics

RLS enabled on all tables.

## Local Setup

```bash
git clone <repo>
cd ai-animation-factory
pnpm install
cp .env.example .env          # Fill in all values
docker start redis             # Redis required for BullMQ
pnpm dev                       # API:3001 + Web:3000
```

### Prerequisites

- Node.js 18+
- pnpm 9+
- Redis (Docker or local)
- ComfyUI (optional, for image generation)
- Ollama (optional, for local LLMs)

## Build & Deploy

```bash
pnpm build                     # Build all packages
npx vercel --prod              # Deploy to Vercel
```

## Testing

```bash
pnpm --filter @ai-animation-factory/api test           # Run API tests
pnpm --filter @ai-animation-factory/api test:watch      # Watch mode
pnpm --filter @ai-animation-factory/api test:coverage   # Coverage report
```

## Key Dependencies

- `bullmq` + `ioredis` — Job queue system
- `@anthropic-ai/sdk` — Claude API
- `@google/generative-ai` — Gemini API
- `openai` — OpenAI-compatible API (Ollama)
- `fluent-ffmpeg` + `ffmpeg-static` — Video processing
- `axios` — HTTP client for ComfyUI
- `helmet` — Security headers
- `express-rate-limit` — Rate limiting
- `pino` — Structured logging
