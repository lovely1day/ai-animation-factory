# Arabic Fonts — لحرق الترجمة العربية في الفيديو

هذا المجلد يحتوي خطوط عربية احترافية تُستخدم عند حرق الـ SRT في الفيديو عبر `subtitleBurnService`.

## الخطوط المدعومة (كلها OFL — مفتوحة المصدر ومجانية)

| الاسم | الاستخدام | المصدر |
|------|-----------|--------|
| Cairo (Regular + Bold) | الخيار الافتراضي — عصري ومقروء | [Google Fonts](https://fonts.google.com/specimen/Cairo) |
| Tajawal (Regular + Bold) | محتوى تسويقي وإعلانات | [Google Fonts](https://fonts.google.com/specimen/Tajawal) |
| Amiri (Regular + Bold) | محتوى ديني/كلاسيكي (نسخي تقليدي) | [Google Fonts](https://fonts.google.com/specimen/Amiri) |
| IBM Plex Sans Arabic (Regular + Medium) | محتوى تعليمي/تقني | [Google Fonts](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic) |

## التنزيل

الملفات `.ttf` **غير مرفوعة في git** (حجم + gitignore). لتنزيلها:

```bash
cd apps/api
node scripts/download-arabic-fonts.mjs
```

السكربت يحمّل 8 ملفات `.ttf` من مستودع Google Fonts على GitHub إلى هذا المجلد.

## الترخيص

كل الخطوط تحت **SIL Open Font License 1.1** — مجانية للاستخدام التجاري والتعديل بدون قيود.
