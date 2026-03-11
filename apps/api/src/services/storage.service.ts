import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
});

const BUCKET = process.env.R2_BUCKET!;

export async function uploadFile(key: string, buffer: Buffer, contentType: string) {
  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }));
    
    logger.info({ key }, 'File uploaded successfully');
    return { success: true, key };
  } catch (error) {
    logger.error({ error, key }, 'Failed to upload file');
    throw error;
  }
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  });
  
  return getSignedUrl(s3, command, { expiresIn });
}
