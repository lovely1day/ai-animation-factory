# AI Animation Factory — Private Profile (Ali Only)

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | Environment (development/production) |
| `API_PORT` / `PORT` | API server port (3001) |
| `API_URL` | API base URL |
| `NEXT_PUBLIC_API_URL` | Frontend API URL |
| `LOG_LEVEL` | Pino log level |
| `MOCK_MODE` | Use in-memory data without DB/Redis |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (**required**) |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `JWT_SECRET` | JWT signing secret (**required**) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (production) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (production) |
| `REDIS_HOST` | Local Redis host |
| `REDIS_PORT` | Local Redis port (6379) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CLAUDE_API_KEY` | Anthropic Claude API key |
| `COMFYUI_URL` | ComfyUI server URL |
| `NEXT_PUBLIC_COMFYUI_URL` | ComfyUI URL for frontend |
| `MEDIAVORICE_URL` | MediaVoice Studio URL |
| `OLLAMA_URL` | Ollama server URL |
| `OLLAMA_MODEL` | Default Ollama model |
| `AI_PROVIDER` | Provider selection (gemini/ollama/auto) |
| `STORAGE_BUCKET` | Supabase storage bucket name |
| `STORAGE_PUBLIC_URL` | Public storage URL |
| `EPISODES_PER_HOUR` | Generation rate limit |
| `MAX_CONCURRENT_JOBS` | Concurrent job limit |
| `SCENE_COUNT` | Scenes per episode |
| `VIDEO_DURATION_SECONDS` | Target video duration |

## Deployment

- **Vercel Project:** ai-animation-factory (web + API)
- **Web URL:** https://ai-animation-factory-web.vercel.app
- **API URL:** https://api.feelthemusic.app (via Cloudflare Tunnel)
- **ComfyUI URL:** https://comfyui.feelthemusic.app (via Cloudflare Tunnel)
- Vercel env vars: `GEMINI_API_KEY`, `CLAUDE_API_KEY`, `NEXT_PUBLIC_COMFYUI_URL`, `NEXT_PUBLIC_API_URL`

## Cloudflare Tunnel

- Config: `C:\Windows\System32\config\systemprofile\.cloudflared\config.yml`
- Task Scheduler: "CloudflaredTunnel" (SYSTEM, AtStartup)
- Routes: `api.feelthemusic.app → localhost:3001`, `comfyui.feelthemusic.app → localhost:8188`
- Requires local machine running

## Supabase Project

- **Ref:** `ebroeczeulacxtcwnrll` (separate from feelthemusic.app)
- RLS enabled on all tables — enforced in `20260329000001_enforce_rls_production.sql`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET` are **required()** in env config — never make optional

## API Keys Used

- Anthropic Claude (CLAUDE_API_KEY)
- Google Gemini (GEMINI_API_KEY)
- Supabase (service key + anon key)
- Upstash Redis (production queue)

## Infrastructure

- Redis: Docker container (`restart: always`, port 6379)
- Ollama: Docker container (`restart: always`, port 11434)
- ComfyUI: Manual start via START-ALL.bat (port 8188)
- API: Manual start via START-ALL.bat (port 3001)

## Security Notes

- CORS is locked to explicit origins (production domains + localhost in dev only)
- Helmet CSP enabled in production
- All routes (except /health, /auth) require authenticate middleware + rate limiting
- Error handler uses `safeErrorMessage()` — never sends raw error.message to client
- Secrets are `required()` in Zod schema — no fallback defaults allowed

## Internal Notes

- Workers auto-trigger assembly when all scene animations complete
- Scheduler: hourly generation, 30min retry, daily cleanup
- Assembly worker auto-publishes if `auto_publish` config is true
- `packages/prompts` contains shared AI personas, prompt compression, and formatters
- Creative pipeline at `/api/creative/*` uses criteria-based personas
