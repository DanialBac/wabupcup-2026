import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  AdminRole,
  AdminUser,
  CategoryDetail,
  CommitteeBankAccount,
  CommitteeContact,
  CommitteeEmail,
  DownloadableDoc,
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
  Eye,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  X,
  Settings,
  Mail,
  CreditCard,
  FileSpreadsheet,
  FolderDown,
  Building,
  MapPin,
  Save,
  HelpCircle,
  CheckSquare,
  Share2,
  AlertCircle
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
    updateConfig,
    downloadableDocs,
    addDownloadableDoc,
    updateDownloadableDoc,
    deleteDownloadableDoc,
    committeeContacts,
    addCommitteeContact,
    updateCommitteeContact,
    deleteCommitteeContact,
    setPrimaryCommitteeContact,
    committeeEmails,
    addCommitteeEmail,
    updateCommitteeEmail,
    deleteCommitteeEmail,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    setPrimaryBankAccount,
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
    | 'SETTINGS'
    | 'ADMIN_USERS'
    | 'GAS_EXPORT_GUIDE';

  const [activeTab, setActiveTab] = useState<CmsTab>('OVERVIEW');

  // Settings Sub-Tab State
  type SettingsSubTab = 'DOCS' | 'WHATSAPP' | 'EMAIL' | 'BANK' | 'QUOTA' | 'GENERAL';
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('DOCS');
  const [quotaSaveSuccess, setQuotaSaveSuccess] = useState(false);

  // 1. Downloadable Document Form State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DownloadableDoc | null>(null);
  const [docForm, setDocForm] = useState<{
    title: string;
    category: string;
    description: string;
    fileName: string;
    fileSize: string;
    fileUrl: string;
    fileType: 'PDF' | 'DOCX' | 'XLSX' | 'ZIP' | 'IMAGE' | 'OTHER';
    isPrimary: boolean;
  }>({
    title: '',
    category: 'Formulir Pendaftaran',
    description: '',
    fileName: '',
    fileSize: '1.2 MB',
    fileUrl: '',
    fileType: 'PDF',
    isPrimary: false,
  });
  const [docFileSource, setDocFileSource] = useState<'UPLOAD' | 'URL'>('UPLOAD');
  const [docFilePreview, setDocFilePreview] = useState<string>('');

  // 2. Committee Contact (WA) Form State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CommitteeContact | null>(null);
  const [contactForm, setContactForm] = useState<{
    name: string;
    phone: string;
    role: string;
    isPrimary: boolean;
  }>({
    name: '',
    phone: '',
    role: '',
    isPrimary: false,
  });

  // 3. Committee Email Form State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<CommitteeEmail | null>(null);
  const [emailForm, setEmailForm] = useState<{
    title: string;
    email: string;
    isPrimary: boolean;
  }>({
    title: '',
    email: '',
    isPrimary: false,
  });

  // 4. Committee Bank Account Form State
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<CommitteeBankAccount | null>(null);
  const [bankForm, setBankForm] = useState<{
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branchName: string;
    instructions: string;
    isPrimary: boolean;
  }>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branchName: '',
    instructions: '',
    isPrimary: false,
  });

  // 5. General Tournament Info Form State
  const [generalConfigForm, setGeneralConfigForm] = useState({
    name: config.name,
    edition: config.edition,
    tagline: config.tagline,
    registrationDeadline: config.registrationDeadline,
    tournamentStartDate: config.tournamentStartDate,
    tournamentEndDate: config.tournamentEndDate,
    venueName: config.venueName,
    venueAddress: config.venueAddress,
    venueCity: config.venueCity,
    googleMapsEmbedUrl: config.googleMapsEmbedUrl,
    totalPrizePool: config.totalPrizePool,
  });
  const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);

  // Downloadable Docs Handlers
  const handleOpenAddDoc = () => {
    setEditingDoc(null);
    setDocForm({
      title: '',
      category: 'Formulir Pendaftaran',
      description: '',
      fileName: '',
      fileSize: '1.2 MB',
      fileUrl: '',
      fileType: 'PDF',
      isPrimary: false,
    });
    setDocFilePreview('');
    setDocFileSource('UPLOAD');
    setDocModalOpen(true);
  };

  const handleOpenEditDoc = (doc: DownloadableDoc) => {
    setEditingDoc(doc);
    setDocForm({
      title: doc.title,
      category: doc.category || 'Formulir Pendaftaran',
      description: doc.description || '',
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType,
      isPrimary: !!doc.isPrimary,
    });
    setDocFilePreview(doc.fileUrl);
    setDocFileSource(doc.fileUrl.startsWith('data:') ? 'UPLOAD' : 'URL');
    setDocModalOpen(true);
  };

  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Ukuran file maksimal 15 MB.');
      return;
    }

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const extension = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    let fType: 'PDF' | 'DOCX' | 'XLSX' | 'ZIP' | 'IMAGE' | 'OTHER' = 'PDF';
    if (extension === 'DOC' || extension === 'DOCX') fType = 'DOCX';
    else if (extension === 'XLS' || extension === 'XLSX') fType = 'XLSX';
    else if (extension === 'ZIP' || extension === 'RAR') fType = 'ZIP';
    else if (['PNG', 'JPG', 'JPEG', 'WEBP'].includes(extension)) fType = 'IMAGE';
    else if (extension === 'PDF') fType = 'PDF';
    else fType = 'OTHER';

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setDocFilePreview(dataUrl);
      setDocForm(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeInMb,
        fileType: fType,
        fileUrl: dataUrl,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title.trim()) {
      alert('Mohon masukkan nama / judul berkas.');
      return;
    }
    const finalFileUrl = docFilePreview.trim() || docForm.fileUrl.trim() || '#';
    const finalFileName = docForm.fileName.trim() || `${docForm.title.replace(/\s+/g, '_')}.${docForm.fileType.toLowerCase()}`;

    if (editingDoc) {
      updateDownloadableDoc({
        ...editingDoc,
        title: docForm.title.trim(),
        category: docForm.category.trim(),
        description: docForm.description.trim(),
        fileName: finalFileName,
        fileSize: docForm.fileSize.trim() || '1.0 MB',
        fileUrl: finalFileUrl,
        fileType: docForm.fileType,
        isPrimary: docForm.isPrimary,
      });
    } else {
      addDownloadableDoc({
        title: docForm.title.trim(),
        category: docForm.category.trim(),
        description: docForm.description.trim(),
        fileName: finalFileName,
        fileSize: docForm.fileSize.trim() || '1.0 MB',
        fileUrl: finalFileUrl,
        fileType: docForm.fileType,
        isPrimary: docForm.isPrimary,
      });
    }
    setDocModalOpen(false);
  };

  // WhatsApp Contact Handlers
  const handleOpenAddContact = () => {
    setEditingContact(null);
    setContactForm({
      name: '',
      phone: '',
      role: 'Sekretariat Pendaftaran',
      isPrimary: committeeContacts.length === 0,
    });
    setContactModalOpen(true);
  };

  const handleOpenEditContact = (contact: CommitteeContact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      phone: contact.phone,
      role: contact.role,
      isPrimary: !!contact.isPrimary,
    });
    setContactModalOpen(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      alert('Mohon lengkapi nama kontak dan nomor WhatsApp.');
      return;
    }
    if (editingContact) {
      updateCommitteeContact({
        ...editingContact,
        name: contactForm.name.trim(),
        phone: contactForm.phone.trim(),
        role: contactForm.role.trim() || 'Panitia Turnamen',
        isPrimary: contactForm.isPrimary,
      });
    } else {
      addCommitteeContact({
        name: contactForm.name.trim(),
        phone: contactForm.phone.trim(),
        role: contactForm.role.trim() || 'Panitia Turnamen',
        isPrimary: contactForm.isPrimary,
      });
    }
    setContactModalOpen(false);
  };

  // Email Handlers
  const handleOpenAddEmail = () => {
    setEditingEmail(null);
    setEmailForm({
      title: 'Sekretariat Utama',
      email: '',
      isPrimary: committeeEmails.length === 0,
    });
    setEmailModalOpen(true);
  };

  const handleOpenEditEmail = (item: CommitteeEmail) => {
    setEditingEmail(item);
    setEmailForm({
      title: item.title,
      email: item.email,
      isPrimary: !!item.isPrimary,
    });
    setEmailModalOpen(true);
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.email.trim()) {
      alert('Mohon masukkan alamat email resmi.');
      return;
    }
    if (editingEmail) {
      updateCommitteeEmail({
        ...editingEmail,
        title: emailForm.title.trim() || 'Sekretariat',
        email: emailForm.email.trim(),
        isPrimary: emailForm.isPrimary,
      });
    } else {
      addCommitteeEmail({
        title: emailForm.title.trim() || 'Sekretariat',
        email: emailForm.email.trim(),
        isPrimary: emailForm.isPrimary,
      });
    }
    setEmailModalOpen(false);
  };

  // Bank Account Handlers
  const handleOpenAddBank = () => {
    setEditingBank(null);
    setBankForm({
      bankName: 'Bank Nagari',
      accountNumber: '',
      accountHolder: 'PANITIA WABUPCUP 2026',
      branchName: 'Kantor Cabang Utama',
      instructions: 'Transfer ATM / Mobile Banking / Teller',
      isPrimary: bankAccounts.length === 0,
    });
    setBankModalOpen(true);
  };

  const handleOpenEditBank = (bank: CommitteeBankAccount) => {
    setEditingBank(bank);
    setBankForm({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountHolder: bank.accountHolder,
      branchName: bank.branchName || '',
      instructions: bank.instructions || '',
      isPrimary: !!bank.isPrimary,
    });
    setBankModalOpen(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim() || !bankForm.accountHolder.trim()) {
      alert('Mohon lengkapi Nama Bank, Nomor Rekening, dan Nama Pemilik Rekening.');
      return;
    }
    if (editingBank) {
      updateBankAccount({
        ...editingBank,
        bankName: bankForm.bankName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        accountHolder: bankForm.accountHolder.trim(),
        branchName: bankForm.branchName.trim() || undefined,
        instructions: bankForm.instructions.trim() || undefined,
        isPrimary: bankForm.isPrimary,
      });
    } else {
      addBankAccount({
        bankName: bankForm.bankName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        accountHolder: bankForm.accountHolder.trim(),
        branchName: bankForm.branchName.trim() || undefined,
        instructions: bankForm.instructions.trim() || undefined,
        isPrimary: bankForm.isPrimary,
      });
    }
    setBankModalOpen(false);
  };

  // General Config Handler
  const handleSaveGeneralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      name: generalConfigForm.name.trim(),
      edition: generalConfigForm.edition.trim(),
      tagline: generalConfigForm.tagline.trim(),
      registrationDeadline: generalConfigForm.registrationDeadline.trim(),
      tournamentStartDate: generalConfigForm.tournamentStartDate.trim(),
      tournamentEndDate: generalConfigForm.tournamentEndDate.trim(),
      venueName: generalConfigForm.venueName.trim(),
      venueAddress: generalConfigForm.venueAddress.trim(),
      venueCity: generalConfigForm.venueCity.trim(),
      googleMapsEmbedUrl: generalConfigForm.googleMapsEmbedUrl.trim(),
      totalPrizePool: Number(generalConfigForm.totalPrizePool) || config.totalPrizePool,
    });
    setGeneralSaveSuccess(true);
    setTimeout(() => setGeneralSaveSuccess(false), 3000);
  };

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
  const [sponsorForm, setSponsorForm] = useState<{
    name: string;
    tier: SponsorTier;
    logoText: string;
    logoUrl: string;
    websiteUrl: string;
    description: string;
  }>({
    name: '',
    tier: 'GOLD',
    logoText: '',
    logoUrl: '',
    websiteUrl: '',
    description: '',
  });
  const [sponsorLogoPreview, setSponsorLogoPreview] = useState<string>('');
  const [sponsorLogoType, setSponsorLogoType] = useState<'UPLOAD' | 'URL'>('UPLOAD');

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

  // SPONSOR MANAGEMENT ACTIONS
  const handleOpenAddSponsor = () => {
    setEditingSponsor(null);
    setSponsorForm({
      name: '',
      tier: 'GOLD',
      logoText: '',
      logoUrl: '',
      websiteUrl: '',
      description: '',
    });
    setSponsorLogoPreview('');
    setSponsorLogoType('UPLOAD');
    setSponsorModalOpen(true);
  };

  const handleOpenEditSponsor = (sp: SponsorItem) => {
    setEditingSponsor(sp);
    setSponsorForm({
      name: sp.name,
      tier: sp.tier,
      logoText: sp.logoText || '',
      logoUrl: sp.logoUrl || '',
      websiteUrl: sp.websiteUrl || '',
      description: sp.description || '',
    });
    setSponsorLogoPreview(sp.logoUrl || '');
    setSponsorLogoType(sp.logoUrl?.startsWith('data:') ? 'UPLOAD' : sp.logoUrl ? 'URL' : 'UPLOAD');
    setSponsorModalOpen(true);
  };

  const handleSponsorFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSponsorLogoPreview(dataUrl);
      setSponsorForm(prev => ({ ...prev, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorForm.name.trim()) {
      alert('Mohon masukkan nama sponsor / perusahaan.');
      return;
    }

    const finalLogoText = sponsorForm.logoText.trim() || sponsorForm.name.slice(0, 4).toUpperCase();
    const finalLogoUrl = sponsorLogoPreview.trim() || sponsorForm.logoUrl.trim() || undefined;

    if (editingSponsor) {
      updateSponsor({
        ...editingSponsor,
        name: sponsorForm.name.trim(),
        tier: sponsorForm.tier,
        logoText: finalLogoText,
        logoUrl: finalLogoUrl,
        websiteUrl: sponsorForm.websiteUrl.trim() || undefined,
        description: sponsorForm.description.trim() || undefined,
      });
    } else {
      addSponsor({
        name: sponsorForm.name.trim(),
        tier: sponsorForm.tier,
        logoText: finalLogoText,
        logoUrl: finalLogoUrl,
        websiteUrl: sponsorForm.websiteUrl.trim() || undefined,
        description: sponsorForm.description.trim() || undefined,
      });
    }

    setSponsorModalOpen(false);
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
              onClick={() => setActiveTab('SETTINGS')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'SETTINGS'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Pengaturan & Berkas</span>
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
              <option value="SETTINGS">⚙️ Pengaturan & Berkas (Settings)</option>
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
                {categories.map(c => {
                  const catRegs = registrations.filter(r => r.category === c.id && r.status !== 'REJECTED');
                  const count = Math.max(catRegs.length, c.registeredTeamsCount || 0);
                  const isFull = count >= c.maxTeams;
                  const remaining = Math.max(0, c.maxTeams - count);
                  const percent = Math.min(100, Math.round((count / c.maxTeams) * 100));

                  return (
                    <div key={c.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 rounded-md bg-red-600 text-white font-bold text-xs">
                            {c.id}
                          </span>
                          <h4 className="text-lg font-bold text-white">{c.name}</h4>
                        </div>
                        {isFull ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center space-x-1">
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>KUOTA PENUH</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {count}/{c.maxTeams} Tim ({remaining} Sisa)
                          </span>
                        )}
                      </div>

                      {/* QUOTA BAR */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          <span>Slot Terisi ({count} dari {c.maxTeams} Tim)</span>
                          <span className={isFull ? 'text-red-400' : 'text-emerald-400'}>{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                            Kuota Maksimal (Tim)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={c.maxTeams}
                            onChange={e => updateCategory({ ...c, maxTeams: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-full bg-slate-950 border border-amber-500/40 focus:border-amber-400 rounded-lg px-3 py-1.5 text-amber-400 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                            Total Hadiah (Rp)
                          </label>
                          <input
                            type="number"
                            value={c.totalPrize}
                            onChange={e => updateCategory({ ...c, totalPrize: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-red-400 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                            Biaya Registrasi (Rp)
                          </label>
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
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Rincian Hadiah Juara 1 (Rp)</label>
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
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 9: KELOLA SPONSOR (REQ #4 & #5) */}
          {activeTab === 'SPONSORS' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-heading font-bold uppercase tracking-wide text-white">
                    KELOLA SPONSOR & MITRA KERJASAMA
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kelola sponsor turnamen: upload logo gambar, tautkan link website resmi, dan atur tingkatan sponsor.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddSponsor}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-red-950/40 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sponsor Baru</span>
                </button>
              </div>

              {/* SPONSOR CARDS GRID */}
              {sponsors.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-white">Belum Ada Sponsor</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Klik tombol Tambah Sponsor Baru di atas untuk menambahkan sponsor atau mitra resmi turnamen.
                  </p>
                  <button
                    onClick={handleOpenAddSponsor}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Tambah Sponsor Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sponsors.map(sp => {
                    const tierBadgeColors: Record<SponsorTier, string> = {
                      PLATINUM: 'bg-red-600/20 text-red-400 border-red-500/30',
                      GOLD: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                      SILVER: 'bg-slate-700 text-slate-200 border-slate-600',
                      OFFICIAL_PARTNER: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
                    };

                    return (
                      <div
                        key={sp.id}
                        className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-xl space-y-4 group"
                      >
                        <div>
                          {/* TOP HEADER: TIER & ACTIONS */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${tierBadgeColors[sp.tier]}`}>
                              {sp.tier}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleOpenEditSponsor(sp)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                                title="Edit Sponsor"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus sponsor "${sp.name}"?`)) {
                                    deleteSponsor(sp.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-white hover:bg-rose-600 transition"
                                title="Hapus Sponsor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* LOGO PREVIEW BOX */}
                          <div className="w-full h-24 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-3 mb-3 overflow-hidden group-hover:border-slate-700 transition">
                            {sp.logoUrl ? (
                              <img
                                src={sp.logoUrl}
                                alt={sp.name}
                                referrerPolicy="no-referrer"
                                className="max-h-16 max-w-full object-contain filter drop-shadow"
                                onError={(e) => {
                                  // Fallback if image load fails
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-blue-700 flex items-center justify-center font-bold text-sm text-white shadow">
                                  {(sp.logoText || sp.name).slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-mono text-xs font-bold text-slate-300 tracking-wider">
                                  {sp.logoText || sp.name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* SPONSOR INFO */}
                          <div className="space-y-1">
                            <h4 className="font-bold text-base text-white leading-tight group-hover:text-red-400 transition-colors">
                              {sp.name}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {sp.description || 'Mitra Resmi Turnamen'}
                            </p>
                          </div>
                        </div>

                        {/* BOTTOM LINK & QUICK EDIT */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          {sp.websiteUrl ? (
                            <a
                              href={sp.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition truncate max-w-[200px]"
                            >
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{sp.websiteUrl.replace(/^https?:\/\//i, '')}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Tanpa tautan web</span>
                          )}

                          <button
                            onClick={() => handleOpenEditSponsor(sp)}
                            className="text-xs font-bold text-slate-400 hover:text-white transition"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

          {/* TAB 12: SETTINGS (BERKAS, WA, EMAIL, REKENING, PENGATURAN UMUM) */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 animate-fadeIn">
              {/* SETTINGS HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center space-x-2.5">
                    <Settings className="w-6 h-6 text-cyan-400" />
                    <span>Pusat Pengaturan Sistem & Berkas</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Kelola berkas unduhan publik, kontak WhatsApp panitia, email resmi, rekening bank pembayaran, dan informasi umum turnamen.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400">
                    Auto-Sync LocalStorage & Landing Page
                  </span>
                </div>
              </div>

              {/* SETTINGS SUB-NAV TABS */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800/80">
                <button
                  onClick={() => setSettingsSubTab('DOCS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                    settingsSubTab === 'DOCS'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <FolderDown className="w-4 h-4" />
                  <span>1. Berkas Unduhan ({downloadableDocs.length})</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('WHATSAPP')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                    settingsSubTab === 'WHATSAPP'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>2. Kontak WhatsApp ({committeeContacts.length})</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('EMAIL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                    settingsSubTab === 'EMAIL'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>3. Email Panitia ({committeeEmails.length})</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('BANK')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                    settingsSubTab === 'BANK'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>4. Rekening Bank ({bankAccounts.length})</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('QUOTA')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                    settingsSubTab === 'QUOTA'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-amber-300" />
                  <span>5. Kuota Pendaftaran Kategori ({categories.length})</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('GENERAL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                    settingsSubTab === 'GENERAL'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>6. Informasi Turnamen</span>
                </button>
              </div>

              {/* SUB-TAB 1: DOKUMEN UNDUHAN PUBLIK */}
              {settingsSubTab === 'DOCS' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase flex items-center space-x-2">
                        <FolderDown className="w-4 h-4 text-cyan-400" />
                        <span>Daftar Berkas & Dokumen Resmi Turnamen</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Berkas ini dapat diunduh oleh calon pendaftar di Footer, Hero, dan Form Pendaftaran.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenAddDoc}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-cyan-950/60 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Berkas Baru</span>
                    </button>
                  </div>

                  {downloadableDocs.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                      <FolderDown className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="text-sm font-bold text-slate-300">Belum ada berkas unduhan yang terdaftar</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Klik tombol di atas untuk mengunggah formulir pendaftaran, regulasi teknis, atau template surat.
                      </p>
                      <button
                        onClick={handleOpenAddDoc}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition inline-flex items-center space-x-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Berkas Pertama</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {downloadableDocs.map(doc => (
                        <div
                          key={doc.id}
                          className={`p-5 rounded-2xl bg-slate-900 border transition flex flex-col justify-between space-y-4 hover:border-slate-700 ${
                            doc.isPrimary ? 'border-cyan-500/40 shadow-lg shadow-cyan-950/20' : 'border-slate-800'
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    doc.fileType === 'PDF'
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : doc.fileType === 'DOCX'
                                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                      : doc.fileType === 'XLSX'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : doc.fileType === 'ZIP'
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : 'bg-slate-700 text-slate-300'
                                  }`}
                                >
                                  {doc.fileType}
                                </span>
                                {doc.isPrimary && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    ⭐ Utama
                                  </span>
                                )}
                              </div>

                              <span className="text-[10px] text-slate-400 font-mono">
                                {doc.fileSize}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-bold text-sm text-white leading-snug">
                                {doc.title}
                              </h5>
                              <p className="text-[11px] text-cyan-400/90 font-medium mt-0.5">
                                {doc.category || 'Dokumen Umum'}
                              </p>
                              {doc.description && (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                  {doc.description}
                                </p>
                              )}
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono truncate">
                              📁 {doc.fileName}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={doc.fileName}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 transition flex items-center space-x-1.5 cursor-pointer"
                              title="Test Unduh Berkas"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Test Unduh</span>
                            </a>

                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleOpenEditDoc(doc)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Edit Berkas"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus berkas "${doc.title}"?`)) {
                                    deleteDownloadableDoc(doc.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                                title="Hapus Berkas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: KONTAK WHATSAPP PANITIA */}
              {settingsSubTab === 'WHATSAPP' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <span>Daftar Nomor WhatsApp Resmi Panitia</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kontak WhatsApp berlabel <strong className="text-emerald-400">Utama</strong> akan digunakan pada tombol konfirmasi pendaftaran, notifikasi, dan floating chat.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenAddContact}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-950/60 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Kontak WA</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {committeeContacts.map(c => {
                      const clean = c.phone.replace(/\D/g, '');
                      const formattedWa = clean.startsWith('0') ? `62${clean.slice(1)}` : clean;
                      return (
                        <div
                          key={c.id}
                          className={`p-5 rounded-2xl bg-slate-900 border transition flex flex-col justify-between space-y-4 ${
                            c.isPrimary ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/20' : 'border-slate-800'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                                {c.role}
                              </span>
                              {c.isPrimary ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ⭐ Kontak Utama
                                </span>
                              ) : (
                                <button
                                  onClick={() => setPrimaryCommitteeContact(c.id)}
                                  className="text-[10px] text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                                >
                                  Set Jadi Utama
                                </button>
                              )}
                            </div>

                            <div>
                              <h5 className="font-bold text-sm text-white">
                                {c.name}
                              </h5>
                              <p className="font-mono text-xs text-emerald-400 font-semibold mt-0.5">
                                📞 {c.phone}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                            <a
                              href={`https://wa.me/${formattedWa}?text=${encodeURIComponent('Halo Panitia WabupCup 2026, saya ingin bertanya seputar turnamen...')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Test Chat WA</span>
                            </a>

                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleOpenEditContact(c)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Edit Kontak"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {committeeContacts.length > 1 && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus kontak "${c.name}"?`)) {
                                      deleteCommitteeContact(c.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                                  title="Hapus Kontak"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: EMAIL RESMI PANITIA */}
              {settingsSubTab === 'EMAIL' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <span>Daftar Email Resmi Panitia</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Alamat email resmi untuk korespondensi surat undangan, rekomendasi, dan pertanyaan resmi peserta.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenAddEmail}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-blue-950/60 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Email Panitia</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {committeeEmails.map(em => (
                      <div
                        key={em.id}
                        className={`p-5 rounded-2xl bg-slate-900 border transition flex flex-col justify-between space-y-4 ${
                          em.isPrimary ? 'border-blue-500/50 shadow-lg shadow-blue-950/20' : 'border-slate-800'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              {em.title}
                            </span>
                            {em.isPrimary ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                ⭐ Email Utama
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  updateCommitteeEmail({ ...em, isPrimary: true });
                                }}
                                className="text-[10px] text-slate-400 hover:text-blue-400 underline cursor-pointer"
                              >
                                Set Jadi Utama
                              </button>
                            )}
                          </div>

                          <p className="font-mono text-xs text-blue-400 font-semibold">
                            ✉️ {em.email}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <a
                            href={`mailto:${em.email}?subject=${encodeURIComponent('Pertanyaan Turnamen WabupCup 2026')}`}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Kirim Email</span>
                          </a>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEditEmail(em)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                              title="Edit Email"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {committeeEmails.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus email "${em.email}"?`)) {
                                    deleteCommitteeEmail(em.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                                title="Hapus Email"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: REKENING BANK & PEMBAYARAN */}
              {settingsSubTab === 'BANK' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span>Rekening Bank & Opsi Pembayaran Resmi</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Rekening bank berstatus <strong className="text-amber-400">Utama</strong> akan tercantum pada form registrasi dan pesan WA otomatis ke manajer tim.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenAddBank}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-amber-950/60 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Rekening Bank</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bankAccounts.map(b => (
                      <div
                        key={b.id}
                        className={`p-5 rounded-2xl bg-slate-900 border transition flex flex-col justify-between space-y-4 ${
                          b.isPrimary ? 'border-amber-500/50 shadow-lg shadow-amber-950/20' : 'border-slate-800'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {b.bankName}
                            </span>
                            {b.isPrimary ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ⭐ Rekening Utama
                              </span>
                            ) : (
                              <button
                                onClick={() => setPrimaryBankAccount(b.id)}
                                className="text-[10px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
                              >
                                Set Jadi Utama
                              </button>
                            )}
                          </div>

                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">No. Rekening</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(b.accountNumber);
                                  alert(`Nomor rekening ${b.accountNumber} berhasil disalin!`);
                                }}
                                className="text-[10px] text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Salin</span>
                              </button>
                            </div>
                            <p className="font-mono text-base font-bold text-white tracking-wider">
                              {b.accountNumber}
                            </p>
                            <p className="text-xs text-slate-300 font-semibold">
                              a/n {b.accountHolder}
                            </p>
                            {b.branchName && (
                              <p className="text-[10px] text-slate-400">
                                Cabang: {b.branchName}
                              </p>
                            )}
                          </div>

                          {b.instructions && (
                            <p className="text-xs text-slate-400 leading-relaxed italic">
                              "{b.instructions}"
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditBank(b)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          {bankAccounts.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus rekening bank "${b.bankName} - ${b.accountNumber}"?`)) {
                                  deleteBankAccount(b.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                              title="Hapus Rekening"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: KUOTA PENDAFTARAN & KATEGORI TURNAMEN */}
              {settingsSubTab === 'QUOTA' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* HEADER BANNER */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white uppercase flex items-center space-x-2">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <span>Pengaturan Kuota Pendaftaran & Kategori Turnamen</span>
                      </h4>
                      <p className="text-xs text-slate-300">
                        Atur batas maksimal kuota tim (<code className="text-amber-300 font-mono">maxTeams</code>), biaya registrasi, total hadiah, dan syarat batasan usia untuk masing-masing kategori.
                      </p>
                      <p className="text-[11px] text-amber-400/90 flex items-center space-x-1.5 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Kategori yang kuotanya telah penuh akan otomatis disembunyikan dari formulir pendaftaran peserta di halaman publik.</span>
                      </p>
                    </div>

                    {quotaSaveSuccess && (
                      <span className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 animate-fadeIn shrink-0 shadow-lg shadow-emerald-950/40">
                        <Check className="w-4 h-4" />
                        <span>Pengaturan Kuota Tersimpan!</span>
                      </span>
                    )}
                  </div>

                  {/* SUMMARY STATS ROW */}
                  {(() => {
                    let totalMax = 0;
                    let totalReg = 0;
                    let fullCount = 0;

                    categories.forEach(c => {
                      const count = Math.max(
                        registrations.filter(r => r.category === c.id && r.status !== 'REJECTED').length,
                        c.registeredTeamsCount || 0
                      );
                      totalMax += c.maxTeams;
                      totalReg += count;
                      if (count >= c.maxTeams) fullCount++;
                    });

                    const totalRemaining = Math.max(0, totalMax - totalReg);
                    const overallPercent = totalMax > 0 ? Math.round((totalReg / totalMax) * 100) : 0;

                    return (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Kuota Turnamen</span>
                          <p className="text-2xl font-black text-white font-mono">{totalMax} <span className="text-xs font-normal text-slate-400">Tim</span></p>
                          <span className="text-[11px] text-slate-400 block">6 Kategori Turnamen</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Tim Terdaftar</span>
                          <p className="text-2xl font-black text-emerald-400 font-mono">{totalReg} <span className="text-xs font-normal text-slate-400">Tim</span></p>
                          <span className="text-[11px] text-emerald-400/80 block">{overallPercent}% Terisi</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Sisa Kuota Tersedia</span>
                          <p className="text-2xl font-black text-cyan-400 font-mono">{totalRemaining} <span className="text-xs font-normal text-slate-400">Slot</span></p>
                          <span className="text-[11px] text-cyan-400/80 block">Slot Masih Terbuka</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Kategori Kuota Penuh</span>
                          <p className="text-2xl font-black text-amber-400 font-mono">{fullCount} <span className="text-xs font-normal text-slate-400">/ {categories.length}</span></p>
                          <span className="text-[11px] text-amber-400/80 block">{fullCount > 0 ? `${fullCount} ditutup sementara` : 'Semua kategori buka'}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* CATEGORIES QUOTA LIST */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {categories.map(cat => {
                      const activeRegs = registrations.filter(r => r.category === cat.id && r.status !== 'REJECTED');
                      const regCount = Math.max(activeRegs.length, cat.registeredTeamsCount || 0);
                      const isFull = regCount >= cat.maxTeams;
                      const remaining = Math.max(0, cat.maxTeams - regCount);
                      const percent = Math.min(100, Math.round((regCount / cat.maxTeams) * 100));

                      const presets = [8, 12, 16, 24, 32, 48, 64];

                      return (
                        <div
                          key={cat.id}
                          className={`p-6 rounded-2xl bg-slate-900 border transition shadow-xl space-y-5 ${
                            isFull ? 'border-red-500/50 shadow-red-950/20' : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* CATEGORY TITLE & STATUS BADGE */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-xs tracking-wider">
                                {cat.id}
                              </span>
                              <h5 className="font-bold text-base text-white">{cat.name}</h5>
                            </div>

                            {isFull ? (
                              <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center space-x-1.5">
                                <Lock className="w-3.5 h-3.5 text-red-400" />
                                <span>KUOTA PENUH</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                                {regCount} / {cat.maxTeams} Tim ({remaining} Sisa)
                              </span>
                            )}
                          </div>

                          {/* LIVE STATUS PROGRESS BAR */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-slate-400">
                              <span className="font-semibold text-slate-300">
                                {regCount} Tim Terdaftar dari Kuota {cat.maxTeams} Tim
                              </span>
                              <span className={`font-mono font-bold ${isFull ? 'text-red-400' : 'text-emerald-400'}`}>
                                {percent}% Terisi
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isFull ? 'bg-red-500' : percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                            {isFull && (
                              <p className="text-[11px] text-red-400/90 font-medium flex items-center space-x-1 pt-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Kategori ini otomatis tidak muncul di dropdown formulir pendaftaran publik.</span>
                              </p>
                            )}
                          </div>

                          {/* FORM FIELDS */}
                          <div className="space-y-4 pt-1">
                            {/* KUOTA MAKSIMAL & PRESETS */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                                  <Sliders className="w-3.5 h-3.5" />
                                  <span>Batas Kuota Maksimal Tim</span>
                                </label>
                                <span className="text-[11px] text-slate-400">Pilih Preset Cepat:</span>
                              </div>

                              <div className="flex items-center space-x-3">
                                <input
                                  type="number"
                                  min={1}
                                  max={128}
                                  value={cat.maxTeams}
                                  onChange={e => {
                                    const val = Math.max(1, Number(e.target.value) || 1);
                                    updateCategory({ ...cat, maxTeams: val });
                                  }}
                                  className="w-28 bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {presets.map(p => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => updateCategory({ ...cat, maxTeams: p })}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition font-mono cursor-pointer ${
                                        cat.maxTeams === p
                                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* BIAYA & TOTAL HADIAH */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <label className="block text-[10px] text-slate-400 uppercase font-bold">
                                  Biaya Pendaftaran (Rp)
                                </label>
                                <input
                                  type="number"
                                  value={cat.registrationFee}
                                  onChange={e => updateCategory({ ...cat, registrationFee: Number(e.target.value) || 0 })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] text-slate-400 uppercase font-bold">
                                  Total Hadiah (Rp)
                                </label>
                                <input
                                  type="number"
                                  value={cat.totalPrize}
                                  onChange={e => updateCategory({ ...cat, totalPrize: Number(e.target.value) || 0 })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-red-400 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                              </div>
                            </div>

                            {/* SYARAT BATASAN USIA */}
                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-400 uppercase font-bold">
                                Syarat & Batasan Usia / Peserta
                              </label>
                              <input
                                type="text"
                                value={cat.ageRestriction}
                                onChange={e => updateCategory({ ...cat, ageRestriction: e.target.value })}
                                placeholder="Contoh: Kelahiran 2014 atau sesudahnya"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </div>

                          {/* QUICK SAVE ACTION */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              Status: <strong className={isFull ? 'text-red-400' : 'text-emerald-400'}>{isFull ? 'Kuota Penuh (Tutup)' : 'Pendaftaran Terbuka'}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setQuotaSaveSuccess(true);
                                setTimeout(() => setQuotaSaveSuccess(false), 3000);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Simpan {cat.id}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* GLOBAL ACTION BUTTON */}
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-sm">Sinkronisasi Kuota Kategori</h5>
                        <p className="text-xs text-slate-400">Perubahan kuota langsung berdampak real-time ke halaman utama dan sistem pendaftaran.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setQuotaSaveSuccess(true);
                        setTimeout(() => setQuotaSaveSuccess(false), 3500);
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-950/60 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Seluruh Pengaturan Kuota</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-TAB 6: INFORMASI UMUM TURNAMEN */}
              {settingsSubTab === 'GENERAL' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase flex items-center space-x-2">
                        <Building className="w-4 h-4 text-red-500" />
                        <span>Informasi & Konfigurasi Utama Turnamen</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ubah metadata turnamen, batas pendaftaran, lokasi stadion, embed maps, dan total hadiah.
                      </p>
                    </div>

                    {generalSaveSuccess && (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 animate-fadeIn">
                        <Check className="w-4 h-4" />
                        <span>Pengaturan Tersimpan!</span>
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveGeneralConfig} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {/* NAMA TURNAMEN */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Nama Turnamen
                        </label>
                        <input
                          type="text"
                          required
                          value={generalConfigForm.name}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* EDISI */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Edisi / Tahun
                        </label>
                        <input
                          type="text"
                          required
                          value={generalConfigForm.edition}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, edition: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* TOTAL POOL HADIAH */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Total Hadiah Pool (Rp)
                        </label>
                        <input
                          type="number"
                          required
                          value={generalConfigForm.totalPrizePool}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, totalPrizePool: Number(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* TAGLINE */}
                      <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Slogan / Tagline
                        </label>
                        <input
                          type="text"
                          value={generalConfigForm.tagline}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, tagline: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* BATAS PENDAFTARAN */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Batas Akhir Pendaftaran
                        </label>
                        <input
                          type="text"
                          value={generalConfigForm.registrationDeadline}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, registrationDeadline: e.target.value })}
                          placeholder="2026-06-15"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* TANGGAL MULAI */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Tanggal Mulai Turnamen
                        </label>
                        <input
                          type="text"
                          value={generalConfigForm.tournamentStartDate}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, tournamentStartDate: e.target.value })}
                          placeholder="2026-06-20"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* TANGGAL SELESAI */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Tanggal Selesai Turnamen
                        </label>
                        <input
                          type="text"
                          value={generalConfigForm.tournamentEndDate}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, tournamentEndDate: e.target.value })}
                          placeholder="2026-06-28"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* NAMA VENUE */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Nama Stadion / GOR
                        </label>
                        <input
                          type="text"
                          value={generalConfigForm.venueName}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, venueName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* ALAMAT VENUE */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Alamat Lengkap Venue
                        </label>
                        <input
                          type="text"
                          value={generalConfigForm.venueAddress}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, venueAddress: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* KOTA VENUE */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Kota / Kabupaten
                        </label>
                        <input
                          type="text"
                          value={generalConfigForm.venueCity}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, venueCity: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* GOOGLE MAPS EMBED URL */}
                      <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Google Maps Embed URL
                        </label>
                        <input
                          type="url"
                          value={generalConfigForm.googleMapsEmbedUrl}
                          onChange={e => setGeneralConfigForm({ ...generalConfigForm, googleMapsEmbedUrl: e.target.value })}
                          placeholder="https://www.google.com/maps/embed?..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-800">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-red-950/60 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Pengaturan Turnamen</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
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

      {/* SPONSOR MODAL (TAMBAH / EDIT SPONSOR DENGAN UPLOAD & LINK) */}
      {sponsorModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-2xl animate-fadeIn">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-xl font-heading font-bold text-white uppercase tracking-wide">
                  {editingSponsor ? 'Edit Data Sponsor' : 'Tambah Sponsor Baru'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lengkapi identitas, logo (upload/link), serta link website resmi mitra sponsor.
                </p>
              </div>
              <button
                onClick={() => setSponsorModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSponsor} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NAMA SPONSOR */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Nama Sponsor / Perusahaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sponsorForm.name}
                    onChange={e => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                    placeholder="Contoh: Bank Nagari, Pocari Sweat, Pemkab Wijaya"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                {/* TINGKATAN / TIER */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Tingkatan Sponsor (Tier)
                  </label>
                  <select
                    value={sponsorForm.tier}
                    onChange={e => setSponsorForm({ ...sponsorForm, tier: e.target.value as SponsorTier })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-bold"
                  >
                    <option value="PLATINUM">🌟 PLATINUM (Utama)</option>
                    <option value="GOLD">🥇 GOLD (Partner Resmi)</option>
                    <option value="SILVER">🥈 SILVER (Pendukung)</option>
                    <option value="OFFICIAL_PARTNER">🤝 OFFICIAL PARTNER (Media & Medis)</option>
                  </select>
                </div>

                {/* INISIAL / LOGO TEXT */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Inisial / Monogram Cadangan
                  </label>
                  <input
                    type="text"
                    value={sponsorForm.logoText}
                    onChange={e => setSponsorForm({ ...sponsorForm, logoText: e.target.value })}
                    placeholder="Contoh: BN, POCARI, PEMKAB"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none uppercase"
                  />
                </div>

                {/* WEBSITE URL */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Tautan Website / Landing Page Sponsor
                    </label>
                    {sponsorForm.websiteUrl && (
                      <a
                        href={sponsorForm.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                      >
                        <span>Uji Tautan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={sponsorForm.websiteUrl}
                      onChange={e => setSponsorForm({ ...sponsorForm, websiteUrl: e.target.value })}
                      placeholder="https://sponsor-website.co.id"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-blue-400 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* DESKRIPSI / SLOGAN */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Deskripsi / Peran Sponsor
                  </label>
                  <input
                    type="text"
                    value={sponsorForm.description}
                    onChange={e => setSponsorForm({ ...sponsorForm, description: e.target.value })}
                    placeholder="Contoh: Official Hydration Partner & Match Ball Sponsor"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* LOGO IMAGE METHOD (UPLOAD / URL LINK) */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-red-400" />
                    <span>Logo Gambar Sponsor</span>
                  </label>

                  {/* TAB PILIHAN METODE */}
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSponsorLogoType('UPLOAD')}
                      className={`px-3 py-1 rounded-md transition ${
                        sponsorLogoType === 'UPLOAD'
                          ? 'bg-red-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setSponsorLogoType('URL')}
                      className={`px-3 py-1 rounded-md transition ${
                        sponsorLogoType === 'URL'
                          ? 'bg-red-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Link URL Gambar
                    </button>
                  </div>
                </div>

                {/* METODE 1: UPLOAD FILE */}
                {sponsorLogoType === 'UPLOAD' && (
                  <div className="space-y-3">
                    <label className="block border-2 border-dashed border-slate-700 hover:border-red-500/70 rounded-xl p-4 text-center cursor-pointer transition bg-slate-900/40">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                        onChange={handleSponsorFileUpload}
                        className="hidden"
                      />
                      <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-200">
                        Klik untuk upload logo gambar (PNG, JPG, WebP, SVG)
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Maksimal ukuran 5 MB. Transparan PNG sangat disarankan.
                      </p>
                    </label>
                  </div>
                )}

                {/* METODE 2: LINK URL */}
                {sponsorLogoType === 'URL' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={sponsorForm.logoUrl}
                      onChange={e => {
                        setSponsorForm({ ...sponsorForm, logoUrl: e.target.value });
                        setSponsorLogoPreview(e.target.value);
                      }}
                      placeholder="https://example.com/images/logo-sponsor.png"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      Masukkan direct URL gambar logo sponsor dari web hosting atau CDN.
                    </p>
                  </div>
                )}

                {/* LIVE PREVIEW LOGO */}
                {(sponsorLogoPreview || sponsorForm.logoUrl) && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 overflow-hidden">
                        <img
                          src={sponsorLogoPreview || sponsorForm.logoUrl}
                          alt="Preview Logo"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Logo Gambar Terpasang</span>
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {sponsorLogoPreview.startsWith('data:') ? 'File Gambar Lokal (Base64)' : 'URL Eksternal'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSponsorLogoPreview('');
                        setSponsorForm(prev => ({ ...prev, logoUrl: '' }));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold transition flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Gambar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* LIVE CARD PREVIEW CONTAINER */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pratinjau Kartu di Landing Page:
                </span>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-2">
                      {sponsorLogoPreview || sponsorForm.logoUrl ? (
                        <img
                          src={sponsorLogoPreview || sponsorForm.logoUrl}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="font-bold text-sm text-red-500">
                          {(sponsorForm.logoText || sponsorForm.name || 'SP').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-white">
                        {sponsorForm.name || 'Nama Sponsor Anda'}
                      </h5>
                      <p className="text-xs text-slate-400">
                        {sponsorForm.description || 'Deskripsi singkat mitra'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {sponsorForm.tier}
                  </span>
                </div>
              </div>

              {/* FORM ACTIONS */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSponsorModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-xs font-bold text-white transition shadow-lg shadow-red-950/50 flex items-center space-x-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSponsor ? 'Simpan Perubahan' : 'Tambahkan Sponsor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* 1. MODAL: TAMBAH / EDIT BERKAS UNDUHAN */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FolderDown className="w-5 h-5 text-cyan-400" />
                <h4 className="text-base font-bold text-white uppercase">
                  {editingDoc ? 'Edit Berkas Unduhan' : 'Tambah Berkas Unduhan Baru'}
                </h4>
              </div>
              <button
                onClick={() => setDocModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Nama / Judul Berkas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Formulir Pendaftaran Tim & Surat Pernyataan"
                  value={docForm.title}
                  onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Kategori Berkas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Formulir, Regulasi, Template Surat"
                    value={docForm.category}
                    onChange={e => setDocForm({ ...docForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Format File</label>
                  <select
                    value={docForm.fileType}
                    onChange={e => setDocForm({ ...docForm, fileType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="PDF">PDF (Dokumen Portabel)</option>
                    <option value="DOCX">DOCX (Word Document)</option>
                    <option value="XLSX">XLSX (Excel Spreadsheet)</option>
                    <option value="ZIP">ZIP (Arsip Berkas)</option>
                    <option value="IMAGE">IMAGE (PNG/JPG)</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat tentang isi dokumen..."
                  value={docForm.description}
                  onChange={e => setDocForm({ ...docForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                ></textarea>
              </div>

              {/* METODE BERKAS: UPLOAD ATAU URL */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300">Sumber File</label>
                  <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDocFileSource('UPLOAD')}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition ${
                        docFileSource === 'UPLOAD' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocFileSource('URL')}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition ${
                        docFileSource === 'URL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Link URL / G-Drive
                    </button>
                  </div>
                </div>

                {docFileSource === 'UPLOAD' ? (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 rounded-2xl hover:border-cyan-500 bg-slate-950/60 cursor-pointer transition">
                      <FolderDown className="w-8 h-8 text-cyan-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-300">
                        {docForm.fileName ? `Terpilih: ${docForm.fileName}` : 'Klik untuk pilih file berkas (PDF, DOCX, XLSX, dll)'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Maksimal ukuran file 15 MB
                      </span>
                      <input
                        type="file"
                        onChange={handleDocFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="https://drive.google.com/file/d/... atau URL langsung"
                      value={docForm.fileUrl}
                      onChange={e => setDocForm({ ...docForm, fileUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Nama file: Formulir.pdf"
                        value={docForm.fileName}
                        onChange={e => setDocForm({ ...docForm, fileName: e.target.value })}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Ukuran: 1.5 MB"
                        value={docForm.fileSize}
                        onChange={e => setDocForm({ ...docForm, fileSize: e.target.value })}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PRIMARY TOGGLE */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="docIsPrimary"
                  checked={docForm.isPrimary}
                  onChange={e => setDocForm({ ...docForm, isPrimary: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="docIsPrimary" className="text-xs text-slate-300 cursor-pointer">
                  Jadikan <strong>Unduhan Utama</strong> (tampil paling menonjol di halaman pendaftaran)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Berkas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: TAMBAH / EDIT KONTAK WHATSAPP */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-bold text-white uppercase">
                  {editingContact ? 'Edit Kontak WhatsApp' : 'Tambah Kontak WhatsApp Panitia'}
                </h4>
              </div>
              <button
                onClick={() => setContactModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Nama Lengkap / Jabatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rahmat Fauzi (Sekretariat Turnamen)"
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Nomor WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081267891234 atau +6281267891234"
                  value={contactForm.phone}
                  onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Divisi / Peran Panitia</label>
                <input
                  type="text"
                  placeholder="Contoh: Pendaftaran & Pembayaran, Teknis Pertandingan, Sponsorship"
                  value={contactForm.role}
                  onChange={e => setContactForm({ ...contactForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="contactIsPrimary"
                  checked={contactForm.isPrimary}
                  onChange={e => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="contactIsPrimary" className="text-xs text-slate-300 cursor-pointer">
                  Jadikan <strong>Kontak Utama</strong> untuk konfirmasi pendaftaran
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Kontak</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL: TAMBAH / EDIT EMAIL RESMI */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <h4 className="text-base font-bold text-white uppercase">
                  {editingEmail ? 'Edit Email Panitia' : 'Tambah Email Resmi Panitia'}
                </h4>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmail} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Nama Divisi / Bagian *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sekretariat Panitia Pelaksana, Divisi Humas"
                  value={emailForm.title}
                  onChange={e => setEmailForm({ ...emailForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Alamat Email *</label>
                <input
                  type="email"
                  required
                  placeholder="panitia@wabupcup.id atau panitiawabupcup2026@gmail.com"
                  value={emailForm.email}
                  onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="emailIsPrimary"
                  checked={emailForm.isPrimary}
                  onChange={e => setEmailForm({ ...emailForm, isPrimary: e.target.checked })}
                  className="rounded border-slate-700 text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="emailIsPrimary" className="text-xs text-slate-300 cursor-pointer">
                  Jadikan <strong>Email Utama</strong>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: TAMBAH / EDIT REKENING BANK */}
      {bankModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h4 className="text-base font-bold text-white uppercase">
                  {editingBank ? 'Edit Rekening Bank' : 'Tambah Rekening Bank Pembayaran'}
                </h4>
              </div>
              <button
                onClick={() => setBankModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Nama Bank / E-Wallet *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bank Nagari, BRI, Mandiri, BCA"
                  value={bankForm.bankName}
                  onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Nomor Rekening *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1200.0210.12345.6"
                  value={bankForm.accountNumber}
                  onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-wider"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Atas Nama (a/n) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PANITIA WABUP CUP 2026"
                  value={bankForm.accountHolder}
                  onChange={e => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Kantor Cabang</label>
                <input
                  type="text"
                  placeholder="Contoh: Cabang Utama Solok Selatan"
                  value={bankForm.branchName}
                  onChange={e => setBankForm({ ...bankForm, branchName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Instruksi Pembayaran / Catatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Sertakan nama tim pada berita transfer"
                  value={bankForm.instructions}
                  onChange={e => setBankForm({ ...bankForm, instructions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="bankIsPrimary"
                  checked={bankForm.isPrimary}
                  onChange={e => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="bankIsPrimary" className="text-xs text-slate-300 cursor-pointer">
                  Jadikan <strong>Rekening Utama</strong> untuk pembayaran pendaftaran
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBankModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Rekening</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
