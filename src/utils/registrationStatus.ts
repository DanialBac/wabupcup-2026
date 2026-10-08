import { TournamentConfig, RegistrationButtonMode } from '../types';

export interface RegistrationStatus {
  mode: RegistrationButtonMode;
  isVisible: boolean;
  isCustomLink: boolean;
  customLink?: string;
  customButtonText?: string;
  openInNewTab: boolean;
}

/**
 * Normalisasi URL (memastikan tautan diawali dengan protokol yang benar)
 */
export function formatExternalLink(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '#';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('wa.me')) {
    return `https://${trimmed}`;
  }
  return `https://${trimmed}`;
}

/**
 * Menghitung status tombol pendaftaran berdasarkan konfigurasi turnamen di CMS
 */
export function getRegistrationStatus(config?: Partial<TournamentConfig> | null): RegistrationStatus {
  if (!config) {
    return {
      mode: 'INTERNAL_FORM',
      isVisible: true,
      isCustomLink: false,
      openInNewTab: true,
    };
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
    // Fallback: jika mode belum ditentukan secara eksplisit namun ada registrationCustomLink
    if (config.registrationCustomLink && config.registrationCustomLink.trim() !== '') {
      mode = 'CUSTOM_LINK';
    } else {
      mode = 'INTERNAL_FORM';
    }
  }

  const isVisible = mode !== 'HIDDEN';
  const customLink = config.registrationCustomLink?.trim();
  const isCustomLink = mode === 'CUSTOM_LINK' && Boolean(customLink);
  const customButtonText = config.registrationCustomButtonText?.trim();
  const openInNewTab = config.registrationCustomLinkNewTab !== false;

  return {
    mode,
    isVisible,
    isCustomLink,
    customLink: isCustomLink ? formatExternalLink(customLink!) : undefined,
    customButtonText: customButtonText || undefined,
    openInNewTab,
  };
}

/**
 * Helper eksekusi: Membuka link kustom (tombol samaran) atau memanggil fallback aksi modal sistem
 */
export function handleRegistrationAction(
  config: Partial<TournamentConfig> | undefined,
  fallbackAction?: () => void
): void {
  const status = getRegistrationStatus(config);
  if (status.isCustomLink && status.customLink) {
    if (typeof window !== 'undefined') {
      if (status.openInNewTab) {
        window.open(status.customLink, '_blank', 'noopener,noreferrer');
      } else {
        window.location.assign(status.customLink);
      }
    }
    return;
  }
  if (fallbackAction) {
    fallbackAction();
  }
}
