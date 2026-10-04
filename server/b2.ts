import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Backblaze B2 (S3-compatible) helper.
 * Env: B2_KEY_ID, B2_APP_KEY, B2_REGION (mis. us-west-004), B2_BUCKET, opsional B2_ENDPOINT.
 */
let client: S3Client | null = null;

export function isB2Configured(): boolean {
  return Boolean(
    process.env.B2_KEY_ID && process.env.B2_APP_KEY && process.env.B2_REGION && process.env.B2_BUCKET
  );
}

function getClient(): S3Client {
  if (client) return client;
  const region = String(process.env.B2_REGION);
  client = new S3Client({
    region,
    endpoint: process.env.B2_ENDPOINT || `https://s3.${region}.backblazeb2.com`,
    credentials: {
      accessKeyId: String(process.env.B2_KEY_ID),
      secretAccessKey: String(process.env.B2_APP_KEY),
    },
    // B2 belum mendukung header checksum default AWS SDK v3 terbaru.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return client;
}

const bucket = () => String(process.env.B2_BUCKET);

/** Presigned PUT: browser mengunggah langsung ke B2 (tidak lewat Vercel). */
export async function presignPut(key: string, contentType: string, contentLength: number, expiresIn = 600) {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ContentLength: contentLength }),
    { expiresIn }
  );
}

/** Presigned GET berumur singkat; browser mengunduh langsung dari B2. */
export async function presignGet(
  key: string,
  opts: { contentType?: string; disposition?: string; expiresIn?: number } = {}
) {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ResponseContentType: opts.contentType,
      ResponseContentDisposition: opts.disposition,
    }),
    { expiresIn: opts.expiresIn ?? 600 }
  );
}

export async function putB2Object(key: string, body: Buffer, contentType: string) {
  await getClient().send(
    new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType, ContentLength: body.length })
  );
}

export async function headB2Object(key: string): Promise<{ size: number } | null> {
  try {
    const out = await getClient().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return { size: Number(out.ContentLength ?? 0) };
  } catch {
    return null;
  }
}

export async function deleteB2Objects(keys: string[]): Promise<void> {
  if (!isB2Configured() || keys.length === 0) return;
  await Promise.allSettled(
    keys.map((Key) => getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key })))
  );
}
