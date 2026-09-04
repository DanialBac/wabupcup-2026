import { upload } from '@vercel/blob/client';
import { compressImage, compressLogo } from './imageCompressor';

export interface UploadResult {
  url: string;
  name: string;
  size: string;
  type: string;
  fileData?: string; // Optional fallback if blob storage is unavailable
}

/**
 * Uploads a document or image directly from React to @vercel/blob cloud storage.
 * Eliminates large payload transmissions through Vercel Serverless Functions.
 */
export async function uploadFileToBlob(
  file: File,
  folder = 'registrations',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const pathname = `${folder}/${timestamp}-${sanitizedName}`;

  try {
    // Attempt direct upload to @vercel/blob
    const blob = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
      onUploadProgress: (progress) => {
        if (onProgress && progress.total > 0) {
          onProgress(Math.round((progress.loaded / progress.total) * 100));
        }
      },
    });

    const sizeInKb = (file.size / 1024).toFixed(1);
    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${sizeInKb} KB`;

    return {
      url: blob.url,
      name: file.name,
      size: sizeFormatted,
      type: file.type || 'application/octet-stream',
    };
  } catch (err: any) {
    console.warn('[Blob Upload] Direct cloud upload unavailable or token not set, using lightweight client fallback:', err?.message || err);

    // If file is an image (e.g. logo/foto bukti), compress it first to ensure payload stays tiny (~25-50KB)
    if (file.type.startsWith('image/')) {
      try {
        const compressed = await (folder.includes('logo') ? compressLogo(file, 400, 0.85) : compressImage(file, 1600, 1200, 0.82));
        const approxKb = (compressed.length * 0.75 / 1024).toFixed(1);
        return {
          url: compressed,
          name: file.name,
          size: `${approxKb} KB`,
          type: 'image/jpeg',
          fileData: compressed,
        };
      } catch {
        // Continue to fallback
      }
    }

    // Fallback for PDFs or general documents
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const sizeInKb = (file.size / 1024).toFixed(1);
        resolve({
          url: base64,
          name: file.name,
          size: `${sizeInKb} KB`,
          type: file.type || 'application/pdf',
          fileData: base64,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
