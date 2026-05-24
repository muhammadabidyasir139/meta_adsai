'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { loadSettings } from '@/lib/settings';

// ── Types ──────────────────────────────────────────────────────────────────────
interface MetaSummary {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  roas: number;
  date_start?: string;
  date_stop?: string;
}

interface Campaign {
  campaign_name: string;
  campaign_id: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  roas: number;
}

interface TimeseriesPoint {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface MetaData {
  summary: MetaSummary | null;
  campaigns: Campaign[];
  timeseries: TimeseriesPoint[];
  account_id: string;
  date_preset: string;
}

// ── Format helpers ─────────────────────────────────────────────────────────────
const fmtRp = (n: number) =>
  n >= 1_000_000 ? `Rp ${(n / 1_000_000).toFixed(2)}M` :
  n >= 1_000 ? `Rp ${(n / 1_000).toFixed(1)}K` :
  `Rp ${n.toFixed(0)}`;

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` :
  n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` :
  n.toLocaleString('id-ID');

// ── Skeleton Loader ───────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 20, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite linear',
    }} />
  );
}

// ── Live Badge ────────────────────────────────────────────────────────────────
function LiveBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: '#d1fae5', color: '#065f46',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: '#10b981',
        display: 'inline-block', animation: 'pulse 2s infinite',
      }} />
      LIVE
    </span>
  );
}

// ── SVG Line Chart ─────────────────────────────────────────────────────────────
function LineChart({ data, color, label, height = 110 }: {
  data: number[]; color: string; label: string; height?: number;
}) {
  if (data.length < 2) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>Tidak cukup data</div>;
  const w = 360, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const pad = 12;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return `${x},${y}`;
  });
  const linePath = `M ${pts.join(' L ')}`;
  const areaPath = `M ${pts[0]} L ${pts.join(' L ')} L ${pts[pts.length - 1].split(',')[0]},${h - pad} L ${pts[0].split(',')[0]},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${label})`} />
      <path d={linePath} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((_, i) => {
        const [x, y] = pts[i].split(',');
        return <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke={color} strokeWidth="2.5" />;
      })}
    </svg>
  );
}

