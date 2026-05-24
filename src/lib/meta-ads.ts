/**
 * Meta Ads API Helper (Server-side only)
 * Memanggil Meta Graph API untuk mendapatkan metrik iklan
 */

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;
const META_API_VERSION = process.env.META_API_VERSION ?? 'v19.0';
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaInsights {
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  conversions?: Array<{ action_type: string; value: string }>;
  purchase_roas?: Array<{ action_type: string; value: string }>;
  date_start?: string;
  date_stop?: string;
}

export interface AdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
}

export interface CampaignInsights extends MetaInsights {
  campaign_name: string;
  campaign_id: string;
}

// Ambil semua Ad Account yang terhubung dengan token
export async function getAdAccounts(): Promise<AdAccount[]> {
  const url = new URL(`${BASE_URL}/me/adaccounts`);
  url.searchParams.set('fields', 'id,name,account_status,currency');
  url.searchParams.set('access_token', META_ACCESS_TOKEN);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta API Error (accounts): ${err}`);
  }
  const json = await res.json();
  return json.data ?? [];
}

// Ambil summary insights untuk satu ad account
export async function getAccountInsights(
  adAccountId: string,
  datePreset: string = 'last_30d'
): Promise<MetaInsights | null> {
  const fields = [
    'spend',
    'impressions',
    'clicks',
    'ctr',
    'cpc',
    'cpm',
    'conversions',
    'purchase_roas',
    'date_start',
    'date_stop',
  ].join(',');

  const url = new URL(`${BASE_URL}/${adAccountId}/insights`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('date_preset', datePreset);
  url.searchParams.set('access_token', META_ACCESS_TOKEN);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta API Error (insights): ${err}`);
  }
  const json = await res.json();
  return json.data?.[0] ?? null;
}

// Ambil insights per campaign
export async function getCampaignInsights(
  adAccountId: string,
  datePreset: string = 'last_30d'
): Promise<CampaignInsights[]> {
  const fields = [
    'campaign_name',
    'campaign_id',
    'spend',
    'impressions',
    'clicks',
    'ctr',
    'cpc',
    'cpm',
    'conversions',
    'purchase_roas',
  ].join(',');

  const url = new URL(`${BASE_URL}/${adAccountId}/insights`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('date_preset', datePreset);
  url.searchParams.set('level', 'campaign');
  url.searchParams.set('access_token', META_ACCESS_TOKEN);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta API Error (campaigns): ${err}`);
  }
  const json = await res.json();
  return json.data ?? [];
}

// Ambil data time-series (per hari) untuk grafik
export async function getTimeseriesInsights(
  adAccountId: string,
  datePreset: string = 'last_30d'
): Promise<MetaInsights[]> {
  const fields = ['spend', 'impressions', 'clicks', 'ctr', 'date_start'].join(',');

  const url = new URL(`${BASE_URL}/${adAccountId}/insights`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('date_preset', datePreset);
  url.searchParams.set('time_increment', '1');
  url.searchParams.set('access_token', META_ACCESS_TOKEN);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta API Error (timeseries): ${err}`);
  }
  const json = await res.json();
  return json.data ?? [];
}

// Helper: ambil nilai konversi dari array action
export function getConversions(conversions?: Array<{ action_type: string; value: string }>): number {
  if (!conversions) return 0;
  const total = conversions
    .filter(a => ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(a.action_type))
    .reduce((sum, a) => sum + parseFloat(a.value || '0'), 0);
  // fallback: sum all
  if (total === 0) {
    return conversions.reduce((sum, a) => sum + parseFloat(a.value || '0'), 0);
  }
  return total;
}

// Helper: ambil nilai ROAS dari array
export function getRoas(roas?: Array<{ action_type: string; value: string }>): number {
  if (!roas) return 0;
  return roas.reduce((sum, a) => sum + parseFloat(a.value || '0'), 0);
}
