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
}

const fmtRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

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

// ── Recommendation Logic ──────────────────────────────────────────────────────
function getRecommendation(c: Campaign) {
  // Aturan optimasi sederhana berdasarkan performa kampanye
  if (c.roas >= 2.5 && c.ctr >= 1.5) {
    return {
      status: 'Scale Up',
      action: 'Tingkatkan Budget',
      desc: 'Performa sangat baik. Tingkatkan budget harian 15-20% untuk memaksimalkan hasil.',
      color: '#10b981', bg: '#d1fae5', icon: '🚀'
    };
  } else if (c.roas < 1.0 && c.spend > 10000) {
    return {
      status: 'Reduce',
      action: 'Kurangi/Hentikan',
      desc: 'Membakar budget dengan return rendah. Matikan kampanye atau ganti materi iklan (creatives).',
      color: '#ef4444', bg: '#fee2e2', icon: '⚠️'
    };
  } else if (c.ctr < 0.8 && c.spend > 5000) {
    return {
      status: 'Optimize',
      action: 'Ganti Ads Creative',
      desc: 'Klik sangat rendah (CTR < 0.8%). Perbaiki gambar, video, atau copywriting iklan.',
      color: '#f59e0b', bg: '#fef3c7', icon: '🎨'
    };
  } else {
    return {
      status: 'Maintain',
      action: 'Pertahankan',
      desc: 'Performa stabil. Terus pantau metrik dalam 3-5 hari ke depan.',
      color: '#6366f1', bg: '#eef2ff', icon: '⚖️'
    };
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settings = typeof window !== 'undefined' ? loadSettings() : null;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const adAccountId = settings?.adAccountId ?? '';
      const params = new URLSearchParams({ date_preset: 'last_30d' });
      if (adAccountId) params.set('account_id', `act_${adAccountId}`);
      const res = await fetch(`/api/meta/insights?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal mengambil data Meta Ads');
    } finally {
      setLoading(false);
    }
  }, [settings?.adAccountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const campaigns = data?.campaigns ?? [];
  const scaleUpCount = campaigns.filter(c => getRecommendation(c).status === 'Scale Up').length;
  const reduceCount = campaigns.filter(c => getRecommendation(c).status === 'Reduce').length;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">

        {/* ── Page Header ── */}
        <div className="page-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.03em' }}>
              ML Analytics & Recommendations
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
              Rekomendasi optimasi budget berdasarkan performa ROAS, CTR, dan CPA (Last 30 Days).
            </p>
          </div>
          <button className="btn-primary" onClick={() => fetchData()} style={{ gap: 8 }}>
            <span>🔄</span> Analisis Ulang
          </button>
        </div>

        {/* ── Summary Alert ── */}
        {!loading && !error && (
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: 16,
            padding: '24px', color: 'white', display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: 48 }}>🧠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Hasil Analisis Model</div>
              <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
                Ditemukan <strong style={{ color: '#34d399' }}>{scaleUpCount} kampanye</strong> yang berpotensi untuk di-scale up, dan <strong style={{ color: '#f87171' }}>{reduceCount} kampanye</strong> yang membuang budget dan perlu dihentikan.
              </div>
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {error && (
          <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 14, padding: '14px 20px', color: '#991b1b' }}>
            ⚠️ <strong>Error:</strong> {error}
          </div>
        )}

        {/* ── Recommendations List ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="chart-card" style={{ display: 'flex', gap: 20 }}>
                <Skeleton w={60} h={60} r={12} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Skeleton w="40%" h={20} />
                  <Skeleton w="80%" h={14} />
                </div>
              </div>
            ))
          ) : campaigns.length === 0 ? (
            <div className="chart-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>Tidak ada data kampanye</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Jalankan iklan di Meta Ads untuk mendapatkan rekomendasi dari AI.</div>
            </div>
          ) : (
            campaigns.sort((a, b) => b.spend - a.spend).map((c) => {
              const rec = getRecommendation(c);
              return (
                <div key={c.campaign_id} className="chart-card" style={{
                  display: 'flex', gap: 20, alignItems: 'center',
                  borderLeft: `5px solid ${rec.color}`
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, background: rec.bg, color: rec.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
                  }}>
                    {rec.icon}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{c.campaign_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>ID: {c.campaign_id}</div>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                        background: rec.bg, color: rec.color, border: `1px solid ${rec.color}40`
                      }}>
                        {rec.status}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex', gap: 24, marginTop: 16, padding: '12px 16px',
                      background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0'
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>ROAS</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: c.roas >= 2.5 ? '#10b981' : c.roas < 1 ? '#ef4444' : '#1e293b' }}>
                          {c.roas.toFixed(2)}x
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>CTR</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{c.ctr.toFixed(2)}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Spend</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{fmtRp(c.spend)}</div>
                      </div>
                      <div style={{ flex: 1, borderLeft: '1.5px dashed #cbd5e1', paddingLeft: 24 }}>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>💡 Saran Tindakan</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: rec.color, marginTop: 2 }}>{rec.action}</div>
                        <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2, lineHeight: 1.4 }}>{rec.desc}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ height: 40 }} />
      </main>

      <style>{`
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
