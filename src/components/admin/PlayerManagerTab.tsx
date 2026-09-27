import React, { useState, useMemo, useRef } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerItem, TournamentCategory } from '../../types';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  Search,
  FileSpreadsheet,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Layers,
  RefreshCw,
  X
} from 'lucide-react';

export const PlayerManagerTab: React.FC = () => {
  const {
    players,
    savePlayer,
    batchImportPlayers,
    deletePlayer,
    refreshPlayers,
    registrations,
    categories,
  } = useTournament();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Partial<PlayerItem> | null>(null);

  // Delete Confirmation Modal state (replaces native window.confirm blocked in iframe)
  const [playerToDelete, setPlayerToDelete] = useState<{ id: string; name: string; teamName?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unique registered teams for dropdown
  const registeredTeams = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach(r => {
      if (r.teamName) set.add(r.teamName.trim());
    });
    return Array.from(set).sort();
  }, [registrations]);

  // Filtered player list
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      if (selectedTeamFilter !== 'ALL' && p.teamName !== selectedTeamFilter) return false;
      if (selectedCatFilter !== 'ALL' && p.category !== selectedCatFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchTeam = p.teamName.toLowerCase().includes(q);
        const matchPos = p.position ? p.position.toLowerCase().includes(q) : false;
        return matchName || matchTeam || matchPos;
      }
      return true;
    });
  }, [players, selectedTeamFilter, selectedCatFilter, searchQuery]);

  // Overall player metrics
  const totalGoals = useMemo(() => players.reduce((sum, p) => sum + (p.goals || 0), 0), [players]);
  const totalYellows = useMemo(() => players.reduce((sum, p) => sum + (p.yellowCards || 0), 0), [players]);
  const totalReds = useMemo(() => players.reduce((sum, p) => sum + (p.redCards || 0), 0), [players]);

  // Download Sample Format Excel
  const handleDownloadSampleExcel = async () => {
    const sampleRows = [
      {
        'Nama Pemain': 'Budi Pratama',
        'Nomor Punggung': 10,
        'Posisi': 'Pivot',
        'Nama Tim': registeredTeams[0] || 'SMAN 1 Garut',
      },
      {
        'Nama Pemain': 'Andi Kurniawan',
        'Nomor Punggung': 7,
        'Posisi': 'Flank',
        'Nama Tim': registeredTeams[0] || 'SMAN 1 Garut',
      },
      {
        'Nama Pemain': 'Rizky Wijaya',
        'Nomor Punggung': 1,
        'Posisi': 'Kiper',
        'Nama Tim': registeredTeams[1] || 'SMAN 2 Garut',
      },
      {
        'Nama Pemain': 'Dedi Suhendar',
        'Nomor Punggung': 4,
        'Posisi': 'Anchor',
        'Nama Tim': registeredTeams[1] || 'SMAN 2 Garut',
      },
    ];

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Format_Pemain');
    XLSX.writeFile(wb, 'Format_Import_Pemain_WabupCup.xlsx');

    setMessage({
      text: 'Format template Excel berhasil diunduh. Silakan isi dan import kembali.',
      type: 'success',
    });
  };

  // Export Current Players to Excel
  const handleExportPlayersToExcel = async () => {
    if (players.length === 0) {
      setMessage({ text: 'Belum ada data pemain untuk diekspor.', type: 'error' });
      return;
    }

    const exportRows = players.map(p => ({
      'Nama Pemain': p.name,
      'Nomor Punggung': p.jerseyNumber || '-',
      'Posisi': p.position || '-',
      'Nama Tim': p.teamName,
      'Kategori': p.category || '-',
      'Gol': p.goals || 0,
      'Kartu Kuning': p.yellowCards || 0,
      'Kartu Merah': p.redCards || 0,
    }));

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar_Pemain');
    XLSX.writeFile(wb, `Data_Pemain_WabupCup_${Date.now()}.xlsx`);

    setMessage({
      text: `Berhasil mengekspor ${players.length} data pemain ke Excel.`,
      type: 'success',
    });
  };

  // Import Players from uploaded Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async evt => {
      try {
        const bstr = evt.target?.result;
        const XLSX = await import('xlsx');
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          setMessage({ text: 'File Excel kosong atau format tidak sesuai.', type: 'error' });
          setIsProcessing(false);
          return;
        }

        const parsedPlayers: PlayerItem[] = data
          .map((row: any) => {
            const rawName = row['Nama Pemain'] || row['nama'] || row['Nama'] || row['Name'] || '';
            const rawTeam = row['Nama Tim'] || row['tim'] || row['Tim'] || row['Team'] || '';
            const rawNum = row['Nomor Punggung'] || row['nomor'] || row['No Punggung'] || row['No'] || undefined;
            const rawPos = row['Posisi'] || row['posisi'] || row['Position'] || undefined;

            // Try to match category from registered team
            const teamReg = registrations.find(
              r => r.teamName.toLowerCase() === String(rawTeam).trim().toLowerCase()
            );

            return {
              id: `ply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: String(rawName).trim(),
              teamName: String(rawTeam).trim(),
              jerseyNumber: rawNum ? Number(rawNum) : undefined,
              position: rawPos ? String(rawPos).trim() : undefined,
              category: teamReg?.category,
              goals: Number(row['Gol'] || row['gol'] || 0) || 0,
              yellowCards: Number(row['Kartu Kuning'] || row['yellow'] || 0) || 0,
              redCards: Number(row['Kartu Merah'] || row['red'] || 0) || 0,
            };
          })
          .filter(p => p.name && p.teamName);

        if (parsedPlayers.length === 0) {
          setMessage({
            text: 'Tidak ada baris data pemain yang valid (Pastikan kolom "Nama Pemain" dan "Nama Tim" terisi).',
            type: 'error',
          });
          setIsProcessing(false);
          return;
        }

        const res = await batchImportPlayers(parsedPlayers);
        setMessage({
          text: `Berhasil mengimpor ${res.count} pemain dari Excel ke database!`,
          type: 'success',
        });
      } catch (err: any) {
        console.error(err);
        setMessage({ text: `Gagal membaca file Excel: ${err?.message || 'Error'}`, type: 'error' });
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Save or update player from modal
  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer?.name?.trim() || !editingPlayer?.teamName?.trim()) {
      setMessage({ text: 'Nama pemain dan nama tim wajib diisi.', type: 'error' });
      return;
    }

    const teamReg = registrations.find(
      r => r.teamName.toLowerCase() === editingPlayer.teamName!.trim().toLowerCase()
    );

    const playerToSave: PlayerItem = {
      id: editingPlayer.id || undefined,
      name: editingPlayer.name.trim(),
      teamName: editingPlayer.teamName.trim(),
      jerseyNumber: editingPlayer.jerseyNumber !== undefined && editingPlayer.jerseyNumber !== null && !isNaN(Number(editingPlayer.jerseyNumber)) ? Number(editingPlayer.jerseyNumber) : 0,
      position: editingPlayer.position?.trim() || 'Flank',
      category: (editingPlayer.category || teamReg?.category || 'SMA') as TournamentCategory,
      teamId: teamReg?.id,
      photoUrl: editingPlayer.photoUrl || undefined,
      goals: Number(editingPlayer.goals || 0),
      yellowCards: Number(editingPlayer.yellowCards || 0),
      redCards: Number(editingPlayer.redCards || 0),
    };

    try {
      const saved = await savePlayer(playerToSave);
      setIsModalOpen(false);
      setEditingPlayer(null);
      setMessage({
        text: `Data pemain "${saved.name}" berhasil disimpan ke database table_players.`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: `Gagal menyimpan data pemain: ${err?.message || 'Kesalahan sistem'}`,
        type: 'error',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!playerToDelete) return;
    setIsDeleting(true);
    try {
      await deletePlayer(playerToDelete.id);
      if (refreshPlayers) {
        await refreshPlayers();
      }
      setMessage({
        text: `Pemain "${playerToDelete.name}" berhasil dihapus dari database table_players.`,
        type: 'success',
      });
      setPlayerToDelete(null);
    } catch (err: any) {
      setMessage({
        text: `Gagal menghapus pemain: ${err?.message || 'Kesalahan sistem'}`,
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & METRICS */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-heading font-black text-white uppercase tracking-wide flex items-center space-x-2">
              <Users className="w-5 h-5 text-red-500" />
              <span>MANAJEMEN DATA PEMAIN & STATISTIK PERTANDINGAN</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Pencatatan daftar pemain terintegrasi dengan tim terdaftar, monitoring statistik Gol (Top Skor) dan Pelanggaran (Kartu Kuning/Merah), serta fitur import massal via Excel (.xlsx).
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadSampleExcel}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
              title="Unduh Format Template Excel"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Format Excel</span>
            </button>

            {/* Hidden File Input for Excel */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-950/40 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Mengimpor...' : 'Import Excel'}</span>
            </button>

            <button
              onClick={handleExportPlayersToExcel}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export</span>
            </button>

            <button
              onClick={() => {
                setEditingPlayer({
                  name: '',
                  teamName: registeredTeams[0] || '',
                  goals: 0,
                  yellowCards: 0,
                  redCards: 0,
                });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-red-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pemain</span>
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Pemain</p>
              <p className="text-base font-black text-white font-mono">{players.length}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Gol</p>
              <p className="text-base font-black text-amber-400 font-mono">{totalGoals}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-xs">
              🟨
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Kartu Kuning</p>
              <p className="text-base font-black text-yellow-400 font-mono">{totalYellows}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
              🟥
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Kartu Merah</p>
              <p className="text-base font-black text-red-400 font-mono">{totalReds}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ALERT MESSAGE */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/60 border-red-500/50 text-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pemain, posisi, nomor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Filter Team */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-semibold">Tim:</span>
            <select
              value={selectedTeamFilter}
              onChange={e => setSelectedTeamFilter(e.target.value)}
              className="bg-slate-950 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Tim ({registeredTeams.length})</option>
              {registeredTeams.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Category */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-semibold">Kategori:</span>
            <select
              value={selectedCatFilter}
              onChange={e => setSelectedCatFilter(e.target.value)}
              className="bg-slate-950 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium self-start md:self-center">
          Menampilkan {filteredPlayers.length} dari {players.length} Pemain
        </span>
      </div>

      {/* PLAYERS TABLE */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {filteredPlayers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="font-bold text-white text-base">Belum Ada Data Pemain</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Gunakan tombol <strong>"Format Excel"</strong> untuk mengunduh template dan tombol <strong>"Import Excel"</strong> untuk mengunggah daftar pemain tim secara massal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 font-semibold">
                  <th className="py-3.5 px-4 w-12 text-center">NO</th>
                  <th className="py-3.5 px-4">NAMA PEMAIN</th>
                  <th className="py-3.5 px-3 text-center">NO PUNGGUNG</th>
                  <th className="py-3.5 px-3">POSISI</th>
                  <th className="py-3.5 px-4">TIM / ASAL KLUB</th>
                  <th className="py-3.5 px-3 text-center text-amber-400">GOL ⚽</th>
                  <th className="py-3.5 px-3 text-center text-yellow-400">K. KUNING 🟨</th>
                  <th className="py-3.5 px-3 text-center text-red-400">K. MERAH 🟥</th>
                  <th className="py-3.5 px-4 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {filteredPlayers.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-white block text-sm">
                        {p.name}
                      </span>
                      {p.category && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Kategori: {p.category}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {p.jerseyNumber ? (
                        <span className="px-2 py-0.5 rounded bg-slate-950 font-mono font-bold text-amber-400 border border-slate-800">
                          #{p.jerseyNumber}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      {p.position || '-'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-200">
                        {p.teamName}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-400 text-sm">
                      {p.goals || 0}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-yellow-400">
                      {p.yellowCards || 0}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-red-400">
                      {p.redCards || 0}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            setEditingPlayer(p);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Edit Pemain"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPlayerToDelete({ id: p.id!, name: p.name, teamName: p.teamName })}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition cursor-pointer"
                          title="Hapus Pemain"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH / EDIT PEMAIN */}
      {isModalOpen && editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSavePlayer}
            className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-white text-base uppercase">
                {editingPlayer.id ? 'Edit Data Pemain' : 'Tambah Pemain Baru'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap Pemain:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Pratama"
                  value={editingPlayer.name || ''}
                  onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tim Asal:
                </label>
                <select
                  value={editingPlayer.teamName || ''}
                  onChange={e => {
                    const selTeam = e.target.value;
                    const matchedReg = registrations.find(r => r.teamName.toLowerCase() === selTeam.toLowerCase());
                    setEditingPlayer({
                      ...editingPlayer,
                      teamName: selTeam,
                      category: matchedReg ? matchedReg.category : editingPlayer.category,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  required
                >
                  <option value="" disabled>-- Pilih Tim --</option>
                  {registeredTeams.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor Punggung:
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 10"
                  value={editingPlayer.jerseyNumber ?? ''}
                  onChange={e => setEditingPlayer({ ...editingPlayer, jerseyNumber: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Posisi Bermain (Futsal):
                </label>
                <select
                  value={editingPlayer.position || 'Flank'}
                  onChange={e => setEditingPlayer({ ...editingPlayer, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white cursor-pointer"
                >
                  <option value="Flank">Flank (Sayap Kiri/Kanan)</option>
                  <option value="Pivot">Pivot (Penyerang Depan)</option>
                  <option value="Anchor">Anchor (Pemain Bertahan)</option>
                  <option value="Kiper">Kiper (Penjaga Gawang)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori Turnamen:
                </label>
                <select
                  value={editingPlayer.category || ''}
                  onChange={e => setEditingPlayer({ ...editingPlayer, category: e.target.value as TournamentCategory })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="">Otomatis Sesuai Tim</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statistics Inputs (Gol, Kartu Kuning, Kartu Merah) */}
              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">
                  Jumlah Gol ⚽:
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingPlayer.goals ?? 0}
                  onChange={e => setEditingPlayer({ ...editingPlayer, goals: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-yellow-400 mb-1">
                  Kartu Kuning 🟨:
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingPlayer.yellowCards ?? 0}
                  onChange={e => setEditingPlayer({ ...editingPlayer, yellowCards: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-yellow-400 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-red-400 mb-1">
                  Kartu Merah 🟥:
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingPlayer.redCards ?? 0}
                  onChange={e => setEditingPlayer({ ...editingPlayer, redCards: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-red-400 font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white cursor-pointer"
              >
                Simpan Data
              </button>
            </div>
          </form>
        </div>
      )}
      {/* MODAL KONFIRMASI HAPUS PEMAIN (In-App Dialog) */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-red-500/30 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 text-red-500">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Hapus Data Pemain?</h4>
                <p className="text-xs text-slate-400">Data akan dihapus permanen dari database table_players.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nama Pemain:</span>
                <span className="font-bold text-white text-sm">{playerToDelete.name}</span>
              </div>
              {playerToDelete.teamName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Asal Tim:</span>
                  <span className="font-semibold text-amber-400">{playerToDelete.teamName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPlayerToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Pemain</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
