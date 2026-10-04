import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useTournament } from '../context/TournamentContext'; // Or wherever admin token is

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// L1 Cache: LRU Map
const PDF_MEMORY_CACHE = new Map<string, Promise<pdfjsLib.PDFDocumentProxy>>();
const MAX_MEMORY_CACHE_SIZE = 5;

// L2 Cache: Cache API
const CACHE_NAME = 'pdf-cache-v1';

export function usePdfLoader(fileUrl: string | undefined, fileId: string | undefined) {
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fileUrl || !fileId) {
      setPdf(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        // 1. Check L1 Memory Cache
        if (PDF_MEMORY_CACHE.has(fileId)) {
          const cachedPdf = await PDF_MEMORY_CACHE.get(fileId);
          if (isMounted) {
            setPdf(cachedPdf!);
            setLoading(false);
          }
          return;
        }

        // Create a new promise for fetching and parsing
        const fetchAndParsePdf = async (): Promise<pdfjsLib.PDFDocumentProxy> => {
          // 2. Check L2 Cache API
          let buffer: ArrayBuffer | null = null;
          if ('caches' in window) {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(fileId);
            if (cachedResponse) {
              buffer = await cachedResponse.arrayBuffer();
            } else {
              // 3. Fetch from Network (L3 HTTP Cache kicks in here if cached by browser)
              const response = await fetch(fileUrl);
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              
              const resClone = response.clone();
              await cache.put(fileId, resClone);
              buffer = await response.arrayBuffer();
            }
          } else {
            // Fallback if Cache API not supported
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            buffer = await response.arrayBuffer();
          }

          // Parse PDF
          const loadingTask = pdfjsLib.getDocument(new Uint8Array(buffer));
          return await loadingTask.promise;
        };

        const pdfPromise = fetchAndParsePdf();
        
        // Evict LRU if needed
        if (PDF_MEMORY_CACHE.size >= MAX_MEMORY_CACHE_SIZE) {
          const firstKey = PDF_MEMORY_CACHE.keys().next().value;
          const oldPromise = PDF_MEMORY_CACHE.get(firstKey);
          PDF_MEMORY_CACHE.delete(firstKey);
          if (oldPromise) {
            oldPromise.then(oldPdf => {
              oldPdf.destroy();
            }).catch(() => {});
          }
        }

        PDF_MEMORY_CACHE.set(fileId, pdfPromise);

        const loadedPdf = await pdfPromise;
        if (isMounted) {
          setPdf(loadedPdf);
          setLoading(false);
        }
      } catch (err: any) {
        PDF_MEMORY_CACHE.delete(fileId);
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [fileUrl, fileId]);

  return { pdf, loading, error };
}

// Admin logout trigger to clear L2 Cache
export async function clearPdfCache() {
  if ('caches' in window) {
    await caches.delete(CACHE_NAME);
  }
  for (const [key, promise] of PDF_MEMORY_CACHE.entries()) {
    promise.then(p => p.destroy()).catch(() => {});
  }
  PDF_MEMORY_CACHE.clear();
}
