import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface HeroParallaxVisualProps {
  wabupLogoUrl?: string;
  figureUrl?: string;
  ballUrl?: string;
  className?: string;
}

/**
 * Komponen Visual Hero Interaktif:
 * 1. Soft radial glow oranye/merah di belakang foto tokoh dengan animasi 'infinite breathe' pulse.
 * 2. Foto figur tokoh / atlet futsal responsif kursor mouse (translasi 10-15px).
 * 3. Bola futsal 3D melayang dengan depth layer terpisah (-22px translasi + rotasi dinamis).
 * 4. Ornamen floating badges & sparks berenergi tinggi.
 */
export const HeroParallaxVisual: React.FC<HeroParallaxVisualProps> = ({
  wabupLogoUrl = '/wabup-cup-logo.svg',
  figureUrl,
  ballUrl,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values untuk kursor mouse (-1 sampai 1)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics untuk pergerakan halus (damping & stiffness)
  const springConfig = { damping: 28, stiffness: 120, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax Layer 1: Glow & Back Rings (Translasi lembut ~5px)
  const glowX = useTransform(smoothX, [-1, 1], [-8, 8]);
  const glowY = useTransform(smoothY, [-1, 1], [-8, 8]);

  // Parallax Layer 2: Tokoh / Figur Atlet (Translasi 12px - 15px)
  const figureTranslateX = useTransform(smoothX, [-1, 1], [-14, 14]);
  const figureTranslateY = useTransform(smoothY, [-1, 1], [-12, 12]);
  const figureRotateZ = useTransform(smoothX, [-1, 1], [-2.5, 2.5]);

  // Parallax Layer 3: Bola Futsal (Depth layer terpisah, berlawanan arah -24px + rotasi 18deg)
  const ballTranslateX = useTransform(smoothX, [-1, 1], [22, -22]);
  const ballTranslateY = useTransform(smoothY, [-1, 1], [20, -20]);
  const ballRotateZ = useTransform(smoothX, [-1, 1], [16, -16]);

  // Parallax Layer 4: Floating Badges (Translasi 10px)
  const badgeTranslateX = useTransform(smoothX, [-1, 1], [-10, 10]);
  const badgeTranslateY = useTransform(smoothY, [-1, 1], [-10, 10]);

  // Listener pointer global di hero / window agar parallax tetap hidup saat kursor bergerak
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalisasi posisi kursor terhadap window (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[520px] aspect-square mx-auto flex items-center justify-center select-none ${className}`}
    >
      {/* KEYFRAME ANIMATIONS */}
      <style>{`
        @keyframes heroInfiniteBreathe {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.65;
            filter: blur(45px);
          }
          50% {
            transform: scale(1.15);
            opacity: 0.95;
            filter: blur(55px);
          }
        }
        @keyframes floatOrbitSlow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes subtleFloating {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>

      {/* ======================================================== */}
      {/* LAYER 0: SOFT RADIAL GLOW ORANYE/MERAH (INFINITE BREATHE) */}
      {/* ======================================================== */}
      <motion.div
        style={{ x: glowX, y: glowY }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
      >
        {/* Inti Cahaya Oranye/Merah Bervolume */}
        <div
          className="w-72 h-72 sm:w-88 sm:h-88 lg:w-96 lg:h-96 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(249, 115, 22, 0.38) 35%, rgba(220, 38, 38, 0.18) 65%, transparent 80%)',
            animation: 'heroInfiniteBreathe 5s ease-in-out infinite',
            willChange: 'transform, opacity, filter',
          }}
        />

        {/* Orbit Ring Neon Tipis di Sekeliling Glow */}
        <div
          className="absolute w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] rounded-full border border-dashed border-red-500/20 dark:border-red-500/30 pointer-events-none opacity-60"
          style={{ animation: 'floatOrbitSlow 40s linear infinite' }}
        />
        <div
          className="absolute w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full border border-orange-500/15 pointer-events-none"
        />
      </motion.div>

      {/* ======================================================== */}
      {/* LAYER 1: BACKDROP PERISAI HOLOGRAFIK TURNAMEN            */}
      {/* ======================================================== */}
      <motion.div
        style={{ x: figureTranslateX, y: figureTranslateY }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]"
      >
        <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] rounded-full bg-gradient-to-tr from-red-950/40 via-slate-900/40 to-orange-950/30 backdrop-blur-md border border-red-500/25 p-4 shadow-2xl shadow-red-950/50 flex items-center justify-center overflow-hidden">
          {/* Garis radial pendaran */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/15 via-transparent to-transparent pointer-events-none" />

          {/* Logo Siluet / Watermark Turnamen di Belakang Figur */}
          <img
            src={wabupLogoUrl}
            alt="Wabup Cup Medallion"
            className="w-44 h-44 sm:w-52 sm:h-52 object-contain opacity-25 dark:opacity-35 filter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] transform -scale-x-100"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* LAYER 2: FOTO FIGUR / ATLET TOKOH FUTSAL (PARALLAX 12-15px)*/}
      {/* ======================================================== */}
      <motion.div
        style={{
          x: figureTranslateX,
          y: figureTranslateY,
          rotateZ: figureRotateZ,
        }}
        className="relative z-[2] flex flex-col items-center justify-center pointer-events-none filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.65)]"
      >
        {figureUrl ? (
          <img
            src={figureUrl}
            alt="Figur Resmi Turnamen"
            className="w-[280px] sm:w-[340px] max-h-[380px] object-contain drop-shadow-[0_10px_25px_rgba(239,68,68,0.35)]"
          />
        ) : (
          /* DEFAULT ARTWORK ATLET & MEDALLION RESMI WABUP CUP */
          <div className="relative flex flex-col items-center justify-center">
            {/* Siluet Atlet Futsal Dinamis Berbalut Energi Api */}
            <div className="relative w-64 sm:w-72 h-72 sm:h-80 flex items-center justify-center">
              {/* Logo Resmi Medallion Utama Wabup Cup */}
              <div className="relative z-10 w-48 sm:w-56 h-48 sm:h-56 p-3 rounded-3xl bg-slate-900/60 backdrop-blur-sm border border-red-500/40 shadow-xl shadow-red-900/40 flex items-center justify-center group">
                <img
                  src={wabupLogoUrl}
                  alt="Wabup Cup Official Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                />
                
                {/* Kilauan Diagonal pada Medallion */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
              </div>

              {/* Aura Efek Sayap Energi di Belakang Medallion */}
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600/20 via-orange-500/25 to-blue-600/20 rounded-full blur-xl -z-10 animate-pulse pointer-events-none" />
            </div>
          </div>
        )}
      </motion.div>

      {/* ======================================================== */}
      {/* LAYER 3: BOLA FUTSAL 3D MELAYANG (DEPTH LAYER TERPISAH)  */}
      {/* ======================================================== */}
      <motion.div
        style={{
          x: ballTranslateX,
          y: ballTranslateY,
          rotateZ: ballRotateZ,
        }}
        className="absolute bottom-4 sm:bottom-6 right-2 sm:right-6 z-[4] pointer-events-none"
      >
        <div
          className="relative group"
          style={{ animation: 'subtleFloating 4s ease-in-out infinite' }}
        >
          {ballUrl ? (
            <img
              src={ballUrl}
              alt="Bola Futsal 3D"
              className="w-24 sm:w-32 h-24 sm:h-32 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)]"
            />
          ) : (
            /* 3D RENDERED FUTSAL BALL (SVG TINGGI & TEKSTUR BERKILAU) */
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]">
              {/* Pendaran Api/Speed Trail di Belakang Bola */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-red-600/50 via-orange-500/40 to-transparent blur-md -z-10" />

              <svg
                viewBox="0 0 120 120"
                className="w-full h-full rounded-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Shading Bola 3D Spherical Radial Gradient */}
                  <radialGradient id="futsalBall3D" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="35%" stop-color="#f1f5f9" />
                    <stop offset="70%" stop-color="#94a3b8" />
                    <stop offset="90%" stop-color="#334155" />
                    <stop offset="100%" stop-color="#0f172a" />
                  </radialGradient>
                  
                  {/* Kilau Specular Kaca di Atas Bola */}
                  <linearGradient id="specularGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
                    <stop offset="60%" stop-color="#ffffff" stop-opacity="0" />
                  </linearGradient>

                  {/* Gradien Panel Futsal Oranye-Merah */}
                  <linearGradient id="panelFire" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ef4444" />
                    <stop offset="100%" stop-color="#991b1b" />
                  </linearGradient>
                </defs>

                {/* Base Sphere */}
                <circle cx="60" cy="60" r="58" fill="url(#futsalBall3D)" />

                {/* Pola Futsal Modern (Pentagon Tengah & Panel Sisi) */}
                {/* Center Pentagon Merah-Bara */}
                <polygon
                  points="60,38 76,49 70,68 50,68 44,49"
                  fill="url(#panelFire)"
                  stroke="#1e293b"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                />

                {/* Jahitan Garis Panel Radiating */}
                <line x1="60" y1="38" x2="60" y2="18" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" />
                <line x1="76" y1="49" x2="94" y2="44" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" />
                <line x1="70" y1="68" x2="86" y2="84" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" />
                <line x1="50" y1="68" x2="34" y2="84" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" />
                <line x1="44" y1="49" x2="26" y2="44" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" />

                {/* Panel Atas */}
                <path
                  d="M 46,12 C 55,8 65,8 74,12 L 60,18 Z"
                  fill="#0f172a"
                  stroke="#1e293b"
                  stroke-width="2"
                />
                {/* Panel Kanan */}
                <path
                  d="M 94,44 L 108,55 C 106,68 98,78 86,84 L 80,75 Z"
                  fill="#1e293b"
                  stroke="#0f172a"
                  stroke-width="2"
                />
                {/* Panel Kiri */}
                <path
                  d="M 26,44 L 12,55 C 14,68 22,78 34,84 L 40,75 Z"
                  fill="url(#panelFire)"
                  stroke="#0f172a"
                  stroke-width="2"
                />

                {/* Highlight Specular Cahaya Atas */}
                <ellipse cx="45" cy="30" rx="20" ry="12" fill="url(#specularGlow)" />
              </svg>
            </div>
          )}
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* LAYER 4: FLOATING BADGE PRESTISIUS TURNAMEN              */}
      {/* ======================================================== */}
      <motion.div
        style={{ x: badgeTranslateX, y: badgeTranslateY }}
        className="absolute top-4 sm:top-8 left-2 sm:-left-2 z-[5] pointer-events-none"
      >
        <div
          className="inline-flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-amber-500/40 shadow-xl shadow-amber-950/40"
          style={{ animation: 'subtleFloating 5s ease-in-out 1s infinite' }}
        >
          <span className="text-amber-400 text-base sm:text-lg">🏆</span>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
              Piala Bergilir
            </div>
            <div className="text-[9px] sm:text-[10px] text-amber-300/90 font-medium">
              Wakil Bupati 2026
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
