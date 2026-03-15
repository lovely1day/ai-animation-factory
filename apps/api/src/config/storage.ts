// Legacy storage config — kept for backward compatibility
// All storage operations now use services/storage.service.ts (Supabase Storage)
import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

export const s3Client = new S3Client({ region: 'auto' });
export const storageBucket = env.STORAGE_BUCKET;
export const storagePublicUrl = env.STORAGE_PUBLIC_URL;
