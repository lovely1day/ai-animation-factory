# Architecture Overview

## System Components

### Frontend (apps/web)
Next.js 14 App Router with two route groups:
- `(streaming)/` - Public viewer (browse, search, watch)
- `(dashboard)/` - CMS for admins/editors
- `(auth)/` - Login

Real-time updates via Supabase realtime subscriptions.

### Backend API (apps/api)
Express.js REST API with:
- JWT authentication
- Rate limiting per route group
- Request validation with Zod
- Structured logging with Winston

### Worker System
9 BullMQ workers running as separate processes:
1. **idea-worker** - GPT-4 idea generation
2. **script-worker** - Full episode script writing
3. **image-worker** - DALL-E 3 scene images (parallel)
4. **animation-worker** - Runway Gen-3 animation
5. **voice-worker** - ElevenLabs TTS per scene
6. **music-worker** - Mubert background track
7. **assembly-worker** - FFmpeg video composition
8. **subtitle-worker** - Whisper transcription → SRT
9. **thumbnail-worker** - DALL-E 3 thumbnail

### Job Dependencies
```
idea → script → image (x8 parallel)
                      → animation (x8 parallel)
     → music          ↘
     → thumbnail       assembly → subtitle
```

The assembly worker is triggered automatically once all scene animations are complete.

### Storage Strategy
All generated assets are uploaded to Cloudflare R2:
```
episodes/{episode_id}/
  video.mp4
  thumbnail.png
  music.mp3
  subtitles.srt
  scenes/{scene_id}/
    image.png
    animation.mp4
    voice.mp3
```

### Database Schema
See [packages/database/schema.sql](../packages/database/schema.sql)

Key tables:
- `episodes` - Episode metadata, status, URLs
- `scenes` - Individual scene data
- `assets` - All uploaded file references
- `generation_jobs` - Pipeline job tracking
- `analytics` - View/like/event tracking
- `scheduler_config` - Runtime configuration

## Scaling

To scale generation throughput:
1. Increase `EPISODES_PER_HOUR` in scheduler config
2. Deploy more worker instances (docker-compose `replicas`)
3. Tune `concurrency` in each worker factory function
4. Add Redis Cluster for high availability
