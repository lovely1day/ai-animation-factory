# 🚀 Upstash Redis Setup Guide

## الخطوة 1: إنشاء حساب Upstash

1. افتح: https://upstash.com
2. سجّل دخول باستخدام GitHub
3. اختر **"Create Database"**

## الخطوة 2: إعداد قاعدة البيانات

```
Database Name: ai-animation-factory
Region: اختر الأقرب لمنطقة Vercel (مثلاً: us-east-1)
TLS/SSL: ✅ مفعّل
Eviction: ✅ مفعّل (للـ cache)
```

## الخطوة 3: جلب معلومات الاتصال

بعد إنشاء قاعدة البيانات، انسخ هذه القيم:

```env
# REST API (موصى به للـ serverless)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# أو Redis Protocol (للـ Docker/Local)
REDIS_HOST=your-db.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

## الخطوة 4: إضافة المتغيرات في Vercel

1. افتح مشروعك في Vercel
2. اذهب إلى **Settings** → **Environment Variables**
3. أضف:

```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## الخطوة 5: اختبار الاتصال

```bash
# اختبار محلي
REDIS_HOST=your-db.upstash.io REDIS_PASSWORD=your-password pnpm dev

# أو مع Upstash HTTP
UPSTASH_REDIS_REST_URL=https://... UPSTASH_REDIS_REST_TOKEN=... pnpm dev
```

## 💡 نصائح

- Upstash مجاني حتى 10,000 request/يوم
- البيانات تُحفظ persistently
- يدعم TLS/SSL افتراضياً
- مناسب جداً لـ Vercel (serverless)

## 🔧 Troubleshooting

### مشكلة: Connection timeout
**الحل:** تأكد من TLS مفعّل للـ Upstash

### مشكلة: ECONNREFUSED
**الحل:** تأكد من صحة الـ URL والـ Token

### مشكلة: Timeout في Vercel
**الحل:** استخدم REST API بدلاً من Redis Protocol
