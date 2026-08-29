import React, { useState } from 'react';
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
  ExternalLink,
  Shield,
  X,
  FileCheck,
  Building,
  UserCheck,
  Mail
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
  const { config, categories, submitNewRegistration, getWhatsAppNotificationUrl } = useTournament();

  const [category, setCategory] = useState<TournamentCategory>(preselectedCategory);
  const [teamName, setTeamName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [coachPhone, setCoachPhone] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [playerCount, setPlayerCount] = useState<number>(12);
  const [officialCount, setOfficialCount] = useState<number>(2);

  // Uploaded documents state
  const [docs, setDocs] = useState<RegistrationDocuments>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const currentCatDetail = categories.find(c => c.id === category);

  // File validator for max 3MB PDF
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

    // Validate size (max 3MB = 3 * 1024 * 1024 bytes)
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadErrors(prev => ({
        ...prev,
        [docKey]: `Ukuran file melebihi batas 3MB (File Anda: ${(file.size / (1024 * 1024)).toFixed(1)} MB)!`,
      }));
      return;
    }

    // Clear error
    setUploadErrors(prev => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });

    const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const now = new Date().toISOString().split('T')[0];

    const uploadedDoc: UploadedDoc = {
      name: file.name,
      size: sizeStr,
      uploadDate: now,
      type: 'application/pdf',
      previewUrl: URL.createObjectURL(file),
    };

    setDocs(prev => ({
      ...prev,
      [docKey]: uploadedDoc,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required documents
    const isSchool = category === 'SD' || category === 'SMP' || category === 'SMA';
    const isInstansi = category === 'INSTANSI';
    const isDesa = category === 'DESA';

    if (!docs.suratPernyataan) {
      alert('Mohon lampirkan Surat Pernyataan Bermaterai (PDF)!');
      setIsSubmitting(false);
      return;
    }
    if (!docs.formulirPemain) {
      alert('Mohon lampirkan Formulir Susunan Pemain & Official (PDF)!');
      setIsSubmitting(false);
      return;
    }
    if ((isSchool || isInstansi || isDesa) && !docs.suratKeterangan) {
      alert(`Mohon lampirkan Surat Keterangan / Rekomendasi resmi untuk kategori ${category}!`);
      setIsSubmitting(false);
      return;
    }
    if (category === 'SD' && !docs.aktaKelahiran) {
      alert('Khusus Kategori SD, wajib melampirkan file gabungan Akta Kelahiran (Kelahiran Maksimal 2014)!');
      setIsSubmitting(false);
      return;
    }

    const regFee = currentCatDetail?.registrationFee || 350000;

    const newRegistration = submitNewRegistration({
      category,
      teamName: teamName.trim(),
      institutionName: institutionName.trim() || teamName.trim(),
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

    setIsSubmitting(false);
    setSubmittedItem(newRegistration);
  };

  const handleCopyCode = () => {
    if (submittedItem) {
      navigator.clipboard.writeText(submittedItem.regCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
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
                Lengkapi biodata dan unggah berkas persyaratan PDF resmi (Maks. 3MB)
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
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Rekening Resmi Pembayaran Panitia:</span>
                </span>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {config.bankAccount.bankName} - {config.bankAccount.accountNumber}
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Atas Nama: <strong>{config.bankAccount.accountHolder}</strong>
                </p>
              </div>

            </div>

            {/* ACTION BUTTON: DIRECT TO WHATSAPP ADMIN */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                id="btn-whatsapp-confirmation"
                href={getWhatsAppNotificationUrl(submittedItem, 'CONFIRMATION')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Hubungi Admin via WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition"
              >
                Selesai & Tutup
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kategori Turnamen <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="reg-input-category"
                    value={category}
                    onChange={e => setCategory(e.target.value as TournamentCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — Biaya: Rp {c.registrationFee.toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Tim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SMAN 1 Garudakusuma FC"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Sekolah / Instansi / Desa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SMA Negeri 1 Garudakusuma"
                    value={institutionName}
                    onChange={e => setInstitutionName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Jumlah Pemain (Maks 12)
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={12}
                    value={playerCount}
                    onChange={e => setPlayerCount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
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
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center space-x-2 text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  <FileText className="w-4 h-4" />
                  <span>3. Unggah Berkas Persyaratan PDF (Maks. 3 MB)</span>
                </div>
                <a
                  href={config.formulirTemplateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Formulir Pemain</span>
                </a>
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

                {/* 5. RAPORT TERAKHIR / KARTU PELAJAR */}
                {(category === 'SD' || category === 'SMP' || category === 'SMA') && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Raport Terakhir / Kartu Pelajar Digabung 1 PDF
                    </label>
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
