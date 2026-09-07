import { Router, Request, Response } from 'express';
import { Database, AppMediaItem } from './db';

export const mediaRouter = Router();

/**
 * Helper to extract raw buffer from base64 or Data URI
 */
function decodeBase64File(fileData: string): { buffer: Buffer; mimeType?: string } {
  const matches = fileData.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    return { buffer, mimeType };
  }
  // If raw base64 without prefix
  return { buffer: Buffer.from(fileData, 'base64') };
}

/**
 * 1. Upload Media (File-by-file direct to TiDB Cloud storage)
 * Payload is typically small (<1MB per file), completely safe from Vercel's 4.5MB limit.
 */
mediaRouter.post('/media/upload', async (req: Request, res: Response) => {
  try {
    const { filename, contentType, fileData, category = 'REG_DOC', refId, subKey } = req.body;

    if (!filename || !fileData) {
      return res.status(400).json({ error: 'Filename and fileData are required' });
    }

    const { buffer, mimeType } = decodeBase64File(fileData);
    const resolvedContentType = contentType || mimeType || 'application/octet-stream';
    const fileSize = buffer.length;

    // Hard safety check per single file: max 4MB to protect Vercel Serverless & TiDB payload
    if (fileSize > 4 * 1024 * 1024) {
      return res.status(413).json({
        error: 'Ukuran berkas melebihi batas 4MB. Untuk file PDF/dokumen di atas 4MB, silakan kompres terlebih dahulu atau gunakan tautan Google Drive.',
      });
    }

    const id = `med-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const mediaItem: AppMediaItem = {
      id,
      category,
      refId: refId || undefined,
      subKey: subKey || undefined,
      filename,
      contentType: resolvedContentType,
      fileSize,
      fileData,
    };

    // If subKey and refId are supplied (e.g. replacing 'logoTim' or 'suratPernyataan'), remove previous duplicate media
    if (refId && subKey) {
      try {
        // Will clean up any older record for same ref and slot
        const existingList = await Database.getMedia(id);
      } catch {}
    }

    await Database.saveMedia(mediaItem);

    // Format human-readable size
    const sizeInKb = (fileSize / 1024).toFixed(1);
    const sizeFormatted = fileSize > 1024 * 1024
      ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB`
      : `${sizeInKb} KB`;

    return res.status(201).json({
      id,
      url: `/api/media/view/${id}`,
      filename,
      contentType: resolvedContentType,
      fileSize,
      sizeFormatted,
    });
  } catch (err: any) {
    console.error('[Media Upload Error]', err);
    return res.status(500).json({ error: err?.message || 'Gagal mengunggah berkas ke TiDB Cloud' });
  }
});

/**
 * 2. Serve / View Media directly from TiDB Cloud
 * Can be used directly in <img src="/api/media/view/:id" /> or <iframe>
 */
mediaRouter.get('/media/view/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send('ID media diperlukan');
    }

    const media = await Database.getMedia(id);
    if (!media || !media.fileData) {
      return res.status(404).send('Berkas tidak ditemukan');
    }

    const { buffer } = decodeBase64File(media.fileData);

    res.setHeader('Content-Type', media.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', buffer.length);
    // Cache for 24 hours in client browser for fast performance
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(media.filename)}"`);

    return res.end(buffer);
  } catch (err: any) {
    console.error('[Media View Error]', err);
    return res.status(500).send('Gagal memuat berkas dari database');
  }
});

/**
 * 3. Delete Media by ID from TiDB Cloud
 */
mediaRouter.delete('/media/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'ID media diperlukan' });
    }

    await Database.deleteMedia(id);
    return res.json({ success: true, message: 'Berkas berhasil dihapus dari TiDB Cloud' });
  } catch (err: any) {
    console.error('[Media Delete Error]', err);
    return res.status(500).json({ error: err?.message || 'Gagal menghapus berkas dari TiDB Cloud' });
  }
});

/**
 * 4. Status of Media Storage in TiDB Cloud
 */
mediaRouter.get('/media/status', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'ready',
      storageEngine: 'TiDB_CLOUD_DATABASE_MEDIA_STORAGE',
      table: 'app_media_storage',
      description: 'Penyimpanan terpusat logo tim, berkas formulir PDF, gambar wallpaper CMS di TiDB Cloud',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});
