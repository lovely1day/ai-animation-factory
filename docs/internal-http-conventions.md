# Internal HTTP Conventions — Cross-Project Calls (JL)

> **الحالة:** مسودة قواعد (2026-04-19). **لم تُنفَّذ في الكود بعد** — هذه اتفاقية لما تقرر ربط المشاريع.
> هذا مستند توافق بين `ai-animation-factory` و `mediavorice-studio` و `feelthemusic.app` و `jackoleeno-ops`.

---

## 1. لماذا هذي الاتفاقية؟

كل مشاريع JL الحالية تشتغل كنظام مستقل. في مايو 2026 سنربطها داخلياً حتى:
- **feelthemusic.app** يستطيع طلب تحريك شخصية من الـ **factory** (بدون تكرار كود).
- **jackoleeno-ops** يستطيع إرسال مهمة TTS إلى **mediavorice-studio**.
- **debate-engine** يستطيع طلب موسيقى خلفية من audio studio.

بدون اتفاقية مشتركة سيفقد كل استدعاء وقتاً في نقاشات "أي header؟ أي status code؟ أي secret؟".

---

## 2. المبدأ الأساسي: `/internal/*` معزولة عن `/api/*`

| النوع | المسار | الـ Auth | الاستخدام |
|------|--------|---------|-----------|
| Public API | `/api/v1/*` | JWT (المستخدم النهائي) | UI الويب، المستخدمون النهائيون |
| **Internal API** | `/internal/*` | `X-Internal-Token` (سر مشترك) | مشاريع JL الأخرى فقط |

**قاعدة حمراء:** `/internal/*` لا تُكشف للإنترنت العام. تُستدعى فقط من:
- داخل نفس الشبكة (localhost في التطوير)
- عبر Cloudflare Tunnel مع IP allowlist
- عبر Access Policy على مستوى Cloudflare

---

## 3. المصادقة — Shared Secret بسيط

### Env variable (كل مشروع)

```bash
# .env في كل خدمة مستهلِكة (feelthemusic, jackoleeno-ops...)
INTERNAL_TOKEN_FACTORY=<long-random-256-bit-secret>
INTERNAL_TOKEN_AUDIO=<different-long-random-secret>

# .env في الخدمة الموفِّرة (factory, audio)
INTERNAL_TOKEN=<نفس القيمة أعلاه>
```

**توليد السر:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Middleware موحّد (نمط للـ factory)

اسم مقترح: `apps/api/src/middleware/internal-auth.ts`

```ts
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function requireInternalToken(req: Request, res: Response, next: NextFunction) {
  const token = req.header('X-Internal-Token');
  if (!token || token !== env.INTERNAL_TOKEN) {
    return res.status(401).json({ error: 'invalid_internal_token' });
  }
  next();
}
```

**التركيب في `routes/index.ts`:**
```ts
router.use('/internal', requireInternalToken, internalRouter);
```

**ملاحظة:** `authenticate` (JWT) **لا** يُطبَّق على `/internal/*`. الـ shared secret يكفي.

---

## 4. تسمية المسارات

**الصيغة:** `/internal/<resource>/<action>`

| المشروع | مسار داخلي | يفعل |
|---------|------------|------|
| factory | `POST /internal/animate` | ينشئ حلقة أنيميشن من فكرة |
| factory | `POST /internal/generate-scene-image` | يولّد صورة مشهد منفردة |
| audio | `POST /internal/tts` | تحويل نص عربي إلى صوت |
| audio | `POST /internal/music` | توليد موسيقى خلفية |
| audio | `POST /internal/burn-subtitles` | حرق SRT في فيديو |

**قواعد:**
- فعل حقيقي في الـ action (`animate`, `tts`, `burn-subtitles`) — ليس CRUD غامض.
- لا nested resources (`/internal/users/:id/posts` ← غلط).
- لا version في المسار (`/internal/v1/...` ← مش ضروري، الـ internal يتغير بالتزامن).

---

## 5. شكل الطلب والاستجابة

### طلب (POST)

```http
POST /internal/animate HTTP/1.1
Host: api.feelthemusic.app
X-Internal-Token: <secret>
X-Request-Id: <uuid v4 optional, للـ tracing>
Content-Type: application/json

{
  "idea": "قصة عن الصبر",
  "sceneCount": 25,
  "contentType": "story",
  "callbackUrl": "https://feelthemusic.app/internal/hooks/animation-done"
}
```

### استجابة — غير متزامنة (العمليات الطويلة)

```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "jobId": "ep_abc123",
  "status": "queued",
  "statusUrl": "/internal/jobs/ep_abc123",
  "estimatedDurationSec": 420
}
```

