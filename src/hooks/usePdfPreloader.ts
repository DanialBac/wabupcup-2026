import { useEffect, useRef } from 'react';

const CACHE_NAME = 'pdf-cache-v1';

export function usePdfPreloader(nextUrls: { id: string, url: string }[]) {
  const preloadedRef = useRef(new Set<string>());

  useEffect(() => {
    // 1. Check data saver mode
    const connection = (navigator as any).connection;
    if (connection && connection.saveData) {
      return;
    }

    if (!('caches' in window) || !window.requestIdleCallback) {
      return;
    }

    const preload = async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // Limit to 2 next documents
      const docsToPreload = nextUrls.slice(0, 2);

      for (const doc of docsToPreload) {
        if (preloadedRef.current.has(doc.id)) continue;
        
        try {
          const cached = await cache.match(doc.id);
          if (!cached) {
            const res = await fetch(doc.url);
            if (res.ok) {
              await cache.put(doc.id, res);
            }
          }
          preloadedRef.current.add(doc.id);
        } catch (e) {
          console.warn('Preload failed for', doc.id, e);
        }
      }
    };

    const handleIdel = (deadline: IdleDeadline) => {
      if (deadline.timeRemaining() > 10) {
        preload();
      }
    };

    const idleId = window.requestIdleCallback(handleIdel);

    return () => {
      window.cancelIdleCallback(idleId);
    };
  }, [nextUrls]);
}
