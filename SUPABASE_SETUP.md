# 🗄️ Supabase Setup Guide - خطوات إعداد قاعدة البيانات

## 📋 متطلبات مسبقة
- حساب GitHub (للتسجيل في Supabase)
- مشروع AI Animation Factory مرفوع على GitHub

---

## 🚀 الخطوة 1: إنشاء حساب Supabase

1. افتح: https://supabase.com
2. اضغط **"Start your project"**
3. سجّل دخول باستخدام **GitHub**
4. اختر المؤسسة (Organization): `skzecvzuuckavsjjsdbe`

---

## 🛠️ الخطوة 2: إنشاء مشروع جديد

1. اضغط **"New Project"**
2. املأ البيانات:

```
Organization: skzecvzuuckavsjjsdbe
Name: ai-animation-factory
Database Password: [اختر كلمة قوية - احفظها جيداً!]
Region: [اختر الأقرب لك]
  - إذا كنت في الشرق الأوسط: "Middle East (N. Virginia)"
  - أو "West US (Oregon)" للمستخدمين الأمريكيين
```

3. اضغط **"Create new project"**
4. انتظر 2-3 دقائق حتى يكتمل الإعداد

---

## 📝 الخطوة 3: تشغيل SQL Script

### 3.1 فتح SQL Editor

1. في لوحة التحكم، اذهب إلى **"SQL Editor"** (في الشريط الجانبي الأيسر)
2. اضغط **"New query"**
3. اسم الـ Query: `initial-schema`

### 3.2 نسخ SQL Script

1. افتح هذا الملف في GitHub:
   ```
   https://github.com/lovely1day/ai-animation-factory/blob/master/supabase/seed.sql
   ```

2. انسخ كل المحتوى (Ctrl+A ثم Ctrl+C)

### 3.3 لصق وتشغيل

1. العودة إلى Supabase SQL Editor
2. الصق المحتوى في المحرر
3. اضغط **"Run"** (الزر الأخضر في الأعلى)

4. انتظر حتى تظهر رسالة: ✅ **"Success. No rows returned"**

---

## 🪣 الخطوة 4: إعداد Storage Bucket

### 4.1 إنشاء Bucket

1. اذهب إلى **"Storage"** (في الشريط الجانبي)
2. اضغط **"New bucket"**
3. املأ البيانات:
   ```
   Name: ai-animation-factory
   Public bucket: ✅ [مفعّل]
   ```
4. اضغط **"Save"

### 4.2 إعداد الصلاحيات (Policies)

1. اضغط على الـ Bucket `ai-animation-factory`
2. اذهب إلى تبويب **"Policies"**
3. اضغط **"New policy"**

4. اختر **"For full customization"** (الخيار الثاني)

5. املأ البيانات:
   ```
   Policy name: Allow public access
   Allowed operation: ALL
   Target roles: anon, authenticated
   Policy definition: true
   ```

6. اضغط **"Review"** ثم **"Save policy"**

---

## 🔑 الخطوة 5: جلب مفاتيح API

### 5.1 Project Settings

1. اذهب إلى **"Project Settings"** (أيقونة الترس في الأسفل)
2. اختر تبويب **"API"**

### 5.2 المفاتيح المطلوبة

انسخ هذه القيم واحفظها في مكان آمن:

```env
# URL
SUPABASE_URL=https://[your-project-ref].supabase.co

# anon key (للـ Frontend)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# service_role key (للـ Backend - سرية جداً!)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
```

⚠️ **تحذير:** لا تشارك `service_role key` أبداً!

---

## ✅ الخطوة 6: التحقق من الإعداد

### 6.1 التحقق من الجداول

1. اذهب إلى **"Table Editor"**
2. يجب أن ترى هذه الجداول:
   - ✅ users
   - ✅ episodes
   - ✅ scenes
   - ✅ assets
   - ✅ generation_jobs
   - ✅ analytics_events

### 6.2 اختبار الاتصال

1. اذهب إلى **"SQL Editor"**
2. شغل هذا الاستعلام:
   ```sql
   SELECT * FROM episodes LIMIT 1;
   ```
3. يجب أن ترى: ✅ **"Success. No rows returned"** (طبيعي لأن البيانات فارغة)

---

## 📊 الخطوة 7: إضافة بيانات تجريبية (اختياري)

```sql
-- تشغيل هذا في SQL Editor
INSERT INTO episodes (
  title, 
  description, 
  genre, 
  target_audience, 
  status
) VALUES (
  'Test Episode', 
  'This is a test episode', 
  'adventure', 
  'children', 
  'published'
);
```

---

## 🔧 الخطوة 8: إعداد Environment Variables

### للـ Vercel (Web):
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

### للـ Vercel (API):
```env
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_KEY=[service-role-key]
SUPABASE_ANON_KEY=[anon-key]
```

---

## 🎯 ملخص ما تم إنجازه

✅ إنشاء مشروع Supabase
✅ تشغيل SQL Schema (جميع الجداول)
✅ إعداد Storage Bucket
✅ إعداد صلاحيات الوصول
✅ جلب مفاتيح API

---

## 🆘 استكشاف الأخطاء

### مشكلة: "Error: relation 'episodes' does not exist"
**الحل:** تأكد من تشغيل SQL script كاملاً بدون أخطاء

### مشكلة: "Permission denied for table"
**الحل:** تأكد من تفعيل RLS policies أو استخدم service_role key

### مشكلة: "Bucket not found"
**الحل:** تأكد من إنشاء bucket باسم `ai-animation-factory`

---

## 📞 للمساعدة

- 📚 Supabase Docs: https://supabase.com/docs
- 🐛 Report Issues: https://github.com/lovely1day/ai-animation-factory/issues

---

## ✅ التحقق النهائي

بعد الانتهاء، تأكد من:
- [x] المشروع منشأ في Supabase
- [x] جميع الجداول موجودة (6 tables)
- [x] Storage Bucket منشأ
- [x] Policies مفعلة
- [x] API Keys محفوظة
- [x] Environment Variables جاهزة

**🎉 مبروك! قاعدة البيانات جاهزة للاستخدام!**
