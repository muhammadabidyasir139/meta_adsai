import type { NextRequest } from 'next/server';
import {
  getAdAccounts,
  getAccountInsights,
  getCampaignInsights,
  getTimeseriesInsights,
  getConversions,
  getRoas,
} from '@/lib/meta-ads';
import { db } from '@/db';
import {
  metaAdsSummary,
  metaAdsCampaigns,
  metaAdsTimeseries,
  metaAdsSyncLogs,
} from '@/db/schema';

/**
 * GET /api/meta/insights
 * Ambil data dari Meta API, simpan ke PostgreSQL, kembalikan hasilnya.
 *
 * Query params:
 *   - account_id: string (mis: act_682716181447477 atau 682716181447477)
 *   - date_preset: string (default: last_30d)
 *   - save: 'true' | 'false' (default: true) — simpan ke DB atau tidak
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawId = searchParams.get('account_id') ?? '';
  const datePreset = searchParams.get('date_preset') ?? 'last_30d';
  const shouldSave = searchParams.get('save') !== 'false';

  // Normalize account ID → pastikan format act_XXXX
  let accountId = rawId
    ? rawId.startsWith('act_') ? rawId : `act_${rawId}`
    : '';

  // Fallback ke env variable
  if (!accountId && process.env.META_AD_ACCOUNT_ID) {
    accountId = `act_${process.env.META_AD_ACCOUNT_ID}`;
  }

  // Terakhir: auto-detect dari token
  if (!accountId) {
    try {
      const accounts = await getAdAccounts();
      if (accounts.length === 0) {
        return Response.json(
          { success: false, error: 'Tidak ada Ad Account yang ditemukan. Konfigurasikan di halaman Settings.' },
          { status: 404 }
        );
      }
      accountId = accounts[0].id;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal auto-detect account';
      return Response.json({ success: false, error: msg }, { status: 500 });
    }
  }

  try {
    // ── 1. Fetch dari Meta API secara parallel ────────────────────────────
    const [summary, campaigns, timeseries] = await Promise.all([
      getAccountInsights(accountId, datePreset),
      getCampaignInsights(accountId, datePreset),
      getTimeseriesInsights(accountId, datePreset),
    ]);

    // ── 2. Normalize data ─────────────────────────────────────────────────
    const normalizedSummary = summary
      ? {
          spend: parseFloat(summary.spend || '0'),
          impressions: parseInt(summary.impressions || '0'),
          clicks: parseInt(summary.clicks || '0'),
          ctr: parseFloat(summary.ctr || '0'),
          cpc: parseFloat(summary.cpc || '0'),
          cpm: parseFloat(summary.cpm || '0'),
          conversions: getConversions(summary.conversions),
          roas: getRoas(summary.purchase_roas),
          date_start: summary.date_start,
          date_stop: summary.date_stop,
        }
      : null;

    const normalizedCampaigns = campaigns.map((c) => ({
      campaign_name: c.campaign_name,
      campaign_id: c.campaign_id,
      spend: parseFloat(c.spend || '0'),
      impressions: parseInt(c.impressions || '0'),
      clicks: parseInt(c.clicks || '0'),
      ctr: parseFloat(c.ctr || '0'),
      cpc: parseFloat(c.cpc || '0'),
      cpm: parseFloat(c.cpm || '0'),
      conversions: getConversions(c.conversions),
      roas: getRoas(c.purchase_roas),
    }));

    const normalizedTimeseries = timeseries.map((t) => ({
      date: t.date_start ?? '',
      spend: parseFloat(t.spend || '0'),
      impressions: parseInt(t.impressions || '0'),
      clicks: parseInt(t.clicks || '0'),
      ctr: parseFloat(t.ctr || '0'),
    }));

    // ── 3. Simpan ke PostgreSQL ───────────────────────────────────────────
    if (shouldSave) {
      await saveToDatabase({
        accountId,
        datePreset,
        summary: normalizedSummary,
        campaigns: normalizedCampaigns,
        timeseries: normalizedTimeseries,
      });
    }

    // ── 4. Return response ────────────────────────────────────────────────
    return Response.json({
      success: true,
      account_id: accountId,
      date_preset: datePreset,
      saved_to_db: shouldSave,
      summary: normalizedSummary,
      campaigns: normalizedCampaigns,
      timeseries: normalizedTimeseries,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Log error ke database
    try {
      await db.insert(metaAdsSyncLogs).values({
        adAccountId: accountId,
        datePreset,
        status: 'error',
        errorMessage: message,
        campaignCount: 0,
        timeseriesCount: 0,
      });
    } catch {
      // Jangan crash jika DB juga gagal
    }

    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// ── Helper: Simpan semua data ke DB ──────────────────────────────────────────
async function saveToDatabase({
  accountId,
  datePreset,
  summary,
  campaigns,
  timeseries,
}: {
  accountId: string;
  datePreset: string;
  summary: {
    spend: number; impressions: number; clicks: number;
    ctr: number; cpc: number; cpm: number;
    conversions: number; roas: number;
    date_start?: string; date_stop?: string;
  } | null;
  campaigns: Array<{
    campaign_name: string; campaign_id: string;
    spend: number; impressions: number; clicks: number;
    ctr: number; cpc: number; cpm: number;
    conversions: number; roas: number;
  }>;
  timeseries: Array<{
    date: string; spend: number; impressions: number; clicks: number; ctr: number;
  }>;
}) {
  const ops: Promise<unknown>[] = [];

  // Simpan summary
  if (summary) {
    ops.push(
      db.insert(metaAdsSummary).values({
        adAccountId: accountId,
        datePreset,
        spend: summary.spend,
        impressions: summary.impressions,
        clicks: summary.clicks,
        ctr: summary.ctr,
        cpc: summary.cpc,
        cpm: summary.cpm,
        conversions: summary.conversions,
        roas: summary.roas,
        dateStart: summary.date_start ?? null,
        dateStop: summary.date_stop ?? null,
      })
    );
  }

  // Simpan campaigns (batch insert)
  if (campaigns.length > 0) {
    ops.push(
      db.insert(metaAdsCampaigns).values(
        campaigns.map((c) => ({
          adAccountId: accountId,
          campaignId: c.campaign_id,
          campaignName: c.campaign_name,
          spend: c.spend,
          impressions: c.impressions,
          clicks: c.clicks,
          ctr: c.ctr,
          cpc: c.cpc,
          cpm: c.cpm,
          conversions: c.conversions,
          roas: c.roas,
          datePreset,
        }))
      )
    );
  }

  // Simpan timeseries — skip baris dengan date kosong
  const validTs = timeseries.filter((t) => !!t.date);
  if (validTs.length > 0) {
    ops.push(
      db.insert(metaAdsTimeseries).values(
        validTs.map((t) => ({
          adAccountId: accountId,
          date: t.date,
          spend: t.spend,
          impressions: t.impressions,
          clicks: t.clicks,
          ctr: t.ctr,
        }))
      )
    );
  }

  // Simpan sync log
  ops.push(
    db.insert(metaAdsSyncLogs).values({
      adAccountId: accountId,
      datePreset,
      status: 'success',
      campaignCount: campaigns.length,
      timeseriesCount: validTs.length,
    })
  );

  await Promise.all(ops);
}
