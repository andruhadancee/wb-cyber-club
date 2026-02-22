import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';
import { config } from './config';
import logger from './logger';

const ENDPOINT = config.S3_ENDPOINT;
const BUCKET = config.S3_BUCKET;
const REGION = config.S3_REGION;
const ACCESS_KEY = config.S3_ACCESS_KEY;
const SECRET_KEY = config.S3_SECRET_KEY;

const enabled = !!(ENDPOINT && BUCKET && ACCESS_KEY && SECRET_KEY);

const client = enabled
  ? new S3Client({
      endpoint: ENDPOINT,
      region: REGION,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
      forcePathStyle: true,
    })
  : null;

if (enabled) {
  logger.info({ bucket: BUCKET, endpoint: ENDPOINT }, 'S3 storage enabled');
} else {
  logger.warn('S3 env vars missing — falling back to local uploads');
}

export function isS3Enabled(): boolean {
  return enabled;
}

export function getPublicUrl(key: string): string {
  return `${ENDPOINT}/${BUCKET}/${key}`;
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = 'disciplines',
): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  const hash = crypto.randomBytes(8).toString('hex');
  const key = `${folder}/${Date.now()}-${hash}${ext}`;

  if (!client) throw new Error('S3 is not configured');

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=604800',
    }),
  );

  return getPublicUrl(key);
}

export async function deleteFile(url: string): Promise<void> {
  if (!client) return;

  const prefix = `${ENDPOINT}/${BUCKET}/`;
  if (!url.startsWith(prefix)) return;

  const key = url.slice(prefix.length);

  await client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key }),
  );
}
