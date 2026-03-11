# AI Animation Factory

An automated system that generates 50-100 short animated episodes per day using AI services.

## Architecture

```
ai-animation-factory/
├── apps/
│   ├── web/          # Next.js 14 frontend (streaming + CMS dashboard)
│   └── api/          # Express backend + BullMQ workers
├── packages/
│   ├── database/     # PostgreSQL schema & migrations
│   └── shared/       # Shared TypeScript types & utilities
└── docs/
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TailwindCSS, shadcn/ui, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Queue | BullMQ + Redis |
| Database | Supabase (PostgreSQL) |
| Storage | Cloudflare R2 / AWS S3 |
| AI: Ideas & Scripts | OpenAI GPT-4o |
| AI: Images | DALL-E 3 |
| AI: Animation | Runway Gen-3 Turbo |
| AI: Voice | ElevenLabs |
| AI: Music | Mubert |
| AI: Subtitles | OpenAI Whisper |
| Video | FFmpeg |

## Generation Pipeline

```
Idea (GPT-4) → Script (GPT-4) → Images (DALL-E 3) → Animations (Runway)
                              → Voice (ElevenLabs)  ↗
                              → Music (Mubert)      →  Assembly (FFmpeg) → Subtitles (Whisper)
                              → Thumbnail (DALL-E)
```

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Redis 7+
- FFmpeg
- Supabase project
- API keys (see `.env.example`)

### 1. Clone and Setup

```bash
git clone <repo>
cd ai-animation-factory
cp .env.example .env
# Fill in your API keys in .env
pnpm install
```

### 2. Database Setup

Create a Supabase project, then run:
```sql
-- In Supabase SQL editor:
-- Copy and paste contents of packages/database/schema.sql
```

### 3. Start Redis

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Development

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Health: http://localhost:3001/health

### 5. Start Workers

```bash
cd apps/api
pnpm worker
```

### Docker Compose (Full Stack)

```bash
cp .env.example .env
# Fill in API keys
docker-compose up -d
```

## API Endpoints

### Episodes
- `GET /api/episodes` - List episodes
- `GET /api/episodes/:id` - Get episode
- `POST /api/episodes` - Create episode (auth required)
- `PATCH /api/episodes/:id` - Update episode (auth required)
- `DELETE /api/episodes/:id` - Delete episode (admin only)
- `GET /api/episodes/:id/jobs` - Get generation jobs

### Generation
- `POST /api/generation/start` - Start episode generation
- `GET /api/generation/queue` - Queue statistics
- `GET /api/generation/active` - Active jobs
- `POST /api/generation/retry/:queueName` - Retry failed jobs
- `GET /api/generation/jobs` - All generation jobs
- `POST /api/generation/clean` - Clean old queue jobs

### Analytics
- `GET /api/analytics/summary` - Overview stats
- `GET /api/analytics/views-by-day` - Daily views
- `GET /api/analytics/views-by-genre` - Views by genre
- `POST /api/analytics/track` - Track event

### Auth
- `POST /api/auth/login` - Login

## Environment Variables

See [.env.example](.env.example) for all required variables.

## Automation

The scheduler runs automatically:
- **Every hour**: Generates N new episodes (configurable)
- **Every 30 min**: Retries failed jobs
- **Daily 2 AM**: Cleans up old job records
- **Every 5 min**: Updates view/like counts

Configure via Supabase `scheduler_config` table.

## License

MIT
