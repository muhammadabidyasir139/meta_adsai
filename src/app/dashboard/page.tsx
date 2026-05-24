'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';

// ── Mock Data ─────────────────────────────────────────────────────────────────
const STAT_CARDS = [
  { label: 'Total Spend Iklan', value: 'Rp 14.2M', change: '+12.4%', up: true, icon: '💸', color: '#6366f1', bg: '#eef2ff' },
  { label: 'Total Revenue Iklan', value: 'Rp 58.7M', change: '+23.1%', up: true, icon: '💰', color: '#10b981', bg: '#d1fae5' },
  { label: 'ROAS', value: '4.13x', change: '+0.32x', up: true, icon: '📈', color: '#06b6d4', bg: '#cffafe' },
  { label: 'Conversion Rate', value: '3.87%', change: '-0.14%', up: false, icon: '🎯', color: '#f59e0b', bg: '#fef3c7' },
  { label: 'Total Order', value: '2,841', change: '+8.6%', up: true, icon: '📦', color: '#8b5cf6', bg: '#ede9fe' },
  { label: 'Profit / Margin', value: 'Rp 22.1M', change: '+18.5%', up: true, icon: '🏆', color: '#ef4444', bg: '#fee2e2' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SPEND_REVENUE = [
  { m: 'Jan', spend: 8.2, revenue: 28 },
  { m: 'Feb', spend: 9.1, revenue: 31 },
  { m: 'Mar', spend: 10.5, revenue: 38 },
  { m: 'Apr', spend: 11.2, revenue: 42 },
  { m: 'May', spend: 12.8, revenue: 50 },
  { m: 'Jun', spend: 14.2, revenue: 58.7 },
];

const ROAS_TREND = [3.4, 3.5, 3.6, 3.75, 3.9, 4.13];
const CONV_TREND = [3.2, 3.5, 3.8, 4.0, 3.95, 3.87];
const CPC_TREND  = [1800, 1750, 1680, 1720, 1690, 1650];

const PRODUCTS = [
  { name: 'Kain Batik Premium', spend: 3200000, revenue: 15800000, roas: 4.94, ctr: 2.8, cpc: 1450, conv: 4.2, profit: 6200000, status: 'Naik' },
  { name: 'Gamis Syari Exclusive', spend: 2800000, revenue: 10500000, roas: 3.75, ctr: 2.1, cpc: 1680, conv: 3.5, profit: 3900000, status: 'Naik' },
  { name: 'Mukena Bordir', spend: 1950000, revenue: 7200000, roas: 3.69, ctr: 1.9, cpc: 1820, conv: 3.1, profit: 2600000, status: 'Stabil' },
  { name: 'Baju Couple Set', spend: 2100000, revenue: 6900000, roas: 3.29, ctr: 3.2, cpc: 1540, conv: 2.8, profit: 1850000, status: 'Stabil' },
  { name: 'Hijab Pashmina', spend: 1600000, revenue: 5200000, roas: 3.25, ctr: 1.7, cpc: 1920, conv: 2.5, profit: 1400000, status: 'Turun' },
  { name: 'Sarung Tenun', spend: 980000, revenue: 2800000, roas: 2.86, ctr: 1.4, cpc: 2100, conv: 2.0, profit: 650000, status: 'Turun' },
  { name: 'Blouse Batik Modern', spend: 1570000, revenue: 6300000, roas: 4.01, ctr: 2.5, cpc: 1600, conv: 3.8, profit: 2500000, status: 'Naik' },
];

// ── Helper: Simple SVG Line Chart ─────────────────────────────────────────────
function LineChart({ data, color, label, height = 120 }: {
  data: number[]; color: string; label: string; height?: number;
}) {
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
      {data.map((v, i) => {
        const [x, y] = pts[i].split(',');
        return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke={color} strokeWidth="2.5" />;
      })}
    </svg>
  );
}

// ── Helper: Dual Bar Chart (Spend vs Revenue) ──────────────────────────────────
function DualBarChart({ items }: { items: typeof SPEND_REVENUE }) {
  const maxVal = Math.max(...items.map(d => d.revenue));
  const h = 140, padV = 12, barW = 16, gap = 6;
  const totalW = items.length * (barW * 2 + gap + 20);

  return (
    <svg viewBox={`0 0 ${totalW} ${h}`} style={{ width: '100%', height: h }}>
      {items.map((d, i) => {
        const x = i * (barW * 2 + gap + 20) + 8;
        const spendH = ((d.spend / maxVal) * (h - padV * 2));
        const revH = ((d.revenue / maxVal) * (h - padV * 2));
        return (
          <g key={i}>
            <rect x={x} y={h - padV - revH} width={barW} height={revH} rx="4" fill="#6366f1" opacity="0.85" />
            <rect x={x + barW + 3} y={h - padV - spendH} width={barW} height={spendH} rx="4" fill="#06b6d4" opacity="0.85" />
            <text x={x + barW} y={h - 1} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">{d.m}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Format helpers ─────────────────────────────────────────────────────────────
const fmtRp = (n: number) => 'Rp ' + (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n.toLocaleString('id-ID'));

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = { Naik: 'badge-green', Turun: 'badge-red', Stabil: 'badge-yellow' };
  return <span className={`badge ${map[s] || 'badge-blue'}`}>{s === 'Naik' ? '↑ ' : s === 'Turun' ? '↓ ' : '→ '}{s}</span>;
}

// ── Mini Trend Sparkline ───────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const w = 80, h = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / (max - min || 1)) * (h - 8);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: 80, height: 36 }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('all');
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const filteredProducts = activeTab === 'all' ? PRODUCTS
    : PRODUCTS.filter(p => p.status.toLowerCase() === activeTab);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.03em' }}>
              Overview Dashboard
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{today}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-outline">📅 Last 30 Days</button>
            <button className="btn-primary">+ New Campaign</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: '1px solid #e2e8f0' }}>
              <div className="user-avatar">A</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Abid</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 16, marginBottom: 24 }}>
          {STAT_CARDS.map((c) => (
            <div key={c.label} className="stat-card">
              <div className="card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
              <div className="card-label">{c.label}</div>
              <div className="card-value">{c.value}</div>
              <div className={`card-change ${c.up ? 'up' : 'down'}`}>
                <span>{c.up ? '▲' : '▼'}</span>
                <span>{c.change}</span>
                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 2 }}>vs bulan lalu</span>
              </div>
              <div className="card-bg-blob" style={{ background: c.color }} />
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Spend vs Revenue */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div className="chart-title">Spend vs Revenue Over Time</div>
                <div className="chart-subtitle">Perbandingan pengeluaran iklan dan pendapatan bulanan</div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                  <span className="legend-dot" style={{ background: '#6366f1' }} />Revenue
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                  <span className="legend-dot" style={{ background: '#06b6d4' }} />Spend
                </span>
              </div>
            </div>
            <DualBarChart items={SPEND_REVENUE} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              {SPEND_REVENUE.map(d => (
                <div key={d.m} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{d.m}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{d.revenue}M</div>
                </div>
              ))}
            </div>
          </div>

          {/* ROAS Trend */}
          <div className="chart-card">
            <div className="chart-title">ROAS Trend</div>
            <div className="chart-subtitle">Return on Ad Spend 6 bulan terakhir</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#6366f1', letterSpacing: '-0.04em' }}>4.13x</span>
              <span className="badge badge-green">▲ +0.32x</span>
            </div>
            <LineChart data={ROAS_TREND} color="#6366f1" label="roas" height={110} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {['Jan','Feb','Mar','Apr','May','Jun'].map(m => (
                <span key={m} style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Charts Row 2 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Conversion Trend */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <div className="chart-title">Conversion Rate Trend</div>
                <div className="chart-subtitle">6 bulan terakhir</div>
              </div>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.04em' }}>3.87%</span>
            </div>
            <LineChart data={CONV_TREND} color="#f59e0b" label="conv" height={100} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {['Jan','Feb','Mar','Apr','May','Jun'].map(m => (
                <span key={m} style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{m}</span>
              ))}
            </div>
          </div>

          {/* CPC Trend */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <div className="chart-title">CPC Trend</div>
                <div className="chart-subtitle">Cost Per Click 6 bulan terakhir</div>
              </div>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#10b981', letterSpacing: '-0.04em' }}>Rp 1,650</span>
            </div>
            <LineChart data={CPC_TREND} color="#10b981" label="cpc" height={100} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {['Jan','Feb','Mar','Apr','May','Jun'].map(m => (
                <span key={m} style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Product Table ── */}
        <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="section-title">Performa Produk</div>
              <div className="section-subtitle">Analisis iklan per produk — {PRODUCTS.length} produk aktif</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all','naik','stabil','turun'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    border: activeTab === tab ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
                    background: activeTab === tab ? '#eef2ff' : 'white',
                    color: activeTab === tab ? '#6366f1' : '#64748b',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab === 'all' ? 'Semua' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <button className="btn-primary" style={{ fontSize: 12 }}>Export CSV</button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>#</th>
                  <th>Nama Produk</th>
                  <th>Spend Iklan</th>
                  <th>Revenue</th>
                  <th>ROAS</th>
                  <th>CTR</th>
                  <th>CPC</th>
                  <th>Conv. Rate</th>
                  <th>Profit</th>
                  <th>Status ML</th>
                  <th style={{ paddingRight: 24 }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, i) => (
                  <tr key={p.name}>
                    <td style={{ paddingLeft: 24, color: '#94a3b8', fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>ID: PRD-{1000 + i}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#ef4444' }}>{fmtRp(p.spend)}</td>
                    <td style={{ fontWeight: 600, color: '#10b981' }}>{fmtRp(p.revenue)}</td>
                    <td>
                      <span style={{
                        fontWeight: 800, fontSize: 14,
                        color: p.roas >= 4 ? '#6366f1' : p.roas >= 3.5 ? '#f59e0b' : '#ef4444'
                      }}>{p.roas.toFixed(2)}x</span>
                    </td>
                    <td>{p.ctr.toFixed(1)}%</td>
                    <td>Rp {p.cpc.toLocaleString('id-ID')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 40, height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${(p.conv / 5) * 100}%`, height: '100%', borderRadius: 3,
                            background: p.conv >= 4 ? '#10b981' : p.conv >= 3 ? '#f59e0b' : '#ef4444',
                          }} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{p.conv}%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>{fmtRp(p.profit)}</td>
                    <td><StatusBadge s={p.status} /></td>
                    <td style={{ paddingRight: 24 }}>
                      <Sparkline
                        data={ROAS_TREND.map(v => v * (0.8 + Math.random() * 0.4))}
                        color={p.status === 'Naik' ? '#10b981' : p.status === 'Turun' ? '#ef4444' : '#f59e0b'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div style={{
            padding: '14px 24px', borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#fafbfc',
          }}>
            <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
              Menampilkan {filteredProducts.length} dari {PRODUCTS.length} produk
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['←','1','2','3','→'].map(p => (
                <button key={p} style={{
                  width: 30, height: 30, borderRadius: 6, border: '1px solid #e2e8f0',
                  background: p === '1' ? '#6366f1' : 'white', color: p === '1' ? 'white' : '#64748b',
                  fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom padding */}
        <div style={{ height: 32 }} />
      </main>
    </div>
  );
}
