import {
  CategoryDetail,
  MatchItem,
  RegistrationItem,
  SponsorItem,
  TournamentConfig,
  AdminUser,
  PlayerItem,
  GroupStageItem,
  TeamStandingItem,
} from '../types';


// Override fetch to always include credentials & auth headers for admin sessions
const originalFetch = window.fetch;
window.fetch = async function() {
  const args = Array.prototype.slice.call(arguments);
  if (typeof args[0] === 'string' && args[0].includes('/api/') && !args[0].includes('/api/media/view/')) {
    args[1] = args[1] || {};
    args[1].credentials = 'include';
    const headers = new Headers(args[1].headers || {});
    try {
      const storedToken = localStorage.getItem('wabupcup_admin_token');
      if (storedToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${storedToken}`);
      }
      const currentAdmin = localStorage.getItem('wabupcup_current_admin');
      if (currentAdmin && !headers.has('X-Admin-User')) {
        const parsed = JSON.parse(currentAdmin);
        if (parsed?.id) headers.set('X-Admin-User', parsed.id);
      }
    } catch {}
    args[1].headers = headers;
  }
  return originalFetch.apply(this, args as any);
};

const API_BASE = '/api';

async function safeJsonFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return null;
    }
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export const ApiService = {
  // Check Health & DB status
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) {
        return {
          status: 'local',
          database: { connected: false, mode: 'CLIENT_STORAGE', error: `Server returned status ${res.status}` },
        };
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return {
          status: 'local',
          database: { connected: false, mode: 'CLIENT_STORAGE', error: 'Invalid JSON response from server' },
        };
      }
    } catch (err: any) {
      return {
        status: 'local',
        database: { connected: false, mode: 'CLIENT_STORAGE', error: err?.message },
      };
    }
  },

  async checkHealth() {
    return this.getHealth();
  },

  // Database actions
  async initDb(): Promise<{ success: boolean; message?: string; error?: string; status?: any }> {
    try {
      const res = await fetch(`${API_BASE}/database/init`, { method: 'POST' });
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return json;
      } catch {
        return {
          success: false,
          error: `Server Response Error (${res.status}): ${text.substring(0, 100)}`,
        };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghubungi server' };
    }
  },

  async reconnectDb(): Promise<{ success: boolean; status?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/database/reconnect`, { method: 'POST' });
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return json;
      } catch {
        return {
          success: false,
          error: `Server Response Error (${res.status}): ${text.substring(0, 100)}`,
        };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghubungi server' };
    }
  },

  async connectDb(config: {
    databaseUrl?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean;
  }): Promise<{ success: boolean; message?: string; status?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/database/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return json;
      } catch {
        return {
          success: false,
          error: `Server Response Error (${res.status}): ${text.substring(0, 150)}`,
        };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghubungi backend database' };
    }
  },

  getExportSqlUrl() {
    return `${API_BASE}/database/export-sql`;
  },

  // Config
  async getConfig(): Promise<TournamentConfig | null> {
    return safeJsonFetch<TournamentConfig>(`${API_BASE}/config`);
  },

  async updateConfig(config: Partial<TournamentConfig>): Promise<TournamentConfig | null> {
    return safeJsonFetch<TournamentConfig>(`${API_BASE}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  },

  // Categories
  async getCategories(): Promise<CategoryDetail[] | null> {
    return safeJsonFetch<CategoryDetail[]>(`${API_BASE}/categories`);
  },

  async saveCategory(category: CategoryDetail): Promise<CategoryDetail | null> {
    return safeJsonFetch<CategoryDetail>(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
  },

  async reorderCategories(categories: CategoryDetail[]): Promise<CategoryDetail[] | null> {
    const res = await safeJsonFetch<{ success: boolean; categories: CategoryDetail[] }>(`${API_BASE}/categories/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
    return res ? res.categories : null;
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
  async getRegistrations(isAdmin?: boolean): Promise<RegistrationItem[] | null> {
    return safeJsonFetch<RegistrationItem[]>(`${API_BASE}/registrations${isAdmin ? "" : "/public"}`);
  },

  async createRegistration(data: Partial<RegistrationItem>): Promise<RegistrationItem | null> {
    const res = await fetch(`${API_BASE}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'Gagal menyimpan pendaftaran');
    }
    
    return res.json();
  },

  async updateRegistration(item: RegistrationItem): Promise<RegistrationItem | null> {
    return safeJsonFetch<RegistrationItem>(`${API_BASE}/registrations/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
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
    return safeJsonFetch<MatchItem[]>(`${API_BASE}/matches`);
  },

  async saveMatch(match: MatchItem): Promise<MatchItem | null> {
    return safeJsonFetch<MatchItem>(`${API_BASE}/matches/${match.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(match),
    });
  },

  async replaceCategoryMatches(category: string, matches: MatchItem[]): Promise<MatchItem[] | null> {
    const res = await safeJsonFetch<{ success: boolean; count: number; matches: MatchItem[] }>(`${API_BASE}/matches/replace-category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, matches }),
    });
    return res ? res.matches : null;
  },

  async saveMatchesBatch(matches: MatchItem[]): Promise<MatchItem[] | null> {
    const res = await safeJsonFetch<{ success: boolean; count: number; matches: MatchItem[] }>(`${API_BASE}/matches/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches }),
    });
    return res ? res.matches : null;
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
    return safeJsonFetch<SponsorItem[]>(`${API_BASE}/sponsors`);
  },

  async saveSponsor(sponsor: SponsorItem): Promise<SponsorItem | null> {
    return safeJsonFetch<SponsorItem>(`${API_BASE}/sponsors/${sponsor.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sponsor),
    });
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
  async getAdmins(isAdmin?: boolean): Promise<AdminUser[] | null> {
    const res = await safeJsonFetch<any>(`${API_BASE}/admins`);
    if (res && Array.isArray(res.admins)) {
      return res.admins;
    }
    if (Array.isArray(res)) {
      return res;
    }
    return null;
  },

  async createAdmin(admin: Omit<AdminUser, 'id' | 'createdAt'> & { password?: string }): Promise<{ success: boolean; user?: AdminUser; error?: string; savedToDatabase?: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admin),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || `Error ${res.status}: Gagal membuat admin` };
      }
      return { success: true, user: data, savedToDatabase: data.savedToDatabase };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghubungi server database' };
    }
  },

  async updateAdmin(id: string, admin: Partial<AdminUser> & { password?: string }): Promise<{ success: boolean; user?: AdminUser; error?: string; savedToDatabase?: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/admins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admin),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || `Error ${res.status}: Gagal memperbarui admin` };
      }
      return { success: true, user: data, savedToDatabase: data.savedToDatabase };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghubungi server database' };
    }
  },

  async deleteAdmin(id: string): Promise<{ success: boolean; error?: string; savedToDatabase?: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/admins/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Gagal menghapus admin' };
      }
      return { success: true, savedToDatabase: data.savedToDatabase };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghubungi server database' };
    }
  },

  async loginAdmin(username: string, pass: string): Promise<{ success: boolean; user?: AdminUser; token?: string; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && data.success && data.token) {
          try {
            localStorage.setItem('wabupcup_admin_token', data.token);
          } catch {}
        }
        return data;
      } catch {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error during login' };
    }
  },

  // Players (table_players)
  async getPlayers(category?: string, teamName?: string): Promise<PlayerItem[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (teamName) params.append('teamName', teamName);
    const res = await safeJsonFetch<PlayerItem[]>(`${API_BASE}/players?${params.toString()}`);
    return Array.isArray(res) ? res : [];
  },

  async savePlayer(player: PlayerItem): Promise<PlayerItem | null> {
    const method = player.id ? 'PUT' : 'POST';
    const url = player.id ? `${API_BASE}/players/${player.id}` : `${API_BASE}/players`;
    return safeJsonFetch<PlayerItem>(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player),
    });
  },

  async batchImportPlayers(players: PlayerItem[]): Promise<{ success: boolean; count: number; players?: PlayerItem[] }> {
    try {
      const res = await fetch(`${API_BASE}/players/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, count: 0 };
    }
  },

  async deletePlayer(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/players/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getTopScorers(category?: string): Promise<PlayerItem[]> {
    const param = category ? `?category=${category}` : '';
    const res = await safeJsonFetch<PlayerItem[]>(`${API_BASE}/players/top-scorers${param}`);
    return Array.isArray(res) ? res : [];
  },

  // Groups
  async getGroups(category?: string): Promise<GroupStageItem[]> {
    const param = category ? `?category=${category}` : '';
    const res = await safeJsonFetch<GroupStageItem[]>(`${API_BASE}/groups${param}`);
    return Array.isArray(res) ? res : [];
  },

  async saveGroups(category: string, groups: GroupStageItem[]): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/groups/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, groups }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async resetCategoryGroupsAndMatches(category: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/groups/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      if (res.ok) {
        return await res.json();
      }
      return { success: false, message: 'Gagal mengosongkan grup dan jadwal di server' };
    } catch {
      return { success: false, message: 'Koneksi gagal saat mengosongkan grup' };
    }
  },

  // Standings
  async getStandings(category?: string): Promise<Record<string, TeamStandingItem[]>> {
    const param = category ? `?category=${category}` : '';
    const res = await safeJsonFetch<Record<string, TeamStandingItem[]>>(`${API_BASE}/standings${param}`);
    return res || {};
  },
};

