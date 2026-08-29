import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  AdminRole,
  AdminUser,
  CategoryDetail,
  MatchItem,
  MatchStatus,
  PaymentStatus,
  RegistrationItem,
  RegistrationStatus,
  SponsorItem,
  SponsorTier,
  TournamentCategory,
  UploadedDoc,
} from '../../types';
import { PdfViewerModal } from './PdfViewerModal';
import {
  SETUP_GS_CODE,
  CODE_GS_CODE,
  INDEX_HTML_STANDALONE_TEMPLATE,
  DEPLOYMENT_AND_GIT_GUIDE,
} from '../../utils/gasCodeGenerator';
import {
  Shield,
  Users,
  Trophy,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  FileText,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  LogOut,
  Lock,
  Download,
  Copy,
  ExternalLink,
  Shuffle,
  Activity,
  Sliders,
  DollarSign,
  AlertTriangle,
  FileCode,
  Globe,
  Sparkles,
  ArrowRight,
  Eye
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const {
    currentAdmin,
    loginAdmin,
    logoutAdmin,
    registrations,
    updateRegistrationStatus,
    updatePaymentStatus,
    deleteRegistration,
    categories,
    updateCategory,
    matches,
    addMatch,
    updateMatch,
    deleteMatch,
    randomizeMatchesForCategory,
    sponsors,
    addSponsor,
    updateSponsor,
    deleteSponsor,
    adminUsers,
    addAdminUser,
    deleteAdminUser,
    resetAllDataToDefaults,
    getWhatsAppNotificationUrl,
    config,
  } = useTournament();

  // Login credentials state
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // Active CMS Navigation Tab
  type CmsTab =
    | 'OVERVIEW'
    | 'ALL_REGISTRATIONS'
    | 'PENDING_PAYMENT'
    | 'APPROVED_TEAMS'
    | 'REJECTED_TEAMS'
    | 'DRAWING_RANDOMIZER'
    | 'SCHEDULE_LIVESCORE'
    | 'CATEGORIES_PRIZES'
    | 'SPONSORS'
    | 'ADMIN_USERS'
    | 'GAS_EXPORT_GUIDE';

  const [activeTab, setActiveTab] = useState<CmsTab>('OVERVIEW');

  // Search and filters for registration tables
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // PDF Viewer Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<UploadedDoc | null>(null);
  const [selectedDocTitle, setSelectedDocTitle] = useState('');
  const [selectedTeamName, setSelectedTeamName] = useState('');

  // Rejection reason prompt modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetRejectItem, setTargetRejectItem] = useState<RegistrationItem | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Drawing Randomizer State
  const [drawCategory, setDrawCategory] = useState<TournamentCategory>('SMA');
  const [drawResultMatches, setDrawResultMatches] = useState<MatchItem[] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Live Score Controller State
  const [editMatchModalOpen, setEditMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchItem | null>(null);
  const [newGoalPlayer, setNewGoalPlayer] = useState('');
  const [newGoalTeam, setNewGoalTeam] = useState<'A' | 'B'>('A');

  // Category editor state
  const [editingCategory, setEditingCategory] = useState<CategoryDetail | null>(null);

  // Sponsor form modal state
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorItem | null>(null);
  const [sponsorForm, setSponsorForm] = useState<{ name: string; tier: SponsorTier; logoText: string; websiteUrl: string; description: string }>({
    name: '',
    tier: 'GOLD',
    logoText: '',
    websiteUrl: '',
    description: '',
  });

  // Admin User modal state
  const [adminUserModalOpen, setAdminUserModalOpen] = useState(false);
  const [adminUserForm, setAdminUserForm] = useState<{ username: string; fullName: string; role: AdminRole; email: string; phone: string }>({
    username: '',
    fullName: '',
    role: 'PANITIA',
    email: '',
    phone: '',
  });

  // GAS export active sub-tab
  const [gasActiveFile, setGasActiveFile] = useState<'setup.gs' | 'Code.gs' | 'Index.html' | 'Panduan_Deploy'>('setup.gs');
  const [copiedGas, setCopiedGas] = useState(false);

  // AUTH SUBMISSION
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = loginAdmin(username, password);
    if (!success) {
      setLoginError('Username atau password salah! (Coba: superadmin / admin123)');
    }
  };

  // OPEN PDF VIEWER
  const handleOpenPdf = (doc: UploadedDoc | undefined, title: string, team: string) => {
    if (!doc) {
      alert('Dokumen ini belum diunggah oleh peserta.');
      return;
    }
    setSelectedDoc(doc);
    setSelectedDocTitle(title);
    setSelectedTeamName(team);
    setPdfModalOpen(true);
  };

  // OPEN REJECT MODAL
  const handleOpenReject = (item: RegistrationItem) => {
    setTargetRejectItem(item);
    setRejectionReasonText(item.rejectionReason || '');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (targetRejectItem) {
      updateRegistrationStatus(
        targetRejectItem.id,
        'REJECTED',
        rejectionReasonText.trim() || 'Dokumen persyaratan belum lengkap/tidak valid.'
      );
      setRejectModalOpen(false);
      setTargetRejectItem(null);
    }
  };

  // EXECUTE RANDOM DRAWING
  const handleRunDrawing = () => {
    setIsDrawing(true);
    setTimeout(() => {
      const generated = randomizeMatchesForCategory(drawCategory);
      setDrawResultMatches(generated);
      setIsDrawing(false);
    }, 600);
  };

  // COPY GAS CODE
  const handleCopyGasCode = () => {
    let text = '';
    if (gasActiveFile === 'setup.gs') text = SETUP_GS_CODE;
    else if (gasActiveFile === 'Code.gs') text = CODE_GS_CODE;
    else if (gasActiveFile === 'Index.html') text = INDEX_HTML_STANDALONE_TEMPLATE;
    else if (gasActiveFile === 'Panduan_Deploy') text = DEPLOYMENT_AND_GIT_GUIDE;

    navigator.clipboard.writeText(text);
    setCopiedGas(true);
    setTimeout(() => setCopiedGas(false), 2500);
  };

  // DOWNLOAD GAS FILE
  const handleDownloadGasFile = () => {
    let content = '';
    let filename = '';
    if (gasActiveFile === 'setup.gs') { content = SETUP_GS_CODE; filename = 'setup.gs'; }
    else if (gasActiveFile === 'Code.gs') { content = CODE_GS_CODE; filename = 'Code.gs'; }
    else if (gasActiveFile === 'Index.html') { content = INDEX_HTML_STANDALONE_TEMPLATE; filename = 'Index.html'; }
    else { content = DEPLOYMENT_AND_GIT_GUIDE; filename = 'PANDUAN_DEPLOYMENT.md'; }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // FILTERED REGISTRATIONS HELPER
  const filterList = (items: RegistrationItem[]) => {
    return items.filter(r => {
      const matchSearch =
        searchFilter === '' ||
        r.regCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.teamName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.coachName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.coachPhone.includes(searchFilter);
      const matchCat = categoryFilter === 'ALL' || r.category === categoryFilter;
      return matchSearch && matchCat;
    });
  };

  const pendingList = registrations.filter(r => r.status === 'PENDING_PAYMENT');
  const approvedList = registrations.filter(r => r.status === 'APPROVED');
  const rejectedList = registrations.filter(r => r.status === 'REJECTED');

  const totalCollectedRevenue = registrations
    .filter(r => r.paymentStatus === 'PAID')
    .reduce((acc, curr) => acc + curr.paymentAmount, 0);

  // 1. IF NOT LOGGED IN: SHOW LOGIN SCREEN
  if (!currentAdmin) {
    return (
      <div
        id="admin-login-overlay"
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      >
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto text-2xl mb-3 shadow-lg">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-heading font-bold uppercase tracking-wider">
              PANEL ADMIN CMS WABUPCUP 2026
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Silakan login dengan akun panitia atau administrator resmi.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-700/60 text-red-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Username Panitia
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="superadmin / panitia"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Kata Sandi (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-300">Akun Demo Panitia Tersedia:</p>
              <p>• Super Admin: <code className="text-red-400">superadmin</code> / <code className="text-slate-300">admin123</code></p>
              <p>• Sekretariat: <code className="text-blue-400">panitia</code> / <code className="text-slate-300">panitia2026</code></p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-900/40 transition flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Masuk ke Dashboard CMS</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. MAIN LOGGED-IN ADMIN CMS PORTAL
  return (
    <div
      id="admin-dashboard-root"
      className="fixed inset-0 z-50 overflow-hidden bg-[#0F172A] text-slate-200 flex flex-col font-sans animate-fadeIn"
    >
      {/* CMS TOP BAR - PROFESSIONAL POLISH */}
      <header className="flex items-center justify-between px-6 sm:px-8 py-3.5 bg-[#1E293B] border-b border-slate-700 shadow-lg shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 bg-red-600 rounded-full flex items-center justify-center border-2 border-slate-300 shadow-[0_0_15px_rgba(220,38,38,0.5)] shrink-0">
            <span className="font-black text-lg text-white">WC</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
              WABUP<span className="text-red-500">CUP</span> 2026
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
              Tournament Management System • {currentAdmin.role}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-5">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-300">LIVE STATUS: ACTIVE</span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-700"></div>

          <button
            onClick={() => {
              if (confirm('Reset seluruh data ke data dummy default awal?')) {
                resetAllDataToDefaults();
                alert('Data berhasil di-reset ke default.');
              }
            }}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
            title="Reset ke Data Dummy Awal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/80 border border-slate-700 hover:border-red-800 text-xs font-medium text-slate-300 hover:text-red-300 transition flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors border border-slate-600 flex items-center space-x-1"
          >
            <span>Landing Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* CMS MAIN CONTAINER WITH SIDEBAR & CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION - PROFESSIONAL POLISH */}
        <aside className="w-64 bg-[#111827] border-r border-slate-800 p-4 flex flex-col shrink-0 overflow-y-auto hidden md:flex">
          <div className="space-y-1 mb-6">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Dashboard Menu
            </p>

            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'OVERVIEW'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Ringkasan & Statistik</span>
            </button>

            <button
              onClick={() => setActiveTab('ALL_REGISTRATIONS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'ALL_REGISTRATIONS'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4" />
                <span>Pendaftaran</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-mono border border-slate-700">
                {registrations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PENDING_PAYMENT')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'PENDING_PAYMENT'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>Menunggu Bayar</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-mono border border-yellow-500/20">
                {pendingList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('APPROVED_TEAMS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'APPROVED_TEAMS'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Disetujui (Approved)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-mono border border-green-500/20">
                {approvedList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('REJECTED_TEAMS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'REJECTED_TEAMS'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Ditolak (Rejected)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-mono border border-red-500/20">
                {rejectedList.length}
              </span>
            </button>

            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-4 mb-2">
              Manajemen Kompetisi
            </p>

            <button
              onClick={() => setActiveTab('DRAWING_RANDOMIZER')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'DRAWING_RANDOMIZER'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4 text-amber-400" />
              <span>Sistem Acak & Bracket</span>
            </button>

            <button
              onClick={() => setActiveTab('SCHEDULE_LIVESCORE')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'SCHEDULE_LIVESCORE'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Jadwal Pertandingan</span>
            </button>

            <button
              onClick={() => setActiveTab('CATEGORIES_PRIZES')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'CATEGORIES_PRIZES'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Kategori & Hadiah</span>
            </button>

            <button
              onClick={() => setActiveTab('SPONSORS')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'SPONSORS'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>Sponsorship</span>
            </button>

            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-4 mb-2">
              Sistem & Sinkronisasi
            </p>

            <button
              onClick={() => setActiveTab('ADMIN_USERS')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'ADMIN_USERS'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Kelola Admin Users</span>
            </button>

            <button
              onClick={() => setActiveTab('GAS_EXPORT_GUIDE')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'GAS_EXPORT_GUIDE'
                  ? 'bg-gradient-to-r from-red-600 to-blue-700 text-white shadow-lg shadow-red-900/20'
                  : 'text-blue-400 hover:bg-slate-800 hover:text-blue-300'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Google Sheets 3-File Hub</span>
            </button>
          </div>

          {/* DATABASE SYNC STATUS WIDGET */}
          <div className="mt-auto p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-slate-300">Database Sync</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-slate-400 mb-3">Connected to G-Sheets & Drive</p>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 w-3/4 h-full rounded-full"></div>
            </div>
          </div>
        </aside>

        {/* CMS CONTENT AREA */}
        <main className="flex-1 bg-[#0F172A] overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
          
          {/* MOBILE TABS SELECTOR */}
          <div className="md:hidden mb-2">
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value as CmsTab)}
              className="w-full bg-[#1E293B] border border-slate-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none"
            >
              <option value="OVERVIEW">📊 Ringkasan & Statistik</option>
              <option value="ALL_REGISTRATIONS">📋 Semua Pendaftaran ({registrations.length})</option>
              <option value="PENDING_PAYMENT">⏳ Menunggu Pembayaran ({pendingList.length})</option>
              <option value="APPROVED_TEAMS">✅ Tim Disetujui ({approvedList.length})</option>
              <option value="REJECTED_TEAMS">❌ Pendaftaran Ditolak ({rejectedList.length})</option>
              <option value="DRAWING_RANDOMIZER">🎲 Sistem Acak & Bracket</option>
              <option value="SCHEDULE_LIVESCORE">📅 Jadwal Pertandingan</option>
              <option value="CATEGORIES_PRIZES">🏆 Kategori & Hadiah</option>
              <option value="SPONSORS">🤝 Sponsorship</option>
              <option value="ADMIN_USERS">🛡️ Kelola Admin Users</option>
              <option value="GAS_EXPORT_GUIDE">📁 Google Sheets 3-File Hub</option>
            </select>
          </div>

          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-white uppercase">
                  DASHBOARD RINGKASAN TURNAMEN
                </h3>
                <p className="text-xs text-slate-400">
                  Pantau pertumbuhan registrasi, verifikasi berkas, dan pergerakan peserta secara real-time.
                </p>
              </div>

              {/* 4 STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold">Total Tim Mendaftar</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {registrations.length} <span className="text-xs text-slate-500 font-normal">Tim</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Seluruh 6 kategori kompetisi</p>
                </div>

                <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between text-xs text-green-400 mb-2">
                    <span className="font-semibold">Disetujui (Approved)</span>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400">
                    {approvedList.length} <span className="text-xs text-slate-500 font-normal">Tim</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Siap masuk drawing bracket</p>
                </div>

                <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between text-xs text-yellow-400 mb-2">
                    <span className="font-semibold">Menunggu Bayar</span>
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {pendingList.length} <span className="text-xs text-slate-500 font-normal">Tim</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Perlu verifikasi transfer</p>
                </div>

                <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between text-xs text-red-400 mb-2">
                    <span className="font-semibold">Total Uang Registrasi</span>
                    <DollarSign className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    Rp {totalCollectedRevenue.toLocaleString('id-ID')}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Dari tim berstatus lunas (PAID)</p>
                </div>
              </div>

              {/* CATEGORY DISTRIBUTION BARS */}
              <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-xl">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Distribusi Pendaftaran Berdasarkan Kategori
                </h4>

                <div className="space-y-4">
                  {categories.map(cat => {
                    const count = registrations.filter(r => r.category === cat.id).length;
                    const percent = Math.min(100, Math.round((count / cat.maxTeams) * 100));

                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-200">
                            {cat.name} ({cat.id})
                          </span>
                          <span className="text-slate-400 font-mono">
                            {count} / {cat.maxTeams} Tim ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-blue-600 rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2, 3, 4, 5: REGISTRATION TABLES (SEMUA, PENDING, APPROVED, REJECTED) */}
          {(activeTab === 'ALL_REGISTRATIONS' ||
            activeTab === 'PENDING_PAYMENT' ||
            activeTab === 'APPROVED_TEAMS' ||
            activeTab === 'REJECTED_TEAMS') && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* TABLE HEADER & FILTER BAR */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-heading font-bold uppercase tracking-wide">
                    {activeTab === 'ALL_REGISTRATIONS' && 'SEMUA BERKAS PENDAFTARAN TIM'}
                    {activeTab === 'PENDING_PAYMENT' && 'TAB KHUSUS: MENUNGGU PEMBAYARAN'}
                    {activeTab === 'APPROVED_TEAMS' && 'TAB KHUSUS: PENDAFTARAN DISETUJUI (APPROVED)'}
                    {activeTab === 'REJECTED_TEAMS' && 'TAB KHUSUS: PENDAFTARAN DITOLAK (REJECTED)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gunakan tabel ini untuk verifikasi berkas PDF, mengubah status, dan mengirim notifikasi WhatsApp otomatis.
                  </p>
                </div>

                {/* SEARCH & CATEGORY SELECTOR */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Cari tim, kode, WA..."
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500 w-48 sm:w-60"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="ALL">Semua Kategori</option>
                    <option value="SD">SD (U-12)</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="INSTANSI">Instansi</option>
                    <option value="UMUM">Umum</option>
                    <option value="DESA">Desa</option>
                  </select>
                </div>
              </div>

              {/* RENDER TABLE */}
              {(() => {
                const baseList =
                  activeTab === 'ALL_REGISTRATIONS'
                    ? registrations
                    : activeTab === 'PENDING_PAYMENT'
                    ? pendingList
                    : activeTab === 'APPROVED_TEAMS'
                    ? approvedList
                    : rejectedList;

                const displayItems = filterList(baseList);

                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                            <th className="py-3.5 px-4">Kode / Tim</th>
                            <th className="py-3.5 px-4">Kategori & Asal</th>
                            <th className="py-3.5 px-4">Pelatih & Kontak</th>
                            <th className="py-3.5 px-4">Dokumen PDF</th>
                            <th className="py-3.5 px-4">Biaya & Pembayaran</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-center">Aksi / Notifikasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {displayItems.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-10 text-slate-500">
                                Tidak ada data pendaftaran ditemukan pada tabel ini.
                              </td>
                            </tr>
                          ) : (
                            displayItems.map(item => (
                              <tr key={item.id} className="hover:bg-slate-800/60 transition">
                                
                                {/* KODE & NAMA TIM */}
                                <td className="py-3.5 px-4">
                                  <span className="font-mono text-red-400 font-bold block">
                                    {item.regCode}
                                  </span>
                                  <span className="font-bold text-white text-sm">
                                    {item.teamName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    Daftar: {item.registrationDate}
                                  </span>
                                </td>

                                {/* KATEGORI */}
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-950 font-bold text-slate-300 border border-slate-800">
                                    {item.category}
                                  </span>
                                  <p className="text-[11px] text-slate-300 font-medium mt-1 truncate max-w-[150px]">
                                    {item.institutionName}
                                  </p>
                                </td>

                                {/* PELATIH & WA */}
                                <td className="py-3.5 px-4">
                                  <span className="font-semibold text-white block">
                                    {item.coachName}
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                    <Phone className="w-3 h-3 text-emerald-400" />
                                    <span>{item.coachPhone}</span>
                                  </span>
                                </td>

                                {/* DOKUMEN PDF BUTTONS */}
                                <td className="py-3.5 px-4 space-y-1">
                                  <div className="flex flex-wrap gap-1">
                                    {item.documents.suratKeterangan && (
                                      <button
                                        onClick={() => handleOpenPdf(item.documents.suratKeterangan, 'Surat Keterangan', item.teamName)}
                                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-blue-400 flex items-center space-x-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Surat Ket</span>
                                      </button>
                                    )}
                                    {item.documents.suratPernyataan && (
                                      <button
                                        onClick={() => handleOpenPdf(item.documents.suratPernyataan, 'Surat Pernyataan', item.teamName)}
                                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-blue-400 flex items-center space-x-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Pernyataan</span>
                                      </button>
                                    )}
                                    {item.documents.formulirPemain && (
                                      <button
                                        onClick={() => handleOpenPdf(item.documents.formulirPemain, 'Formulir Pemain', item.teamName)}
                                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-blue-400 flex items-center space-x-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Form Pemain</span>
                                      </button>
                                    )}
                                    {item.documents.aktaKelahiran && (
                                      <button
                                        onClick={() => handleOpenPdf(item.documents.aktaKelahiran, 'Akta Kelahiran (Max 2014)', item.teamName)}
                                        className="px-2 py-0.5 rounded bg-red-950 hover:bg-red-900 text-[10px] text-red-300 flex items-center space-x-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Akta SD</span>
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* BIAYA & PEMBAYARAN */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <span className="font-bold text-white block">
                                    Rp {item.paymentAmount.toLocaleString('id-ID')}
                                  </span>
                                  <select
                                    value={item.paymentStatus}
                                    onChange={e => updatePaymentStatus(item.id, e.target.value as PaymentStatus)}
                                    className={`mt-1 text-[10px] font-bold rounded px-2 py-0.5 border focus:outline-none ${
                                      item.paymentStatus === 'PAID'
                                        ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                                        : item.paymentStatus === 'VERIFYING'
                                        ? 'bg-blue-950 text-blue-400 border-blue-700'
                                        : 'bg-amber-950 text-amber-400 border-amber-700'
                                    }`}
                                  >
                                    <option value="UNPAID">Belum Bayar</option>
                                    <option value="VERIFYING">Sedang Dicek</option>
                                    <option value="PAID">Lunas (Paid)</option>
                                  </select>
                                </td>

                                {/* STATUS VERIFIKASI */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {item.status === 'APPROVED' && (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-700 flex items-center space-x-1 w-fit">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Approved</span>
                                    </span>
                                  )}
                                  {item.status === 'PENDING_PAYMENT' && (
                                    <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 font-bold border border-amber-700 flex items-center space-x-1 w-fit">
                                      <Clock className="w-3 h-3" />
                                      <span>Pending Bayar</span>
                                    </span>
                                  )}
                                  {item.status === 'REJECTED' && (
                                    <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-400 font-bold border border-rose-700 flex items-center space-x-1 w-fit" title={item.rejectionReason}>
                                      <XCircle className="w-3 h-3" />
                                      <span>Ditolak</span>
                                    </span>
                                  )}
                                </td>

                                {/* AKSI & NOTIFIKASI WHATSAPP */}
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center space-x-1.5">
                                    
                                    {/* Setujui / Approve */}
                                    <button
                                      onClick={() => updateRegistrationStatus(item.id, 'APPROVED')}
                                      className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700"
                                      title="Setujui Berkas Tim Ini"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>

                                    {/* Tolak / Reject */}
                                    <button
                                      onClick={() => handleOpenReject(item)}
                                      className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-800 text-rose-300 border border-rose-700"
                                      title="Tolak / Minta Perbaikan Berkas"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>

                                    {/* Kirim WhatsApp Otomatis */}
                                    <a
                                      href={getWhatsAppNotificationUrl(
                                        item,
                                        item.status === 'APPROVED' ? 'APPROVED' : item.status === 'REJECTED' ? 'REJECTED' : 'PAYMENT_REMINDER'
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                                      title="Kirim Notifikasi WhatsApp Resmi ke Pelatih"
                                    >
                                      <Phone className="w-4 h-4" />
                                    </a>

                                    {/* Hapus */}
                                    <button
                                      onClick={() => {
                                        if (confirm(`Hapus data tim ${item.teamName}?`)) {
                                          deleteRegistration(item.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400"
                                      title="Hapus Registrasi"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>

                                  </div>
                                </td>

                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* TAB 6: SISTEM ACAK / DRAWING PERTANDINGAN (REQ #8) */}
          {activeTab === 'DRAWING_RANDOMIZER' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-heading font-bold uppercase tracking-wide flex items-center space-x-2">
                  <Shuffle className="w-6 h-6 text-amber-400" />
                  <span>SISTEM ACAK PERTANDINGAN (DRAWING GENERATOR)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Pengacakan otomatis sistem gugur (Knockout Draw) menggunakan algoritma Fisher-Yates yang adil dan transparan untuk seluruh kategori.
                </p>
              </div>

              {/* DRAWING CONTROL PANEL */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    Pilih Kategori untuk Dilakukan Pengacakan:
                  </label>
                  <div className="flex items-center space-x-2">
                    {(['SD', 'SMP', 'SMA', 'INSTANSI', 'UMUM', 'DESA'] as TournamentCategory[]).map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          setDrawCategory(c);
                          setDrawResultMatches(null);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                          drawCategory === c
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRunDrawing}
                  disabled={isDrawing}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Shuffle className={`w-4 h-4 ${isDrawing ? 'animate-spin' : ''}`} />
                  <span>{isDrawing ? 'Mengacak Tim...' : `🎲 Acak Bagan Match ${drawCategory}`}</span>
                </button>
              </div>

              {/* DRAWING RESULTS PREVIEW */}
              {drawResultMatches && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Hasil Undian Match Resmi Kategori {drawCategory}:</span>
                    </h4>
                    <span className="text-xs text-emerald-400 font-semibold">
                      ✓ Tersimpan Otomatis ke Jadwal Publik
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {drawResultMatches.map((m, idx) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            Match #{m.matchNumber} • {m.round}
                          </span>
                          <p className="font-bold text-white text-sm mt-1">
                            {m.teamA.name} <span className="text-red-500 font-normal">vs</span> {m.teamB.name}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {m.date} • {m.time} WIB • {m.pitch}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 font-mono font-bold text-xs text-amber-400 border border-slate-800">
                          VS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: KELOLA JADWAL & LIVE SCORE (REQ #9) */}
          {activeTab === 'SCHEDULE_LIVESCORE' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-heading font-bold uppercase tracking-wide">
                    KELOLA JADWAL & LIVE SCORE CONTROLLER
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update skor langsung, menit pertandingan, kartu kuning/merah, atau tambah jadwal manual.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const newM: MatchItem = {
                      id: `match-new-${Date.now()}`,
                      matchNumber: matches.length + 1,
                      category: 'SMA',
                      round: 'Babak Penyisihan',
                      roundIndex: 2,
                      teamA: { name: 'Tim A Baru' },
                      teamB: { name: 'Tim B Baru' },
                      date: '2026-10-26',
                      time: '14:00',
                      pitch: 'Lapangan 1 - Utama',
                      status: 'UPCOMING',
                    };
                    addMatch(newM);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pertandingan Baru</span>
                </button>
              </div>

              {/* MATCHES LIST FOR ADMIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map(m => {
                  const isLive = m.status === 'LIVE';

                  return (
                    <div
                      key={m.id}
                      className={`p-5 rounded-2xl border transition shadow-lg ${
                        isLive
                          ? 'bg-gradient-to-b from-slate-900 to-red-950/40 border-red-500'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 mb-3">
                        <span className="font-bold text-red-400">{m.category} • {m.round}</span>
                        <select
                          value={m.status}
                          onChange={e => updateMatch({ ...m, status: e.target.value as MatchStatus })}
                          className="bg-slate-950 text-[10px] font-bold text-white rounded px-2 py-0.5 border border-slate-700"
                        >
                          <option value="UPCOMING">UPCOMING</option>
                          <option value="LIVE">🔴 LIVE</option>
                          <option value="FINISHED">FINISHED</option>
                        </select>
                      </div>

                      {/* TEAMS AND SCORE INPUT */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={m.teamA.name}
                            onChange={e =>
                              updateMatch({
                                ...m,
                                teamA: { ...m.teamA, name: e.target.value },
                              })
                            }
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white w-40"
                          />
                          <input
                            type="number"
                            min={0}
                            value={m.teamA.score ?? 0}
                            onChange={e =>
                              updateMatch({
                                ...m,
                                teamA: { ...m.teamA, score: Number(e.target.value) },
                              })
                            }
                            className="w-12 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-sm text-red-400"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={m.teamB.name}
                            onChange={e =>
                              updateMatch({
                                ...m,
                                teamB: { ...m.teamB, name: e.target.value },
                              })
                            }
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white w-40"
                          />
                          <input
                            type="number"
                            min={0}
                            value={m.teamB.score ?? 0}
                            onChange={e =>
                              updateMatch({
                                ...m,
                                teamB: { ...m.teamB, score: Number(e.target.value) },
                              })
                            }
                            className="w-12 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-sm text-blue-400"
                          />
                        </div>
                      </div>

                      {/* DATE & VENUE INPUTS */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                        <input
                          type="date"
                          value={m.date}
                          onChange={e => updateMatch({ ...m, date: e.target.value })}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                        />
                        <input
                          type="time"
                          value={m.time}
                          onChange={e => updateMatch({ ...m, time: e.target.value })}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <input
                          type="text"
                          value={m.pitch}
                          onChange={e => updateMatch({ ...m, pitch: e.target.value })}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-400 w-36 truncate"
                        />
                        <button
                          onClick={() => deleteMatch(m.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Hapus Match"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: KELOLA KATEGORI & TOTAL HADIAH (REQ #1) */}
          {activeTab === 'CATEGORIES_PRIZES' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-heading font-bold uppercase tracking-wide">
                  KELOLA KATEGORI & TOTAL HADIAH
                </h3>
                <p className="text-xs text-slate-400">
                  Ubah total hadiah, biaya registrasi, batasan usia, dan rincian juara per kategori secara real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map(c => (
                  <div key={c.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="px-2.5 py-1 rounded-md bg-red-600 text-white font-bold text-xs">
                        {c.id}
                      </span>
                      <h4 className="text-lg font-bold text-white">{c.name}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Total Hadiah (Rp)</label>
                        <input
                          type="number"
                          value={c.totalPrize}
                          onChange={e => updateCategory({ ...c, totalPrize: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-red-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Biaya Registrasi (Rp)</label>
                        <input
                          type="number"
                          value={c.registrationFee}
                          onChange={e => updateCategory({ ...c, registrationFee: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Syarat & Batasan Usia</label>
                      <input
                        type="text"
                        value={c.ageRestriction}
                        onChange={e => updateCategory({ ...c, ageRestriction: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Rincian Hadiah Juara 1</label>
                      <input
                        type="number"
                        value={c.prizes[0]?.prizeMoney || 0}
                        onChange={e => {
                          const prizesCopy = [...c.prizes];
                          if (prizesCopy[0]) prizesCopy[0].prizeMoney = Number(e.target.value);
                          updateCategory({ ...c, prizes: prizesCopy });
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: KELOLA SPONSOR (REQ #4) */}
          {activeTab === 'SPONSORS' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-heading font-bold uppercase tracking-wide">
                    KELOLA SPONSOR & MITRA KERJASAMA
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tambah, edit, dan hapus sponsor turnamen untuk ditampilkan di landing page publik.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newSp: SponsorItem = {
                      id: `sp-${Date.now()}`,
                      name: 'Mitra Sponsor Baru',
                      tier: 'GOLD',
                      logoText: 'SP',
                      websiteUrl: 'https://google.com',
                      description: 'Official Partner',
                    };
                    addSponsor(newSp);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sponsor</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sponsors.map(sp => (
                  <div key={sp.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <select
                        value={sp.tier}
                        onChange={e => updateSponsor({ ...sp, tier: e.target.value as SponsorTier })}
                        className="bg-slate-950 text-xs font-bold text-amber-400 rounded px-2 py-1 border border-slate-700"
                      >
                        <option value="PLATINUM">PLATINUM</option>
                        <option value="GOLD">GOLD</option>
                        <option value="SILVER">SILVER</option>
                        <option value="OFFICIAL_PARTNER">OFFICIAL PARTNER</option>
                      </select>

                      <button
                        onClick={() => deleteSponsor(sp.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Hapus Sponsor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={sp.name}
                      onChange={e => updateSponsor({ ...sp, name: e.target.value })}
                      placeholder="Nama Sponsor"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
                    />

                    <input
                      type="text"
                      value={sp.websiteUrl || ''}
                      onChange={e => updateSponsor({ ...sp, websiteUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-blue-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: KELOLA ADMIN USERS (REQ #6) */}
          {activeTab === 'ADMIN_USERS' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-heading font-bold uppercase tracking-wide">
                    KELOLA ADMIN & OPERATOR SISTEM
                  </h3>
                  <p className="text-xs text-slate-400">
                    Daftar akun panitia yang memiliki akses ke dashboard CMS WabupCup 2026.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const u = prompt('Masukkan Username Admin Baru:');
                    if (u) {
                      addAdminUser({
                        username: u.toLowerCase().trim(),
                        fullName: `Panitia ${u}`,
                        role: 'PANITIA',
                        email: `${u}@wabupcup2026.id`,
                        phone: '081234567890',
                        avatarColor: 'bg-blue-600',
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Admin</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                      <th className="py-3.5 px-4">Nama & Username</th>
                      <th className="py-3.5 px-4">Role Akses</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">No. HP</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {adminUsers.map(adm => (
                      <tr key={adm.id} className="hover:bg-slate-800/60">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{adm.fullName}</span>
                          <span className="font-mono text-red-400 text-[11px]">@{adm.username}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-bold border border-slate-800">
                            {adm.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{adm.email}</td>
                        <td className="py-3.5 px-4 text-slate-400">{adm.phone}</td>
                        <td className="py-3.5 px-4 text-center">
                          {adm.username !== 'superadmin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus admin @${adm.username}?`)) {
                                  deleteAdminUser(adm.id);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 11: GOOGLE APPS SCRIPT 3-FILE HUB & DEPLOYMENT GUIDE */}
          {activeTab === 'GAS_EXPORT_GUIDE' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-2xl sm:text-3xl font-heading font-bold uppercase tracking-wide flex items-center space-x-2">
                  <FileCode className="w-6 h-6 text-amber-400" />
                  <span>ARSITEKTUR 3-FILE GOOGLE APPS SCRIPT & PANDUAN DEPLOYMENT</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Kode 100% lengkap tanpa potongan untuk database Google Sheets, backend Drive API, dan frontend SPA mandiri.
                </p>
              </div>

              {/* FILE SELECTOR TABS & ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center space-x-2 overflow-x-auto">
                  {(['setup.gs', 'Code.gs', 'Index.html', 'Panduan_Deploy'] as const).map(fileName => (
                    <button
                      key={fileName}
                      onClick={() => setGasActiveFile(fileName)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        gasActiveFile === fileName
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {fileName === 'setup.gs' && '1. setup.gs (Database Sheets)'}
                      {fileName === 'Code.gs' && '2. Code.gs (Backend API & Drive)'}
                      {fileName === 'Index.html' && '3. Index.html (Frontend SPA)'}
                      {fileName === 'Panduan_Deploy' && '📖 Panduan Deploy & Git'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleCopyGasCode}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition flex items-center space-x-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{copiedGas ? 'Tersalin ke Clipboard!' : 'Salin Kode'}</span>
                  </button>

                  <button
                    onClick={handleDownloadGasFile}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>

              {/* CODE DISPLAY BOX */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-xs text-slate-300 overflow-x-auto max-h-[600px] shadow-2xl leading-relaxed">
                <pre className="whitespace-pre">
                  {gasActiveFile === 'setup.gs' && SETUP_GS_CODE}
                  {gasActiveFile === 'Code.gs' && CODE_GS_CODE}
                  {gasActiveFile === 'Index.html' && INDEX_HTML_STANDALONE_TEMPLATE}
                  {gasActiveFile === 'Panduan_Deploy' && DEPLOYMENT_AND_GIT_GUIDE}
                </pre>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* FOOTER STATUS BAR - PROFESSIONAL POLISH */}
      <footer className="h-8 bg-[#111827] border-t border-slate-800 flex items-center justify-between px-6 shrink-0 text-[11px] text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-mono text-slate-300">System Ready</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline font-mono">Operator: {currentAdmin.fullName} ({currentAdmin.role})</span>
        </div>
        <div className="flex items-center space-x-4 font-mono">
          <span>v2.6.0-PRO</span>
          <span className="text-red-500 font-bold">WABUPCUP 2026</span>
        </div>
      </footer>

      {/* PDF VIEWER MODAL */}
      <PdfViewerModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        document={selectedDoc}
        documentTitle={selectedDocTitle}
        teamName={selectedTeamName}
      />

      {/* REJECTION REASON MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-rose-400 uppercase">
              Tolak / Minta Perbaikan Berkas
            </h4>
            <p className="text-xs text-slate-400">
              Tuliskan alasan penolakan atau instruksi perbaikan berkas untuk tim <strong className="text-white">{targetRejectItem?.teamName}</strong>.
            </p>

            <textarea
              rows={4}
              value={rejectionReasonText}
              onChange={e => setRejectionReasonText(e.target.value)}
              placeholder="Contoh: Akta kelahiran belum dilegalisir, terdapat 2 pemain melebihi batas usia 2014..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            ></textarea>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
