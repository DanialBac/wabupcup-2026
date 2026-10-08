import { useState, useEffect, RefObject } from 'react';

interface UseAnimationPauseOptions {
  elementRef?: RefObject<HTMLElement | null>;
  threshold?: number;
}

/**
 * Hook to pause CPU/GPU intensive animations when:
 * 1. The browser tab is hidden / in background (document.hidden)
 * 2. The element is scrolled outside the viewport (IntersectionObserver)
 */
export function useAnimationPause({ elementRef, threshold = 0.05 }: UseAnimationPauseOptions = {}): {
  isPaused: boolean;
  isDocumentHidden: boolean;
  isInViewport: boolean;
} {
  const [isDocumentHidden, setIsDocumentHidden] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.hidden;
  });

  const [isInViewport, setIsInViewport] = useState<boolean>(true);

  // 1. Tab visibility listener
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsDocumentHidden(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 2. IntersectionObserver for viewport tracking
  useEffect(() => {
    if (typeof window === 'undefined' || !elementRef?.current || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold }
    );

    const el = elementRef.current;
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, [elementRef, threshold]);

  const isPaused = isDocumentHidden || !isInViewport;

  return { isPaused, isDocumentHidden, isInViewport };
}
