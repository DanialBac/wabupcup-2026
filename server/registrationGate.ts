import { Database } from './db';
import { TournamentConfig, RegistrationButtonMode } from '../src/types';

/**
 * Logika evaluasi status pendaftaran publik di tingkat server.
 * Memakai aturan yang PERSIS SAMA dengan getRegistrationStatus di klien (src/utils/registrationStatus.ts):
 * - Mode eksplisit 'HIDDEN' atau 'CUSTOM_LINK' -> tertutup (false)
 * - Mode undefined dan sectionsVisibility.registrationButton === false -> tertutup (false)
 * - Mode undefined dengan registrationCustomLink terisi -> tertutup (false, dialihkan)
 * - Mode 'INTERNAL_FORM' atau tidak ada konfigurasi -> terbuka (true)
 */
export function isPublicRegistrationOpen(config?: Partial<TournamentConfig> | null): boolean {
  if (!config) {
    return true; // Default terbuka jika tidak ada konfigurasi
  }

  const rawMode = config.registrationButtonMode;
  const isHiddenByVis = config.sectionsVisibility?.registrationButton === false;

  let mode: RegistrationButtonMode = 'INTERNAL_FORM';
  if (rawMode === 'HIDDEN' || (rawMode === undefined && isHiddenByVis)) {
    mode = 'HIDDEN';
  } else if (rawMode === 'CUSTOM_LINK') {
    mode = 'CUSTOM_LINK';
  } else if (rawMode === 'INTERNAL_FORM') {
    mode = 'INTERNAL_FORM';
  } else {
    // Fallback lama: jika mode belum ditentukan secara eksplisit namun ada registrationCustomLink
    if (config.registrationCustomLink && config.registrationCustomLink.trim() !== '') {
      mode = 'CUSTOM_LINK';
    } else {
      mode = 'INTERNAL_FORM';
    }
  }

  return mode === 'INTERNAL_FORM';
}

/**
 * Cache memori per-instance berumur 10 detik.
 * Menjamin tambahan RU maksimal 1 kueri per 10 detik per instance.
 */
interface CacheEntry {
  config: TournamentConfig | null;
  timestamp: number;
}

let cachedEntry: CacheEntry | null = null;
const CACHE_TTL_MS = 10_000; // 10 detik

export function clearRegistrationGateCache(): void {
  cachedEntry = null;
}

export function setRegistrationGateCacheForTest(config: TournamentConfig | null, timestamp = Date.now()): void {
  cachedEntry = { config, timestamp };
}

/**
 * Membaca konfigurasi dari database lewat fungsi yang sudah ada (Database.getConfig).
 * Jika gagal membaca konfigurasi dari basis data, sistem menerapkan kebijakan FAIL-OPEN:
 * menganggap pendaftaran terbuka (true) agar ketersediaan layanan publik tidak terganggu,
 * dan mencatat pesan peringatan pada log.
 */
export async function getRegistrationConfigWithCache(): Promise<TournamentConfig | null> {
  const now = Date.now();
  if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_TTL_MS) {
    return cachedEntry.config;
  }

  try {
    const config = await Database.getConfig();
    cachedEntry = {
      config,
      timestamp: now,
    };
    return config;
  } catch (err) {
    console.warn('[RegistrationGate] Gagal membaca konfigurasi turnamen dari basis data, menerapkan fail-open (pendaftaran dianggap terbuka):', err);
    return null;
  }
}

/**
 * Evaluasi penutupan pendaftaran publik dengan cache 10 detik dan kebijakan fail-open.
 */
export async function checkPublicRegistrationOpen(): Promise<boolean> {
  try {
    const config = await getRegistrationConfigWithCache();
    return isPublicRegistrationOpen(config);
  } catch (err) {
    console.warn('[RegistrationGate] Galat dalam checkPublicRegistrationOpen, menerapkan fail-open:', err);
    return true; // Fail-open untuk ketersediaan
  }
}

/**
 * Respons standar 403 saat pendaftaran publik ditutup atau dialihkan.
 */
export const REGISTRATION_CLOSED_RESPONSE = {
  success: false,
  code: 'REGISTRATION_CLOSED',
  error: 'Pendaftaran sedang ditutup atau dialihkan ke tautan resmi.',
} as const;

/**
 * Validasi ketat konfigurasi registration di PUT /config (server).
 */
export function validateRegistrationConfig(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: true };
  }

  // 1. registrationCustomLink
  if (body.registrationCustomLink !== undefined && body.registrationCustomLink !== null) {
    if (typeof body.registrationCustomLink !== 'string') {
      return { valid: false, error: 'registrationCustomLink harus berupa teks (string).' };
    }
    const trimmed = body.registrationCustomLink.trim();
    // Karakter kontrol ASCII 0-31 dan 127
    if (/[\x00-\x1F\x7F]/.test(trimmed)) {
      return { valid: false, error: 'registrationCustomLink tidak boleh mengandung karakter kontrol.' };
    }
    if (trimmed.length > 2048) {
      return { valid: false, error: 'registrationCustomLink melebihi batas maksimal 2048 karakter.' };
    }
    // Jika diawali skema (misal scheme:...)
    const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    if (schemeMatch) {
      const scheme = schemeMatch[1].toLowerCase();
      const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];
      if (!ALLOWED_SCHEMES.includes(scheme)) {
        return {
          valid: false,
          error: `Skema URL '${scheme}:' ditolak. Hanya protokol http, https, mailto, dan tel yang diterima.`,
        };
      }
    }
    // Nilai tanpa skema (misal wa.me/xxx) diterima apa adanya
  }

  // 2. registrationCustomButtonText
  if (body.registrationCustomButtonText !== undefined && body.registrationCustomButtonText !== null) {
    if (typeof body.registrationCustomButtonText !== 'string') {
      return { valid: false, error: 'registrationCustomButtonText harus berupa teks (string).' };
    }
    const trimmed = body.registrationCustomButtonText.trim();
    if (/[\x00-\x1F\x7F]/.test(trimmed)) {
      return { valid: false, error: 'registrationCustomButtonText tidak boleh mengandung karakter kontrol.' };
    }
    if (trimmed.length > 60) {
      return { valid: false, error: 'registrationCustomButtonText melebihi batas maksimal 60 karakter.' };
    }
  }

  // 3. registrationButtonMode
  if (body.registrationButtonMode !== undefined && body.registrationButtonMode !== null) {
    const ALLOWED_MODES = ['INTERNAL_FORM', 'CUSTOM_LINK', 'HIDDEN'];
    if (!ALLOWED_MODES.includes(body.registrationButtonMode)) {
      return {
        valid: false,
        error: `registrationButtonMode '${body.registrationButtonMode}' tidak valid. Pilihan yang sah: INTERNAL_FORM, CUSTOM_LINK, atau HIDDEN.`,
      };
    }
  }

  // 4. registrationCustomLinkNewTab
  if (body.registrationCustomLinkNewTab !== undefined && body.registrationCustomLinkNewTab !== null) {
    if (typeof body.registrationCustomLinkNewTab !== 'boolean') {
      return { valid: false, error: 'registrationCustomLinkNewTab harus berupa boolean (true atau false).' };
    }
  }

  return { valid: true };
}
