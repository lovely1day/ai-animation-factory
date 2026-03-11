#!/bin/bash
set -e

echo "🎬 AI Animation Factory - Setup Script"
echo "======================================"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 18+ required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Installing pnpm..."; npm install -g pnpm; }
command -v ffmpeg >/dev/null 2>&1 || echo "⚠️  FFmpeg not found - install it for video assembly"

# Copy env file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example - please fill in your API keys"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build packages
echo "🔨 Building packages..."
pnpm build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Create Supabase project and run packages/database/schema.sql"
echo "  3. Start Redis: docker run -d -p 6379:6379 redis:7-alpine"
echo "  4. Run: pnpm dev"
echo ""
echo "Or use Docker Compose:"
echo "  docker-compose up -d"
