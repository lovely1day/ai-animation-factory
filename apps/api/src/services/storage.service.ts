import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Supabase Storage client (uses service role for full access)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = process.env.STORAGE_BUCKET || 'ai-animation-factory';
const PUBLIC_BASE = process.env.STORAGE_PUBLIC_URL ||
  `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

/**
 * Upload a buffer to Supabase Storage and return the public URL.
 */
export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    logger.error({ error: error.message, key }, 'Supabase Storage upload failed');
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const url = `${PUBLIC_BASE}/${key}`;
  logger.info({ key, url }, 'File uploaded to Supabase Storage');
  return url;
}

export async function uploadFile(key: string, buffer: Buffer, contentType: string) {
  await uploadBuffer(buffer, key, contentType);
  return { success: true, key };
}

/**
 * Get a signed (temporary) download URL for a private file.
 * For public buckets, just use the public URL directly.
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, expiresIn);

  if (error || !data?.signedUrl) {
    // Fallback to public URL
    return `${PUBLIC_BASE}/${key}`;
  }
  return data.signedUrl;
}

export const storageService = { uploadBuffer, uploadFile, getSignedDownloadUrl };