### استجابة — متزامنة (العمليات السريعة)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": { ... },
  "meta": { "durationMs": 340 }
}
```

### استجابة خطأ — موحّدة

```http
HTTP/1.1 4xx/5xx
Content-Type: application/json

{
  "error": "invalid_idea_format",
  "message": "idea must be non-empty string",
  "requestId": "<echo of X-Request-Id>"
}
```

**قواعد:**
- `error`: ثابت، snake_case، للكود الذي يستهلك.
- `message`: نص قابل للقراءة — لا تعتمد عليه في branching.
- لا تكشف stack traces أو رسائل داخلية (خصوصاً في prod).

---

## 6. Webhooks / Callbacks (العمليات الطويلة)

إذا تقدم `callbackUrl` في الطلب، الخدمة الموفِّرة ستستدعيه عند الانتهاء:

```http
POST <callbackUrl> HTTP/1.1
X-Internal-Token: <secret الخاص بالمستقبِل>
Content-Type: application/json

{
  "jobId": "ep_abc123",
  "status": "completed",
  "result": { "videoUrl": "https://..." },
  "error": null
}
```

**أمان webhook:** الطرف المستقبِل يجب أن يتحقق من `X-Internal-Token` بنفس آلية §3.

---

## 7. الشبكة

### تطوير محلي
- factory على `http://localhost:3001`
- audio (mediavorice) على `http://localhost:8000`
- feelthemusic على `http://localhost:8080`
- الاستدعاءات المباشرة بين localhost — لا tunnel.

### إنتاج
- factory على `https://api.feelthemusic.app` (Cloudflare Tunnel موجود)
- audio على دومين مستقل لاحقاً
- **Cloudflare Access Policy** يُقيّد `/internal/*` على IP allowlist أو Service Token.

---

## 8. Idempotency

أي endpoint ينشئ مورداً يجب أن يقبل `Idempotency-Key` header:

```http
POST /internal/animate
Idempotency-Key: <uuid v4>
```

الخدمة الموفِّرة تحفظ `(key, response)` لـ 24 ساعة — إعادة الطلب بنفس المفتاح يرجع نفس الاستجابة بدون تكرار العمل.

---

## 9. Observability

كل استدعاء `/internal/*` يجب أن يُسجَّل:

```json
{
  "timestamp": "2026-04-19T12:34:56Z",
  "requestId": "<uuid>",
  "route": "/internal/animate",
  "caller": "feelthemusic",         // من header X-Caller-Service
  "durationMs": 340,
  "statusCode": 202,
  "episodeId": "<if applicable>"
}
```

`X-Caller-Service` header: كل مستهلِك يضع اسم خدمته — يسهّل التتبع.

---

## 10. TypeScript Types المشتركة

الملف المقترح: `packages/shared/src/internal-api.ts` (لم يُضف بعد).

```ts
export interface InternalAnimateRequest {
  idea: string;
  sceneCount?: number;
  contentType?: 'story' | 'sermon' | 'educational' | 'advertisement';
  callbackUrl?: string;
}

export interface InternalJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  statusUrl?: string;
  estimatedDurationSec?: number;
  result?: unknown;
  error?: string | null;
}

export interface InternalErrorResponse {
  error: string;
  message: string;
  requestId?: string;
}
```

كل مشروع مستهلِك يستورد الأنواع من `@ai-animation-factory/shared` ليضمن التطابق.

---

## 11. ما لا يجب فعله

| ممنوع | السبب |
|-------|-------|
| استخدام JWT المستخدم النهائي لـ `/internal/*` | internal = machine-to-machine، المستخدم غير موجود في السياق |
| كشف `/internal/*` بدون tunnel/allowlist | أي تسريب للـ token = اختراق فوري |
| خلط `/api/v1/*` و `/internal/*` في نفس controller | يخلط مستويات المصادقة ويربك الـ auditing |
| إعادة استخدام نفس `INTERNAL_TOKEN` لكل الخدمات | سر واحد مسروق = كل الخدمات مخترقة. **سر لكل خدمة موفِّرة.** |
| Hard-code الـ secret في الكود | دائماً `env` + `.env.example` placeholder |

---

## 12. خطة تنفيذ (لما نبدأ)

1. **factory**: أضف `middleware/internal-auth.ts` + route `/internal/animate` — يعاد استخدام الـ `creativePipeline` controller موجود.
2. **feelthemusic**: طبقة client في `lib/internal-clients/factory.ts` تستخدم `INTERNAL_TOKEN_FACTORY`.
3. **mediavorice**: كرر نفس النمط مع `/internal/tts` + `/internal/music`.
4. **أضف X-Internal-Token** لـ `helmet.noSniff` و CORS allowlist (لو موجود).

**لا تنفّذ خطوة منها قبل مايو 2026** — هذا التوثيق فقط للتوافق حين نبدأ.