// ── Dual Bar Chart ─────────────────────────────────────────────────────────────
function DualBarChart({ items }: { items: { label: string; a: number; b: number }[] }) {
  const maxVal = Math.max(...items.map(d => Math.max(d.a, d.b)), 1);
  const h = 140, padV = 12, barW = 14, gap = 4;
  const totalW = Math.max(items.length * (barW * 2 + gap + 22), 300);
  return (
    <svg viewBox={`0 0 ${totalW} ${h}`} style={{ width: '100%', height: h }}>
      {items.map((d, i) => {
        const x = i * (barW * 2 + gap + 22) + 10;
        const aH = ((d.a / maxVal) * (h - padV * 2));
        const bH = ((d.b / maxVal) * (h - padV * 2));
        return (
          <g key={i}>
            <rect x={x} y={h - padV - aH} width={barW} height={Math.max(aH, 2)} rx="4" fill="#6366f1" opacity="0.85" />
            <rect x={x + barW + 3} y={h - padV - bH} width={barW} height={Math.max(bH, 2)} rx="4" fill="#06b6d4" opacity="0.85" />
            <text x={x + barW} y={h - 1} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function RoasBadge({ roas }: { roas: number }) {
  const color = roas >= 3 ? '#065f46' : roas >= 2 ? '#92400e' : '#991b1b';
  const bg = roas >= 3 ? '#d1fae5' : roas >= 2 ? '#fef3c7' : '#fee2e2';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      background: bg, color, fontSize: 12, fontWeight: 800,
    }}>{roas.toFixed(2)}x</span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState('last_30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [campaignTab, setCampaignTab] = useState<'all' | 'high' | 'low'>('all');

  const settings = typeof window !== 'undefined' ? loadSettings() : null;

  const fetchData = useCallback(async (preset: string = datePreset) => {
    setLoading(true);
    setError(null);
    try {
      const adAccountId = settings?.adAccountId ?? '';
      const params = new URLSearchParams({ date_preset: preset });
      if (adAccountId) params.set('account_id', `act_${adAccountId}`);
      const res = await fetch(`/api/meta/insights?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json);
      setLastUpdated(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal mengambil data Meta Ads');
    } finally {
      setLoading(false);
    }
  }, [datePreset, settings?.adAccountId]);

  // Auto-refresh
  useEffect(() => {
    fetchData(datePreset);
    const interval = settings?.autoRefresh
      ? setInterval(() => fetchData(datePreset), (settings.refreshInterval ?? 5) * 60 * 1000)
      : null;
    return () => { if (interval) clearInterval(interval); };
  }, [datePreset, fetchData, settings?.autoRefresh, settings?.refreshInterval]);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const s = data?.summary;

  // Build timeseries chart data (last 14 points max)
  const tsSample = (data?.timeseries ?? []).slice(-14);
  const spendChart = tsSample.map(t => t.spend);
  const clickChart = tsSample.map(t => t.clicks);
  const ctrChart = tsSample.map(t => t.ctr);
  const tsLabels = tsSample.map(t => t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '');

  // Bar chart: spend vs clicks per campaign (top 6)
  const topCampaigns = (data?.campaigns ?? []).slice(0, 6);
  const barItems = topCampaigns.map(c => ({
    label: c.campaign_name.split(' ')[0].substring(0, 6),
    a: c.impressions,
    b: c.clicks * 100, // scale clicks for visibility
  }));

  // Filter campaigns
  const filteredCampaigns = campaignTab === 'all'
    ? (data?.campaigns ?? [])
    : campaignTab === 'high'
    ? (data?.campaigns ?? []).filter(c => c.roas >= 2)
    : (data?.campaigns ?? []).filter(c => c.roas < 2);

  const STAT_CARDS = s ? [
    {
      label: 'Total Spend', value: fmtRp(s.spend), icon: '💸', color: '#6366f1', bg: '#eef2ff',
      sub: `${s.date_start ?? ''} – ${s.date_stop ?? ''}`,
    },
    {
      label: 'Impressions', value: fmtNum(s.impressions), icon: '👁️', color: '#06b6d4', bg: '#cffafe',
      sub: `CPM: ${fmtRp(s.cpm)}`,
    },
    {
      label: 'Clicks', value: fmtNum(s.clicks), icon: '🖱️', color: '#8b5cf6', bg: '#ede9fe',
      sub: `CTR: ${s.ctr.toFixed(2)}%`,
    },
    {
      label: 'CTR', value: `${s.ctr.toFixed(2)}%`, icon: '📊', color: '#f59e0b', bg: '#fef3c7',
      sub: `CPC: ${fmtRp(s.cpc)}`,
    },
    {
      label: 'CPC', value: fmtRp(s.cpc), icon: '💰', color: '#10b981', bg: '#d1fae5',
      sub: 'Cost per Click',
    },
    {
      label: 'CPM', value: fmtRp(s.cpm), icon: '📣', color: '#ec4899', bg: '#fce7f3',
      sub: 'per 1K Tayangan',
    },
    {
      label: 'Conversions', value: fmtNum(s.conversions), icon: '🎯', color: '#ef4444', bg: '#fee2e2',
      sub: 'Total konversi',
    },
    {
      label: 'ROAS', value: `${s.roas.toFixed(2)}x`, icon: '📈', color: s.roas >= 3 ? '#10b981' : s.roas >= 2 ? '#f59e0b' : '#ef4444',
      bg: s.roas >= 3 ? '#d1fae5' : s.roas >= 2 ? '#fef3c7' : '#fee2e2',
      sub: s.roas >= 3 ? 'Sangat Baik 🚀' : s.roas >= 2 ? 'Cukup Baik' : 'Perlu Ditingkatkan',
    },
  ] : [];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.03em' }}>
                Overview Dashboard
              </h2>
              <LiveBadge />
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>
              {today}
              {lastUpdated && (
                <span style={{ marginLeft: 8, color: '#10b981', fontWeight: 600 }}>
                  · Diperbarui {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Date Preset Selector */}
            <select
              value={datePreset}
              onChange={(e) => { setDatePreset(e.target.value); fetchData(e.target.value); }}
              style={{
                padding: '8px 32px 8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: '1.5px solid #c7d2fe', background: '#eef2ff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236366f1\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E") no-repeat right 11px center',
                color: '#4338ca', appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="last_7d">Last 7 Days</option>
              <option value="last_14d">Last 14 Days</option>
              <option value="last_30d">Last 30 Days</option>
              <option value="last_90d">Last 90 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>

            <button
              className="btn-outline"
              onClick={() => fetchData(datePreset)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              🔄 Refresh
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: '1px solid #e2e8f0' }}>
              <div className="user-avatar">{settings?.avatar ?? 'A'}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{settings?.name ?? 'Abid'}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{settings?.role ?? 'Admin'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{
            background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 14,
            padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#991b1b' }}>Gagal mengambil data Meta Ads</div>
              <div style={{ fontSize: 12.5, color: '#b91c1c', marginTop: 2 }}>{error}</div>
            </div>
            <a href="/settings" style={{
              padding: '7px 14px', borderRadius: 8, background: '#ef4444', color: '#fff',
              fontSize: 12.5, fontWeight: 700, textDecoration: 'none',
            }}>⚙️ Pengaturan</a>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="stat-card" style={{ gap: 12, display: 'flex', flexDirection: 'column' }}>
                  <Skeleton w={44} h={44} r={12} />
                  <Skeleton w="60%" h={12} />
                  <Skeleton w="80%" h={28} />
                  <Skeleton w="50%" h={12} />
                </div>
              ))
            : STAT_CARDS.map((c) => (
              <div key={c.label} className="stat-card">
                <div className="card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                <div className="card-label">{c.label}</div>
                <div className="card-value">{c.value}</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 6, fontWeight: 500 }}>{c.sub}</div>
                <div className="card-bg-blob" style={{ background: c.color }} />
              </div>
            ))
          }
        </div>

        {/* ── Charts Row ── */}
        {!loading && !error && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Spend & Clicks over time */}
              <div className="chart-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div className="chart-title">Spend & Clicks Harian</div>
                    <div className="chart-subtitle">Tren pengeluaran dan klik dari Meta Ads</div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                      <span className="legend-dot" style={{ background: '#6366f1' }} />Spend
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                      <span className="legend-dot" style={{ background: '#10b981' }} />Clicks
                    </span>
                  </div>
                </div>
                {tsSample.length > 0 ? (
                  <>
                    <LineChart data={spendChart} color="#6366f1" label="spend" height={120} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                      {tsLabels.filter((_, i) => i % Math.max(1, Math.floor(tsLabels.length / 6)) === 0).map(l => (
                        <span key={l} style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{l}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                    Tidak ada data time-series tersedia
                  </div>
                )}
              </div>

              {/* ROAS & CTR cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="chart-card" style={{ flex: 1 }}>
                  <div className="chart-title">ROAS</div>
                  <div className="chart-subtitle">Return on Ad Spend</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: s && s.roas >= 3 ? '#10b981' : '#f59e0b', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {s ? `${s.roas.toFixed(2)}x` : '—'}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12.5, color: '#64748b' }}>
                    {s && s.roas >= 3 ? '🚀 Di atas rata-rata industri' : s && s.roas >= 2 ? '⚡ Performa cukup' : '⚠️ Perlu optimasi'}
                  </div>
                </div>
                <div className="chart-card" style={{ flex: 1 }}>
                  <div className="chart-title">CTR Trend</div>
                  <div className="chart-subtitle">Click-through Rate</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {s ? `${s.ctr.toFixed(2)}%` : '—'}
                  </div>
                  {ctrChart.length > 1 && <LineChart data={ctrChart} color="#f59e0b" label="ctr" height={60} />}
                </div>
              </div>
            </div>

            {/* Impressions vs Clicks Bar Chart */}
            {barItems.length > 0 && (
              <div className="chart-card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div className="chart-title">Impressions vs Clicks per Kampanye</div>
                    <div className="chart-subtitle">Perbandingan tayangan dan klik top kampanye</div>
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                      <span className="legend-dot" style={{ background: '#6366f1' }} />Impressions
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                      <span className="legend-dot" style={{ background: '#06b6d4' }} />Clicks (×100)
                    </span>
                  </div>
                </div>
                <DualBarChart items={barItems} />
              </div>
            )}

            {/* ── Campaign Table ── */}
            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="section-title">Performa Kampanye</div>
                  <div className="section-subtitle">
                    Data real-time dari Meta Ads · {data?.campaigns.length ?? 0} kampanye aktif
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['all', 'high', 'low'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setCampaignTab(tab)}
                      style={{
                        padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                        border: campaignTab === tab ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
                        background: campaignTab === tab ? '#eef2ff' : 'white',
                        color: campaignTab === tab ? '#6366f1' : '#64748b', transition: 'all 0.15s',
                      }}
                    >
                      {tab === 'all' ? 'Semua' : tab === 'high' ? '🟢 ROAS ≥ 2x' : '🔴 ROAS < 2x'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto', marginTop: 16 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 24 }}>#</th>
                      <th>Nama Kampanye</th>
                      <th>Spend</th>
                      <th>Impressions</th>
                      <th>Clicks</th>
                      <th>CTR</th>
                      <th>CPC</th>
                      <th>CPM</th>
                      <th>Conversions</th>
                      <th style={{ paddingRight: 24 }}>ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '32px 24px', color: '#94a3b8' }}>
                          Tidak ada kampanye ditemukan
                        </td>
                      </tr>
                    ) : filteredCampaigns.map((c, i) => (
                      <tr key={c.campaign_id}>
                        <td style={{ paddingLeft: 24, color: '#94a3b8', fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#1e293b', maxWidth: 200 }}>{c.campaign_name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>ID: {c.campaign_id}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: '#ef4444' }}>{fmtRp(c.spend)}</td>
                        <td style={{ fontWeight: 600 }}>{fmtNum(c.impressions)}</td>
                        <td style={{ fontWeight: 600, color: '#6366f1' }}>{fmtNum(c.clicks)}</td>
                        <td>{c.ctr.toFixed(2)}%</td>
                        <td>{fmtRp(c.cpc)}</td>
                        <td>{fmtRp(c.cpm)}</td>
                        <td style={{ fontWeight: 700 }}>{fmtNum(c.conversions)}</td>
                        <td style={{ paddingRight: 24 }}><RoasBadge roas={c.roas} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{
                padding: '14px 24px', borderTop: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#fafbfc',
              }}>
                <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
                  Menampilkan {filteredCampaigns.length} dari {data?.campaigns.length ?? 0} kampanye
                </span>
                {data?.account_id && (
                  <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
                    📡 {data.account_id}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        <div style={{ height: 32 }} />
      </main>

      <style>{`
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
