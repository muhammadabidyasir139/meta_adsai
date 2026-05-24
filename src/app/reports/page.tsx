'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { loadSettings } from '@/lib/settings';

// ── Types ──────────────────────────────────────────────────────────────────────
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

interface MetaData {
  campaigns: Campaign[];
  date_preset: string;
}

const fmtRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
const fmtNum = (n: number) => n.toLocaleString('id-ID');

// ── CSV Export Helper ─────────────────────────────────────────────────────────
function downloadCSV(campaigns: Campaign[], datePreset: string) {
  // 1. Define headers
  const headers = [
    'Campaign ID',
    'Campaign Name',
    'Spend (IDR)',
    'Impressions',
    'Clicks',
    'CTR (%)',
    'CPC (IDR)',
    'CPM (IDR)',
    'Conversions',
    'ROAS'
  ];

  // 2. Map data to rows
  const rows = campaigns.map(c => [
    c.campaign_id,
    `"${c.campaign_name.replace(/"/g, '""')}"`, // escape quotes for CSV
    c.spend,
    c.impressions,
    c.clicks,
    c.ctr.toFixed(4),
    c.cpc.toFixed(2),
    c.cpm.toFixed(2),
    c.conversions,
    c.roas.toFixed(4)
  ]);

  // 3. Construct CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  // 4. Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  
  link.setAttribute('href', url);
  link.setAttribute('download', `meta_ads_report_${datePreset}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState('last_30d');
  
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal mengambil data laporan');
    } finally {
      setLoading(false);
    }
  }, [datePreset, settings?.adAccountId]);

  useEffect(() => {
    fetchData(datePreset);
  }, [datePreset, fetchData]);

  const campaigns = data?.campaigns ?? [];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.03em' }}>
              Data & Reports
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
              Ekspor data mentah performa kampanye ke CSV untuk analisis lebih lanjut.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="settings-input"
              style={{ width: 'auto', paddingRight: 32 }}
            >
              <option value="last_7d">Last 7 Days</option>
              <option value="last_14d">Last 14 Days</option>
              <option value="last_30d">Last 30 Days</option>
              <option value="last_90d">Last 90 Days</option>
              <option value="this_month">This Month</option>
            </select>

            <button 
              className="btn-primary" 
              onClick={() => downloadCSV(campaigns, datePreset)}
              disabled={loading || campaigns.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: (loading || campaigns.length === 0) ? 0.5 : 1 }}
            >
              ⬇️ Download CSV
            </button>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 14, padding: '14px 20px', color: '#991b1b', marginBottom: 20 }}>
            ⚠️ <strong>Error:</strong> {error}
          </div>
        )}

        {/* ── Raw Data Table ── */}
        <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
              Raw Campaign Data ({campaigns.length})
            </div>
            {loading && <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Memuat data...</div>}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Campaign Info</th>
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} style={{ padding: '16px 24px' }}>
                        <div style={{ height: 16, background: '#f1f5f9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                      </td>
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      Tidak ada data kampanye untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.campaign_id}>
                      <td style={{ paddingLeft: 24 }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.campaign_name}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{c.campaign_id}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#475569' }}>{fmtRp(c.spend)}</td>
                      <td>{fmtNum(c.impressions)}</td>
                      <td>{fmtNum(c.clicks)}</td>
                      <td style={{ fontWeight: 600, color: '#6366f1' }}>{c.ctr.toFixed(2)}%</td>
                      <td>{fmtRp(c.cpc)}</td>
                      <td>{fmtRp(c.cpm)}</td>
                      <td style={{ fontWeight: 600 }}>{fmtNum(c.conversions)}</td>
                      <td style={{ paddingRight: 24 }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                          background: c.roas >= 2.5 ? '#d1fae5' : c.roas < 1 ? '#fee2e2' : '#f1f5f9',
                          color: c.roas >= 2.5 ? '#065f46' : c.roas < 1 ? '#991b1b' : '#475569'
                        }}>
                          {c.roas.toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ height: 40 }} />
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
