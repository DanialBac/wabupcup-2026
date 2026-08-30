import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AdminUser,
  CategoryDetail,
  CommitteeBankAccount,
  CommitteeContact,
  CommitteeEmail,
  DownloadableDoc,
  MatchItem,
  RegistrationItem,
  RegistrationStatus,
  PaymentStatus,
  SponsorItem,
  TournamentCategory,
  TournamentConfig,
} from '../types';
import {
  INITIAL_ADMIN_USERS,
  INITIAL_CATEGORIES,
  INITIAL_MATCHES,
  INITIAL_REGISTRATIONS,
  INITIAL_SPONSORS,
  INITIAL_TOURNAMENT_CONFIG,
} from '../data/mockData';

interface TournamentContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  config: TournamentConfig;
  updateConfig: (newConfig: Partial<TournamentConfig>) => void;
  // Downloadable Documents
  downloadableDocs: DownloadableDoc[];
  addDownloadableDoc: (doc: Omit<DownloadableDoc, 'id' | 'updatedAt'>) => void;
  updateDownloadableDoc: (doc: DownloadableDoc) => void;
  deleteDownloadableDoc: (id: string) => void;
  // Committee Contacts
  committeeContacts: CommitteeContact[];
  addCommitteeContact: (contact: Omit<CommitteeContact, 'id'>) => void;
  updateCommitteeContact: (contact: CommitteeContact) => void;
  deleteCommitteeContact: (id: string) => void;
  setPrimaryCommitteeContact: (id: string) => void;
  // Committee Emails
  committeeEmails: CommitteeEmail[];
  addCommitteeEmail: (email: Omit<CommitteeEmail, 'id'>) => void;
  updateCommitteeEmail: (email: CommitteeEmail) => void;
  deleteCommitteeEmail: (id: string) => void;
  // Committee Bank Accounts
  bankAccounts: CommitteeBankAccount[];
  addBankAccount: (bank: Omit<CommitteeBankAccount, 'id'>) => void;
  updateBankAccount: (bank: CommitteeBankAccount) => void;
  deleteBankAccount: (id: string) => void;
  setPrimaryBankAccount: (id: string) => void;
  // Categories & Registration
  categories: CategoryDetail[];
  updateCategory: (category: CategoryDetail) => void;
  registrations: RegistrationItem[];
  submitNewRegistration: (data: Omit<RegistrationItem, 'id' | 'regCode' | 'registrationDate' | 'status' | 'paymentStatus' | 'lastUpdated'>) => RegistrationItem;
  updateRegistration: (item: RegistrationItem) => void;
  updateRegistrationStatus: (id: string, status: RegistrationStatus, reason?: string, notes?: string) => void;
  updatePaymentStatus: (id: string, paymentStatus: PaymentStatus) => void;
  deleteRegistration: (id: string) => void;
  matches: MatchItem[];
  addMatch: (match: Omit<MatchItem, 'id'>) => void;
  updateMatch: (match: MatchItem) => void;
  deleteMatch: (matchId: string) => void;
  randomizeMatchesForCategory: (
    category: TournamentCategory,
    stageOption?: 'AUTO' | 'PENYISIHAN' | '16_BESAR' | '8_BESAR' | 'SEMIFINAL'
  ) => { success: boolean; message: string; matches?: MatchItem[] };
  checkCanDrawNextRound: (category: TournamentCategory) => {
    canDraw: boolean;
    pendingMatchesCount: number;
    currentRoundName?: string;
    completedMatchesCount: number;
    totalMatchesCount: number;
  };
  sponsors: SponsorItem[];
  addSponsor: (sponsor: Omit<SponsorItem, 'id'>) => void;
  updateSponsor: (sponsor: SponsorItem) => void;
  deleteSponsor: (id: string) => void;
  adminUsers: AdminUser[];
  currentAdmin: AdminUser | null;
  loginAdmin: (username: string, pass: string) => boolean;
  logoutAdmin: () => void;
  addAdminUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => void;
  deleteAdminUser: (id: string) => void;
  resetAllDataToDefaults: () => void;
  getWhatsAppNotificationUrl: (item: RegistrationItem, type: 'CONFIRMATION' | 'APPROVED' | 'REJECTED' | 'PAYMENT_REMINDER') => string;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('wabupcup_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('wabupcup_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Tournament Config
  const [config, setConfig] = useState<TournamentConfig>(() => {
    const saved = localStorage.getItem('wabupcup_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_TOURNAMENT_CONFIG,
          ...parsed,
          downloadableDocs: parsed.downloadableDocs && parsed.downloadableDocs.length > 0 ? parsed.downloadableDocs : INITIAL_TOURNAMENT_CONFIG.downloadableDocs,
          committeeContacts: parsed.committeeContacts && parsed.committeeContacts.length > 0 ? parsed.committeeContacts : INITIAL_TOURNAMENT_CONFIG.committeeContacts,
          committeeEmails: parsed.committeeEmails && parsed.committeeEmails.length > 0 ? parsed.committeeEmails : INITIAL_TOURNAMENT_CONFIG.committeeEmails,
          bankAccounts: parsed.bankAccounts && parsed.bankAccounts.length > 0 ? parsed.bankAccounts : INITIAL_TOURNAMENT_CONFIG.bankAccounts,
        };
      } catch {
        return INITIAL_TOURNAMENT_CONFIG;
      }
    }
    return INITIAL_TOURNAMENT_CONFIG;
  });

  const updateConfig = (newConfig: Partial<TournamentConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('wabupcup_config', JSON.stringify(updated));
      return updated;
    });
  };

  // Downloadable Documents Methods
  const downloadableDocs = config.downloadableDocs || INITIAL_TOURNAMENT_CONFIG.downloadableDocs || [];

  const addDownloadableDoc = (doc: Omit<DownloadableDoc, 'id' | 'updatedAt'>) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newDoc: DownloadableDoc = {
      ...doc,
      id: `doc-${Date.now()}`,
      updatedAt: formattedDate,
    };
    const nextDocs = [newDoc, ...downloadableDocs];
    updateConfig({ downloadableDocs: nextDocs });
  };

  const updateDownloadableDoc = (updated: DownloadableDoc) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nextDocs = downloadableDocs.map(d =>
      d.id === updated.id ? { ...updated, updatedAt: formattedDate } : d
    );
    updateConfig({ downloadableDocs: nextDocs });
  };

  const deleteDownloadableDoc = (id: string) => {
    const nextDocs = downloadableDocs.filter(d => d.id !== id);
    updateConfig({ downloadableDocs: nextDocs });
  };

  // Committee Contacts (WhatsApp) Methods
  const committeeContacts = config.committeeContacts || INITIAL_TOURNAMENT_CONFIG.committeeContacts || [];

  const addCommitteeContact = (contact: Omit<CommitteeContact, 'id'>) => {
    const newContact: CommitteeContact = {
      ...contact,
      id: `wa-${Date.now()}`,
    };
    let nextContacts = [...committeeContacts, newContact];
    if (newContact.isPrimary || committeeContacts.length === 0) {
      nextContacts = nextContacts.map(c => ({
        ...c,
        isPrimary: c.id === newContact.id,
      }));
      updateConfig({
        committeeContacts: nextContacts,
        adminContactPhone: newContact.phone.replace(/\D/g, ''),
      });
    } else {
      updateConfig({ committeeContacts: nextContacts });
    }
  };

  const updateCommitteeContact = (updated: CommitteeContact) => {
    let nextContacts = committeeContacts.map(c =>
      c.id === updated.id ? updated : updated.isPrimary ? { ...c, isPrimary: false } : c
    );
    const primary = nextContacts.find(c => c.isPrimary) || nextContacts[0];
    updateConfig({
      committeeContacts: nextContacts,
      adminContactPhone: primary ? primary.phone.replace(/\D/g, '') : config.adminContactPhone,
    });
  };

  const deleteCommitteeContact = (id: string) => {
    const nextContacts = committeeContacts.filter(c => c.id !== id);
    if (nextContacts.length > 0 && !nextContacts.some(c => c.isPrimary)) {
      nextContacts[0].isPrimary = true;
    }
    const primary = nextContacts.find(c => c.isPrimary);
    updateConfig({
      committeeContacts: nextContacts,
      adminContactPhone: primary ? primary.phone.replace(/\D/g, '') : config.adminContactPhone,
    });
  };

  const setPrimaryCommitteeContact = (id: string) => {
    const nextContacts = committeeContacts.map(c => ({
      ...c,
      isPrimary: c.id === id,
    }));
    const primary = nextContacts.find(c => c.id === id);
    updateConfig({
      committeeContacts: nextContacts,
      adminContactPhone: primary ? primary.phone.replace(/\D/g, '') : config.adminContactPhone,
    });
  };

  // Committee Emails Methods
  const committeeEmails = config.committeeEmails || INITIAL_TOURNAMENT_CONFIG.committeeEmails || [];

  const addCommitteeEmail = (emailItem: Omit<CommitteeEmail, 'id'>) => {
    const newEmail: CommitteeEmail = {
      ...emailItem,
      id: `em-${Date.now()}`,
    };
    let nextEmails = [...committeeEmails, newEmail];
    if (newEmail.isPrimary || committeeEmails.length === 0) {
      nextEmails = nextEmails.map(e => ({
        ...e,
        isPrimary: e.id === newEmail.id,
      }));
      updateConfig({
        committeeEmails: nextEmails,
        adminContactEmail: newEmail.email,
      });
    } else {
      updateConfig({ committeeEmails: nextEmails });
    }
  };

  const updateCommitteeEmail = (updated: CommitteeEmail) => {
    let nextEmails = committeeEmails.map(e =>
      e.id === updated.id ? updated : updated.isPrimary ? { ...e, isPrimary: false } : e
    );
    const primary = nextEmails.find(e => e.isPrimary) || nextEmails[0];
    updateConfig({
      committeeEmails: nextEmails,
      adminContactEmail: primary ? primary.email : config.adminContactEmail,
    });
  };

  const deleteCommitteeEmail = (id: string) => {
    const nextEmails = committeeEmails.filter(e => e.id !== id);
    if (nextEmails.length > 0 && !nextEmails.some(e => e.isPrimary)) {
      nextEmails[0].isPrimary = true;
    }
    const primary = nextEmails.find(e => e.isPrimary);
    updateConfig({
      committeeEmails: nextEmails,
      adminContactEmail: primary ? primary.email : config.adminContactEmail,
    });
  };

  // Committee Bank Accounts Methods
  const bankAccounts = config.bankAccounts || INITIAL_TOURNAMENT_CONFIG.bankAccounts || [];

  const addBankAccount = (bank: Omit<CommitteeBankAccount, 'id'>) => {
    const newBank: CommitteeBankAccount = {
      ...bank,
      id: `bank-${Date.now()}`,
    };
    let nextBanks = [...bankAccounts, newBank];
    if (newBank.isPrimary || bankAccounts.length === 0) {
      nextBanks = nextBanks.map(b => ({
        ...b,
        isPrimary: b.id === newBank.id,
      }));
      updateConfig({
        bankAccounts: nextBanks,
        bankAccount: {
          bankName: newBank.bankName,
          accountNumber: newBank.accountNumber,
          accountHolder: newBank.accountHolder,
        },
      });
    } else {
      updateConfig({ bankAccounts: nextBanks });
    }
  };

  const updateBankAccount = (updated: CommitteeBankAccount) => {
    let nextBanks = bankAccounts.map(b =>
      b.id === updated.id ? updated : updated.isPrimary ? { ...b, isPrimary: false } : b
    );
    const primary = nextBanks.find(b => b.isPrimary) || nextBanks[0];
    updateConfig({
      bankAccounts: nextBanks,
      bankAccount: primary
        ? {
            bankName: primary.bankName,
            accountNumber: primary.accountNumber,
            accountHolder: primary.accountHolder,
          }
        : config.bankAccount,
    });
  };

  const deleteBankAccount = (id: string) => {
    const nextBanks = bankAccounts.filter(b => b.id !== id);
    if (nextBanks.length > 0 && !nextBanks.some(b => b.isPrimary)) {
      nextBanks[0].isPrimary = true;
    }
    const primary = nextBanks.find(b => b.isPrimary);
    updateConfig({
      bankAccounts: nextBanks,
      bankAccount: primary
        ? {
            bankName: primary.bankName,
            accountNumber: primary.accountNumber,
            accountHolder: primary.accountHolder,
          }
        : config.bankAccount,
    });
  };

  const setPrimaryBankAccount = (id: string) => {
    const nextBanks = bankAccounts.map(b => ({
      ...b,
      isPrimary: b.id === id,
    }));
    const primary = nextBanks.find(b => b.id === id);
    updateConfig({
      bankAccounts: nextBanks,
      bankAccount: primary
        ? {
            bankName: primary.bankName,
            accountNumber: primary.accountNumber,
            accountHolder: primary.accountHolder,
          }
        : config.bankAccount,
    });
  };

  // Categories & Prizes
  const [categories, setCategories] = useState<CategoryDetail[]>(() => {
    const saved = localStorage.getItem('wabupcup_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const updateCategory = (updated: CategoryDetail) => {
    setCategories(prev => {
      const next = prev.map(c => (c.id === updated.id ? updated : c));
      localStorage.setItem('wabupcup_categories', JSON.stringify(next));
      return next;
    });
  };

  // Registrations
  const [registrations, setRegistrations] = useState<RegistrationItem[]>(() => {
    const saved = localStorage.getItem('wabupcup_registrations');
    return saved ? JSON.parse(saved) : INITIAL_REGISTRATIONS;
  });

  useEffect(() => {
    localStorage.setItem('wabupcup_registrations', JSON.stringify(registrations));
  }, [registrations]);

  const submitNewRegistration = (
    data: Omit<RegistrationItem, 'id' | 'regCode' | 'registrationDate' | 'status' | 'paymentStatus' | 'lastUpdated'>
  ): RegistrationItem => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Count existing for reg code
    const existingCount = registrations.filter(r => r.category === data.category).length + 1;
    const regCode = `WBC-${data.category}-${String(existingCount).padStart(3, '0')}`;
    
    const newReg: RegistrationItem = {
      ...data,
      id: `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      regCode,
      registrationDate: formattedDate,
      status: 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      lastUpdated: formattedDate,
    };

    setRegistrations(prev => [newReg, ...prev]);

    // Update category count
    setCategories(prev =>
      prev.map(c =>
        c.id === data.category
          ? { ...c, registeredTeamsCount: c.registeredTeamsCount + 1 }
          : c
      )
    );

    return newReg;
  };

  const updateRegistration = (updatedItem: RegistrationItem) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    setRegistrations(prev =>
      prev.map(item => (item.id === updatedItem.id ? { ...updatedItem, lastUpdated: formattedDate } : item))
    );
  };

  const updateRegistrationStatus = (
    id: string,
    status: RegistrationStatus,
    reason?: string,
    notes?: string
  ) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    setRegistrations(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status,
            rejectionReason: reason !== undefined ? reason : item.rejectionReason,
            adminNotes: notes !== undefined ? notes : item.adminNotes,
            lastUpdated: formattedDate,
          };
        }
        return item;
      })
    );
  };

  const updatePaymentStatus = (id: string, paymentStatus: PaymentStatus) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    setRegistrations(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newStatus: RegistrationStatus =
            paymentStatus === 'PAID' && item.status === 'PENDING_PAYMENT'
              ? 'APPROVED'
              : item.status;
          return {
            ...item,
            paymentStatus,
            status: newStatus,
            lastUpdated: formattedDate,
          };
        }
        return item;
      })
    );
  };

  const deleteRegistration = (id: string) => {
    setRegistrations(prev => prev.filter(item => item.id !== id));
  };

  // Matches & Schedule
  const [matches, setMatches] = useState<MatchItem[]>(() => {
    const saved = localStorage.getItem('wabupcup_matches');
    return saved ? JSON.parse(saved) : INITIAL_MATCHES;
  });

  useEffect(() => {
    localStorage.setItem('wabupcup_matches', JSON.stringify(matches));
  }, [matches]);

  const addMatch = (newMatch: Omit<MatchItem, 'id'>) => {
    const item: MatchItem = {
      ...newMatch,
      id: `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setMatches(prev => [item, ...prev]);
  };

  const updateMatch = (updated: MatchItem) => {
    // 1. Calculate Winner ID automatically based on regular scores and penalties
    let determinedWinner: 'A' | 'B' | 'DRAW' | undefined = updated.winnerId;

    const scoreA = updated.teamA.score;
    const scoreB = updated.teamB.score;
    const penA = updated.teamA.penalties;
    const penB = updated.teamB.penalties;

    if (scoreA !== undefined && scoreB !== undefined) {
      if (scoreA > scoreB) {
        determinedWinner = 'A';
      } else if (scoreB > scoreA) {
        determinedWinner = 'B';
      } else {
        // Tied / Draw score: check penalties shootout
        if (penA !== undefined && penB !== undefined && penA !== penB) {
          determinedWinner = penA > penB ? 'A' : 'B';
        } else {
          determinedWinner = 'DRAW';
        }
      }
    }

    const matchWithWinner: MatchItem = {
      ...updated,
      winnerId: determinedWinner,
    };

    setMatches(prevMatches => {
      // Create new copy with updated match
      let newMatchesList = prevMatches.map(m => (m.id === updated.id ? matchWithWinner : m));

      // 2. AUTOMATIC ADVANCEMENT TO NEXT ROUND IF FINISHED
      if (matchWithWinner.status === 'FINISHED' && (determinedWinner === 'A' || determinedWinner === 'B')) {
        const winningTeam = determinedWinner === 'A' ? matchWithWinner.teamA : matchWithWinner.teamB;

        // If explicit nextMatchId is set
        if (matchWithWinner.nextMatchId) {
          newMatchesList = newMatchesList.map(m => {
            if (m.id === matchWithWinner.nextMatchId) {
              if (matchWithWinner.nextMatchSlot === 'B') {
                return {
                  ...m,
                  teamB: {
                    ...m.teamB,
                    name: winningTeam.name,
                    institution: winningTeam.institution,
                    logo: winningTeam.logo,
                  },
                };
              } else {
                return {
                  ...m,
                  teamA: {
                    ...m.teamA,
                    name: winningTeam.name,
                    institution: winningTeam.institution,
                    logo: winningTeam.logo,
                  },
                };
              }
            }
            return m;
          });
        } else {
          // Dynamic propagation by round hierarchy in the same category
          const catMatches = newMatchesList.filter(m => m.category === matchWithWinner.category);
          const roundName = matchWithWinner.round.toLowerCase();

          // Semifinal -> Grand Final
          if (roundName.includes('semifinal 1') || roundName.includes('semi final 1') || (roundName.includes('semifinal') && matchWithWinner.matchNumber % 2 === 1)) {
            const finalMatch = catMatches.find(m => m.round.toLowerCase().includes('final') && !m.round.toLowerCase().includes('semi') && !m.round.toLowerCase().includes('perempat'));
            if (finalMatch) {
              newMatchesList = newMatchesList.map(m => m.id === finalMatch.id ? { ...m, teamA: { ...m.teamA, name: winningTeam.name, institution: winningTeam.institution, logo: winningTeam.logo } } : m);
            }
          } else if (roundName.includes('semifinal 2') || roundName.includes('semi final 2') || (roundName.includes('semifinal') && matchWithWinner.matchNumber % 2 === 0)) {
            const finalMatch = catMatches.find(m => m.round.toLowerCase().includes('final') && !m.round.toLowerCase().includes('semi') && !m.round.toLowerCase().includes('perempat'));
            if (finalMatch) {
              newMatchesList = newMatchesList.map(m => m.id === finalMatch.id ? { ...m, teamB: { ...m.teamB, name: winningTeam.name, institution: winningTeam.institution, logo: winningTeam.logo } } : m);
            }
          }
          // Quarter Finals -> Semifinals
          else if (roundName.includes('perempat') || roundName.includes('8 besar') || roundName.includes('quarter')) {
            const semi1 = catMatches.find(m => m.round.toLowerCase().includes('semifinal 1') || (m.round.toLowerCase().includes('semifinal') && m.matchNumber % 2 === 1));
            const semi2 = catMatches.find(m => m.round.toLowerCase().includes('semifinal 2') || (m.round.toLowerCase().includes('semifinal') && m.matchNumber % 2 === 0));

            if (roundName.includes('1') && semi1) {
              newMatchesList = newMatchesList.map(m => m.id === semi1.id ? { ...m, teamA: { ...m.teamA, name: winningTeam.name, institution: winningTeam.institution, logo: winningTeam.logo } } : m);
            } else if (roundName.includes('2') && semi1) {
              newMatchesList = newMatchesList.map(m => m.id === semi1.id ? { ...m, teamB: { ...m.teamB, name: winningTeam.name, institution: winningTeam.institution, logo: winningTeam.logo } } : m);
            } else if (roundName.includes('3') && semi2) {
              newMatchesList = newMatchesList.map(m => m.id === semi2.id ? { ...m, teamA: { ...m.teamA, name: winningTeam.name, institution: winningTeam.institution, logo: winningTeam.logo } } : m);
            } else if (roundName.includes('4') && semi2) {
              newMatchesList = newMatchesList.map(m => m.id === semi2.id ? { ...m, teamB: { ...m.teamB, name: winningTeam.name, institution: winningTeam.institution, logo: winningTeam.logo } } : m);
            }
          }
        }
      }

      return newMatchesList;
    });
  };

  const deleteMatch = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  // CHECK IF NEXT ROUND CAN BE DRAWN (Must wait until previous round matches are ALL FINISHED)
  const checkCanDrawNextRound = (category: TournamentCategory) => {
    const catMatches = matches.filter(m => m.category === category);
    if (catMatches.length === 0) {
      return {
        canDraw: true,
        pendingMatchesCount: 0,
        completedMatchesCount: 0,
        totalMatchesCount: 0,
        currentRoundName: 'Belum Ada Pertandingan',
      };
    }

    // Find the earliest incomplete round
    const pendingMatches = catMatches.filter(m => m.status !== 'FINISHED');
    const completedMatches = catMatches.filter(m => m.status === 'FINISHED');

    return {
      canDraw: pendingMatches.length === 0,
      pendingMatchesCount: pendingMatches.length,
      completedMatchesCount: completedMatches.length,
      totalMatchesCount: catMatches.length,
      currentRoundName: pendingMatches[0]?.round || 'Seluruh Babak Selesai',
    };
  };

  // ADVANCED DRAWING & BRACKET GENERATOR (Sistem Acak Berjenjang)
  const randomizeMatchesForCategory = (
    category: TournamentCategory,
    stageOption?: 'AUTO' | 'PENYISIHAN' | '16_BESAR' | '8_BESAR' | 'SEMIFINAL'
  ): { success: boolean; message: string; matches?: MatchItem[] } => {
    // 1. Get approved/active registered teams for this category
    const activeTeams = registrations
      .filter(r => r.category === category && (r.status === 'APPROVED' || r.status === 'PENDING_PAYMENT'))
      .map(r => ({
        name: r.teamName,
        institution: r.institutionName,
        logo: r.teamLogo,
      }));

    // If fewer than 4 teams, provide default challenger pool
    const teamsToDraw = [...activeTeams];
    const defaultDummies = [
      { name: `${category} Bintang Wijaya FC`, institution: `Klub Unggulan ${category}` },
      { name: `${category} Garuda Muda`, institution: `Akademi ${category}` },
      { name: `${category} Satria Perkasa`, institution: `Persatuan Olahraga ${category}` },
      { name: `${category} Putra Wijaya FC`, institution: `Klub Juara ${category}` },
      { name: `${category} Tunas Bangsa`, institution: `Diklat ${category}` },
      { name: `${category} Gelora Perkasa`, institution: `Persatuan ${category}` },
      { name: `${category} Singa Wijaya`, institution: `Sentra Pembinaan ${category}` },
      { name: `${category} Elang Putih FC`, institution: `Pusat Pelatihan ${category}` },
    ];

    while (teamsToDraw.length < 8) {
      const dummy = defaultDummies[teamsToDraw.length % defaultDummies.length];
      teamsToDraw.push({ ...dummy, name: `${dummy.name} ${teamsToDraw.length + 1}` });
    }

    // 2. Fisher-Yates Random Shuffle
    for (let i = teamsToDraw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamsToDraw[i], teamsToDraw[j]] = [teamsToDraw[j], teamsToDraw[i]];
    }

    // Determine tournament bracket structure
    const targetTeams = stageOption === 'SEMIFINAL' || teamsToDraw.length <= 4
      ? teamsToDraw.slice(0, 4)
      : stageOption === '16_BESAR' && teamsToDraw.length >= 16
      ? teamsToDraw.slice(0, 16)
      : teamsToDraw.slice(0, 8); // Default 8 besar (Perempat final)

    const is16Besar = targetTeams.length === 16;
    const is8Besar = targetTeams.length === 8;
    const isSemiOnly = targetTeams.length === 4;

    const kickoffTimes = ['08:00', '09:15', '10:30', '13:30', '15:00', '16:15', '19:00', '20:15'];
    const pitches = ['Lapangan 1 - Utama', 'Lapangan 2 - Futsal A', 'Lapangan 3 - Futsal B'];
    let matchCounter = 1;
    const newGeneratedMatches: MatchItem[] = [];

    // Grand Final Match ID
    const grandFinalId = `match-${category.toLowerCase()}-final-${Date.now()}`;
    const semi1Id = `match-${category.toLowerCase()}-sf1-${Date.now()}`;
    const semi2Id = `match-${category.toLowerCase()}-sf2-${Date.now()}`;

    // Quarter Finals IDs
    const qfIds = [
      `match-${category.toLowerCase()}-qf1-${Date.now()}`,
      `match-${category.toLowerCase()}-qf2-${Date.now()}`,
      `match-${category.toLowerCase()}-qf3-${Date.now()}`,
      `match-${category.toLowerCase()}-qf4-${Date.now()}`,
    ];

    if (is8Besar) {
      // 4 QUARTER FINAL MATCHES (Babak 8 Besar)
      for (let i = 0; i < 4; i++) {
        const teamA = targetTeams[i * 2];
        const teamB = targetTeams[i * 2 + 1];
        const assignedNextId = i < 2 ? semi1Id : semi2Id;
        const assignedNextSlot: 'A' | 'B' = i % 2 === 0 ? 'A' : 'B';

        newGeneratedMatches.push({
          id: qfIds[i],
          matchNumber: matchCounter++,
          category: category,
          round: `Perempat Final ${i + 1} (8 Besar)`,
          roundIndex: 3,
          teamA: {
            name: teamA.name,
            institution: teamA.institution,
            logo: teamA.logo,
          },
          teamB: {
            name: teamB.name,
            institution: teamB.institution,
            logo: teamB.logo,
          },
          date: '2026-10-26',
          time: kickoffTimes[i % kickoffTimes.length],
          pitch: pitches[i % pitches.length],
          status: 'UPCOMING',
          nextMatchId: assignedNextId,
          nextMatchSlot: assignedNextSlot,
        });
      }

      // 2 SEMIFINAL MATCHES
      newGeneratedMatches.push({
        id: semi1Id,
        matchNumber: matchCounter++,
        category: category,
        round: 'Semifinal 1',
        roundIndex: 4,
        teamA: { name: 'Pemenang Perempat Final 1', institution: 'TBD' },
        teamB: { name: 'Pemenang Perempat Final 2', institution: 'TBD' },
        date: '2026-10-28',
        time: '16:00',
        pitch: 'Lapangan 1 - Utama',
        status: 'UPCOMING',
        nextMatchId: grandFinalId,
        nextMatchSlot: 'A',
      });

      newGeneratedMatches.push({
        id: semi2Id,
        matchNumber: matchCounter++,
        category: category,
        round: 'Semifinal 2',
        roundIndex: 4,
        teamA: { name: 'Pemenang Perempat Final 3', institution: 'TBD' },
        teamB: { name: 'Pemenang Perempat Final 4', institution: 'TBD' },
        date: '2026-10-28',
        time: '19:30',
        pitch: 'Lapangan 1 - Utama',
        status: 'UPCOMING',
        nextMatchId: grandFinalId,
        nextMatchSlot: 'B',
      });

      // GRAND FINAL MATCH
      newGeneratedMatches.push({
        id: grandFinalId,
        matchNumber: matchCounter++,
        category: category,
        round: 'GRAND FINAL WABUP CUP 2026',
        roundIndex: 5,
        teamA: { name: 'Pemenang Semifinal 1', institution: 'TBD' },
        teamB: { name: 'Pemenang Semifinal 2', institution: 'TBD' },
        date: '2026-10-31',
        time: '19:00',
        pitch: 'Stadion Utama Gelora Wijaya',
        status: 'UPCOMING',
      });
    } else {
      // 2 SEMIFINALS + FINAL
      const teamA1 = targetTeams[0];
      const teamB1 = targetTeams[1];
      const teamA2 = targetTeams[2];
      const teamB2 = targetTeams[3] || { name: 'BYE (Lolos Otomatis)', institution: '-' };

      newGeneratedMatches.push({
        id: semi1Id,
        matchNumber: matchCounter++,
        category: category,
        round: 'Semifinal 1',
        roundIndex: 4,
        teamA: { name: teamA1.name, institution: teamA1.institution, logo: teamA1.logo },
        teamB: { name: teamB1.name, institution: teamB1.institution, logo: teamB1.logo },
        date: '2026-10-28',
        time: '16:00',
        pitch: 'Lapangan 1 - Utama',
        status: 'UPCOMING',
        nextMatchId: grandFinalId,
        nextMatchSlot: 'A',
      });

      newGeneratedMatches.push({
        id: semi2Id,
        matchNumber: matchCounter++,
        category: category,
        round: 'Semifinal 2',
        roundIndex: 4,
        teamA: { name: teamA2.name, institution: teamA2.institution, logo: teamA2.logo },
        teamB: { name: teamB2.name, institution: teamB2.institution, logo: teamB2.logo },
        date: '2026-10-28',
        time: '19:30',
        pitch: 'Lapangan 1 - Utama',
        status: 'UPCOMING',
        nextMatchId: grandFinalId,
        nextMatchSlot: 'B',
      });

      newGeneratedMatches.push({
        id: grandFinalId,
        matchNumber: matchCounter++,
        category: category,
        round: 'GRAND FINAL WABUP CUP 2026',
        roundIndex: 5,
        teamA: { name: 'Pemenang Semifinal 1', institution: 'TBD' },
        teamB: { name: 'Pemenang Semifinal 2', institution: 'TBD' },
        date: '2026-10-31',
        time: '19:00',
        pitch: 'Stadion Utama Gelora Wijaya',
        status: 'UPCOMING',
      });
    }

    // Replace matches for this category
    setMatches(prev => {
      const otherCategoryMatches = prev.filter(m => m.category !== category);
      return [...otherCategoryMatches, ...newGeneratedMatches];
    });

    return {
      success: true,
      message: `Bagan sistem gugur resmi kategori ${category} berhasil diacak (${targetTeams.length} Tim).`,
      matches: newGeneratedMatches,
    };
  };

  // Sponsors
  const [sponsors, setSponsors] = useState<SponsorItem[]>(() => {
    const saved = localStorage.getItem('wabupcup_sponsors');
    return saved ? JSON.parse(saved) : INITIAL_SPONSORS;
  });

  useEffect(() => {
    localStorage.setItem('wabupcup_sponsors', JSON.stringify(sponsors));
  }, [sponsors]);

  const addSponsor = (sponsor: Omit<SponsorItem, 'id'>) => {
    const item: SponsorItem = {
      ...sponsor,
      id: `sp-${Date.now()}`,
    };
    setSponsors(prev => [...prev, item]);
  };

  const updateSponsor = (updated: SponsorItem) => {
    setSponsors(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const deleteSponsor = (id: string) => {
    setSponsors(prev => prev.filter(s => s.id !== id));
  };

  // Admin Users & Auth
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('wabupcup_admins');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_USERS;
  });

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('wabupcup_current_admin');
    return saved ? JSON.parse(saved) : null;
  });

  const loginAdmin = (username: string, pass: string): boolean => {
    const found = adminUsers.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    // Simple demo password check (admin123 / panitia2026 / wasit123)
    if (found && (pass === 'admin123' || pass === 'panitia2026' || pass === 'admin' || pass === '123456')) {
      setCurrentAdmin(found);
      localStorage.setItem('wabupcup_current_admin', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('wabupcup_current_admin');
  };

  const addAdminUser = (user: Omit<AdminUser, 'id' | 'createdAt'>) => {
    const newUser: AdminUser = {
      ...user,
      id: `adm-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAdminUsers(prev => {
      const next = [...prev, newUser];
      localStorage.setItem('wabupcup_admins', JSON.stringify(next));
      return next;
    });
  };

  const deleteAdminUser = (id: string) => {
    setAdminUsers(prev => {
      const next = prev.filter(a => a.id !== id);
      localStorage.setItem('wabupcup_admins', JSON.stringify(next));
      return next;
    });
  };

  const resetAllDataToDefaults = () => {
    setConfig(INITIAL_TOURNAMENT_CONFIG);
    setCategories(INITIAL_CATEGORIES);
    setRegistrations(INITIAL_REGISTRATIONS);
    setMatches(INITIAL_MATCHES);
    setSponsors(INITIAL_SPONSORS);
    setAdminUsers(INITIAL_ADMIN_USERS);
    localStorage.clear();
  };

  // WhatsApp formatted notification generator
  const getWhatsAppNotificationUrl = (
    item: RegistrationItem,
    type: 'CONFIRMATION' | 'APPROVED' | 'REJECTED' | 'PAYMENT_REMINDER'
  ): string => {
    const cleanPhone = item.coachPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0')
      ? `62${cleanPhone.slice(1)}`
      : cleanPhone;

    const primaryBank = bankAccounts.find(b => b.isPrimary) || bankAccounts[0] || config.bankAccount;
    const tourneyName = config.name || 'WabupCup 2026';

    let message = '';
    if (type === 'CONFIRMATION') {
      message = `Halo *${item.coachName}*, terima kasih telah mendaftarkan tim *${item.teamName}* pada Turnamen *${tourneyName}* (Kategori: *${item.category}*).\n\n📌 *Kode Registrasi:* ${item.regCode}\n💰 *Biaya Pendaftaran:* Rp ${item.paymentAmount.toLocaleString('id-ID')}\n🏦 *Transfer ke:* ${primaryBank.bankName} No. Rek: ${primaryBank.accountNumber} a/n ${primaryBank.accountHolder}\n\nSilakan kirimkan bukti transfer ke nomor ini untuk diverifikasi oleh panitia. Salam olahraga!`;
    } else if (type === 'APPROVED') {
      message = `🎉 *SELAMAT! PENDAFTARAN DISETUJUI*\n\nTim *${item.teamName}* (${item.regCode}) telah resmi TERVERIFIKASI & DISETUJUI untuk bertanding di *${tourneyName}* Kategori *${item.category}*.\n\n📅 *Jadwal Drawing Pertandingan:* Segera dicek di website.\n🏟️ *Lokasi:* ${config.venueName}, ${config.venueCity}\n\nSampai jumpa di lapangan dan junjung tinggi sportivitas!`;
    } else if (type === 'REJECTED') {
      message = `⚠️ *PEMBERITAHUAN VERIFIKASI BERKAS ${tourneyName.toUpperCase()}*\n\nTim *${item.teamName}* (${item.regCode}), berkas pendaftaran Anda memerlukan perbaikan dengan catatan:\n\n❌ *Alasan:* ${item.rejectionReason || 'Berkas dokumen belum sesuai ketentuan regulasi'}\n\nSilakan lakukan upload ulang atau hubungi sekretariat panitia untuk bantuan perbaikan berkas.`;
    } else if (type === 'PAYMENT_REMINDER') {
      message = `🔔 *PENGINGAT PEMBAYARAN REGISTRASI ${tourneyName.toUpperCase()}*\n\nYth. *${item.coachName}* (${item.teamName}), berkas tim Anda sudah lengkap dan valid. Mohon segera menyelesaikan pembayaran biaya pendaftaran sebesar *Rp ${item.paymentAmount.toLocaleString('id-ID')}* sebelum batas akhir agar slot tim Anda terkunci aman.\n\nRekening: ${primaryBank.bankName} ${primaryBank.accountNumber} a/n ${primaryBank.accountHolder}. Terima kasih!`;
    }

    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  };

  return (
    <TournamentContext.Provider
      value={{
        theme,
        toggleTheme,
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
        categories,
        updateCategory,
        registrations,
        submitNewRegistration,
        updateRegistration,
        updateRegistrationStatus,
        updatePaymentStatus,
        deleteRegistration,
        matches,
        addMatch,
        updateMatch,
        deleteMatch,
        randomizeMatchesForCategory,
        checkCanDrawNextRound,
        sponsors,
        addSponsor,
        updateSponsor,
        deleteSponsor,
        adminUsers,
        currentAdmin,
        loginAdmin,
        logoutAdmin,
        addAdminUser,
        deleteAdminUser,
        resetAllDataToDefaults,
        getWhatsAppNotificationUrl,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = (): TournamentContextType => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
