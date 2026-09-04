import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useTournament } from '../context/TournamentContext';
import {
  RegistrationDocuments,
  TournamentCategory,
  UploadedDoc,
} from '../types';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Shield,
  X,
  FileCheck,
  Building,
  UserCheck,
  Mail,
  Lock,
  MessageCircle,
  Info
} from 'lucide-react';

interface RegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCategory?: TournamentCategory;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  isOpen,
  onClose,
  preselectedCategory = 'SMA',
}) => {
  const { config, categories, registrations, submitNewRegistration, getWhatsAppNotificationUrl, committeeContacts } = useTournament();

  // Helper to calculate real-time registered count for a category
  const getCategoryCount = (catId: TournamentCategory) => {
    const activeRegs = registrations.filter(r => r.category === catId && r.status !== 'REJECTED');
    return activeRegs.length;
  };

  // Helper to determine if a category's quota is full
  const isCategoryFull = (catId: TournamentCategory) => {
    const catObj = categories.find(c => c.id === catId);
    if (!catObj) return false;
    const count = getCategoryCount(catId);
    return count >= catObj.maxTeams;
  };

  // Filter available categories (strictly excluding categories whose quota is full)
  const availableCategories = categories.filter(c => !isCategoryFull(c.id));
  const fullCategories = categories.filter(c => isCategoryFull(c.id));

  // Determine primary committee contact for WhatsApp fallback
  const primaryContact = committeeContacts?.find(c => c.isPrimary) || committeeContacts?.[0] || {
    name: 'Sekretariat Panitia WABUPCUP',
    phone: config.adminContactPhone || '081234567890',
  };
  const cleanPhone = primaryContact.phone.replace(/\D/g, '');
  const formattedWa = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;

  const [category, setCategory] = useState<TournamentCategory>(() => {
    if (categories.some(c => c.id === preselectedCategory && !isCategoryFull(c.id))) {
      return preselectedCategory;
    }
    return availableCategories[0]?.id || 'SMA';
  });

  // Sync category selection whenever modal opens or category availability changes
  useEffect(() => {
    if (isOpen) {
      if (preselectedCategory && availableCategories.some(c => c.id === preselectedCategory)) {
        setCategory(preselectedCategory);
      } else if (availableCategories.length > 0 && !availableCategories.some(c => c.id === category)) {
        setCategory(availableCategories[0].id);
      }
    }
  }, [isOpen, preselectedCategory, categories, registrations]);

  const [teamName, setTeamName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [coachPhone, setCoachPhone] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [playerCount, setPlayerCount] = useState<number>(12);
  const [officialCount, setOfficialCount] = useState<number>(2);
  const [teamLogo, setTeamLogo] = useState<string>('');

  // Uploaded documents state
  const [docs, setDocs] = useState<RegistrationDocuments>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submittedItem, setSubmittedItem] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCatDetail = categories.find(c => c.id === category);

  // File validator for max 1MB (1024KB) PDF with Base64 encoding
  const handleFileUpload = (
    docKey: keyof RegistrationDocuments,
    file: File | null
  ) => {
    if (!file) return;

    // Validate type (must be PDF)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadErrors(prev => ({
        ...prev,
        [docKey]: 'Format file wajib .PDF!',
      }));
      return;
    }

    // Validate size (max 1MB = 1024 * 1024 bytes)
    const maxSize = 1024 * 1024;
    if (file.size > maxSize) {
      setUploadErrors(prev => ({
        ...prev,
        [docKey]: `Ukuran file melebihi batas 1MB / 1024 KB (File Anda: ${(file.size / 1024).toFixed(0)} KB)!`,
      }));
      return;
    }

    // Clear error
    setUploadErrors(prev => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });

    const sizeStr = file.size >= 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' 
      : (file.size / 1024).toFixed(0) + ' KB';
    const now = new Date().toISOString().split('T')[0];

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const uploadedDoc: UploadedDoc = {
        name: file.name,
        size: sizeStr,
        uploadDate: now,
        type: 'application/pdf',
        previewUrl: base64Data,
        fileData: base64Data,
      };

      setDocs(prev => ({
        ...prev,
        [docKey]: uploadedDoc,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Logo uploader (PNG, JPG, SVG, WebP)
  const handleLogoUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Format logo tim harus berupa gambar (PNG, JPG, SVG, atau WEBP)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setTeamLogo(base64);
      setDocs(prev => ({
        ...prev,
        logoTim: {
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          uploadDate: new Date().toISOString().split('T')[0],
          type: file.type,
          previewUrl: base64,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (submittingRef.current || isSubmitting) {
      return;
    }

    // Check if category has reached its maximum quota
    if (isCategoryFull(category)) {
      alert(`Mohon maaf, kuota pendaftaran untuk kategori ${category} saat ini telah penuh! Silakan pilih kategori lain yang masih tersedia atau hubungi panitia.`);
      return;
    }

    // Validate required documents and logo
    const isSchool = category === 'SD' || category === 'SMP' || category === 'SMA';
    const isInstansi = category === 'INSTANSI';
    const isDesa = category === 'DESA';
    const isUmum = category === 'UMUM';

    if (!teamLogo) {
      alert('Mohon unggah Logo Tim / Klub resmi! (Wajib)');
      return;
    }
    if (!docs.suratKeterangan) {
      const keteranganLabel = isSchool
        ? 'Surat Keterangan / Izin Sekolah (PDF)'
        : isInstansi
        ? 'Surat Tugas / Keterangan Instansi (PDF)'
        : isDesa
        ? 'Surat Keterangan Kepala Desa / Lurah (PDF)'
        : 'Surat Rekomendasi / Keterangan Klub (PDF)';
      alert(`Mohon lampirkan ${keteranganLabel}! (Wajib)`);
      return;
    }
    if (!docs.suratPernyataan) {
      alert('Mohon lampirkan Surat Pernyataan Bermaterai (PDF)! (Wajib)');
      return;
    }
    if (!docs.formulirPemain) {
      alert('Mohon lampirkan Formulir Susunan Pemain & Official (PDF)! (Wajib)');
      return;
    }
    if (category === 'SD' && !docs.aktaKelahiran) {
      alert('Khusus Kategori SD, wajib melampirkan file gabungan Akta Kelahiran (Kelahiran Maksimal 2014)! (Wajib)');
      return;
    }
    if (isSchool && !docs.raportKartuPelajar) {
      alert(`Khusus Kategori ${category}, wajib melampirkan Raport Terakhir / Kartu Pelajar yang digabung dalam 1 file PDF! (Wajib)`);
      return;
    }
    if ((isDesa || isUmum) && !docs.ktpGabungan) {
      alert(`Khusus Kategori ${category === 'DESA' ? 'Desa / Kelurahan' : 'Umum'}, wajib melampirkan File KTP Pemain & Official yang digabung menjadi 1 PDF! (Wajib)`);
      return;
    }
    if (isInstansi && !docs.bpjsKetenagakerjaan) {
      alert('Khusus Kategori Instansi / OPD / BUMN / Perbankan, wajib melampirkan File BPJS Ketenagakerjaan yang digabung menjadi 1 PDF! (Wajib)');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const regFee = currentCatDetail?.registrationFee || 350000;
      const cleanTeamName = teamName.trim();

      const newRegistration = submitNewRegistration({
        category,
        teamName: cleanTeamName,
        teamLogo: teamLogo || undefined,
        institutionName: cleanTeamName,
        coachName: coachName.trim(),
        coachPhone: coachPhone.trim(),
        coachEmail: coachEmail.trim(),
        playerCount,
        officialCount,
        paymentAmount: regFee,
        documents: docs,
      });

      // Launch celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {}

      setSubmittedItem(newRegistration);
    } catch (err) {
      console.error('Registration submission error:', err);
      alert('Terjadi kesalahan saat memproses pendaftaran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleCopyCode = () => {
    if (submittedItem) {
      navigator.clipboard.writeText(submittedItem.regCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleCopyBank = (accountNumber: string, identifier: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedBankId(identifier);
    setTimeout(() => {
      setCopiedBankId(prev => (prev === identifier ? null : prev));
    }, 2500);
  };

  return (
    <div
      id="registration-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div
        id="registration-modal-container"
        className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 text-slate-900 dark:text-white"
      >
        
        {/* MODAL TOP HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
              ⚽
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold uppercase tracking-wider leading-none">
                FORMULIR PENDAFTARAN TIM WABUPCUP 2026
              </h3>
              <p className="text-xs text-white/80 mt-1">
                Lengkapi biodata dan unggah berkas persyaratan PDF resmi (Maks. 1MB / 1024 KB)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUBMITTED SUCCESS POPUP VIEW */}
        {submittedItem ? (
          <div className="p-6 sm:p-8 space-y-6 animate-fadeIn text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20">
              ✓
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">
                Pendaftaran Berhasil Dikirimkan!
              </span>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                Selamat Datang, Tim {submittedItem.teamName}!
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto mt-1">
                Data pendaftaran dan berkas dokumen Anda telah tersimpan aman di database turnamen.
              </p>
            </div>

            {/* REGISTRATION CODE & PAYMENT INSTRUCTIONS */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left space-y-4 max-w-xl mx-auto">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Kode Registrasi Tim</span>
                  <span className="text-xl font-mono font-bold text-red-600 dark:text-red-400">
                    {submittedItem.regCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Kategori</span>
                  <strong className="text-slate-800 dark:text-slate-200">{submittedItem.category}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Biaya Registrasi</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    Rp {submittedItem.paymentAmount.toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>

              {/* BANK TRANSFER DETAILS */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center space-x-1">
                    <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Rekening Resmi Pembayaran Panitia:</span>
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 italic">
                    Klik nomor untuk salin
                  </span>
                </div>
                {config.bankAccounts && config.bankAccounts.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {config.bankAccounts.map(b => (
                      <div key={b.id} className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-950/70 border border-amber-200/70 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-700 transition">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {b.bankName}
                            </span>
                            {b.isPrimary && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                                Utama
                              </span>
                            )}
                          </div>
                          
                          {/* COPY BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleCopyBank(b.accountNumber, b.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer shrink-0 ${
                              copiedBankId === b.id
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-800/60 text-amber-900 dark:text-amber-200'
                            }`}
                            title="Salin Nomor Rekening"
                          >
                            {copiedBankId === b.id ? (
                              <>
                                <Check className="w-3 h-3 text-white" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin No. Rek</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* CLICKABLE ACCOUNT NUMBER */}
                        <div className="mt-1 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleCopyBank(b.accountNumber, b.id)}
                            className="font-mono text-sm font-bold text-slate-900 dark:text-amber-200 tracking-wider hover:underline hover:text-amber-600 dark:hover:text-amber-400 flex items-center space-x-1.5 cursor-pointer text-left"
                            title="Klik untuk salin no rekening"
                          >
                            <span>{b.accountNumber}</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                          a/n <strong>{b.accountHolder}</strong> {b.branchName ? `(${b.branchName})` : ''}
                        </p>
                        {b.instructions && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5">{b.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-950/70 border border-amber-200/70 dark:border-amber-900/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {config.bankAccount.bankName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyBank(config.bankAccount.accountNumber, 'fallback')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer shrink-0 ${
                          copiedBankId === 'fallback'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-800/60 text-amber-900 dark:text-amber-200'
                        }`}
                        title="Salin Nomor Rekening"
                      >
                        {copiedBankId === 'fallback' ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin No. Rek</span>
                          </>
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyBank(config.bankAccount.accountNumber, 'fallback')}
                      className="font-mono text-sm font-bold text-slate-900 dark:text-amber-200 tracking-wider hover:underline hover:text-amber-600 dark:hover:text-amber-400 block mt-1 cursor-pointer"
                      title="Klik untuk salin no rekening"
                    >
                      {config.bankAccount.accountNumber}
                    </button>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      Atas Nama: <strong>{config.bankAccount.accountHolder}</strong>
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* ACTION BUTTON: DIRECT TO WHATSAPP ADMIN */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                id="btn-whatsapp-confirmation"
                href={`https://wa.me/${formattedWa}?text=${encodeURIComponent(
                  `Halo Panitia *${config.name || 'WABUPCUP 2026'}*, saya *${submittedItem.coachName}* dari tim *${submittedItem.teamName}* (Kategori: *${submittedItem.category}*).\n\nSaya telah berhasil melakukan pendaftaran resmi dengan:\n📌 *Kode Registrasi:* ${submittedItem.regCode}\n💰 *Nominal Biaya:* Rp ${submittedItem.paymentAmount.toLocaleString('id-ID')}\n\nMohon informasi verifikasi pembayaran dan berkas dokumen tim kami. Terima kasih!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Hubungi Admin via WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={() => {
                  setSubmittedItem(null);
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : availableCategories.length === 0 ? (
          
          /* ALL CATEGORIES ARE FULL VIEW */
          <div className="p-8 sm:p-10 space-y-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                Pemberitahuan Pendaftaran
              </span>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                Kuota Seluruh Kategori Telah Penuh!
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Terima kasih atas antusiasme luar biasa Anda. Seluruh slot kuota pendaftaran tim untuk semua kategori turnamen WABUPCUP 2026 telah terisi 100%.
              </p>
            </div>

            {/* FULL CATEGORIES STATUS LIST */}
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left max-w-lg mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Status Kuota Kategori:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {categories.map(c => {
                  const regCount = getCategoryCount(c.id);
                  return (
                    <div key={c.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-600 dark:text-red-400">
                        {regCount}/{c.maxTeams} Penuh
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/${formattedWa}?text=${encodeURIComponent(`Halo Panitia WABUPCUP 2026, saya ingin menanyakan perihal waiting list / kuota tambahan untuk pendaftaran turnamen.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi Panitia (Waiting List)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        ) : (
          
          /* MAIN FORM */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* SECTION 1: KATEGORI & INFORMASI TIM */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                <Building className="w-4 h-4" />
                <span>1. Data Kategori & Identitas Tim</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kategori Turnamen <span className="text-red-500">*</span>
                    </label>
                    {currentCatDetail && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Sisa {Math.max(0, currentCatDetail.maxTeams - getCategoryCount(currentCatDetail.id))} 
                         {/* Slot ({currentCatDetail.maxTeams} Tim) */}
                      </span>
                    )}
                  </div>
                  <select
                    id="reg-input-category"
                    value={category}
                    onChange={e => setCategory(e.target.value as TournamentCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    {availableCategories.map(c => {
                      const count = getCategoryCount(c.id);
                      const sisa = Math.max(0, c.maxTeams - count);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} — Biaya: Rp {c.registrationFee.toLocaleString('id-ID')}
                           {/* (Sisa {sisa} Slot) */}
                           
                        </option>
                      );
                    })}
                  </select>
                  {fullCategories.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                      <Info className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>
                        Kategori penuh ({fullCategories.map(f => f.id).join(', ')}) otomatis tidak ditampilkan.
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Team / Sekolah / Instansi / Desa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SMAN 1 Garudakusuma FC / Dispora FC / Desa Sukamaju"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Jumlah Pemain (Maksimal 12 Orang) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={12}
                    required
                    value={playerCount}
                    onChange={e => setPlayerCount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Minimal 7 pemain, maksimal 12 pemain.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Jumlah Official / Pelatih (Maksimal 3 Orang) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    required
                    value={officialCount}
                    onChange={e => setOfficialCount(Math.min(3, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Minimal 1 official, maksimal 3 official.</span>
                </div>
              </div>

              {/* UPLOAD LOGO TIM (WAJIB) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {teamLogo ? (
                      <img
                        src={teamLogo}
                        alt="Preview Logo Tim"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-lg">🛡️</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Upload Logo Tim / Instansi / Klub <span className="text-red-500">* (Wajib)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Format PNG / JPG / SVG / WEBP. Logo wajib diunggah untuk ditampilkan pada bagan turnamen dan live score.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center space-x-1.5">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{teamLogo ? 'Ganti Logo' : 'Pilih Logo *'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      className="hidden"
                      onChange={e => handleLogoUpload(e.target.files?.[0] || null)}
                    />
                  </label>
                  {teamLogo && (
                    <button
                      type="button"
                      onClick={() => {
                        setTeamLogo('');
                        setDocs(prev => {
                          const c = { ...prev };
                          delete c.logoTim;
                          return c;
                        });
                      }}
                      className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 text-xs font-semibold transition"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: KONTAK OFFICIAL / PELATIH */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                <UserCheck className="w-4 h-4" />
                <span>2. Kontak Pelatih / Pembina / Official</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Pelatih / Pembina <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bambang Supriyanto, S.Pd"
                    value={coachName}
                    onChange={e => setCoachName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    No. WhatsApp Aktif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={coachPhone}
                    onChange={e => setCoachPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Aktif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="coach@sekolah.sch.id"
                    value={coachEmail}
                    onChange={e => setCoachEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: UPLOAD PERSYARATAN DOKUMEN PDF */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-2">
                <div className="flex items-center space-x-2 text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  <FileText className="w-4 h-4" />
                  <span>3. Unggah Berkas Persyaratan PDF (Maks. 1 MB / 1024 KB)</span>
                </div>
                {config.downloadableDocs && config.downloadableDocs.length > 0 ? (
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <span className="text-slate-500 text-[11px]">Download Template:</span>
                    {config.downloadableDocs.map(doc => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.fileName}
                        className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 flex items-center space-x-1 font-semibold text-[11px] transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>{doc.title}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <a
                    href={config.formulirTemplateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Formulir Pemain</span>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. SURAT KETERANGAN SEKOLAH / INSTANSI / DESA */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {category === 'SD' || category === 'SMP' || category === 'SMA'
                      ? 'Surat Keterangan / Izin Sekolah (PDF)'
                      : category === 'INSTANSI'
                      ? 'Surat Tugas / Keterangan Instansi (PDF)'
                      : category === 'DESA'
                      ? 'Surat Keterangan Kepala Desa/Lurah (PDF)'
                      : 'Surat Rekomendasi / Keterangan Klub (PDF)'}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={e => handleFileUpload('suratKeterangan', e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-semibold hover:file:bg-red-700 cursor-pointer"
                  />
                  {docs.suratKeterangan && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{docs.suratKeterangan.name} ({docs.suratKeterangan.size})</span>
                    </p>
                  )}
                  {uploadErrors.suratKeterangan && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">{uploadErrors.suratKeterangan}</p>
                  )}
                </div>

                {/* 2. SURAT PERNYATAAN BERMATERAI */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Surat Pernyataan Bermaterai (PDF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={e => handleFileUpload('suratPernyataan', e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-semibold hover:file:bg-red-700 cursor-pointer"
                  />
                  {docs.suratPernyataan && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{docs.suratPernyataan.name} ({docs.suratPernyataan.size})</span>
                    </p>
                  )}
                  {uploadErrors.suratPernyataan && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">{uploadErrors.suratPernyataan}</p>
                  )}
                </div>

                {/* 3. FORMULIR PEMAIN */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Formulir Susunan Pemain & Official (PDF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={e => handleFileUpload('formulirPemain', e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-semibold hover:file:bg-red-700 cursor-pointer"
                  />
                  {docs.formulirPemain && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{docs.formulirPemain.name} ({docs.formulirPemain.size})</span>
                    </p>
                  )}
                  {uploadErrors.formulirPemain && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">{uploadErrors.formulirPemain}</p>
                  )}
                </div>

                {/* 4. AKTA KELAHIRAN (KHUSUS KATEGORI SD) */}
                {category === 'SD' && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                    <label className="block text-xs font-bold text-red-900 dark:text-red-300 mb-1">
                      Akta Kelahiran Gabungan Maks 2014 (Khusus SD) (PDF) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={e => handleFileUpload('aktaKelahiran', e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-semibold hover:file:bg-red-700 cursor-pointer"
                    />
                    {docs.aktaKelahiran && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{docs.aktaKelahiran.name} ({docs.aktaKelahiran.size})</span>
                      </p>
                    )}
                    {uploadErrors.aktaKelahiran && (
                      <p className="text-[11px] text-red-500 font-medium mt-1">{uploadErrors.aktaKelahiran}</p>
                    )}
                  </div>
                )}

                {/* 5. RAPORT TERAKHIR / KARTU PELAJAR (KHUSUS SD, SMP, SMA) */}
                {(category === 'SD' || category === 'SMP' || category === 'SMA') && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Raport Terakhir / Kartu Pelajar Digabung 1 PDF <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                      Scan Raport terakhir / Kartu Pelajar seluruh pemain disatukan ke dalam 1 file PDF (Maks. 1MB).
                    </p>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={e => handleFileUpload('raportKartuPelajar', e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-semibold hover:file:bg-red-700 cursor-pointer"
                    />
                    {docs.raportKartuPelajar && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{docs.raportKartuPelajar.name} ({docs.raportKartuPelajar.size})</span>
                      </p>
                    )}
                    {uploadErrors.raportKartuPelajar && (
                      <p className="text-[11px] text-red-500 font-medium mt-1">{uploadErrors.raportKartuPelajar}</p>
                    )}
                  </div>
                )}

                {/* 6. KTP PEMAIN & OFFICIAL DIGABUNG 1 PDF (KHUSUS DESA/KELURAHAN & UMUM) */}
                {(category === 'DESA' || category === 'UMUM') && (
                  <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
                    <label className="block text-xs font-bold text-amber-950 dark:text-amber-300 mb-1">
                      File KTP Pemain & Official Digabung 1 PDF <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2">
                      Scan / foto KTP seluruh pemain dan official disatukan ke dalam 1 file PDF (Maks. 1MB).
                    </p>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={e => handleFileUpload('ktpGabungan', e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-semibold hover:file:bg-red-700 cursor-pointer"
                    />
                    {docs.ktpGabungan && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{docs.ktpGabungan.name} ({docs.ktpGabungan.size})</span>
                      </p>
                    )}
                    {uploadErrors.ktpGabungan && (
                      <p className="text-[11px] text-red-500 font-medium mt-1">{uploadErrors.ktpGabungan}</p>
                    )}
                  </div>
                )}

                {/* 7. BPJS KETENAGAKERJAAN DIGABUNG 1 PDF (KHUSUS INSTANSI) */}
                {category === 'INSTANSI' && (
                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                    <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-300 mb-1">
                      File BPJS Ketenagakerjaan Digabung 1 PDF <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2">
                      Scan kartu / bukti kepesertaan BPJS Ketenagakerjaan seluruh pemain digabung 1 file PDF (Maks. 1MB).
                    </p>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={e => handleFileUpload('bpjsKetenagakerjaan', e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-semibold hover:file:bg-red-700 cursor-pointer"
                    />
                    {docs.bpjsKetenagakerjaan && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{docs.bpjsKetenagakerjaan.name} ({docs.bpjsKetenagakerjaan.size})</span>
                      </p>
                    )}
                    {uploadErrors.bpjsKetenagakerjaan && (
                      <p className="text-[11px] text-red-500 font-medium mt-1">{uploadErrors.bpjsKetenagakerjaan}</p>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"
              >
                Batal
              </button>

              <button
                type="submit"
                id="btn-submit-registration-form"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Mengunggah Berkas...</span>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Kirim Berkas Pendaftaran</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
