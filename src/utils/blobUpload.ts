import { compressImage, compressLogo } from './imageCompressor';

export interface UploadResult {
  url: string;
  name: string;
  size: string;
  type: string;
  fileData?: string; // Optional fallback
}

/**
 * Reads file as Base64 Data URL
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Dokumen pendaftar (REG_DOC) diunggah langsung dari browser ke Backblaze B2 lewat presigned URL.
 * Mengembalikan null bila B2 belum aktif atau gagal, supaya jalur lama (TiDB) dipakai sebagai cadangan.
 */
async function tryUploadToB2(
  dataUrl: string,
  filename: string,
  contentType: string,
  category: string
): Promise<UploadResult | null> {
  try {
    const blob = await (await fetch(dataUrl)).blob();

    const presRes = await fetch('/api/media/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType, fileSize: blob.size, category }),
    });
    if (!presRes.ok) {
      if (presRes.status === 403) {
        const errJson = await presRes.json().catch(() => ({}));
        if (errJson.code === 'REGISTRATION_CLOSED') {
          const closedErr: any = new Error(errJson.error || 'Pendaftaran publik sedang ditutup atau dialihkan.');
          closedErr.code = 'REGISTRATION_CLOSED';
          closedErr.status = 403;
          throw closedErr;
        }
      }
      return null; // 503 = B2 belum dikonfigurasi, lainnya = pakai jalur lama
    }

    const pres = await presRes.json();
    const putRes = await fetch(pres.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });

    if (!putRes.ok) {
      // Unggahan gagal: hapus metadata yatim, lalu jatuh ke jalur lama
      fetch(`/api/media/${pres.id}`, { method: 'DELETE' }).catch(() => {});
      return null;
    }

    return {
      url: pres.url,
      name: pres.filename || filename,
      size: blob.size > 1024 * 1024 ? `${(blob.size / (1024 * 1024)).toFixed(2)} MB` : `${(blob.size / 1024).toFixed(1)} KB`,
      type: pres.contentType || contentType,
      fileData: pres.url,
    };
  } catch (err: any) {
    if (err?.code === 'REGISTRATION_CLOSED' || err?.status === 403) {
      throw err;
    }
    console.warn('[B2 Upload] gagal, memakai jalur cadangan:', err);
    return null;
  }
}

/**
 * Centralized Storage in TiDB Cloud:
 * Uploads media (logos, PDF docs, CMS images) file-by-file directly into
 * the TiDB Cloud `app_media_storage` table via /api/media/upload.
 * Fast, centralized, zero external dependencies, with automatic cascading cleanup.
 */
