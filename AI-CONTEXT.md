# سياق المشروع — AI Animation Factory

> انسخ هذا الملف كامل والصقه في أي محادثة AI عشان يفهم مشروعك ويساعدك بشكل أفضل.

---

## القسم 1: عني

- **الاسم:** علي (JackoLeeno / جاكو)
- **الموقع:** جدة، السعودية
- **الدور:** مؤسس JackoLeeno JL — شركة رقمية قابضة
- **الخلفية:** مطور self-taught أتعلم من خلال بناء منتجات حقيقية
- **اللغة:** أكتب بالعامية السعودية + إنجليزي تقني — رد علي بنفس الأسلوب

---

## القسم 2: جهازي وأدواتي

| العنصر | التفاصيل |
|--------|----------|
| **النظام** | Windows 11, Intel i7-12700H, RTX 3060 6GB, 16GB RAM, 512GB SSD |
| **GPU** | تُستخدم لـ ComfyUI (توليد صور) + Ollama (نماذج AI محلية) |
| **المحرر** | VS Code + Claude Code CLI |
| **الأدوات** | Docker Desktop, Git, Redis (Docker), Ollama (Docker) |
| **AI** | Claude API, Gemini API, Ollama (محلي), HuggingFace, ComfyUI (SDXL) |
| **النشر** | Vercel, Cloudflare Tunnel, Supabase |
| **Package Manager** | pnpm (monorepo) |

---

## القسم 3: هذا المشروع

### المعلومات الأساسية

| العنصر | التفاصيل |
|--------|----------|
| **الاسم** | AI Animation Factory — مصنع الأنيميشن الذكي |
| **الوصف** | نظام إنتاج حلقات أنيميشن مؤتمت بالكامل باستخدام AI |
| **الغرض** | توليد أفكار → سكربت → صور → موسيقى → أنيميشن → تجميع → ترجمة تلقائيا |
| **الحالة** | 82% (Active) — 9 BullMQ workers + أول فيديو حقيقي تولّد |
| **الرابط** | https://ai-animation-factory-web.vercel.app |
| **API** | https://api.feelthemusic.app (عبر Cloudflare Tunnel) |
| **ComfyUI** | https://comfyui.feelthemusic.app (عبر Cloudflare Tunnel) |
| **البورتات** | API: 3001, Web: 3000, ComfyUI: 8188, Redis: 6379, Ollama: 11434 |
| **التشغيل** | `pnpm dev` |

### Stack التقني

| الطبقة | التقنية |
|--------|---------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend (apps/web) | Next.js 14 App Router + TypeScript + Tailwind |
| Backend (apps/api) | Express 5 + TypeScript + BullMQ |
| Queue | Redis + BullMQ (9 workers) |
| Database | Supabase (PostgreSQL + RLS) |
| AI Providers | Claude API, Gemini API, Ollama (محلي) |
| Image Gen | ComfyUI (SDXL) + HuggingFace FLUX |
| Shared | packages/shared (types), packages/prompts (AI prompts) |
| Testing | Vitest |

### البنية المعمارية

```
ai-animation-factory/
├── apps/
│   ├── api/                   ← Express backend
│   │   ├── src/
│   │   │   ├── server.ts      ← Entry point
│   │   │   ├── routes/        ← API routes (auth + rate limit)
│   │   │   ├── services/      ← Business logic
│   │   │   ├── workers/       ← BullMQ workers (9 workers)
│   │   │   ├── scheduler/     ← Cron automation
│   │   │   ├── config/        ← env + AI providers
│   │   │   └── middleware/     ← Auth, error handling, rate limit
│   │   └── package.json
│   ├── web/                   ← Next.js frontend
│   └── character-studio/      ← Character DNA system
├── packages/
│   ├── database/              ← PostgreSQL schema
│   ├── shared/                ← Shared TypeScript types
│   └── prompts/               ← AI prompt library (personas, compression)
├── supabase/
│   └── migrations/            ← SQL migrations with RLS
├── turbo.json
└── pnpm-workspace.yaml
```

### Pipeline الإنتاج

```
idea → script → [images x8 + music + thumbnail] (parallel) → animations → assembly → subtitles
```

### الميزات المكتملة

- Creative Pipeline كامل (4 مراحل + full-pipeline)
- 9 BullMQ workers للمعالجة المتوازية
- Scheduler (cron) للتوليد التلقائي كل ساعة
- دعم 5 AI providers: Claude Sonnet, Gemini, Ollama+Claude, Ollama+Gemini, Ollama
- Status dots (خضراء/حمراء) على كل provider
- packages/prompts — مكتبة برومبتات مشتركة مع personas + compression
- Criteria-based Personas + Prompt Compression بين المراحل
- Character DNA system
- Auth + Rate Limiting + CORS + CSP + Error Handling
- Cloudflare Tunnel للوصول الخارجي

### القواعد المهمة

- كل route لازم يكون عنده `authenticate` middleware + rate limiting
- ما تستخدم `cors()` بدون قائمة origins صريحة
- ما ترسل `error.message` للعميل — استخدم `safeErrorMessage()`
- RLS مفعل على كل الجداول
- الأسرار required() في env.ts — ما تغيرها لـ optional
- TypeScript strict mode في كل مكان

### الناقص

- تحسين واجهة الويب
- ربط ComfyUI بشكل أعمق
- نظام المراجعة والموافقة
- Auto-publish pipeline
- المزيد من الـ tests

---

## القسم 4: أحتاج مساعدة في

أحتاج مساعدة في: [اكتب هنا]

---

*JackoLeeno JL · كل كود وفكرة وقرار صُنع بحب*
