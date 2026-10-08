import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  Copy,
  Download,
} from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';
import { getWhatsAppInvoiceShareUrl } from '../utils/invoicePdf';

interface CheckStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckStatusModal: React.FC<CheckStatusModalProps> = ({ isOpen, onClose }) => {
  const { registrations, config, committeeContacts } = useTournament();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedResult, setSearchedResult] = useState<RegistrationItem | null | 'NOT_FOUND'>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  if (!isOpen) return null;

  const primaryContact = committeeContacts?.find(c => c.isPrimary) || committeeContacts?.[0] || {
    name: 'Sekretariat Panitia WABUPCUP',
    phone: config.adminContactPhone || '085232924449',
  };
  const cleanAdminPhone = primaryContact.phone.replace(/\D/g, '');
  const formattedAdminPhone = cleanAdminPhone.startsWith('0')
    ? `62${cleanAdminPhone.slice(1)}`
    : cleanAdminPhone;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    setIsSearching(true);
    setTimeout(() => {
      const found = registrations.find(
        r =>
          r.regCode.toLowerCase() === query ||
          r.teamName.toLowerCase().includes(query) ||
          r.coachPhone.includes(query)
      );

      setSearchedResult(found || 'NOT_FOUND');
      setIsSearching(false);
    }, 350);
  };

  return (
    <div
      id="check-status-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <motion.div
        id="check-status-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
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
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.25)]"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-red-950/30 flex items-center justify-center space-x-2 shrink-0 cursor-pointer disabled:opacity-75"
              >
                {isSearching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari</span>
                  </>
                )}
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

              {/* TIMELINE / STATUS STEPPER (Berkas Diterima -> Verifikasi -> Lolos) */}
              <div className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Progres Verifikasi Dokumen:</span>
                  <span className={
                    searchedResult.status === 'APPROVED' ? 'text-emerald-500 font-extrabold' :
                    searchedResult.status === 'PENDING_PAYMENT' ? 'text-amber-500 font-extrabold' : 'text-rose-500 font-extrabold'
                  }>
                    {searchedResult.status === 'APPROVED' ? '100% Selesai (Lolos)' :
                     searchedResult.status === 'PENDING_PAYMENT' ? 'Tahap 2 dari 3 (Verifikasi)' : 'Perlu Perbaikan'}
                  </span>
                </div>

                {/* ANIMATED PROGRESS BAR FILLING */}
                <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: searchedResult.status === 'APPROVED' ? '100%' :
                             searchedResult.status === 'PENDING_PAYMENT' ? '66%' : '66%'
                    }}
                    transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full ${
                      searchedResult.status === 'APPROVED' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' :
                      searchedResult.status === 'PENDING_PAYMENT' ? 'bg-amber-500 shadow-[0_0_12px_#f59e0b]' :
                      'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                    }`}
                  />
                </div>

                {/* 3 STEPS ICONS & LABELS */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  {/* Step 1: Berkas Diterima */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.1 }}
                      className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs mb-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </motion.div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">1. Berkas Masuk</span>
                    <span className="text-[9px] text-slate-400">Tersimpan</span>
                  </div>

                  {/* Step 2: Verifikasi Panitia */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.25 }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs mb-1 ${
                        searchedResult.status === 'APPROVED'
                          ? 'bg-emerald-500 text-white'
                          : searchedResult.status === 'PENDING_PAYMENT'
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {searchedResult.status === 'APPROVED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : searchedResult.status === 'PENDING_PAYMENT' ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                    </motion.div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">2. Validasi Panitia</span>
                    <span className="text-[9px] text-slate-400">
                      {searchedResult.status === 'APPROVED' ? 'Terverifikasi' :
                       searchedResult.status === 'PENDING_PAYMENT' ? 'Sedang Ditinjau' : 'Catatan Revisi'}
                    </span>
                  </div>

                  {/* Step 3: Lolos / Disetujui */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.4 }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs mb-1 ${
                        searchedResult.status === 'APPROVED'
                          ? 'bg-emerald-500 text-white shadow-[0_0_10px_#10b981]'
                          : 'bg-slate-300 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {searchedResult.status === 'APPROVED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Shield className="w-3.5 h-3.5" />
                      )}
                    </motion.div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">3. Resmi Lolos</span>
                    <span className="text-[9px] text-slate-400">
                      {searchedResult.status === 'APPROVED' ? 'Siap Tanding' : 'Menunggu'}
                    </span>
                  </div>
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

              {/* INFO NOTICE FOR PENDING PAYMENT */}
              {searchedResult.status === 'PENDING_PAYMENT' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold">Menunggu Validasi Berkas & Konfirmasi Pembayaran</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Berkas tim Anda sedang dalam proses peninjauan oleh sekretariat panitia. Silakan hubungi admin panitia via WhatsApp di bawah untuk mempercepat validasi dan mendapatkan nomor rekening pembayaran resmi.
                  </p>
                </div>
              )}

              {/* INVOICE & KUITANSI RESMI CARD FOR PAID REGISTRANTS */}
               {/* {(searchedResult.paymentStatus === 'PAID' || searchedResult.status === 'APPROVED') && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/30 via-slate-900 to-slate-950 border border-red-800/40 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">
                          Invoice & Kuitansi Resmi Pelunasan
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Berstempel Cap Wabup Cup 2026 & Tanda Tangan Ketua Panitia
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase">
                      Lunas
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Pembayaran Anda telah lunas dan terverifikasi secara resmi. Silakan unduh dokumen PDF atau kirimkan salinan invoice ke nomor WhatsApp Anda untuk ditunjukkan saat Technical Meeting.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setIsInvoiceOpen(true)}
                      className="w-full py-2 px-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Lihat & Unduh PDF</span>
                    </button>

                    <a
                      href={getWhatsAppInvoiceShareUrl(searchedResult, config)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Kirim ke WA</span>
                    </a>
                  </div>
                </div>
              )}*/}

              {/* WHATSAPP ACTION BUTTON */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/${formattedAdminPhone}?text=${encodeURIComponent(
                    `Halo Panitia *${config.name + '2026' || 'WABUPCUP 2026'}*, saya *${searchedResult.coachName}* dari tim *${searchedResult.teamName}* (Kategori: *${searchedResult.category}*).\n\n📌 *Kode Registrasi:* ${searchedResult.regCode}\n📊 *Status Berkas:* ${
                      searchedResult.status === 'APPROVED'
                        ? 'Telah Disetujui'
                        : searchedResult.status === 'PENDING_PAYMENT'
                        ? 'Menunggu Validasi & Pembayaran'
                        : 'Perlu Perbaikan'
                    }\n\nSaya ingin menanyakan perihal validasi persyaratan berkas dan konfirmasi pembayaran tim kami. Terima kasih!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center space-x-2 transition border border-slate-700"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Hubungi Sekretariat Panitia di WhatsApp</span>
                </a>
              </div>

            </div>
          )}

        </div>
      </motion.div>

      {/* INVOICE MODAL POPUP */}
      {typeof searchedResult === 'object' && searchedResult !== null && (
        <InvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          item={searchedResult}
          config={config}
        />
      )}
    </div>
  );
};
