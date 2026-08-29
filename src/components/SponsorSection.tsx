import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { SponsorItem, SponsorTier } from '../types';
import { Users, Award, ExternalLink, Sparkles, Handshake } from 'lucide-react';

export const SponsorSection: React.FC = () => {
  const { sponsors, config } = useTournament();

  const tiers: { tier: SponsorTier; title: string; badgeStyle: string; cardStyle: string }[] = [
    {
      tier: 'PLATINUM',
      title: '🌟 Platinum Main Sponsors',
      badgeStyle: 'bg-red-600 text-white',
      cardStyle: 'bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/40 border-red-500/40',
    },
    {
      tier: 'GOLD',
      title: '🥇 Gold Official Partners',
      badgeStyle: 'bg-amber-500 text-slate-950 font-bold',
      cardStyle: 'bg-white dark:bg-slate-900 border-amber-400/40',
    },
    {
      tier: 'SILVER',
      title: '🥈 Silver Partners',
      badgeStyle: 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white',
      cardStyle: 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800',
    },
    {
      tier: 'OFFICIAL_PARTNER',
      title: '🤝 Media & Medical Partners',
      badgeStyle: 'bg-blue-600 text-white',
      cardStyle: 'bg-white dark:bg-slate-900 border-blue-500/30',
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
            Terima kasih kepada seluruh sponsor dan mitra resmi yang mendukung terselenggaranya WabupCup 2026.
          </p>
        </div>

        {/* TIERS DISPLAY */}
        <div className="space-y-10">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {tierSponsors.map(sponsor => (
                    <div
                      key={sponsor.id}
                      className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${t.cardStyle}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700">
                          {sponsor.logoText.slice(0, 2).toUpperCase()}
                        </div>
                        {sponsor.websiteUrl && (
                          <a
                            href={sponsor.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-red-500 transition"
                            title="Kunjungi Website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                          {sponsor.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {sponsor.description || 'Mitra Resmi Turnamen'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* BECOME A SPONSOR CALLOUT */}
        <div className="mt-14 p-8 rounded-2xl bg-gradient-to-r from-red-900/40 via-slate-900 to-blue-900/40 border border-red-600/30 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-2xl font-heading font-bold uppercase tracking-wider text-white">
              Tertarik Menjadi Mitra Sponsor WabupCup 2026?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Dapatkan eksposur ribuan audiens langsung di stadion dan puluhan ribu pemirsa siaran langsung live streaming daerah.
            </p>
          </div>

          <a
            href={`https://wa.me/${config.adminContactPhone}?text=${encodeURIComponent(
              'Halo Panitia WabupCup 2026, perusahaan/instansi kami tertarik untuk mengajukan proposal kerjasama sponsorship.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-900/40 transition shrink-0 flex items-center space-x-2"
          >
            <Handshake className="w-4 h-4" />
            <span>Ajukan Proposal Sponsor</span>
          </a>
        </div>

      </div>
    </section>
  );
};
