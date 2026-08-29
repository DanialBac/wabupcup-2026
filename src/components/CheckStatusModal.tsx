import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { RegistrationItem } from '../types';
import {
  Search,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  FileText,
  Shield,
  ExternalLink,
  Copy
} from 'lucide-react';

interface CheckStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckStatusModal: React.FC<CheckStatusModalProps> = ({ isOpen, onClose }) => {
  const { registrations, config, getWhatsAppNotificationUrl } = useTournament();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedResult, setSearchedResult] = useState<RegistrationItem | null | 'NOT_FOUND'>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const found = registrations.find(
      r =>
        r.regCode.toLowerCase() === query ||
        r.teamName.toLowerCase().includes(query) ||
        r.coachPhone.includes(query)
    );

    setSearchedResult(found || 'NOT_FOUND');
  };

  return (
    <div
      id="check-status-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div
        id="check-status-modal-container"
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 text-slate-900 dark:text-white"
      >
        {/* HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold uppercase tracking-wider">
              Cek Status Berkas Pendaftaran
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          
          {/* SEARCH FORM */}
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Masukkan Kode Registrasi (Contoh: <strong className="text-red-500 font-mono">WBC-SD-001</strong>) atau No. WhatsApp / Nama Tim:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="WBC-SD-001 atau 0812..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-md"
              >
                Cari
              </button>
            </div>
          </form>

          {/* RESULT VIEW */}
          {searchedResult === 'NOT_FOUND' && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs text-center">
              ❌ Data tim tidak ditemukan. Pastikan Kode Registrasi atau Nomor WhatsApp yang Anda masukkan sudah benar.
            </div>
          )}

          {searchedResult && searchedResult !== 'NOT_FOUND' && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase block">
                    {searchedResult.regCode}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {searchedResult.teamName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {searchedResult.institutionName} • Kategori {searchedResult.category}
                  </p>
                </div>

                {/* STATUS BADGE */}
                <div>
                  {searchedResult.status === 'APPROVED' && (
                    <span className="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>DISETUJUI</span>
                    </span>
                  )}
                  {searchedResult.status === 'PENDING_PAYMENT' && (
                    <span className="px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center space-x-1 border border-amber-300 dark:border-amber-800">
                      <Clock className="w-3.5 h-3.5" />
                      <span>MENUNGGU PEMBAYARAN</span>
                    </span>
                  )}
                  {searchedResult.status === 'REJECTED' && (
                    <span className="px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-1 border border-rose-300 dark:border-rose-800">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>PERLU PERBAIKAN</span>
                    </span>
                  )}
                </div>
              </div>

              {/* REJECTION REASON IF ANY */}
              {searchedResult.status === 'REJECTED' && searchedResult.rejectionReason && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200">
                  <strong>Catatan Panitia:</strong>
                  <p className="mt-1">{searchedResult.rejectionReason}</p>
                </div>
              )}

              {/* ADMIN NOTES */}
              {searchedResult.adminNotes && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  ℹ️ {searchedResult.adminNotes}
                </p>
              )}

              {/* WHATSAPP ACTION BUTTON */}
              <div className="pt-2">
                <a
                  href={getWhatsAppNotificationUrl(searchedResult, 'CONFIRMATION')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md"
                >
                  <Phone className="w-4 h-4" />
                  <span>Hubungi Sekretariat Panitia di WhatsApp</span>
                </a>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