export async function uploadToTiDbStorage(
  file: File,
  folder = 'registrations',
  onProgress?: ((percent: number) => void) | string,
  refId?: string,
  subKey?: string
): Promise<UploadResult> {
  // Support flexible argument order if onProgress was passed directly as refId string
  let progressFn: ((percent: number) => void) | undefined;
  let finalRefId = refId;
  let finalSubKey = subKey;

  if (typeof onProgress === 'function') {
    progressFn = onProgress;
  } else if (typeof onProgress === 'string') {
    finalSubKey = refId;
    finalRefId = onProgress;
    progressFn = undefined;
  }

  let base64Data = '';
  let contentType = file.type || 'application/octet-stream';

  if (progressFn) progressFn(20);

  // Map folder to semantic category
  let category = 'REG_DOC';
  if (folder.includes('logo') || folder === 'logos') {
    category = 'TEAM_LOGO';
  } else if (folder.includes('sponsor') || folder === 'sponsors') {
    category = 'SPONSOR_LOGO';
  } else if (folder.includes('wallpaper') || folder.includes('background') || folder === 'cms') {
    category = 'CMS_WALLPAPER';
  } else if (folder.includes('download') || folder.includes('doc')) {
    category = 'CMS_DOC';
  }

  // Pre-compress images client-side for lightning fast speed & minimal DB footprint
  if (file.type.startsWith('image/')) {
    try {
      if (category === 'TEAM_LOGO' || category === 'SPONSOR_LOGO') {
        base64Data = await compressLogo(file, 400, 0.85);
      } else if (category === 'CMS_WALLPAPER') {
        base64Data = await compressImage(file, 1920, 1080, 0.82);
      } else {
        base64Data = await compressImage(file, 1600, 1200, 0.82);
      }
      contentType = 'image/jpeg';
    } catch {
      base64Data = await readFileAsDataUrl(file);
    }
  } else {
    base64Data = await readFileAsDataUrl(file);
  }

  if (progressFn) progressFn(50);

  // Dokumen pendaftar: coba unggah langsung ke Backblaze B2 dulu
  if (category === 'REG_DOC') {
    const viaB2 = await tryUploadToB2(base64Data, file.name, contentType, category);
    if (viaB2) {
      if (progressFn) progressFn(100);
      return viaB2;
    }
  }

  const uploadHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (category === 'REG_DOC') {
    uploadHeaders['X-Upload-Fallback'] = 'b2-failed';
  }

  const res = await fetch('/api/media/upload', {
    method: 'POST',
    headers: uploadHeaders,
    body: JSON.stringify({
      filename: file.name,
      contentType,
      fileData: base64Data,
      category,
      refId: finalRefId || undefined,
      subKey: finalSubKey || undefined,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const err: any = new Error(errorJson.error || `Gagal menyimpan berkas ke TiDB Cloud (${res.status})`);
    if (res.status === 403 && (errorJson.code === 'REGISTRATION_CLOSED' || errorJson.error?.includes('tutup') || errorJson.error?.includes('dialihkan'))) {
      err.code = 'REGISTRATION_CLOSED';
      err.status = 403;
    }
    throw err;
  }

  const data = await res.json();
  if (progressFn) progressFn(100);

  return {
    url: data.url, // e.g. /api/media/view/med-123456
    name: data.filename || file.name,
    size: data.sizeFormatted || `${(file.size / 1024).toFixed(1)} KB`,
    type: data.contentType || contentType,
    fileData: data.url,
  };
}

/**
 * Universal file uploader:
 * Centralized in TiDB Cloud.
 * Fallback to direct client-side compressed base64 if server is temporarily unreachable.
 */
export async function uploadFileToBlob(
  file: File,
  folder = 'registrations',
  onProgress?: (percent: number) => void,
  refId?: string,
  subKey?: string
): Promise<UploadResult> {
  try {
    return await uploadToTiDbStorage(file, folder, onProgress, refId, subKey);
  } catch (err: any) {
    if (err?.code === 'REGISTRATION_CLOSED' || err?.status === 403) {
      throw err;
    }
    console.warn('[TiDB Cloud Storage Upload] Server upload encountered an issue, using client-side fallback:', err?.message || err);

    // Fallback: Client-side compression
    if (file.type.startsWith('image/')) {
      try {
        const compressed = await (folder.includes('logo')
          ? compressLogo(file, 400, 0.85)
          : compressImage(file, 1600, 1200, 0.82));
        const approxKb = (compressed.length * 0.75 / 1024).toFixed(1);
        if (onProgress) onProgress(100);
        return {
          url: compressed,
          name: file.name,
          size: `${approxKb} KB`,
          type: 'image/jpeg',
          fileData: compressed,
        };
      } catch {}
    }

    const base64 = await readFileAsDataUrl(file);
    const sizeInKb = (file.size / 1024).toFixed(1);
    if (onProgress) onProgress(100);
    return {
      url: base64,
      name: file.name,
      size: `${sizeInKb} KB`,
      type: file.type || 'application/pdf',
      fileData: base64,
    };
  }
}

/**
 * Helper to delete media by URL or ID from TiDB Cloud
 */
export async function deleteMediaFromStorage(urlOrId: string): Promise<boolean> {
  try {
    if (!urlOrId || typeof urlOrId !== 'string') return false;
    let mediaId = urlOrId.trim();

    const directMatch = mediaId.match(/\b(med-\d+-[a-zA-Z0-9_-]+)\b/);
    if (directMatch) {
      mediaId = directMatch[1];
    } else if (mediaId.includes('/api/media/view/')) {
      mediaId = mediaId.split('/api/media/view/')[1].split(/[?#]/)[0];
    }

    if (!mediaId.startsWith('med-')) return false;

    const res = await fetch(`/api/media/${mediaId}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.warn('[deleteMediaFromStorage warning]', err);
    return false;
  }
}
