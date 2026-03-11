# Deployment Guide

## Option 1: Docker Compose (Recommended for VPS)

```bash
# Clone repo
git clone <repo>
cd ai-animation-factory

# Configure
cp .env.example .env
nano .env  # Fill in all API keys

# Deploy
docker-compose up -d

# Scale workers
docker-compose up -d --scale worker=4
```

Services:
- Frontend: http://your-server:3000
- API: http://your-server:3001
- Bull Board: http://your-server:3002

## Option 2: Manual Deployment

### API Server
```bash
cd apps/api
pnpm build
NODE_ENV=production node dist/server.js
```

### Workers (run separately)
```bash
cd apps/api
NODE_ENV=production node dist/workers/index.js
```

### Frontend
```bash
cd apps/web
pnpm build
pnpm start
```

## Option 3: Railway / Render

1. Connect your GitHub repo
2. Set all environment variables from `.env.example`
3. Deploy API as a web service (command: `pnpm --filter api start`)
4. Deploy workers as a background worker (command: `pnpm --filter api worker`)
5. Deploy web as a web service (command: `pnpm --filter web start`)
6. Add Redis addon

## Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Required External Services

| Service | Purpose | Cost |
|---------|---------|------|
| Supabase | Database + Auth | Free tier available |
| Cloudflare R2 | Storage | ~$0.015/GB |
| OpenAI | GPT-4 + DALL-E | Pay per use |
| Runway ML | Animation | $95+/month |
| ElevenLabs | Voice | $5+/month |
| Mubert | Music | Custom pricing |
| Redis | Queue | Self-hosted or Redis Cloud |
