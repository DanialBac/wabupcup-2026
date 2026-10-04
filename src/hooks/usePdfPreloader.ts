import { useEffect } from 'react';
import { prefetchPdfToCache } from './usePdfLoader';

/**
 * Warms the L2 PDF cache for the next 1-2 documents while the browser is idle.
 * Skipped entirely when the user has Data Saver enabled.
 */
export function usePdfPreloader(nextUrls: string[]) {
  const key = nextUrls.slice(0, 2).join('|');

  useEffect(() => {
    const urls = key ? key.split('|') : [];
    if (urls.length === 0) return;
    if ((navigator as any).connection?.saveData) return;
    if (typeof window.requestIdleCallback !== 'function') return;

    let cancelled = false;
    const id = window.requestIdleCallback(async () => {
      for (const url of urls) {
        if (cancelled) return;
        await prefetchPdfToCache(url).catch(() => {});
      }
    }, { timeout: 5000 });

    return () => {
      cancelled = true;
      window.cancelIdleCallback(id);
    };
  }, [key]);
}
