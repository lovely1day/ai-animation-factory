import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

// Supabase Storage client (uses service role for full access)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
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
    // FALLBACK: save locally to web/public so the file is still served
    logger.warn({ error: error.message, key }, 'Supabase Storage failed — using local fallback');
    const webPublic = path.resolve(process.cwd(), '../web/public');
    const localPath = path.join(webPublic, key);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);
    const localUrl = `/${key}`;
    logger.info({ key, localUrl }, 'File saved locally (fallback)');
    return localUrl;
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
