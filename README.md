# AI Animation Factory

Automated AI animation pipeline that generates short animated episodes end-to-end — from idea to published video — using a multi-provider AI stack and BullMQ job queue.

## Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js 14 (App Router), TailwindCSS, shadcn/ui |
| Backend | Express, TypeScript, BullMQ + Redis |
| Database | Supabase (PostgreSQL + RLS on all tables) |
| AI Text | Claude Sonnet, Gemini 2.5 Flash, Ollama (local) |
| AI Images | ComfyUI (SDXL / FLUX) |
| AI Voice | ElevenLabs |
| AI Music | MusicGen (planned) |
| Video | FFmpeg |
| Deploy | Vercel (web) + Cloudflare Tunnel (API + ComfyUI) |

## Pipeline

```
idea → script → [images x8 + music + thumbnail] (parallel) → animations → assembly → subtitles
```

Each stage is a dedicated BullMQ worker. 9 workers total.

## Quick Start

```bash
git clone <repo>
cd ai-animation-factory
pnpm install
cp .env.example .env       # fill in all keys
docker start redis          # Redis required for BullMQ
pnpm dev                    # API → localhost:3001 | Web → localhost:3000
```

**Prerequisites:** Node.js 18+, pnpm 9+, Redis, FFmpeg, ComfyUI (optional), Ollama (optional)

## Project Structure

```
apps/api/              Express backend + BullMQ workers
apps/web/              Next.js 14 frontend
apps/character-studio/ Character DNA management UI
packages/database/     PostgreSQL schema + migrations
packages/shared/       Shared TypeScript types
packages/prompts/      Shared AI prompt library (personas, compression, formatters)
```

## Deploy

```bash
pnpm build
npx vercel --prod
```

- **Web:** Vercel at `ai-animation-factory-web.vercel.app`
- **API:** Cloudflare Tunnel at `api.feelthemusic.app` → localhost:3001
- **ComfyUI:** Cloudflare Tunnel at `comfyui.feelthemusic.app` → localhost:8188

## Testing

```bash
pnpm --filter @ai-animation-factory/api test
```

## Security

All routes (except `/health` and `/auth`) require authentication + rate limiting. RLS enabled on every table. See `CLAUDE.md` for full security rules.

## License

MIT
