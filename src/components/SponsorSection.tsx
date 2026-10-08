import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { SponsorItem, SponsorTier } from '../types';
import { SectionBackground, getSectionTextClass } from './SectionBackground';
import {
  Users,
  ExternalLink,
  Handshake,
  Sparkles,
  Award,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Instagram,
  Globe
} from 'lucide-react';

/**
 * Normalisasi URL sponsor (Website atau Instagram):
 * - Jika berupa handle IG (misal '@persib' atau 'persib'): diubah ke https://instagram.com/persib
 * - Jika berupa domain tanpa protokol (misal 'instagram.com/persib' atau 'sponsor.com'): ditambahkan https://
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
// ViewBox: 0 0 100 115.47 (Rasio lebar:tinggi presisi 1 : 1.1547)
const HEXAGON_PATH =
  'M 43.07 5.00 Q 50.00 1.00 56.93 5.00 L 92.07 25.30 Q 99.00 29.30 99.00 37.30 L 99.00 78.10 Q 99.00 86.10 92.07 90.10 L 56.93 110.40 Q 50.00 114.40 43.07 110.40 L 7.93 90.10 Q 1.00 86.10 1.00 78.10 L 1.00 37.30 Q 1.00 29.30 7.93 25.30 Z';

interface HexagonSponsorCardProps {
  sponsor: SponsorItem;
  imageError?: boolean;
  onImageError?: () => void;
}

const HexagonSponsorCard: React.FC<HexagonSponsorCardProps> = ({
  sponsor,
  imageError,
  onImageError,
}) => {
  const hasValidImage = sponsor.logoUrl && !imageError;
  const finalUrl = formatSponsorUrl(sponsor.websiteUrl);
  const hasLink = Boolean(finalUrl);
  const isInstagram = finalUrl.toLowerCase().includes('instagram.com');

  const tierBorderColors: Record<SponsorTier, string> = {
    PLATINUM: '#ef4444',
    GOLD: '#f59e0b',
    SILVER: '#94a3b8',
    OFFICIAL_PARTNER: '#3b82f6',
  };

  const tierBadgeGradients: Record<SponsorTier, string> = {
    PLATINUM: 'bg-red-600 text-white',
    GOLD: 'bg-amber-500 text-slate-950 font-black',
    SILVER: 'bg-slate-700 text-white',
    OFFICIAL_PARTNER: 'bg-blue-600 text-white',
  };

  const cardContent = (
    <div
      className={`relative group w-[90px] h-[104px] sm:w-[104px] sm:h-[120px] lg:w-[114px] lg:h-[132px] flex items-center justify-center transition-all duration-300 transform-gpu hover:scale-110 hover:-translate-y-1 hover:z-40 ${
        hasLink ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* SVG BACKGROUND SHAPE (White Hexagon with soft shadow) */}
      <svg
        viewBox="0 0 100 115.47"
        className="absolute inset-0 w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.08)] group-hover:drop-shadow-[0_12px_20px_rgba(0,0,0,0.18)] transition-all duration-300"
      >
        <path
          d={HEXAGON_PATH}
          className="fill-white transition-colors duration-300"
          stroke="rgba(226, 232, 240, 0.95)"
          strokeWidth="1.6"
        />
        {/* Highlight border on hover with Tier color */}
        <path
          d={HEXAGON_PATH}
          fill="none"
          stroke={tierBorderColors[sponsor.tier] || '#ef4444'}
          strokeWidth="2.5"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
      </svg>

      {/* CONTENT LAYER (Centered inside hexagon) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3.5 sm:p-4 z-10 select-none pointer-events-none">
        {hasValidImage ? (
          <img
            src={sponsor.logoUrl}
            alt={`Logo ${sponsor.name}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={onImageError}
            className="max-w-[76%] max-h-[58%] w-auto h-auto object-contain object-center filter drop-shadow-sm transition-transform duration-300 group-hover:scale-108"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-1">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-xs flex items-center justify-center shadow-sm mb-1">
              {(sponsor.logoText || sponsor.name).slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 leading-tight line-clamp-1 max-w-[72px]">
              {sponsor.logoText || sponsor.name}
            </span>
          </div>
        )}
      </div>

      {/* FLOATING HOVER TOOLTIP */}
      <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform scale-95 group-hover:scale-100 whitespace-nowrap shadow-xl">
        <div className="bg-slate-900/95 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700/80 backdrop-blur-md flex flex-col items-center space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <span>{sponsor.name}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${tierBadgeGradients[sponsor.tier]}`}>
              {sponsor.tier}
            </span>
          </div>
          {hasLink && (
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
      </div>
    </div>
  );

  if (hasLink) {
    return (
      <a
        href={finalUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Buka ${isInstagram ? 'Instagram' : 'Website'} ${sponsor.name}`}
        className="block no-underline"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

interface HexagonCenterPieceProps {
  logoUrl?: string;
  tournamentName?: string;
  tagline?: string;
}

const HexagonCenterPiece: React.FC<HexagonCenterPieceProps> = ({
  logoUrl,
  tournamentName = 'WabupCup 2026',
}) => {
  const finalLogo = logoUrl || '/wabup-cup-logo.svg';

  return (
    <div className="relative group w-[160px] h-[184px] sm:w-[190px] sm:h-[220px] lg:w-[220px] lg:h-[254px] flex items-center justify-center shrink-0 z-20">
      {/* AMBIENT GLOW EFFECT (Warm Amber / Red / Violet Aura) */}
      <div className="absolute inset-2 bg-gradient-to-tr from-red-600/35 via-amber-500/30 to-purple-600/35 blur-2xl rounded-full pointer-events-none group-hover:blur-3xl transition-all duration-500" />
      <div className="absolute -bottom-4 w-3/4 h-8 bg-amber-500/25 blur-xl rounded-full pointer-events-none" />

      {/* SVG CENTER HEXAGON SHAPE (Dark Gradient with Glowing Accent Border) */}
      <svg
        viewBox="0 0 100 115.47"
        className="absolute inset-0 w-full h-full filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:scale-102"
      >
        <defs>
          <linearGradient id="centerHexFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b0f19" />
            <stop offset="50%" stopColor="#151226" />
            <stop offset="100%" stopColor="#090a10" />
          </linearGradient>

          <linearGradient id="centerHexBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <path
          d={HEXAGON_PATH}
          fill="url(#centerHexFill)"
          stroke="url(#centerHexBorder)"
          strokeWidth="2.8"
        />

        {/* Inner subtle rim light */}
        <path
          d={HEXAGON_PATH}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1"
          transform="scale(0.96) translate(2, 2.3)"
        />
      </svg>

      {/* CENTER CONTENT: LOGO WABUP CUP DARI PENGATURAN INFORMASI DAN LOGO */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-7 z-10 select-none pointer-events-none">
        <img
          src={finalLogo}
          alt={`Logo ${tournamentName}`}
          className="max-w-[78%] max-h-[64%] w-auto h-auto object-contain object-center filter drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* SUBTLE BRAND BADGE */}
        <div className="mt-2 px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/40 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 shadow-sm backdrop-blur-sm">
          OFFICIAL TURNAMEN
        </div>
      </div>
    </div>
  );
};

export const SponsorSection: React.FC = () => {
  const { sponsors, config, committeeContacts, isInitialLoading } = useTournament();
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

  // Logo turnamen sesuai pengaturan informasi dan logo (admin CMS)
  const wabupLogo = config.wabupLogoUrl || '/wabup-cup-logo.svg';

  // Membagi sponsor menjadi 2 sisi (kiri dan kanan)
  const halfCount = Math.ceil(sponsors.length / 2);
  const leftSponsors = sponsors.slice(0, halfCount);
  const rightSponsors = sponsors.slice(halfCount);

  // Helper untuk membagi array sponsor menjadi 3 baris honeycomb
  const splitIntoRows = (items: SponsorItem[]) => {
    const row1: SponsorItem[] = [];
    const row2: SponsorItem[] = [];
    const row3: SponsorItem[] = [];

    items.forEach((item, index) => {
      const mod = index % 3;
      if (mod === 0) row1.push(item);
      else if (mod === 1) row2.push(item);
      else row3.push(item);
    });

    return { row1, row2, row3 };
  };

  const leftRows = splitIntoRows(leftSponsors);
  const rightRows = splitIntoRows(rightSponsors);

  return (
    <section
      id="sponsor"
      className={`scroll-mt-24 py-20 relative overflow-hidden transition-colors duration-300 border-b border-slate-200 dark:border-slate-800/80 ${
        isCustomColor || isCustomImage ? '' : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
      }`}
      style={isCustomColor && bgConfig.bgColor ? { backgroundColor: bgConfig.bgColor } : undefined}
    >
      {/* CUSTOM SECTION BACKGROUND */}
      <SectionBackground config={bgConfig} />

      {/* BACKGROUND AMBIENT GLOW */}
      {(!bgConfig || bgConfig.mode === 'DEFAULT') && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-gradient-to-r from-red-600/10 via-amber-500/10 to-blue-600/10 blur-3xl pointer-events-none rounded-full" />
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${getSectionTextClass(bgConfig)}`}>
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-500/10 dark:bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Kemitraan & Kolaborasi Resmi</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-heading font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
            SPONSOR & OFFICIAL PARTNER
          </h2>
          
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Apresiasi dan penghormatan tertinggi kepada institusi, korporasi, dan mitra media yang menyatukan semangat dalam mewujudkan pesta olahraga futsal terbesar.
          </p>
        </div>

        {/* SPONSOR SHOWCASE CONTAINER */}
        {isInitialLoading && sponsors.length === 0 ? (
          <div className="space-y-6 text-center py-12">
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span>Menyinkronkan daftar mitra & sponsor resmi dari database...</span>
            </div>
          </div>
        ) : (
          <div className="relative py-6 sm:py-10">
            
            {/* DESKTOP & TABLET VIEW: DUAL HONEYCOMB CLUSTERS + CENTER LOGO (LAYOUT SEPERTI GAMBAR) */}
            <div className="hidden md:flex items-center justify-center gap-2 lg:gap-4 select-none">
              
              {/* LEFT HONEYCOMB CLUSTER */}
              <div className="flex flex-col items-end">
                {/* ROW 1 (TOP) */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {leftRows.row1.map(sp => (
                    <HexagonSponsorCard
                      key={sp.id}
                      sponsor={sp}
                      imageError={imageErrors[sp.id]}
                      onImageError={() => handleImageError(sp.id)}
                    />
                  ))}
                  {leftRows.row1.length === 0 && (
                    <div className="w-[104px] h-[120px]" />
                  )}
                </div>

                {/* ROW 2 (MIDDLE, STAGGERED OFFSET KE KIRI) */}
                <div className="flex items-center gap-2 sm:gap-3 -mt-5 sm:-mt-6 -mr-10 sm:-mr-12">
                  {leftRows.row2.map(sp => (
                    <HexagonSponsorCard
                      key={sp.id}
                      sponsor={sp}
                      imageError={imageErrors[sp.id]}
                      onImageError={() => handleImageError(sp.id)}
                    />
                  ))}
                </div>

                {/* ROW 3 (BOTTOM, ALIGNED WITH ROW 1) */}
                <div className="flex items-center gap-2 sm:gap-3 -mt-5 sm:-mt-6">
                  {leftRows.row3.map(sp => (
                    <HexagonSponsorCard
                      key={sp.id}
                      sponsor={sp}
                      imageError={imageErrors[sp.id]}
                      onImageError={() => handleImageError(sp.id)}
                    />
                  ))}
                </div>
              </div>

              {/* CENTER LARGE HEXAGON (LOGO WABUP CUP DARI PENGATURAN INFORMASI DAN LOGO) */}
              <div className="px-2 lg:px-4 shrink-0">
                <HexagonCenterPiece
                  logoUrl={wabupLogo}
                  tournamentName={config.name || 'WabupCup 2026'}
                  tagline={config.tagline}
                />
              </div>

              {/* RIGHT HONEYCOMB CLUSTER */}
              <div className="flex flex-col items-start">
                {/* ROW 1 (TOP) */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {rightRows.row1.map(sp => (
                    <HexagonSponsorCard
                      key={sp.id}
                      sponsor={sp}
                      imageError={imageErrors[sp.id]}
                      onImageError={() => handleImageError(sp.id)}
                    />
                  ))}
                  {rightRows.row1.length === 0 && (
                    <div className="w-[104px] h-[120px]" />
                  )}
                </div>

                {/* ROW 2 (MIDDLE, STAGGERED OFFSET KE KANAN) */}
                <div className="flex items-center gap-2 sm:gap-3 -mt-5 sm:-mt-6 -ml-10 sm:-ml-12">
                  {rightRows.row2.map(sp => (
                    <HexagonSponsorCard
                      key={sp.id}
                      sponsor={sp}
                      imageError={imageErrors[sp.id]}
                      onImageError={() => handleImageError(sp.id)}
                    />
                  ))}
                </div>

                {/* ROW 3 (BOTTOM, ALIGNED WITH ROW 1) */}
                <div className="flex items-center gap-2 sm:gap-3 -mt-5 sm:-mt-6">
                  {rightRows.row3.map(sp => (
                    <HexagonSponsorCard
                      key={sp.id}
                      sponsor={sp}
                      imageError={imageErrors[sp.id]}
                      onImageError={() => handleImageError(sp.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* MOBILE VIEW (< md): CENTER LOGO ON TOP, HONEYCOMB SPONSORS WRAPPED BELOW */}
            <div className="flex md:hidden flex-col items-center">
              {/* TOP CENTER LOGO */}
              <div className="mb-6">
                <HexagonCenterPiece
                  logoUrl={wabupLogo}
                  tournamentName={config.name || 'WabupCup 2026'}
                  tagline={config.tagline}
                />
              </div>

              {/* HONEYCOMB GRID FOR MOBILE */}
              {sponsors.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 max-w-sm px-2">
                  {sponsors.map(sp => (
                    <div key={sp.id} className="m-0.5">
                      <HexagonSponsorCard
                        sponsor={sp}
                        imageError={imageErrors[sp.id]}
                        onImageError={() => handleImageError(sp.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Slot kemitraan sponsor turnamen masih terbuka.
                </p>
              )}
            </div>

            {/* STATUS JIKA BELUM ADA SPONSOR */}
            {sponsors.length === 0 && (
              <div className="mt-8 text-center max-w-md mx-auto p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Daftar mitra sponsor resmi akan tampil di panel heksagon ini secara real-time. Hubungi panitia untuk bergabung sebagai sponsor resmi.
                </p>
              </div>
            )}
          </div>
        )}

        {/* MODERN BECOME A SPONSOR CALLOUT BANNER */}
        <div className="mt-16 relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 border-2 border-red-600/40 text-white p-8 sm:p-10 shadow-2xl shadow-red-950/30 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* BACKGROUND SHAPES */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/50 text-red-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Peluang Kerjasama Sponsorship 2026</span>
            </div>
            
            <h3 className="text-2xl sm:text-4xl font-heading font-extrabold uppercase tracking-tight text-white">
              TERTARIK MENJADI MITRA RESMI WABUPCUP?
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tingkatkan visibilitas brand Anda di hadapan puluhan ribu suporter & futsal secara langsung di stadion serta jutaan impresi media sosial dan liputan siaran resmi turnamen.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
                `Halo Panitia ${config.name || 'WabupCup 2026'}, perkenankan kami dari perusahaan/instansi ingin mengajukan proposal kerjasama sponsorship turnamen.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-900/50 transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-105 active:scale-95"
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
