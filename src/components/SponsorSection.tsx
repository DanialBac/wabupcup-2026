import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTournament } from '../context/TournamentContext';
import { SponsorItem, SponsorTier } from '../types';
import { SectionBackground, getSectionTextClass } from './SectionBackground';
import {
  Users,
  ExternalLink,
  Handshake,
  Sparkles,
  Instagram,
  Globe,
  Zap
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

// Daftar 18 Partner Showcase sesuai contoh desain referensi (fallback jika data database kurang dari 18)
interface PartnerNode {
  id: string;
  name: string;
  tier: SponsorTier;
  logoUrl?: string;
  logoText: string;
  websiteUrl?: string;
  description?: string;
  color?: string;
  // Posisi di kanvas desktop (viewBox 1100 x 480)
  x: number;
  y: number;
  side: 'left' | 'right';
  floatDuration: number;
  floatDelay: number;
}

const DEFAULT_PARTNERS_LAYOUT: Omit<PartnerNode, 'id'>[] = [
  // --- SISI KIRI (9 Nodes: Kolom Luar, Tengah, Dekat Pusat) ---
  // Baris 1 (Top)
  { name: 'ChatGPT', tier: 'PLATINUM', logoText: 'ChatGPT', color: '#10a37f', x: 210, y: 100, side: 'left', floatDuration: 4.2, floatDelay: 0.1, websiteUrl: 'https://openai.com' },
  { name: 'RZ', tier: 'GOLD', logoText: 'RZ', color: '#0284c7', x: 320, y: 100, side: 'left', floatDuration: 3.8, floatDelay: 0.6, websiteUrl: 'https://rz-ostschweiz.ch' },
  { name: 'swissICT', tier: 'SILVER', logoText: 'swissICT', color: '#dc2626', x: 430, y: 100, side: 'left', floatDuration: 4.5, floatDelay: 0.3, websiteUrl: 'https://swissict.ch' },

  // Baris 2 (Mid, Staggered ke kiri)
  { name: 'Intel', tier: 'PLATINUM', logoText: 'intel', color: '#0068b5', x: 155, y: 210, side: 'left', floatDuration: 3.9, floatDelay: 0.5, websiteUrl: 'https://intel.com' },
  { name: 'INGRAM', tier: 'GOLD', logoText: 'INGRAM', color: '#004c97', x: 265, y: 210, side: 'left', floatDuration: 4.4, floatDelay: 0.2, websiteUrl: 'https://ingrammicro.com' },
  { name: 'sipcall', tier: 'OFFICIAL_PARTNER', logoText: 'sipcall', color: '#1e293b', x: 375, y: 210, side: 'left', floatDuration: 4.1, floatDelay: 0.7, websiteUrl: 'https://sipcall.ch' },

  // Baris 3 (Bottom)
  { name: 'Meta', tier: 'PLATINUM', logoText: 'Meta', color: '#0668e1', x: 210, y: 320, side: 'left', floatDuration: 4.6, floatDelay: 0.4, websiteUrl: 'https://about.meta.com' },
  { name: 'ADN', tier: 'SILVER', logoText: 'ADN', color: '#18181b', x: 320, y: 320, side: 'left', floatDuration: 3.7, floatDelay: 0.8, websiteUrl: 'https://adn.de' },
  { name: 'Microsoft Partner', tier: 'GOLD', logoText: 'MSFT', color: '#00a4ef', x: 430, y: 320, side: 'left', floatDuration: 4.3, floatDelay: 0.1, websiteUrl: 'https://microsoft.com' },

  // --- SISI KANAN (9 Nodes: Kolom Dekat Pusat, Tengah, Luar) ---
  // Baris 1 (Top)
  { name: 'Gemini', tier: 'PLATINUM', logoText: 'Gemini', color: '#8b5cf6', x: 670, y: 100, side: 'right', floatDuration: 4.0, floatDelay: 0.2, websiteUrl: 'https://gemini.google.com' },
  { name: 'AWS', tier: 'PLATINUM', logoText: 'aws', color: '#ff9900', x: 780, y: 100, side: 'right', floatDuration: 4.7, floatDelay: 0.5, websiteUrl: 'https://aws.amazon.com' },
  { name: 'AnyDesk', tier: 'GOLD', logoText: 'AnyDesk', color: '#ef4444', x: 890, y: 100, side: 'right', floatDuration: 3.9, floatDelay: 0.3, websiteUrl: 'https://anydesk.com' },

  // Baris 2 (Mid, Staggered ke kanan)
  { name: 'Google', tier: 'PLATINUM', logoText: 'Google', color: '#4285f4', x: 725, y: 210, side: 'right', floatDuration: 4.3, floatDelay: 0.6, websiteUrl: 'https://google.com' },
  { name: 'ID:C', tier: 'SILVER', logoText: 'ID:C', color: '#dc2626', x: 835, y: 210, side: 'right', floatDuration: 3.8, floatDelay: 0.1, websiteUrl: 'https://idc.com' },
  { name: 'Security Core', tier: 'OFFICIAL_PARTNER', logoText: 'CORE', color: '#10b981', x: 945, y: 210, side: 'right', floatDuration: 4.5, floatDelay: 0.4, websiteUrl: '#' },

  // Baris 3 (Bottom)
  { name: 'ASUS', tier: 'GOLD', logoText: 'ASUS', color: '#00539b', x: 670, y: 320, side: 'right', floatDuration: 4.1, floatDelay: 0.7, websiteUrl: 'https://asus.com' },
  { name: 'HotellerieSuisse', tier: 'SILVER', logoText: 'Hotellerie', color: '#b91c1c', x: 780, y: 320, side: 'right', floatDuration: 3.9, floatDelay: 0.2, websiteUrl: 'https://hotelleriesuisse.ch' },
  { name: 'Swiss Hosting', tier: 'OFFICIAL_PARTNER', logoText: 'SwissHost', color: '#dc2626', x: 890, y: 320, side: 'right', floatDuration: 4.4, floatDelay: 0.5, websiteUrl: '#' },
];

export const SponsorSection: React.FC = () => {
  const { sponsors, config, committeeContacts, isInitialLoading } = useTournament();
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);

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

  // Gabungkan sponsor nyata dari database dengan layout 18 posisi
  const partners: PartnerNode[] = DEFAULT_PARTNERS_LAYOUT.map((pos, idx) => {
    const realSponsor = sponsors[idx];
    if (realSponsor) {
      return {
        ...pos,
        id: realSponsor.id,
        name: realSponsor.name,
        tier: realSponsor.tier,
        logoUrl: realSponsor.logoUrl,
        logoText: realSponsor.logoText || realSponsor.name,
        websiteUrl: realSponsor.websiteUrl,
        description: realSponsor.description,
      };
    }
    return {
      ...pos,
      id: `default-node-${idx}`,
    };
  });

  // Helper untuk membuat garis lengkung Cubic Bezier dari pusat ke posisi partner
  const getBezierPath = (targetX: number, targetY: number, side: 'left' | 'right') => {
    // Posisi keluar dari sisi hexagon pusat
    const startX = side === 'left' ? CENTER_X - 60 : CENTER_X + 60;
    const startY = CENTER_Y;

    // Control point elegan yang melengkung natural
    const dx = targetX - startX;
    const dy = targetY - startY;
    const c1x = startX + dx * 0.45;
    const c1y = startY + dy * 0.15;
    const c2x = startX + dx * 0.75;
    const c2y = targetY;

    return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${targetX} ${targetY}`;
  };

  return (
    <section
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
            <span>Ekosistem Kemitraan & Kolaborasi</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-heading font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
            SPONSOR & OFFICIAL PARTNER
          </h2>
          
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Apresiasi dan penghormatan tertinggi kepada institusi, korporasi, dan mitra media yang menyatukan energi dalam mewujudkan pesta olahraga futsal terbesar Wabup Cup 2026.
          </p>
        </div>

        {/* =========================================================================
            DESKTOP INTERACTIVE CANVAS (Interactive Energy Beams + Hexagons + Orbit)
            ========================================================================= */}
        <div className="hidden lg:block relative w-full max-w-[1100px] mx-auto h-[480px] select-none">
          
          {/* SVG LAYER: CONNECTING BEAMS, PARTICLES & ORBITAL ARROWS */}
          <svg
            viewBox="0 0 1100 480"
            className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
          >
            <defs>
              {/* Center glow radial gradient */}
              <radialGradient id="centerAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* Energy line gradients */}
              <linearGradient id="beamGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="1" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="beamGradIdle" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.15" />
              </linearGradient>

              {/* Arrow markers for orbit loops */}
              <marker id="orbitArrowRight" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
                <polygon points="0 1, 7 4, 0 7" fill="#8b5cf6" />
              </marker>
              <marker id="orbitArrowLeft" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
                <polygon points="7 1, 0 4, 7 7" fill="#f97316" />
              </marker>
            </defs>

            {/* AURA GLOW BEHIND CENTER */}
            <circle cx={CENTER_X} cy={CENTER_Y} r="140" fill="url(#centerAura)" />

            {/* EFEK PUTARAN / ORBIT SIRKULASI HALUS (LOOP ARROWS ATAS & BAWAH) */}
            <g className="opacity-70 dark:opacity-85">
              {/* Upper Arc Loop (Clockwise flow: Kiri ke Kanan) */}
              <path
                d="M 450 100 C 510 65, 590 65, 650 100"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.8"
                strokeDasharray="4 6"
                markerEnd="url(#orbitArrowRight)"
                className="animate-[pulse_3s_ease-in-out_infinite]"
              />
              {/* Lower Arc Loop (Counter-clockwise flow: Kanan ke Kiri) */}
              <path
                d="M 650 340 C 590 375, 510 375, 450 340"
                fill="none"
                stroke="#f97316"
                strokeWidth="1.8"
                strokeDasharray="4 6"
                markerEnd="url(#orbitArrowLeft)"
                className="animate-[pulse_3s_ease-in-out_infinite]"
              />
            </g>

            {/* GARIS KONEKSI & ALIRAN ENERGI (BEZIER ENERGY BEAMS) */}
            {partners.map(p => {
              const pathD = getBezierPath(p.x, p.y, p.side);
              const isActive = activePartnerId === p.id;

              return (
                <g key={`beam-${p.id}`}>
                  {/* 1. Base subtle line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isActive ? 'url(#beamGradActive)' : 'url(#beamGradIdle)'}
                    strokeWidth={isActive ? 2.8 : 1.2}
                    className="transition-all duration-300"
                  />

                  {/* 2. Flowing pulse / signal dashes */}
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

                  {/* 3. Glowing Light Dot Particle flowing to partner node */}
                  <circle r={isActive ? 4 : 2.5} fill={isActive ? '#38bdf8' : '#f97316'}>
                    <animateMotion
                      path={pathD}
                      dur={isActive ? '1.2s' : '3.2s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* ===================================================================
              CENTER LARGE HEXAGON LOGO UTAMA WABUP CUP (UNGU - ORANYE NEON GLOW)
              =================================================================== */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-auto"
            style={{ width: 190, height: 220 }}
          >
            {/* AMBIENT ROTATING NEON PULSE */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/35 via-orange-500/30 to-indigo-600/40 rounded-full blur-2xl animate-pulse pointer-events-none" />

            {/* SVG CENTER HEXAGON FRAME */}
            <svg
              viewBox="0 0 100 115.47"
              className="absolute inset-0 w-full h-full filter drop-shadow-[0_15px_35px_rgba(139,92,246,0.35)] transition-transform duration-500 hover:scale-105"
            >
              <defs>
                <linearGradient id="centerMainFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#120726" />
                  <stop offset="45%" stopColor="#1e103c" />
                  <stop offset="100%" stopColor="#080314" />
                </linearGradient>

                <linearGradient id="centerMainBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>

                <linearGradient id="centerInnerBevel" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Main Outer Hexagon */}
              <path
                d={HEXAGON_PATH}
                fill="url(#centerMainFill)"
                stroke="url(#centerMainBorder)"
                strokeWidth="3"
              />

              {/* Inner Glowing Bevel */}
              <path
                d={HEXAGON_PATH}
                fill="none"
                stroke="url(#centerInnerBevel)"
                strokeWidth="1.2"
                transform="scale(0.94) translate(3.2, 3.7)"
              />
            </svg>

            {/* CENTER CONTENT: LOGO WABUP CUP DARI PENGATURAN INFORMASI DAN LOGO */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center select-none">
              <img
                src={wabupLogo}
                alt={config.name || 'Logo Turnamen WabupCup 2026'}
                className="max-w-[100px] max-h-[82px] w-auto h-auto object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-110"
              />
              
              <div className="mt-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-950/80 to-amber-950/80 border border-purple-500/40 text-[9px] font-mono font-bold tracking-wider text-amber-300 shadow-sm backdrop-blur-md">
                OFFICIAL LOGO
              </div>
            </div>
          </div>

          {/* ===================================================================
              INTERACTIVE PARTNER HEXAGON BADGES (SISI KIRI & SISI KANAN)
              =================================================================== */}
          {partners.map(p => {
            const isActive = activePartnerId === p.id;
            const targetUrl = formatSponsorUrl(p.websiteUrl);
            const isInstagram = targetUrl.toLowerCase().includes('instagram.com');

            return (
              <motion.div
                key={p.id}
                className="absolute z-20 cursor-pointer"
                style={{
                  left: p.x - 46, // Center anchor
                  top: p.y - 53,
                  width: 92,
                  height: 106,
                }}
                animate={{
                  y: [-3, 3, -3],
                }}
                transition={{
                  duration: p.floatDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: p.floatDelay,
                }}
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
                  className="relative block w-full h-full no-underline"
                >
                  {/* SPARK / GLOW EFFECT SAAT HOVER */}
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

                  {/* SVG WHITE/GLASS HEXAGON BADGE */}
                  <motion.svg
                    viewBox="0 0 100 115.47"
                    className="w-full h-full filter transition-all duration-300"
                    animate={{
                      scale: isActive ? 1.08 : 1.0,
                    }}
                    style={{
                      filter: isActive
                        ? 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5)) drop-shadow(0 10px 15px rgba(0,0,0,0.18))'
                        : 'drop-shadow(0 4px 6px rgba(0,0,0,0.08))',
                    }}
                  >
                    <path
                      d={HEXAGON_PATH}
                      className="fill-white dark:fill-white transition-colors duration-300"
                      stroke={isActive ? '#8b5cf6' : 'rgba(226, 232, 240, 0.95)'}
                      strokeWidth={isActive ? 2.8 : 1.5}
                    />
                  </motion.svg>

                  {/* CONTENT (Centered inside Hexagon Badge) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 select-none pointer-events-none z-10">
                    {p.logoUrl ? (
                      <img
                        src={p.logoUrl}
                        alt={`Logo ${p.name}`}
                        className="max-w-[76%] max-h-[58%] object-contain filter drop-shadow-sm transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <span
                          className="font-heading font-black text-xs sm:text-sm tracking-wider uppercase truncate max-w-[74px]"
                          style={{ color: p.color || '#0f172a' }}
                        >
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
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-600 text-white">
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
        </div>

        {/* =========================================================================
            MOBILE & TABLET VIEW (< lg): CENTER LOGO ON TOP + HONEYCOMB GRID
            ========================================================================= */}
        <div className="lg:hidden flex flex-col items-center">
          {/* CENTER WABUP CUP LOGO */}
          <div className="relative w-40 h-44 flex items-center justify-center mb-8">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/35 via-orange-500/30 to-indigo-600/40 rounded-full blur-xl pointer-events-none animate-pulse" />
            <svg viewBox="0 0 100 115.47" className="absolute inset-0 w-full h-full filter drop-shadow-xl">
              <defs>
                <linearGradient id="centerMobileFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#120726" />
                  <stop offset="100%" stopColor="#080314" />
                </linearGradient>
                <linearGradient id="centerMobileBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <path d={HEXAGON_PATH} fill="url(#centerMobileFill)" stroke="url(#centerMobileBorder)" strokeWidth="3" />
            </svg>
            <div className="relative z-10 flex flex-col items-center justify-center p-4">
              <img
                src={wabupLogo}
                alt={config.name || 'WabupCup 2026'}
                className="max-w-[76px] max-h-[64px] object-contain filter drop-shadow-md"
              />
              <span className="mt-1 text-[8px] font-mono font-bold text-amber-300 uppercase tracking-widest bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/40">
                OFFICIAL
              </span>
            </div>
          </div>

          {/* MOBILE PARTNERS HONEYCOMB FLEX/GRID */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 max-w-md px-2">
            {partners.slice(0, sponsors.length > 0 ? sponsors.length : 18).map(p => {
              const targetUrl = formatSponsorUrl(p.websiteUrl);

              return (
                <motion.a
                  key={`mobile-${p.id}`}
                  href={targetUrl || '#'}
                  target={targetUrl ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  onClick={e => {
                    if (!targetUrl) e.preventDefault();
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-[84px] h-[97px] sm:w-[96px] sm:h-[111px] flex items-center justify-center m-0.5"
                >
                  <svg viewBox="0 0 100 115.47" className="absolute inset-0 w-full h-full filter drop-shadow-sm">
                    <path d={HEXAGON_PATH} fill="#ffffff" stroke="rgba(226, 232, 240, 0.95)" strokeWidth="1.6" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} className="max-w-[76%] max-h-[58%] object-contain" />
                    ) : (
                      <span className="font-heading font-black text-xs uppercase" style={{ color: p.color || '#0f172a' }}>
                        {p.logoText || p.name}
                      </span>
                    )}
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            MODERN BECOME A SPONSOR CALLOUT BANNER (AJUKAN PROPOSAL VIA WA)
            ========================================================================= */}
        <div className="mt-16 sm:mt-20 relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950 border-2 border-purple-500/40 text-white p-8 sm:p-10 shadow-2xl shadow-purple-950/30 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Ambient Glow */}
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
