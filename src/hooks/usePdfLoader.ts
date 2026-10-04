/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

// ---------- L1: in-memory LRU (stores the Promise to dedupe StrictMode double-fetch) ----------
interface L1Entry {
  promise: Promise<PDFDocumentProxy>;
  task: PDFDocumentLoadingTask | null;
}
const L1 = new Map<string, L1Entry>();
const L1_MAX = 5;

function l1Touch(id: string, entry: L1Entry) {
  L1.delete(id);
  L1.set(id, entry);
}

function l1Evict() {
  while (L1.size > L1_MAX) {
    const oldestKey = L1.keys().next().value as string;
    const old = L1.get(oldestKey);
    L1.delete(oldestKey);
    // pdfjs v6: documents are destroyed through their loading task
    old?.task?.destroy().catch(() => {});
  }
}

// ---------- L2: Cache API with ~50MB LRU index ----------
export const PDF_CACHE_NAME = 'pdf-cache-v1';
const L2_INDEX_KEY = 'pdf-cache-v1-index';
const L2_MAX_BYTES = 50 * 1024 * 1024;

type L2Index = Record<string, { size: number; ts: number }>;

function readIndex(): L2Index {
  try {
    return JSON.parse(localStorage.getItem(L2_INDEX_KEY) || '{}');
  } catch {
    return {};
  }
}
function writeIndex(idx: L2Index) {
  try {
    localStorage.setItem(L2_INDEX_KEY, JSON.stringify(idx));
  } catch {}
}

async function l2Enforce(cache: Cache) {
  const idx = readIndex();
  let total = Object.values(idx).reduce((s, e) => s + e.size, 0);
  const byOldest = Object.entries(idx).sort((a, b) => a[1].ts - b[1].ts);
  for (const [key, meta] of byOldest) {
    if (total <= L2_MAX_BYTES) break;
    await cache.delete(key).catch(() => {});
    total -= meta.size;
    delete idx[key];
  }
  writeIndex(idx);
}

function isCacheableUrl(url: string) {
  return /^https?:\/\//i.test(url) || url.startsWith('/');
}

/** Cache key = URL without query string, resolved to an absolute same-origin URL. */
export function pdfCacheKey(url: string) {
  const abs = new URL(url, window.location.origin);
  return abs.origin + abs.pathname;
}

async function fetchPdfBytes(url: string): Promise<ArrayBuffer> {
  const canUseCache = typeof window !== 'undefined' && 'caches' in window && isCacheableUrl(url);
  if (!canUseCache) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.arrayBuffer();
  }

  const key = pdfCacheKey(url);
  const cache = await caches.open(PDF_CACHE_NAME);
  const hit = await cache.match(key);
  if (hit) {
    const idx = readIndex();
    if (idx[key]) {
      idx[key].ts = Date.now();
      writeIndex(idx);
    }
    if (import.meta.env.DEV) console.info('[pdf-cache] L2 HIT', key);
    return hit.arrayBuffer();
  }

  // L3: network (browser HTTP cache honours Express Cache-Control)
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  try {
    await cache.put(
      key,
      new Response(buf.slice(0), { headers: { 'Content-Type': 'application/pdf' } })
    );
    const idx = readIndex();
    idx[key] = { size: buf.byteLength, ts: Date.now() };
    writeIndex(idx);
    await l2Enforce(cache);
  } catch {
    // Quota exceeded or opaque response — just skip caching
  }
  if (import.meta.env.DEV) console.info('[pdf-cache] L2 MISS -> network', key);
  return buf;
}

function loadPdf(url: string, id: string): Promise<PDFDocumentProxy> {
  const existing = L1.get(id);
  if (existing) {
    l1Touch(id, existing);
    if (import.meta.env.DEV) console.info('[pdf-cache] L1 HIT', id);
    return existing.promise;
  }

  const entry: L1Entry = { promise: null as unknown as Promise<PDFDocumentProxy>, task: null };
  entry.promise = (async () => {
    const bytes = await fetchPdfBytes(url);
    const task = getDocument({ data: new Uint8Array(bytes) });
    entry.task = task;
    return task.promise;
  })();
  entry.promise.catch(() => L1.delete(id));

  L1.set(id, entry);
  l1Evict();
  return entry.promise;
}

export function usePdfLoader(fileUrl: string | undefined, fileId: string | undefined) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fileUrl || !fileId) {
      setPdf(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    loadPdf(fileUrl, fileId)
      .then(doc => {
        if (active) setPdf(doc);
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fileUrl, fileId]);

  return { pdf, loading, error };
}

/** Warm L2 only (no parsing) — used by the idle preloader. */
export async function prefetchPdfToCache(url: string) {
  if (!('caches' in window) || !isCacheableUrl(url)) return;
  const cache = await caches.open(PDF_CACHE_NAME);
  if (await cache.match(pdfCacheKey(url))) return;
  await fetchPdfBytes(url);
}

/** Called on admin logout (privacy): wipes L1 + L2. */
export async function clearPdfCache() {
  for (const entry of L1.values()) entry.task?.destroy().catch(() => {});
  L1.clear();
  try {
    localStorage.removeItem(L2_INDEX_KEY);
  } catch {}
  if ('caches' in window) await caches.delete(PDF_CACHE_NAME);
}
