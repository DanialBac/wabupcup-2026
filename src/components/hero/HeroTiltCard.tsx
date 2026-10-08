import React, { useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface HeroTiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'red' | 'blue' | 'amber';
}

/**
 * Kartu interaktif dengan efek 3D Tilt halus, scale-up 104%, dan neon glow border saat hover.
 * Otomatis beralih ke hover statis bersih saat prefers-reduced-motion aktif.
 */
export const HeroTiltCard: React.FC<HeroTiltCardProps> = ({
  children,
  className = '',
  glowColor = 'red',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [transformStyle, setTransformStyle] = useState<string>('');
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const glowStyles = {
    red: {
      border: 'hover:border-red-500/80',
      shadow: '0 0 25px rgba(239, 68, 68, 0.40)',
      radial: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(239, 68, 68, 0.15), transparent 70%)',
    },
    blue: {
      border: 'hover:border-blue-500/80',
      shadow: '0 0 25px rgba(59, 130, 246, 0.40)',
      radial: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59, 130, 246, 0.15), transparent 70%)',
    },
    amber: {
      border: 'hover:border-amber-500/80',
      shadow: '0 0 25px rgba(245, 158, 11, 0.40)',
      radial: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(245, 158, 11, 0.15), transparent 70%)',
    },
  }[glowColor];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalisasi -1 sampai 1
    const xNorm = (x / rect.width) * 2 - 1;
    const yNorm = (y / rect.height) * 2 - 1;

    // Maksimal tilt 7 derajat
    const rotateX = -yNorm * 7;
    const rotateY = xNorm * 7;

    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);

    setTransformStyle(`perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.04, 1.04, 1.04)`);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!prefersReducedMotion) {
      setTransformStyle('perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: prefersReducedMotion ? undefined : transformStyle,
        boxShadow: isHovered ? glowStyles.shadow : 'none',
        transition: prefersReducedMotion
          ? 'box-shadow 0.2s ease-out'
          : isHovered
          ? 'transform 0.08s ease-out, box-shadow 0.25s ease-out'
          : 'transform 0.4s ease-out, box-shadow 0.4s ease-out',
        willChange: prefersReducedMotion ? 'auto' : (isHovered ? 'transform, box-shadow' : 'auto'),
      }}
      className={`relative rounded-2xl overflow-hidden cursor-pointer ${glowStyles.border} ${className}`}
    >
      {/* GLOW HIGHLIGHT MOUSE SPOTLIGHT */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300 z-0"
        style={{ background: glowStyles.radial }}
      />
      
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
