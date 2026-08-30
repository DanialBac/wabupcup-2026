import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { SponsorItem, SponsorTier } from '../types';
import { Users, ExternalLink, Handshake, Globe, Image as ImageIcon } from 'lucide-react';

export const SponsorSection: React.FC = () => {
  const { sponsors, config } = useTournament();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const tiers: { tier: SponsorTier; title: string; badgeStyle: string; cardStyle: string }[] = [
    {
      tier: 'PLATINUM',
      title: '🌟 Platinum Main Sponsors',
      badgeStyle: 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm',
      cardStyle: 'bg-white dark:bg-slate-900/90 border-red-500/30 hover:border-red-500 dark:border-red-500/40 shadow-md hover:shadow-xl',
    },
    {
      tier: 'GOLD',
      title: '🥇 Gold Official Partners',
      badgeStyle: 'bg-amber-500 text-slate-950 font-bold',
      cardStyle: 'bg-white dark:bg-slate-900/90 border-amber-400/30 hover:border-amber-400 dark:border-amber-400/40 shadow-sm hover:shadow-md',
    },
    {
      tier: 'SILVER',
      title: '🥈 Silver Partners',
      badgeStyle: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold',
      cardStyle: 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md',
    },
    {
      tier: 'OFFICIAL_PARTNER',
      title: '🤝 Media & Medical Partners',
      badgeStyle: 'bg-blue-600 text-white',
      cardStyle: 'bg-white dark:bg-slate-900/90 border-blue-400/30 hover:border-blue-500 dark:border-blue-500/30 shadow-sm hover:shadow-md',
    },
  ];

  return (
    <section id="sponsor" className="py-16 bg-slate-50 dark:bg-slate-900/30 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Kemitraan & Kolaborasi Strategis</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-heading font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
            SPONSOR & MEDIA PARTNER
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Apresiasi dan terima kasih kepada seluruh sponsor resmi dan mitra kolaborasi yang menyukseskan gelaran turnamen akbar WabupCup 2026.
          </p>
        </div>

        {/* TIERS DISPLAY */}
        <div className="space-y-12">
          {tiers.map(t => {
            const tierSponsors = sponsors.filter(s => s.tier === t.tier);
            if (tierSponsors.length === 0) return null;

            return (
              <div key={t.tier} className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${t.badgeStyle}`}>
                    {t.title}
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {tierSponsors.map(sponsor => {
                    const hasValidImage = sponsor.logoUrl && !imageErrors[sponsor.id];
                    const hasLink = Boolean(sponsor.websiteUrl);

                    return (
                      <div
                        key={sponsor.id}
                        className={`group relative p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${t.cardStyle}`}
                      >
                        <div>
                          {/* LOGO CONTAINER */}
                          <div className="relative mb-4 flex items-center justify-between">
                            <div className="w-full h-24 sm:h-28 rounded-xl bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-3.5 overflow-hidden group-hover:border-red-500/50 shadow-inner transition">
                              {hasValidImage ? (
                                <img
                                  src={sponsor.logoUrl}
                                  alt={`Logo ${sponsor.name}`}
                                  referrerPolicy="no-referrer"
                                  onError={() => handleImageError(sponsor.id)}
                                  className="w-full h-full object-contain object-center filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center space-y-1">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-blue-700 flex items-center justify-center font-bold text-lg text-white shadow-md">
                                    {(sponsor.logoText || sponsor.name).slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-heading font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-200 text-center truncate max-w-[180px]">
                                    {sponsor.logoText || sponsor.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* DETAILS */}
                          <div className="space-y-1">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                              {sponsor.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {sponsor.description || 'Mitra Resmi Turnamen'}
                            </p>
                          </div>
                        </div>

                        {/* WEBSITE ACTION LINK */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          {hasLink ? (
                            <a
                              href={sponsor.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-red-600 dark:hover:text-red-400 transition"
                              title={`Kunjungi ${sponsor.websiteUrl}`}
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[170px]">
                                {sponsor.websiteUrl?.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                              </span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                              Official Partner
                            </span>
                          )}

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {sponsor.tier}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* BECOME A SPONSOR CALLOUT */}
        <div className="mt-14 p-8 rounded-2xl bg-gradient-to-r from-red-900/50 via-slate-900 to-blue-900/50 border border-red-600/30 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-2xl font-heading font-bold uppercase tracking-wider text-white">
              Tertarik Menjadi Mitra Sponsor WabupCup 2026?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Dapatkan eksposur ribuan penonton langsung di stadion utama dan puluhan ribu pemirsa siaran langsung live streaming daerah.
            </p>
          </div>

          <a
            href={`https://wa.me/${config.adminContactPhone}?text=${encodeURIComponent(
              'Halo Panitia WabupCup 2026, perusahaan/instansi kami tertarik untuk mengajukan proposal kerjasama sponsorship.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-900/40 transition shrink-0 flex items-center space-x-2 cursor-pointer"
          >
            <Handshake className="w-4 h-4" />
            <span>Ajukan Proposal Sponsor</span>
          </a>
        </div>

      </div>
    </section>
  );
};

