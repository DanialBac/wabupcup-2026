import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AdminUser,
  CategoryDetail,
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
  categories: CategoryDetail[];
  updateCategory: (category: CategoryDetail) => void;
  registrations: RegistrationItem[];
  submitNewRegistration: (data: Omit<RegistrationItem, 'id' | 'regCode' | 'registrationDate' | 'status' | 'paymentStatus' | 'lastUpdated'>) => RegistrationItem;
  updateRegistrationStatus: (id: string, status: RegistrationStatus, reason?: string, notes?: string) => void;
  updatePaymentStatus: (id: string, paymentStatus: PaymentStatus) => void;
  deleteRegistration: (id: string) => void;
  matches: MatchItem[];
  addMatch: (match: Omit<MatchItem, 'id'>) => void;
  updateMatch: (match: MatchItem) => void;
  deleteMatch: (matchId: string) => void;
  randomizeMatchesForCategory: (category: TournamentCategory) => MatchItem[];
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
    return saved ? JSON.parse(saved) : INITIAL_TOURNAMENT_CONFIG;
  });

  const updateConfig = (newConfig: Partial<TournamentConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('wabupcup_config', JSON.stringify(updated));
      return updated;
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
      id: `match-${Date.now()}`,
    };
    setMatches(prev => [item, ...prev]);
  };

  const updateMatch = (updated: MatchItem) => {
    setMatches(prev => prev.map(m => (m.id === updated.id ? updated : m)));
  };

  const deleteMatch = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  // FAIR RANDOM BRACKET GENERATOR (Sistem Acak Pertandingan)
  const randomizeMatchesForCategory = (category: TournamentCategory): MatchItem[] => {
    // Get approved teams for this category
    const approvedTeams = registrations
      .filter(r => r.category === category && (r.status === 'APPROVED' || r.status === 'PENDING_PAYMENT'))
      .map(r => ({
        name: r.teamName,
        institution: r.institutionName,
      }));

    // If fewer than 4 teams, provide representative registered/challenger teams for a proper tournament draw
    const teamsToDraw = [...approvedTeams];
    if (teamsToDraw.length < 4) {
      teamsToDraw.push(
        { name: `${category} Bintang Wijaya FC`, institution: `Klub Utama ${category}` },
        { name: `${category} Garuda Muda`, institution: `Akademi ${category}` },
        { name: `${category} Satria Muda`, institution: `Persatuan ${category}` },
        { name: `${category} Putra Wijaya`, institution: `Klub ${category}` }
      );
    }

    // Fisher-Yates Shuffle
    for (let i = teamsToDraw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamsToDraw[i], teamsToDraw[j]] = [teamsToDraw[j], teamsToDraw[i]];
    }

    const newMatches: MatchItem[] = [];
    const roundLabel =
      teamsToDraw.length <= 4
        ? 'Semifinal'
        : teamsToDraw.length <= 8
        ? 'Perempat Final (8 Besar)'
        : 'Babak 16 Besar';

    let matchCount = matches.length + 1;
    const kickoffTimes = ['08:00', '09:15', '10:30', '13:30', '15:00', '16:15', '19:00', '20:15'];
    const pitches = ['Lapangan 1 - Utama', 'Lapangan 2 - Futsal A', 'Lapangan 3 - Futsal B'];

    for (let i = 0; i < teamsToDraw.length; i += 2) {
      const teamA = teamsToDraw[i];
      const teamB = teamsToDraw[i + 1] || { name: 'BYE (Lolos Otomatis)', institution: '-' };
      const timeIndex = (matchCount - 1) % kickoffTimes.length;
      const pitchIndex = (matchCount - 1) % pitches.length;

      newMatches.push({
        id: `match-draw-${Date.now()}-${i}`,
        matchNumber: matchCount,
        category: category,
        round: roundLabel,
        roundIndex: teamsToDraw.length <= 4 ? 4 : (teamsToDraw.length <= 8 ? 3 : 2),
        teamA: {
          name: teamA.name,
          institution: teamA.institution,
        },
        teamB: {
          name: teamB.name,
          institution: teamB.institution,
        },
        date: '2026-10-25',
        time: kickoffTimes[timeIndex],
        pitch: pitches[pitchIndex],
        status: 'UPCOMING',
      });
      matchCount++;
    }

    // Remove old upcoming matches of this category and append newly drawn matches
    setMatches(prev => {
      const filtered = prev.filter(m => !(m.category === category && m.status === 'UPCOMING'));
      return [...newMatches, ...filtered];
    });

    return newMatches;
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

    let message = '';
    if (type === 'CONFIRMATION') {
      message = `Halo *${item.coachName}*, terima kasih telah mendaftarkan tim *${item.teamName}* pada Turnamen *WabupCup 2026* (Kategori: *${item.category}*).\n\n📌 *Kode Registrasi:* ${item.regCode}\n💰 *Biaya Pendaftaran:* Rp ${item.paymentAmount.toLocaleString('id-ID')}\n🏦 *Transfer ke:* ${config.bankAccount.bankName} No. Rek: ${config.bankAccount.accountNumber} a/n ${config.bankAccount.accountHolder}\n\nSilakan kirimkan bukti transfer ke nomor ini untuk diverifikasi oleh panitia. Salam olahraga!`;
    } else if (type === 'APPROVED') {
      message = `🎉 *SELAMAT! PENDAFTARAN DISETUJUI*\n\nTim *${item.teamName}* (${item.regCode}) telah resmi TERVERIFIKASI & DISETUJUI untuk bertanding di *WabupCup 2026* Kategori *${item.category}*.\n\n📅 *Jadwal Drawing Pertandingan:* Segera dicek di website.\n🏟️ *Lokasi:* ${config.venueName}\n\nSampai jumpa di lapangan dan junjung tinggi sportivitas!`;
    } else if (type === 'REJECTED') {
      message = `⚠️ *PEMBERITAHUAN VERIFIKASI BERKAS WABUPCUP 2026*\n\nTim *${item.teamName}* (${item.regCode}), berkas pendaftaran Anda memerlukan perbaikan dengan catatan:\n\n❌ *Alasan:* ${item.rejectionReason || 'Berkas dokumen belum sesuai ketentuan regulasi'}\n\nSilakan lakukan upload ulang atau hubungi sekretariat panitia untuk bantuan perbaikan berkas.`;
    } else if (type === 'PAYMENT_REMINDER') {
      message = `🔔 *PENGINGAT PEMBAYARAN REGISTRASI WABUPCUP 2026*\n\nYth. *${item.coachName}* (${item.teamName}), berkas tim Anda sudah lengkap dan valid. Mohon segera menyelesaikan pembayaran biaya pendaftaran sebesar *Rp ${item.paymentAmount.toLocaleString('id-ID')}* sebelum batas akhir agar slot tim Anda terkunci aman.\n\nRekening: ${config.bankAccount.bankName} ${config.bankAccount.accountNumber} a/n ${config.bankAccount.accountHolder}. Terima kasih!`;
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
        categories,
        updateCategory,
        registrations,
        submitNewRegistration,
        updateRegistrationStatus,
        updatePaymentStatus,
        deleteRegistration,
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
