'use client';

export interface AppSettings {
  // Profile
  name: string;
  role: string;
  email: string;
  avatar: string; // initials
  // Meta Ads
  adAccountId: string;
  currency: string;
  // Preferences
  defaultDatePreset: string;
  autoRefresh: boolean;
  refreshInterval: number; // minutes
}

export const DEFAULT_SETTINGS: AppSettings = {
  name: 'Abid',
  role: 'Administrator',
  email: '',
  avatar: 'A',
  adAccountId: '682716181447477',
  currency: 'IDR',
  defaultDatePreset: 'last_30d',
  autoRefresh: true,
  refreshInterval: 5,
};

const STORAGE_KEY = 'adsml_settings';

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getAdAccountId(): string {
  const s = loadSettings();
  return s.adAccountId ? `act_${s.adAccountId}` : '';
}
