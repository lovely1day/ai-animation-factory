import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
// لضمان عدم التضارب، سنثبته على 4000 يدوياً الآن للتجربة
const PORT = 4000; 

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    timestamp: new Date().toISOString() 
  });
});

// استيراد الروابط بطريقة أفضل لمعرفة الخطأ الحقيقي
try {
    const { generationRouter } = require('./routes/generation.routes');
    if (generationRouter) {
        app.use('/api/generation', generationRouter);
        console.log("✅ Generation routes loaded successfully");
    }
} catch (e: any) {
    console.error("❌ Critical error loading routes:", e.message);
}

// تشغيل السيرفر مع تحديد العنوان 0.0.0.0 لضمان وصول ويندوز إليه
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ################################################
  🚀  Server listening on: http://localhost:${PORT}
  🚀  Health check: http://localhost:${PORT}/health
  ################################################
  `);
});

// منع الإغلاق المفاجئ
server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`🔴 Port ${PORT} is already in use. Please kill the process or change the port.`);
    } else {
        console.error('🔴 Server Error:', err);
    }
});

process.on('uncaughtException', (err) => {
  console.error('🔴 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('🔴 Unhandled Rejection:', reason);
});

export default app;