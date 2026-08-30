import {
  CategoryDetail,
  MatchItem,
  RegistrationItem,
  SponsorItem,
  TournamentConfig,
  AdminUser,
} from '../types';

const API_BASE = '/api';

export const ApiService = {
  // Check Health & DB status
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return {
        status: 'local',
        database: { connected: false, mode: 'CLIENT_STORAGE' },
      };
    }
  },

  // Database actions
  async initDb() {
    const res = await fetch(`${API_BASE}/database/init`, { method: 'POST' });
    return await res.json();
  },

  async reconnectDb() {
    const res = await fetch(`${API_BASE}/database/reconnect`, { method: 'POST' });
    return await res.json();
  },

  getExportSqlUrl() {
    return `${API_BASE}/database/export-sql`;
  },

  // Config
  async getConfig(): Promise<TournamentConfig | null> {
    try {
      const res = await fetch(`${API_BASE}/config`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateConfig(config: Partial<TournamentConfig>): Promise<TournamentConfig | null> {
    try {
      const res = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Categories
  async getCategories(): Promise<CategoryDetail[] | null> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveCategory(category: CategoryDetail): Promise<CategoryDetail | null> {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Registrations
  async getRegistrations(): Promise<RegistrationItem[] | null> {
    try {
      const res = await fetch(`${API_BASE}/registrations`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createRegistration(data: Partial<RegistrationItem>): Promise<RegistrationItem | null> {
    try {
      const res = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateRegistration(item: RegistrationItem): Promise<RegistrationItem | null> {
    try {
      const res = await fetch(`${API_BASE}/registrations/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateRegistrationStatus(id: string, status: string, reason?: string, notes?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/registrations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason, notes }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updatePaymentStatus(id: string, paymentStatus: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/registrations/${id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteRegistration(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/registrations/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Matches
  async getMatches(): Promise<MatchItem[] | null> {
    try {
      const res = await fetch(`${API_BASE}/matches`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveMatch(match: MatchItem): Promise<MatchItem | null> {
    try {
      const res = await fetch(`${API_BASE}/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async deleteMatch(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/matches/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Sponsors
  async getSponsors(): Promise<SponsorItem[] | null> {
    try {
      const res = await fetch(`${API_BASE}/sponsors`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveSponsor(sponsor: SponsorItem): Promise<SponsorItem | null> {
    try {
      const res = await fetch(`${API_BASE}/sponsors/${sponsor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sponsor),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async deleteSponsor(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/sponsors/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Admins & Auth
  async loginAdmin(username: string, pass: string): Promise<{ success: boolean; user?: AdminUser }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },
};
