import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTournament } from '../context/TournamentContext';
import { SponsorItem, SponsorTier } from '../types';
import { SectionBackground, getSectionTextClass } from './SectionBackground';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useAnimationPause } from '../hooks/useAnimationPause';
import {
  Users,
  ExternalLink,
  Handshake,
  Sparkles,
  Instagram,
  Globe,
  Zap,
  PlusCircle,
  Award
} from 'lucide-react';

/**
 * Normalisasi URL sponsor (Website atau Instagram):
 * - Handle IG '@brand' -> https://instagram.com/brand
 * - 'instagram.com/brand' -> https://instagram.com/brand
 * - Domain polos 'brand.com' -> https://brand.com
 */
export const formatSponsorUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('@')) {
    return `https://instagram.com/${trimmed.slice(1)}`;
  }
  if (trimmed.startsWith('instagram.com/')) {
    return `https://${trimmed}`;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

// SVG Path untuk Pointy-Topped Hexagon dengan sudut membulat (fillet radius = 8)
// ViewBox: 0 0 100 115.47 (Rasio lebar:tinggi 1 : 1.1547)
const HEXAGON_PATH =
  'M 43.07 5.00 Q 50.00 1.00 56.93 5.00 L 92.07 25.30 Q 99.00 29.30 99.00 37.30 L 99.00 78.10 Q 99.00 86.10 92.07 90.10 L 56.93 110.40 Q 50.00 114.40 43.07 110.40 L 7.93 90.10 Q 1.00 86.10 1.00 78.10 L 1.00 37.30 Q 1.00 29.30 7.93 25.30 Z';

interface SlotPos {
  x: number;
  y: number;
  side: 'left' | 'right';
  floatDuration: number;
  floatDelay: number;
}

// Koordinat slot heksagon di sekitar pusat kanvas (viewBox: 1100 x 480)
// Diurutkan dari yang terdekat dengan pusat ke arah luar
const LEFT_SLOTS: SlotPos[] = [
  { x: 375, y: 220, side: 'left', floatDuration: 4.1, floatDelay: 0.2 }, // Mid dekat pusat
  { x: 400, y: 110, side: 'left', floatDuration: 3.8, floatDelay: 0.5 }, // Top dekat pusat
  { x: 400, y: 330, side: 'left', floatDuration: 4.3, floatDelay: 0.1 }, // Bottom dekat pusat
  { x: 265, y: 220, side: 'left', floatDuration: 4.4, floatDelay: 0.4 }, // Mid tengah
  { x: 290, y: 110, side: 'left', floatDuration: 4.0, floatDelay: 0.6 }, // Top tengah
  { x: 290, y: 330, side: 'left', floatDuration: 3.9, floatDelay: 0.3 }, // Bottom tengah
  { x: 155, y: 220, side: 'left', floatDuration: 4.2, floatDelay: 0.7 }, // Mid luar
  { x: 180, y: 110, side: 'left', floatDuration: 4.5, floatDelay: 0.2 }, // Top luar
  { x: 180, y: 330, side: 'left', floatDuration: 3.7, floatDelay: 0.8 }, // Bottom luar
];

const RIGHT_SLOTS: SlotPos[] = [
  { x: 725, y: 220, side: 'right', floatDuration: 4.1, floatDelay: 0.3 }, // Mid dekat pusat
  { x: 700, y: 110, side: 'right', floatDuration: 4.0, floatDelay: 0.1 }, // Top dekat pusat
  { x: 700, y: 330, side: 'right', floatDuration: 4.4, floatDelay: 0.6 }, // Bottom dekat pusat
  { x: 835, y: 220, side: 'right', floatDuration: 3.9, floatDelay: 0.5 }, // Mid tengah
  { x: 810, y: 110, side: 'right', floatDuration: 4.6, floatDelay: 0.2 }, // Top tengah
  { x: 810, y: 330, side: 'right', floatDuration: 4.2, floatDelay: 0.7 }, // Bottom tengah
  { x: 945, y: 220, side: 'right', floatDuration: 4.3, floatDelay: 0.4 }, // Mid luar
  { x: 920, y: 110, side: 'right', floatDuration: 3.8, floatDelay: 0.8 }, // Top luar
  { x: 920, y: 330, side: 'right', floatDuration: 4.5, floatDelay: 0.3 }, // Bottom luar
];

export const SponsorSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isPaused } = useAnimationPause({ elementRef: sectionRef });

  const { sponsors, config, committeeContacts, isInitialLoading } = useTournament();
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const primaryContact = committeeContacts?.find(c => c.isPrimary) || committeeContacts?.[0];
  const waNumber = primaryContact?.phone || config.adminContactPhone || '6281234567890';
  const cleanWaNumber = waNumber.replace(/\D/g, '').startsWith('0')
    ? `62${waNumber.replace(/\D/g, '').slice(1)}`
    : waNumber.replace(/\D/g, '');

  const bgConfig = config.sectionsBackgrounds?.sponsors;
  const isCustomImage = bgConfig?.mode === 'IMAGE';
  const isCustomColor = bgConfig?.mode === 'COLOR';

  // Logo turnamen dari pengaturan informasi & logo CMS
  const wabupLogo = config.wabupLogoUrl || '/wabup-cup-logo.svg';

  // Koordinat pusat Hexagon Logo Turnamen pada kanvas desktop (viewBox 1100 x 480)
  const CENTER_X = 550;
  const CENTER_Y = 220;

  // HANYA MENGGUNAKAN DATA REAL DARI DATABASE
  // Distribusikan sponsor secara seimbang antara sisi kiri dan kanan
  const realNodes: (SponsorItem & SlotPos)[] = [];
  let leftIdx = 0;
  let rightIdx = 0;

  sponsors.forEach((sp, i) => {
    if (i % 2 === 0) {
      if (leftIdx < LEFT_SLOTS.length) {
        realNodes.push({ ...sp, ...LEFT_SLOTS[leftIdx] });
        leftIdx++;
      } else if (rightIdx < RIGHT_SLOTS.length) {
        realNodes.push({ ...sp, ...RIGHT_SLOTS[rightIdx] });
        rightIdx++;
      }
    } else {
      if (rightIdx < RIGHT_SLOTS.length) {
        realNodes.push({ ...sp, ...RIGHT_SLOTS[rightIdx] });
        rightIdx++;
      } else if (leftIdx < LEFT_SLOTS.length) {
        realNodes.push({ ...sp, ...LEFT_SLOTS[leftIdx] });
        leftIdx++;
      }
    }
  });

  // Jika sponsor hanya 1, siapkan 1 slot undangan terbuka di sisi berlawanan agar seimbang
  const hasSingleSponsor = sponsors.length === 1;
  const openSlotPos: SlotPos | null = hasSingleSponsor
    ? RIGHT_SLOTS[0]
    : sponsors.length === 0
    ? null
    : null;

  // Helper untuk membuat garis lengkung Cubic Bezier dari pusat ke posisi partner
  const getBezierPath = (targetX: number, targetY: number, side: 'left' | 'right') => {
    const startX = side === 'left' ? CENTER_X - 60 : CENTER_X + 60;
    const startY = CENTER_Y;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const c1x = startX + dx * 0.45;
    const c1y = startY + dy * 0.15;
    const c2x = startX + dx * 0.75;
    const c2y = targetY;
    return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${targetX} ${targetY}`;
  };

  const tierColors: Record<SponsorTier, string> = {
    PLATINUM: '#ef4444',
    GOLD: '#f59e0b',
    SILVER: '#94a3b8',
    OFFICIAL_PARTNER: '#3b82f6',
  };

  const tierBadges: Record<SponsorTier, string> = {
    PLATINUM: 'bg-red-600 text-white',
    GOLD: 'bg-amber-500 text-slate-950 font-black',
    SILVER: 'bg-slate-700 text-white',
    OFFICIAL_PARTNER: 'bg-blue-600 text-white',
  };

  return (
    <section
      ref={sectionRef}
      id="sponsor"
      className={`scroll-mt-24 py-20 relative overflow-hidden transition-colors duration-300 border-b border-slate-200 dark:border-slate-800/80 ${
        isCustomColor || isCustomImage ? '' : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
      }`}
      style={isCustomColor && bgConfig.bgColor ? { backgroundColor: bgConfig.bgColor } : undefined}
    >
      {/* CUSTOM SECTION BACKGROUND DARI CMS */}
      <SectionBackground config={bgConfig} />

      {/* AMBIENT GRADIENT & NEON MIST */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[550px] bg-gradient-to-r from-purple-600/10 via-amber-500/10 to-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${getSectionTextClass(bgConfig)}`}>
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Kemitraan & Kolaborasi Resmi</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-heading font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
            SPONSOR & OFFICIAL PARTNER
          </h2>
          
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Apresiasi dan penghormatan tertinggi kepada institusi, korporasi, dan mitra resmi yang mendukung terselenggaranya turnamen akbar Wabup Cup 2026.
          </p>
        </div>

        {/* LOADING STATE */}
        {isInitialLoading && sponsors.length === 0 ? (
          <div className="space-y-6 text-center py-16">
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span>Menyinkronkan daftar sponsor resmi dari database...</span>
            </div>
          </div>
        ) : (
          <>
            {/* =========================================================================
                DESKTOP INTERACTIVE CANVAS (Interactive Energy Beams + Real Sponsor Hexagons)
                ========================================================================= */}
            <div className="hidden lg:block relative w-full max-w-[1100px] mx-auto h-[480px] select-none">
              
              {/* SVG LAYER: CONNECTING BEAMS, PARTICLES & ORBITAL ARROWS */}
              <svg
                viewBox="0 0 1100 480"
                className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
              >
                <defs>
                  <radialGradient id="centerAuraReal" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#f97316" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>

                  <linearGradient id="beamGradActiveReal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                    <stop offset="60%" stopColor="#f97316" stopOpacity="1" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                  </linearGradient>

                  <linearGradient id="beamGradIdleReal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.15" />
                  </linearGradient>

                  <marker id="orbitArrowRightReal" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
                    <polygon points="0 1, 7 4, 0 7" fill="#8b5cf6" />
                  </marker>
                  <marker id="orbitArrowLeftReal" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
                    <polygon points="7 1, 0 4, 7 7" fill="#f97316" />
                  </marker>
                </defs>

                {/* AURA GLOW BEHIND CENTER */}
                <circle cx={CENTER_X} cy={CENTER_Y} r="140" fill="url(#centerAuraReal)" />

                {/* EFEK PUTARAN / ORBIT SIRKULASI HALUS (LOOP ARROWS ATAS & BAWAH) */}
                <g className="opacity-70 dark:opacity-85">
                  <path
                    d="M 450 100 C 510 65, 590 65, 650 100"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1.8"
                    strokeDasharray="4 6"
                    markerEnd="url(#orbitArrowRightReal)"
                    className={prefersReducedMotion ? '' : 'animate-[pulse_3s_ease-in-out_infinite]'}
                    style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
                  />
                  <path
                    d="M 650 340 C 590 375, 510 375, 450 340"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="1.8"
                    strokeDasharray="4 6"
                    markerEnd="url(#orbitArrowLeftReal)"
                    className={prefersReducedMotion ? '' : 'animate-[pulse_3s_ease-in-out_infinite]'}
                    style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
                  />
                </g>

                {/* GARIS KONEKSI & ENERGI BEZIER KE REAL SPONSORS */}
                {realNodes.map(p => {
                  const pathD = getBezierPath(p.x, p.y, p.side);
                  const isActive = activePartnerId === p.id;

                  return (
                    <g key={`beam-${p.id}`}>
                      {/* 1. Base line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isActive ? 'url(#beamGradActiveReal)' : 'url(#beamGradIdleReal)'}
                        strokeWidth={isActive ? 2.8 : 1.4}
                        className="transition-all duration-300"
                      />

                      {/* 2. Flowing pulse dashes */}
                      {!prefersReducedMotion && !isPaused && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke={isActive ? '#f97316' : '#8b5cf6'}
                          strokeWidth={isActive ? 3.5 : 1.8}
                          strokeDasharray={isActive ? '12 24' : '6 36'}
                          strokeLinecap="round"
                          className="opacity-80"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            from="100"
                            to="0"
                            dur={isActive ? '1.2s' : '3.2s'}
                            repeatCount="indefinite"
                          />
                        </path>
                      )}

                      {/* 3. Glowing Light Dot Particle */}
                      {!prefersReducedMotion && !isPaused && (
                        <circle r={isActive ? 4 : 2.5} fill={isActive ? '#38bdf8' : '#f97316'}>
                          <animateMotion
                            path={pathD}
                            dur={isActive ? '1.2s' : '3.2s'}
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* Garis halus ke Open Slot jika ada 1 sponsor */}
                {openSlotPos && (
                  <path
                    d={getBezierPath(openSlotPos.x, openSlotPos.y, openSlotPos.side)}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.25)"
                    strokeWidth="1.2"
                    strokeDasharray="4 8"
                  />
                )}
              </svg>

              {/* ===================================================================
                  CENTER LARGE HEXAGON LOGO UTAMA WABUP CUP (UNGU - ORANYE NEON GLOW)
                  =================================================================== */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-auto"
                style={{ width: 190, height: 220 }}
              >
                {/* AMBIENT NEON GLOW */}
                <div
                  className={`absolute inset-0 bg-gradient-to-tr from-purple-600/35 via-orange-500/30 to-indigo-600/40 rounded-full blur-2xl pointer-events-none ${
                    prefersReducedMotion ? '' : 'animate-pulse'
                  }`}
                  style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
                />

                {/* SVG CENTER HEXAGON FRAME */}
                <svg
                  viewBox="0 0 100 115.47"
                  className="absolute inset-0 w-full h-full filter drop-shadow-[0_15px_35px_rgba(139,92,246,0.35)] transition-transform duration-500 hover:scale-105"
                >
                  <defs>
                    <linearGradient id="centerMainFillReal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#120726" />
                      <stop offset="45%" stopColor="#1e103c" />
                      <stop offset="100%" stopColor="#080314" />
                    </linearGradient>

                    <linearGradient id="centerMainBorderReal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>

                    <linearGradient id="centerInnerBevelReal" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  <path
                    d={HEXAGON_PATH}
                    fill="url(#centerMainFillReal)"
                    stroke="url(#centerMainBorderReal)"
                    strokeWidth="3"
                  />

                  <path
                    d={HEXAGON_PATH}
                    fill="none"
                    stroke="url(#centerInnerBevelReal)"
                    strokeWidth="1.2"
                    transform="scale(0.94) translate(3.2, 3.7)"
                  />
                </svg>

                {/* CENTER CONTENT: LOGO WABUP CUP DARI PENGATURAN INFORMASI DAN LOGO */}
                <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center select-none">
                  <img
                    src={wabupLogo}
                    alt={config.name || 'Logo Turnamen WabupCup 2026'}
                    className="max-w-[126px] max-h-[102px] w-auto h-auto object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-110"
                  />
                  
                  <div className="mt-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-950/80 to-amber-950/80 border border-purple-500/40 text-[9px] font-mono font-bold tracking-wider text-amber-300 shadow-sm backdrop-blur-md">
                    OFFICIAL LOGO
                  </div>
                </div>
              </div>

              {/* ===================================================================
                  REAL SPONSORS DARI DATABASE (TANPA DATA DUMMY)
                  =================================================================== */}
              {realNodes.map(p => {
                const isActive = activePartnerId === p.id;
                const targetUrl = formatSponsorUrl(p.websiteUrl);
                const isInstagram = targetUrl.toLowerCase().includes('instagram.com');
                const hasValidImage = Boolean(p.logoUrl && !imageErrors[p.id]);

                return (
                  <motion.div
                    key={p.id}
                    className="absolute z-20 cursor-pointer"
                    style={{
                      left: p.x - 52, // Center anchor
                      top: p.y - 60,
                      width: 104,
                      height: 120,
                    }}
                    animate={
                      prefersReducedMotion || isPaused
                        ? { y: 0 }
                        : { y: [-3, 3, -3] }
                    }
                    transition={
                      prefersReducedMotion || isPaused
                        ? { duration: 0 }
                        : {
                            duration: p.floatDuration,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: p.floatDelay,
                          }
                    }
                    onMouseEnter={() => setActivePartnerId(p.id)}
                    onMouseLeave={() => setActivePartnerId(null)}
                  >
                    <a
                      href={targetUrl || '#'}
                      target={targetUrl ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      onClick={e => {
                        if (!targetUrl) e.preventDefault();
                      }}
                      className="relative block w-full h-full no-underline group"
                    >
                      {/* SPARK / GLOW SAAT HOVER */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1.18 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 bg-gradient-to-tr from-purple-500/35 to-amber-500/35 rounded-2xl blur-lg pointer-events-none"
                          />
                        )}
                      </AnimatePresence>

                      {/* SVG WHITE HEXAGON CARD */}
                      <motion.svg
                        viewBox="0 0 100 115.47"
                        className="w-full h-full filter transition-all duration-300"
                        animate={{
                          scale: isActive ? 1.08 : 1.0,
                        }}
                        style={{
                          filter: isActive
                            ? 'drop-shadow(0 0 22px rgba(139, 92, 246, 0.55)) drop-shadow(0 10px 15px rgba(0,0,0,0.18))'
                            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))',
                        }}
                      >
                        <path
                          d={HEXAGON_PATH}
                          className="fill-white dark:fill-white transition-colors duration-300"
                          stroke={isActive ? '#8b5cf6' : (tierColors[p.tier] || 'rgba(226, 232, 240, 0.95)')}
                          strokeWidth={isActive ? 2.8 : 1.6}
                        />
                      </motion.svg>

                      {/* CONTENT REAL LOGO DARI DATABASE (TAMPIL PENUH / FULL DALAM HEXAGON) */}
                      <div
                        className="absolute inset-0 flex items-center justify-center p-1.5 select-none pointer-events-none z-10"
                        style={{
                          clipPath: 'polygon(50% 1.5%, 98.5% 25.5%, 98.5% 74.5%, 50% 98.5%, 1.5% 74.5%, 1.5% 25.5%)',
                        }}
                      >
                        {hasValidImage ? (
                          <img
                            src={p.logoUrl}
                            alt={`Logo ${p.name}`}
                            onError={() => handleImageError(p.id)}
                            className="w-full h-full max-w-[92%] max-h-[86%] object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center px-1">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-xs flex items-center justify-center shadow-sm mb-1">
                              {(p.logoText || p.name).slice(0, 2).toUpperCase()}
                            </span>
                            <span className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-1 max-w-[80px]">
                              {p.logoText || p.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* FLOATING HOVER TOOLTIP */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.92 }}
                            transition={{ duration: 0.15 }}
                            className="absolute -top-16 left-1/2 -translate-x-1/2 pointer-events-none z-50 whitespace-nowrap shadow-2xl"
                          >
                            <div className="bg-slate-900/95 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-slate-700/80 backdrop-blur-md flex flex-col items-center space-y-0.5">
                              <div className="flex items-center space-x-1.5">
                                <span>{p.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${tierBadges[p.tier] || 'bg-purple-600 text-white'}`}>
                                  {p.tier}
                                </span>
                              </div>
                              {targetUrl && (
                                <div className="text-[10px] font-normal text-slate-300 flex items-center space-x-1 pt-0.5 border-t border-slate-800/80 w-full justify-center">
                                  {isInstagram ? (
                                    <>
                                      <Instagram className="w-3 h-3 text-pink-400" />
                                      <span className="text-pink-300">Buka Instagram</span>
                                    </>
                                  ) : (
                                    <>
                                      <Globe className="w-3 h-3 text-blue-400" />
                                      <span className="text-blue-300">Kunjungi Website</span>
                                    </>
                                  )}
                                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1 border-r border-b border-slate-700/80" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </a>
                  </motion.div>
                );
              })}

              {/* SLOT TERBUKA SIMETRIS (JIKA SPONSOR BARU 1, TAMPILKAN SLOT AJAKAN MITRA DI KANAN) */}
              {openSlotPos && (
                <motion.div
                  className="absolute z-20 cursor-pointer"
                  style={{
                    left: openSlotPos.x - 52,
                    top: openSlotPos.y - 60,
                    width: 104,
                    height: 120,
                  }}
                  animate={
                    prefersReducedMotion || isPaused
                      ? { y: 0 }
                      : { y: [-3, 3, -3] }
                  }
                  transition={
                    prefersReducedMotion || isPaused
                      ? { duration: 0 }
                      : {
                          duration: 4.2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.3,
                        }
                  }
                >
                  <a
                    href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
                      `Halo Panitia ${config.name || 'WabupCup 2026'}, kami berminat mengajukan diri menjadi mitra sponsor resmi.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Slot Sponsor Terbuka - Ajukan Kerjasama"
                    className="relative block w-full h-full no-underline group"
                  >
                    <svg viewBox="0 0 100 115.47" className="w-full h-full filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <path
                        d={HEXAGON_PATH}
                        className="fill-slate-100/90 dark:fill-slate-900/80"
                        stroke="rgba(148, 163, 184, 0.4)"
                        strokeWidth="1.6"
                        strokeDasharray="4 4"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10">
                      <PlusCircle className="w-6 h-6 text-purple-500 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">
                        Slot Mitra Terbuka
                      </span>
                    </div>
                  </a>
                </motion.div>
              )}
            </div>

            {/* =========================================================================
                MOBILE & TABLET VIEW (< lg): CENTER LOGO ON TOP + REAL SPONSOR GRID
                ========================================================================= */}
            <div className="lg:hidden flex flex-col items-center">
              {/* CENTER WABUP CUP LOGO */}
              <div className="relative w-40 h-44 flex items-center justify-center mb-8">
                <div
                  className={`absolute inset-0 bg-gradient-to-tr from-purple-600/35 via-orange-500/30 to-indigo-600/40 rounded-full blur-xl pointer-events-none ${
                    prefersReducedMotion ? '' : 'animate-pulse'
                  }`}
                  style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
                />
                <svg viewBox="0 0 100 115.47" className="absolute inset-0 w-full h-full filter drop-shadow-xl">
                  <defs>
                    <linearGradient id="centerMobileFillReal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#120726" />
                      <stop offset="100%" stopColor="#080314" />
                    </linearGradient>
                    <linearGradient id="centerMobileBorderReal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <path d={HEXAGON_PATH} fill="url(#centerMobileFillReal)" stroke="url(#centerMobileBorderReal)" strokeWidth="3" />
                </svg>
                <div className="relative z-10 flex flex-col items-center justify-center p-3">
                  <img
                    src={wabupLogo}
                    alt={config.name || 'WabupCup 2026'}
                    className="max-w-[95px] max-h-[80px] object-contain filter drop-shadow-md"
                  />
                  <span className="mt-1 text-[8px] font-mono font-bold text-amber-300 uppercase tracking-widest bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/40">
                    OFFICIAL
                  </span>
                </div>
              </div>

              {/* REAL SPONSORS MOBILE GRID */}
              {sponsors.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-3 max-w-md px-2">
                  {sponsors.map(sp => {
                    const targetUrl = formatSponsorUrl(sp.websiteUrl);
                    const hasValidImage = Boolean(sp.logoUrl && !imageErrors[sp.id]);

                    return (
                      <motion.a
                        key={`mobile-${sp.id}`}
                        href={targetUrl || '#'}
                        target={targetUrl ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        onClick={e => {
                          if (!targetUrl) e.preventDefault();
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="relative w-[96px] h-[110px] flex items-center justify-center group"
                      >
                        <svg viewBox="0 0 100 115.47" className="absolute inset-0 w-full h-full filter drop-shadow-sm">
                          <path
                            d={HEXAGON_PATH}
                            fill="#ffffff"
                            stroke={tierColors[sp.tier] || 'rgba(226, 232, 240, 0.95)'}
                            strokeWidth="1.8"
                          />
                        </svg>
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center p-1.5 z-10 select-none"
                          style={{
                            clipPath: 'polygon(50% 1.5%, 98.5% 25.5%, 98.5% 74.5%, 50% 98.5%, 1.5% 74.5%, 1.5% 25.5%)',
                          }}
                        >
                          {hasValidImage ? (
                            <img
                              src={sp.logoUrl}
                              alt={sp.name}
                              onError={() => handleImageError(sp.id)}
                              className="w-full h-full max-w-[92%] max-h-[86%] object-contain filter drop-shadow-sm"
                            />
                          ) : (
                            <span className="font-heading font-black text-xs uppercase text-slate-900 text-center line-clamp-1 px-1">
                              {sp.logoText || sp.name}
                            </span>
                          )}
                        </div>
                      </motion.a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 max-w-xs">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Slot kemitraan sponsor resmi turnamen masih terbuka.
                  </p>
                </div>
              )}
            </div>

            {/* DETAIL DAFTAR MITRA RESMI DARI DATABASE */}
            {sponsors.length > 0 && (
              <div className="mt-14 pt-8 border-t border-slate-200 dark:border-slate-800/80 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Mitra Resmi Terdaftar ({sponsors.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    VERIFIED PARTNERS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sponsors.map(sp => {
                    const targetUrl = formatSponsorUrl(sp.websiteUrl);
                    const isInstagram = targetUrl.toLowerCase().includes('instagram.com');

                    return (
                      <div
                        key={`card-${sp.id}`}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 hover:border-purple-500/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 shrink-0">
                            {sp.logoUrl && !imageErrors[sp.id] ? (
                              <img
                                src={sp.logoUrl}
                                alt={sp.name}
                                onError={() => handleImageError(sp.id)}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <span className="font-bold text-xs text-purple-600">
                                {(sp.logoText || sp.name).slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {sp.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {sp.description || `${sp.tier} Partner`}
                            </p>
                          </div>
                        </div>

                        {targetUrl && (
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-100 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-950/60 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 transition shrink-0"
                            title={`Buka ${isInstagram ? 'Instagram' : 'Website'} ${sp.name}`}
                          >
                            {isInstagram ? <Instagram className="w-4 h-4 text-pink-500" /> : <Globe className="w-4 h-4 text-blue-500" />}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            MODERN BECOME A SPONSOR CALLOUT BANNER (AJUKAN PROPOSAL VIA WA)
            ========================================================================= */}
        <div className="mt-16 sm:mt-20 relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950 border-2 border-purple-500/40 text-white p-8 sm:p-10 shadow-2xl shadow-purple-950/30 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-600/30 border border-purple-500/50 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Peluang Kerjasama Sponsorship 2026</span>
            </div>
            
            <h3 className="text-2xl sm:text-4xl font-heading font-extrabold uppercase tracking-tight text-white">
              TERTARIK MENJADI MITRA RESMI WABUPCUP?
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tingkatkan visibilitas brand Anda di hadapan puluhan ribu suporter & atlet futsal secara langsung di stadion serta jutaan impresi media sosial dan liputan siaran resmi turnamen.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
                `Halo Panitia ${config.name || 'WabupCup 2026'}, perkenankan kami dari perusahaan/instansi ingin mengajukan proposal kerjasama sponsorship turnamen.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-900/50 transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Handshake className="w-4 h-4" />
              <span>Ajukan Proposal Sponsor via WA</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
