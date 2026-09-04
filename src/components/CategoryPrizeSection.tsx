import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { CategoryDetail, TournamentCategory } from '../types';
import { SectionBackground, getSectionTextClass } from './SectionBackground';
import {
  Trophy,
  Award,
  Users,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  CheckCircle2
} from 'lucide-react';

interface CategoryPrizeSectionProps {
  onSelectCategoryToRegister: (category: TournamentCategory) => void;
}

export const CategoryPrizeSection: React.FC<CategoryPrizeSectionProps> = ({
  onSelectCategoryToRegister,
}) => {
  const { categories, config, registrations } = useTournament();
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const toggleExpand = (catId: string) => {
    setExpandedCat(prev => (prev === catId ? null : catId));
  };

  const getCategoryBadgeColor = (id: TournamentCategory) => {
    switch (id) {
      case 'SD':
        return 'from-amber-500 to-orange-600';
      case 'SMP':
        return 'from-blue-600 to-cyan-600';
      case 'SMA':
        return 'from-red-600 to-rose-700';
      case 'INSTANSI':
        return 'from-emerald-600 to-teal-700';
      case 'UMUM':
        return 'from-purple-600 to-indigo-700';
      case 'DESA':
        return 'from-yellow-600 to-amber-700';
      default:
        return 'from-red-600 to-blue-900';
    }
  };

  const bgConfig = config.sectionsBackgrounds?.categories;
  const isCustomImage = bgConfig?.mode === 'IMAGE';
  const isCustomColor = bgConfig?.mode === 'COLOR';

  return (
    <section
      id="kategori"
      className={`py-16 relative overflow-hidden transition-colors duration-300 border-b border-slate-200 dark:border-slate-800 ${
        isCustomColor || isCustomImage ? '' : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
      }`}
      style={isCustomColor && bgConfig.bgColor ? { backgroundColor: bgConfig.bgColor } : undefined}
    >
      {/* CUSTOM SECTION BACKGROUND */}
      <SectionBackground config={bgConfig} />

      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${getSectionTextClass(bgConfig)}`}>
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Trophy className="w-3.5 h-3.5" />
            <span>Perebutan Total Hadiah Rp {config.totalPrizePool.toLocaleString('id-ID')}</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-heading font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
            {categories.length} KATEGORI TURNAMEN & HADIAH
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Pilih kategori tim Anda, lengkapi berkas persyaratan dokumen PDF, dan raih trofi bergilir beserta uang pembinaan.
          </p>
        </div>

        {/* CATEGORIES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => {
            const isExpanded = expandedCat === cat.id;
            const activeRegs = registrations.filter(r => r.category === cat.id && r.status !== 'REJECTED');
            const registeredCount = activeRegs.length;
            const isFull = registeredCount >= cat.maxTeams;
            const remainingSlots = Math.max(0, cat.maxTeams - registeredCount);
            const quotaPercent = Math.min(
              100,
              Math.round((registeredCount / cat.maxTeams) * 100)
            );

            return (
              <div
                key={cat.id}
                id={`category-card-${cat.id}`}
                className="rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-red-500/50 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* CARD TOP BANNER */}
                <div className={`p-5 bg-gradient-to-r ${getCategoryBadgeColor(cat.id)} text-white relative`}>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase border border-white/20">
                      {cat.id} TURNAMEN
                    </span>
                    {isFull ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-red-950/80 text-red-200 border border-red-400/40 text-[11px] font-bold tracking-wider uppercase flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>KUOTA PENUH</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-white/90">
                        Slot: {registeredCount} / {cat.maxTeams} Tim ({remainingSlots} Tersisa)
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-heading font-bold uppercase tracking-wide mt-2 text-white leading-tight">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-white/85 font-medium mt-1">
                    {cat.ageRestriction}
                  </p>
                </div>

                {/* CARD BODY CONTENT */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  
                  {/* TOTAL PRIZE & REGISTRATION FEE */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Hadiah</span>
                      <span className="text-lg font-heading font-bold text-red-600 dark:text-red-400">
                        Rp {cat.totalPrize.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Biaya Registrasi</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        Rp {cat.registrationFee.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* QUOTA BAR */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      <span>Kuota Terisi</span>
                      <span className={isFull ? 'text-red-500 font-bold' : ''}>
                        {isFull ? '100% (Kuota Penuh)' : `${quotaPercent}% (${registeredCount} / ${cat.maxTeams} Tim)`}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? 'bg-red-600'
                            : quotaPercent > 75
                            ? 'bg-gradient-to-r from-amber-500 to-red-600'
                            : 'bg-gradient-to-r from-emerald-500 to-blue-600'
                        }`}
                        style={{ width: `${quotaPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* PRIZES LIST PREVIEW */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Rincian Juara & Hadiah:
                    </span>
                    <div className="space-y-1 text-xs">
                      {cat.prizes.slice(0, 3).map((prz, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60"
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="text-amber-500 text-xs">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {prz.rank}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Rp {prz.prizeMoney.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ACCORDION FOR COMPLETE RULES & ALL PRIZES */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-fadeIn">
                      {/* OTHER PRIZES (MVP, TOP SCORER) */}
                      {cat.prizes.length > 3 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Penghargaan Individu</span>
                          {cat.prizes.slice(3).map((prz, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-white dark:bg-slate-950/40"
                            >
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                ⭐ {prz.rank}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                Rp {prz.prizeMoney.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* RULES LIST */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Ketentuan & Syarat</span>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                          {cat.rules.map((rule, idx) => (
                            <li key={idx} className="leading-tight">{rule}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* TOGGLE DETAILS BUTTON */}
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="w-full text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 py-1 flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Sembunyikan Rincian' : 'Lihat Syarat & Hadiah Lengkap'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* ACTION REGISTER BUTTON */}
                  {isFull ? (
                    <button
                      id={`btn-register-category-${cat.id}`}
                      disabled
                      className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center space-x-2 border border-slate-300 dark:border-slate-700"
                    >
                      <Lock className="w-4 h-4 text-amber-500" />
                      <span>Kuota Tim {cat.id} Penuh (Ditutup)</span>
                    </button>
                  ) : (
                    <button
                      id={`btn-register-category-${cat.id}`}
                      onClick={() => onSelectCategoryToRegister(cat.id)}
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-red-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>Daftarkan Tim {cat.id}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
