import { Router, Request, Response } from 'express';
import { handleUpload, HandleUploadBody } from '@vercel/blob/client';

export const blobRouter = Router();

/**
 * Endpoint for generating @vercel/blob client upload tokens and receiving upload completion callbacks.
 * Files are uploaded directly from user's browser to Vercel Blob CDN, bypassing Serverless Function payload limits.
 */
blobRouter.post('/blob/upload', async (req: Request, res: Response) => {
  const body = req.body as HandleUploadBody;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      error: 'BLOB_READ_WRITE_TOKEN belum dikonfigurasi pada environment. Klien akan menggunakan fallback kompresi ringan.',
    });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname: string) => {
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
        const isAllowed = allowedExtensions.some(ext => pathname.toLowerCase().endsWith(ext));

        if (!isAllowed) {
          throw new Error('Ekstensi berkas tidak diizinkan. Hanya menerima PDF dan Gambar (JPG/PNG/WEBP).');
        }

        return {
          allowedContentTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
          ],
          maximumSizeInBytes: 15 * 1024 * 1024, // Allow up to 15MB direct to Vercel Blob
          tokenPayload: JSON.stringify({ timestamp: Date.now() }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('[Vercel Blob Completed]', blob.url, tokenPayload);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error: any) {
    console.error('[Vercel Blob Upload Token Error]', error);
    return res.status(400).json({ error: error.message || 'Gagal memproses token upload' });
  }
});
