import React, { useMemo, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useAnimationPause } from '../../hooks/useAnimationPause';

interface Particle {
  id: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  size: number; // px 2 - 5
  color: string;
  duration: number; // seconds 4 - 8
  delay: number; // seconds 0 - 5
  driftX: number; // px drift
}

/**
 * Ambient floating sparks & glowing dust particles (oranye & kuning keemasan)
 * Menggunakan GPU-accelerated CSS keyframe transform3d murni tanpa overhead JavaScript loop.
 * Otomatis dihentikan jika pengguna memilih prefers-reduced-motion,
 * atau dijeda saat tab browser tersembunyi / section berada di luar layar.
 */
export const HeroAmbientParticles: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isPaused } = useAnimationPause({ elementRef: containerRef });

  const particles: Particle[] = useMemo(() => {
    if (prefersReducedMotion) return [];
    const colors = [
      'rgba(249, 115, 22, 0.75)', // oranye terang
      'rgba(251, 191, 36, 0.85)', // kuning emas
      'rgba(239, 68, 68, 0.70)',  // merah api
      'rgba(245, 158, 11, 0.80)', // amber hangat
      'rgba(255, 255, 255, 0.60)' // spark putih
    ];

    // Buat 26 partikel dengan distribusi deterministik
    return Array.from({ length: 26 }).map((_, i) => {
      // Pseudo-random berbasis index agar deterministik saat render
      const seed1 = ((i * 137.5) % 100) / 100;
      const seed2 = (((i + 7) * 224.3) % 100) / 100;
      const seed3 = (((i + 13) * 311.7) % 100) / 100;

      return {
        id: i,
        x: Math.round(seed1 * 96 + 2), // 2% - 98%
        y: Math.round(seed2 * 80 + 10), // 10% - 90%
        size: Math.round(2 + seed3 * 3.5), // 2px - 5.5px
        color: colors[i % colors.length],
        duration: +(4.5 + seed1 * 4).toFixed(1), // 4.5s - 8.5s
        delay: +(seed2 * 4).toFixed(1), // 0s - 4s
        driftX: Math.round((seed3 - 0.5) * 50), // -25px sampai +25px
      };
    });
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden z-[2] select-none ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes floatSpark {
          0% {
            transform: translate3d(0, 0, 0) scale(0.8);
            opacity: 0;
          }
          20% {
            opacity: 0.9;
          }
          50% {
            transform: translate3d(var(--drift-x), -35px, 0) scale(1.2);
            opacity: 0.8;
          }
          80% {
            opacity: 0.4;
          }
          100% {
            transform: translate3d(calc(var(--drift-x) * 1.5), -80px, 0) scale(0.6);
            opacity: 0;
          }
        }
      `}</style>

      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full blur-[0.6px]"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              '--drift-x': `${p.driftX}px`,
              animation: `floatSpark ${p.duration}s ease-in-out ${p.delay}s infinite`,
              animationPlayState: isPaused ? 'paused' : 'running',
              willChange: isPaused ? 'auto' : 'transform, opacity',
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
