import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { MatchItem, TournamentCategory } from '../types';
import {
  Trophy,
  Calendar,
  Layers,
  Flame,
  Clock,
  MapPin,
  CheckCircle,
  Activity,
  ArrowRight,
  Shield
} from 'lucide-react';

export const ScheduleBracketSection: React.FC = () => {
  const { matches, categories } = useTournament();
  const [selectedCat, setSelectedCat] = useState<TournamentCategory>('SMA');
  const [viewMode, setViewMode] = useState<'BRACKET' | 'TABLE'>('BRACKET');

  const catMatches = matches.filter(m => m.category === selectedCat);

  // Group matches by round for bracket representation
  const round16Matches = catMatches.filter(m => m.round.includes('16 Besar'));
  const quarterMatches = catMatches.filter(m => m.round.includes('Perempat') || m.round.includes('8 Besar'));
  const semiMatches = catMatches.filter(m => m.round.includes('Semifinal'));
  const finalMatches = catMatches.filter(m => m.round.includes('Final') && !m.round.includes('Perempat') && !m.round.includes('Semi'));

  // Synthetic bracket generation if empty for a newly switched category
  const displayQuarters = quarterMatches.length > 0 ? quarterMatches : [
    {
      id: 'q1',
      matchNumber: 1,
      category: selectedCat,
      round: 'Perempat Final 1',
      roundIndex: 3,
      teamA: { name: `Tim Juara Grup A (${selectedCat})`, score: 3 },
      teamB: { name: `Runner-up Grup B (${selectedCat})`, score: 1 },
      date: '2026-10-27',
      time: '08:30',
      pitch: 'Lapangan 1',
      status: 'FINISHED',
      winnerId: 'A',
    },
    {
      id: 'q2',
      matchNumber: 2,
      category: selectedCat,
      round: 'Perempat Final 2',
      roundIndex: 3,
      teamA: { name: `Tim Juara Grup C (${selectedCat})`, score: 2 },
      teamB: { name: `Runner-up Grup D (${selectedCat})`, score: 0 },
      date: '2026-10-27',
      time: '10:00',
      pitch: 'Lapangan 1',
      status: 'FINISHED',
      winnerId: 'A',
    },
    {
      id: 'q3',
      matchNumber: 3,
      category: selectedCat,
      round: 'Perempat Final 3',
      roundIndex: 3,
      teamA: { name: `Tim Juara Grup B (${selectedCat})`, score: 1 },
      teamB: { name: `Runner-up Grup A (${selectedCat})`, score: 2 },
      date: '2026-10-27',
      time: '13:30',
      pitch: 'Lapangan 1',
      status: 'FINISHED',
      winnerId: 'B',
    },
    {
      id: 'q4',
      matchNumber: 4,
      category: selectedCat,
      round: 'Perempat Final 4',
      roundIndex: 3,
      teamA: { name: `Tim Juara Grup D (${selectedCat})`, score: 4 },
      teamB: { name: `Runner-up Grup C (${selectedCat})`, score: 3 },
      date: '2026-10-27',
      time: '15:00',
      pitch: 'Lapangan 1',
      status: 'FINISHED',
      winnerId: 'A',
    },
  ];

  const displaySemis = semiMatches.length > 0 ? semiMatches : [
    {
      id: 's1',
      matchNumber: 5,
      category: selectedCat,
      round: 'Semifinal 1',
      roundIndex: 4,
      teamA: { name: `Pemenang QF 1`, score: 3 },
      teamB: { name: `Pemenang QF 2`, score: 2 },
      date: '2026-10-29',
      time: '16:00',
      pitch: 'Lapangan Utama',
      status: 'LIVE',
      liveMinute: "38'",
    },
    {
      id: 's2',
      matchNumber: 6,
      category: selectedCat,
      round: 'Semifinal 2',
      roundIndex: 4,
      teamA: { name: `Pemenang QF 3`, score: undefined },
      teamB: { name: `Pemenang QF 4`, score: undefined },
      date: '2026-10-29',
      time: '19:30',
      pitch: 'Lapangan Utama',
      status: 'UPCOMING' as const,
    },
  ];

  const displayFinals = finalMatches.length > 0 ? finalMatches : [
    {
      id: 'f1',
      matchNumber: 7,
      category: selectedCat,
      round: 'GRAND FINAL WABUP CUP 2026',
      roundIndex: 5,
      teamA: { name: `Finalis Semifinal 1`, score: undefined },
      teamB: { name: `Finalis Semifinal 2`, score: undefined },
      date: '2026-11-01',
      time: '19:00',
      pitch: 'Stadion Utama Gelora Wijaya',
      status: 'UPCOMING' as const,
    },
  ];

  return (
    <section id="bagan" className="py-16 bg-slate-900/40 dark:bg-slate-900/40 bg-white border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Sistem Bagan Knockout & Jadwal Resmi</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              BAGAN BRACKET & JADWAL PERTANDINGAN
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Bagan gugur otomatis diperbarui secara real-time dari hasil pertandingan resmi.
            </p>
          </div>

          {/* VIEW SWITCHER */}
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-slate-200 dark:bg-slate-950 rounded-xl border border-slate-300 dark:border-slate-800 flex">
              <button
                onClick={() => setViewMode('BRACKET')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  viewMode === 'BRACKET'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Bagan Bracket Visual</span>
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  viewMode === 'TABLE'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Tabel Jadwal Lengkap</span>
              </button>
            </div>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none border-b border-slate-200 dark:border-slate-800">
          {(['SD', 'SMP', 'SMA', 'INSTANSI', 'UMUM', 'DESA'] as TournamentCategory[]).map(catKey => {
            const isSel = selectedCat === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCat(catKey)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition shrink-0 flex items-center space-x-2 ${
                  isSel
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>⚽ {catKey}</span>
              </button>
            );
          })}
        </div>

        {/* VIEW 1: INTERACTIVE TOURNAMENT BRACKET */}
        {viewMode === 'BRACKET' && (
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 lg:p-8 overflow-x-auto shadow-2xl">
            <div className="min-w-[900px]">
              
              {/* ROUND HEADERS */}
              <div className="grid grid-cols-3 gap-8 mb-6 text-center">
                <div className="py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  🏟️ Perempat Final (8 Besar)
                </div>
                <div className="py-2 rounded-xl bg-blue-950/80 border border-blue-800/80 text-xs font-bold text-blue-300 uppercase tracking-wider">
                  🔥 Semifinal
                </div>
                <div className="py-2 rounded-xl bg-red-950/80 border border-red-800/80 text-xs font-bold text-red-300 uppercase tracking-wider">
                  🏆 Grand Final & Juara
                </div>
              </div>

              {/* BRACKET COLUMNS GRID */}
              <div className="grid grid-cols-3 gap-8 items-center">
                
                {/* COLUMN 1: QUARTER FINALS (4 MATCHES) */}
                <div className="space-y-6">
                  {displayQuarters.slice(0, 4).map((qf, i) => (
                    <div
                      key={qf.id || i}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-slate-800 mb-2">
                        <span>Match #{qf.matchNumber || i + 1}</span>
                        <span>{qf.time || '09:00'} WIB</span>
                      </div>

                      {/* Team A */}
                      <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-950/60 mb-1">
                        <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                          {qf.teamA.name}
                        </span>
                        <span className="text-xs font-bold text-slate-300 font-mono">
                          {qf.teamA.score ?? '-'}
                        </span>
                      </div>

                      {/* Team B */}
                      <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-950/60">
                        <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                          {qf.teamB.name}
                        </span>
                        <span className="text-xs font-bold text-slate-300 font-mono">
                          {qf.teamB.score ?? '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* COLUMN 2: SEMIFINALS (2 MATCHES) */}
                <div className="space-y-16">
                  {displaySemis.slice(0, 2).map((sf, i) => {
                    const isLive = sf.status === 'LIVE';
                    return (
                      <div
                        key={sf.id || i}
                        className={`rounded-xl p-4 shadow-xl transition ${
                          isLive
                            ? 'bg-gradient-to-br from-slate-900 to-red-950 border-2 border-red-500'
                            : 'bg-slate-900/90 border border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800 mb-2.5">
                          <span className="font-bold text-blue-400">{sf.round}</span>
                          {isLive ? (
                            <span className="text-red-400 font-bold animate-pulse">🔴 LIVE {sf.liveMinute}</span>
                          ) : (
                            <span>{sf.date}</span>
                          )}
                        </div>

                        {/* Team A */}
                        <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-950/80 mb-1.5">
                          <span className="text-xs font-bold text-white truncate max-w-[160px]">
                            {sf.teamA.name}
                          </span>
                          <span className="text-sm font-bold text-red-400 font-mono">
                            {sf.teamA.score ?? '-'}
                          </span>
                        </div>

                        {/* Team B */}
                        <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-950/80">
                          <span className="text-xs font-bold text-white truncate max-w-[160px]">
                            {sf.teamB.name}
                          </span>
                          <span className="text-sm font-bold text-blue-400 font-mono">
                            {sf.teamB.score ?? '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* COLUMN 3: GRAND FINAL */}
                <div className="space-y-6">
                  {displayFinals.slice(0, 1).map((fn, i) => (
                    <div
                      key={fn.id || i}
                      className="bg-gradient-to-b from-slate-900 via-red-950/50 to-slate-900 border-2 border-red-500/80 rounded-2xl p-5 shadow-2xl text-center relative overflow-hidden"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 mx-auto flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
                        🏆
                      </div>

                      <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 block mb-1">
                        PARTAI PUNCAK FINAL
                      </span>
                      <h4 className="text-base font-bold text-white mb-4">
                        Kategori {selectedCat} 2026
                      </h4>

                      <div className="space-y-2 text-left mb-4">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                          <span className="text-xs font-bold text-white">{fn.teamA.name}</span>
                          <span className="text-sm font-bold text-amber-400">{fn.teamA.score ?? '-'}</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                          <span className="text-xs font-bold text-white">{fn.teamB.name}</span>
                          <span className="text-sm font-bold text-amber-400">{fn.teamB.score ?? '-'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>{fn.pitch || 'Stadion Utama Gelora Wijaya'}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: FULL SCHEDULE TABLE */}
        {viewMode === 'TABLE' && (
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-4">No.</th>
                    <th className="py-3.5 px-4">Babak</th>
                    <th className="py-3.5 px-4">Pertandingan (Tim A vs Tim B)</th>
                    <th className="py-3.5 px-4">Tanggal & Waktu</th>
                    <th className="py-3.5 px-4">Venue Lapangan</th>
                    <th className="py-3.5 px-4">Skor / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {catMatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        Belum ada jadwal tersimpan untuk kategori {selectedCat}. Anda dapat menggunakan fitur Drawing Acak Otomatis di CMS Admin.
                      </td>
                    </tr>
                  ) : (
                    catMatches.map((m, idx) => (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {m.round}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {m.teamA.name} <span className="text-red-500 font-normal">vs</span> {m.teamB.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {m.teamA.institution || '-'} vs {m.teamB.institution || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {m.date} • <strong className="text-red-600 dark:text-red-400">{m.time} WIB</strong>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {m.pitch}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {m.status === 'LIVE' && (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold border border-red-300 dark:border-red-800 animate-pulse">
                              LIVE {m.teamA.score ?? 0} - {m.teamB.score ?? 0} ({m.liveMinute})
                            </span>
                          )}
                          {m.status === 'FINISHED' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                              FT {m.teamA.score ?? 0} - {m.teamB.score ?? 0}
                            </span>
                          )}
                          {m.status === 'UPCOMING' && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-800">
                              Akan Datang
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
