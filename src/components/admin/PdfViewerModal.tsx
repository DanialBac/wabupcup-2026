import React, { useState, useEffect } from 'react';
import { UploadedDoc } from '../../types';
import {
  FileText,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  CheckCircle,
  ShieldCheck,
  ImageIcon,
  RefreshCw,
} from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: UploadedDoc | null;
  documentTitle: string;
  teamName: string;
  onVerify?: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  document,
  documentTitle,
  teamName,
  onVerify,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [forceMode, setForceMode] = useState<'auto' | 'pdf' | 'image'>('auto');

  useEffect(() => {
    if (isOpen) {
      setZoomLevel(100);
      setForceMode('auto');
    }
  }, [isOpen, document?.url, document?.fileData]);

  if (!isOpen || !document) return null;

  const effectiveSource = document.url || document.fileData || document.previewUrl || '';

  // Heuristic detection: is this an image?
  const docName = (document.name || '').toLowerCase();
  const docType = (document.type || '').toLowerCase();
  const titleLower = (documentTitle || '').toLowerCase();

  const looksLikeImage =
    docType.startsWith('image/') ||
    Boolean(docName.match(/\.(png|jpe?g|webp|svg|gif|bmp|avif)$/i)) ||
    effectiveSource.startsWith('data:image/') ||
    titleLower.includes('logo') ||
    titleLower.includes('foto') ||
    titleLower.includes('gambar');

  const isImageFile = forceMode === 'image' || (forceMode === 'auto' && looksLikeImage);
  const isPdfFile = forceMode === 'pdf' || (forceMode === 'auto' && !looksLikeImage && Boolean(effectiveSource));

  // Tentukan nama berkas dan ekstensi yang akurat sesuai tipe file
  const getDownloadFileName = () => {
    const rawName = (document.name || '').trim();
    if (rawName && rawName.includes('.')) {
      return rawName;
    }

    let ext = '.pdf';
    if (isImageFile) {
      if (docType.includes('png') || effectiveSource.startsWith('data:image/png') || rawName.toLowerCase().endsWith('.png')) {
        ext = '.png';
      } else if (docType.includes('webp') || effectiveSource.startsWith('data:image/webp') || rawName.toLowerCase().endsWith('.webp')) {
        ext = '.webp';
      } else if (docType.includes('svg') || effectiveSource.startsWith('data:image/svg') || rawName.toLowerCase().endsWith('.svg')) {
        ext = '.svg';
      } else {
        ext = '.jpg';
      }
    }

    if (rawName) {
      return rawName.toLowerCase().endsWith(ext) ? rawName : `${rawName}${ext}`;
    }

    const cleanTeam = (teamName || 'Dokumen').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const cleanTitle = (documentTitle || 'Berkas').replace(/[/\\?%*:|"<>]/g, '_').trim();
    return `${cleanTeam}-${cleanTitle}${ext}`;
  };

  const downloadFileName = getDownloadFileName();

  // Helper untuk mendapatkan URL download yang mengembalikan header attachment
  const getDownloadUrl = (source: string) => {
    if (!source || source.startsWith('data:') || source.startsWith('blob:')) {
      return source;
    }
    if (source.includes('/api/media/view/')) {
      return source.replace('/api/media/view/', '/api/media/download/');
    }
    if (source.includes('/api/media/download/')) {
      return source;
    }
    return source.includes('?') ? `${source}&download=1` : `${source}?download=1`;
  };

  const downloadUrl = getDownloadUrl(effectiveSource);

  // Download handler untuk data URI base64 secara sinkronus tanpa async network lag
  const downloadBase64Data = (dataUri: string, targetFilename: string) => {
    try {
      const parts = dataUri.split(',');
      if (parts.length < 2) {
        const a = window.document.createElement('a');
        a.href = dataUri;
        a.download = targetFilename;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        return;
      }
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const binary = atob(parts[1]);
      const len = binary.length;
      const buffer = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        buffer[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([buffer], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = blobUrl;
      a.download = targetFilename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch (err) {
      console.error('[Download DataURI Failed]', err);
      window.open(dataUri, '_blank');
    }
  };

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!effectiveSource) {
      e.preventDefault();
      return;
    }

    if (effectiveSource.startsWith('data:')) {
      e.preventDefault();
      downloadBase64Data(effectiveSource, downloadFileName);
      return;
    }

    // Untuk URL remote (HTTP):
    // Request mengarah ke /api/media/download/:id yang mengembalikan stream berstatus 200 OK
    // dengan header Content-Disposition: attachment secara same-origin.
    // Browser native download manager langsung menangkap berkas dan menyimpannya ke folder Downloads
    // tanpa reload halaman dan tanpa popup blocker!
  };

  return (
    <div
      id="pdf-viewer-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div
        id="pdf-viewer-container"
        className="relative w-full max-w-5xl h-[88vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white"
      >
        {/* HEADER TOOLBAR */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
              {isImageFile ? <ImageIcon className="w-5 h-5 text-purple-400" /> : <FileText className="w-5 h-5 text-red-400" />}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">
                {documentTitle} • <span className="text-red-400">{teamName}</span>
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                Berkas: {document.name || 'Dokumen'} {document.size ? `(${document.size})` : ''} {document.uploadDate ? `• Diunggah: ${document.uploadDate}` : ''}
              </p>
            </div>
          </div>

          {/* ZOOM, TOGGLE & ACTIONS */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Mode Switcher Toggle */}
            <div className="hidden md:flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setForceMode('pdf')}
                className={`px-2 py-1 rounded transition ${isPdfFile ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => setForceMode('image')}
                className={`px-2 py-1 rounded transition ${isImageFile ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Gambar
              </button>
            </div>

            {isImageFile && (
              <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700/60 rounded-lg px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                  className="p-1 hover:text-white text-slate-300 rounded transition"
                  title="Perkecil (Zoom Out)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1 text-slate-300">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(300, prev + 25))}
                  className="p-1 hover:text-white text-slate-300 rounded transition"
                  title="Perbesar (Zoom In)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Direct Open in New Tab (Bypass any browser embed restrictions) */}
            {effectiveSource && (
              <a
                href={effectiveSource}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold flex items-center space-x-1.5 transition"
                title="Buka langsung di Tab Baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buka Tab Baru</span>
              </a>
            )}

            {/* Download Button */}
            {effectiveSource && (
              <a
                href={downloadUrl}
                download={downloadFileName}
                onClick={handleDownloadClick}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                title="Unduh Berkas ke Komputer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh</span>
              </a>
            )}

            {onVerify && (
              <button
                type="button"
                onClick={onVerify}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Verifikasi</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEWER BODY */}
        <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-hidden flex flex-col">
          {effectiveSource ? (
            isImageFile ? (
              <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <img
                  src={effectiveSource}
                  alt={`${documentTitle} - ${teamName}`}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
                  style={{ transform: `scale(${zoomLevel / 100})`, transition: 'transform 0.2s' }}
                  onError={(e) => {
                    // Fallback to PDF iframe mode if image load fails
                    console.warn('[PdfViewerModal] Image load error, trying PDF iframe fallback');
                    setForceMode('pdf');
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col relative">
                <iframe
                  src={`${effectiveSource}#toolbar=1&navpanes=0`}
                  className="w-full h-full border-0 rounded-xl bg-white"
                  title={`${documentTitle} - ${teamName}`}
                />
              </div>
            )
          ) : (
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <div
                className="w-full max-w-2xl min-h-[500px] bg-white text-slate-900 rounded-lg shadow-2xl p-8 transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              >
                {/* OFFICIAL DOCUMENT HEADER */}
                <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-red-700">
                    PANITIA PELAKSANA TURNAMEN WABUPCUP 2026
                  </h3>
                  <h2 className="text-base font-bold uppercase tracking-wider">
                    {documentTitle.toUpperCase()}
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Lampiran Berkas Resmi Tim: <strong className="text-slate-900">{teamName}</strong> • Tanggal Unggah: {document.uploadDate || '-'}
                  </p>
                </div>

                {/* DOCUMENT BODY CONTENT */}
                <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Metadata Berkas Database:
                    </span>
                    <p><strong>Nama Berkas:</strong> {document.name || 'Dokumen'}</p>
                    <p><strong>Ukuran File:</strong> {document.size || 'Standar'}</p>
                    <p><strong>Tipe File:</strong> {document.type || 'application/pdf'}</p>
                    <p><strong>Status:</strong> Terdaftar di Database Turnamen</p>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <p>
                      Dengan ini menyatakan bahwa seluruh data pemain, official, dan dokumen pendukung yang dilampirkan adalah benar, sah, dan dapat dipertanggungjawabkan sesuai regulasi resmi Turnamen WabupCup 2026.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER CONTROLS */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dokumen Terverifikasi Standar Panitia WABUPCUP 2026</span>
          </div>
          <div className="flex items-center space-x-3">
            {effectiveSource && (
              <a
                href={effectiveSource}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab Baru</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
