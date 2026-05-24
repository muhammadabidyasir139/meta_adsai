'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { loadSettings, saveSettings, DEFAULT_SETTINGS, type AppSettings } from '@/lib/settings';

// ── Section Wrapper ───────────────────────────────────────────────────────────
function Section({ title, subtitle, icon, children }: {
  title: string; subtitle: string; icon: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 24,
    }}>
      <div style={{
        padding: '20px 28px 16px', borderBottom: '1px solid #f1f5f9',
        background: 'linear-gradient(135deg, #fafbff 0%, #fff 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
          }}>{icon}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{title}</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 1 }}>{subtitle}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '24px 28px' }}>{children}</div>
    </div>
  );
}

// ── Input Field ───────────────────────────────────────────────────────────────
function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 700, color: '#475569',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7,
      }}>{label}</label>
      {children}
      {helper && (
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 5, lineHeight: 1.5 }}>{helper}</div>
      )}
    </div>
  );
}

// ── Input Styled ──────────────────────────────────────────────────────────────
function Input({ value, onChange, placeholder, type = 'text', prefix }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; prefix?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
      {prefix && (
        <span style={{
          position: 'absolute', left: 13, fontSize: 13, fontWeight: 600,
          color: '#6366f1', background: '#eef2ff', padding: '2px 8px',
          borderRadius: 6, pointerEvents: 'none',
        }}>{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: prefix ? '10px 14px 10px 84px' : '10px 14px',
          border: '1.5px solid #e2e8f0', borderRadius: 11,
          fontSize: 13.5, fontFamily: 'inherit', color: '#1e293b',
          background: '#fafbfc', transition: 'all 0.18s', outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#818cf8';
          e.target.style.background = '#fff';
          e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e2e8f0';
          e.target.style.background = '#fafbfc';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

// ── Select Styled ─────────────────────────────────────────────────────────────
function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', padding: '10px 36px 10px 14px',
        border: '1.5px solid #e2e8f0', borderRadius: 11,
        fontSize: 13.5, fontFamily: 'inherit', color: '#1e293b',
        background: '#fafbfc url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%2394a3b8\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E") no-repeat right 13px center',
        appearance: 'none', outline: 'none', cursor: 'pointer',
        transition: 'all 0.18s',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: '#334155' }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? 'linear-gradient(135deg, #6366f1, #818cf8)' : '#e2e8f0',
          position: 'relative', transition: 'all 0.25s',
          boxShadow: checked ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }} />
      </button>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 100,
      background: type === 'success' ? '#065f46' : '#991b1b',
      color: '#fff', padding: '13px 22px', borderRadius: 14,
      fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      animation: 'slideUp 0.25s cubic-bezier(.4,0,.2,1)',
    }}>
      <span style={{ fontSize: 18 }}>{type === 'success' ? '✅' : '❌'}</span>
      {message}
    </div>
  );
}

// ── Verify Meta Account ───────────────────────────────────────────────────────
async function verifyAccountId(accountId: string): Promise<{ ok: boolean; name?: string; error?: string }> {
  try {
    const res = await fetch(`/api/meta/insights?account_id=act_${accountId}&date_preset=last_7d`);
    const json = await res.json();
    if (json.success) return { ok: true, name: json.account_id };
    return { ok: false, error: json.error };
  } catch {
    return { ok: false, error: 'Koneksi gagal' };
  }
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [verifyMsg, setVerifyMsg] = useState('');

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'adAccountId') {
      setVerifyStatus('idle');
      setVerifyMsg('');
    }
  };

  const handleSave = () => {
    // Auto-generate avatar from name
    const newSettings = {
      ...settings,
      avatar: (settings.name || 'U').charAt(0).toUpperCase(),
    };
    saveSettings(newSettings);
    setSettings(newSettings);
    showToast('Pengaturan berhasil disimpan!', 'success');
  };

  const handleReset = () => {
    saveSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
    showToast('Pengaturan dikembalikan ke default.', 'success');
  };

  const handleVerify = async () => {
    if (!settings.adAccountId.trim()) {
      setVerifyStatus('error');
      setVerifyMsg('Ad Account ID tidak boleh kosong.');
      return;
    }
    setVerifying(true);
    setVerifyStatus('idle');
    const result = await verifyAccountId(settings.adAccountId.trim());
    setVerifying(false);
    if (result.ok) {
      setVerifyStatus('ok');
      setVerifyMsg(`Akun terverifikasi: ${result.name}`);
    } else {
      setVerifyStatus('error');
      setVerifyMsg(result.error ?? 'Verifikasi gagal.');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.03em' }}>
              Pengaturan
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{today}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleReset}
              style={{
                padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
            >
              🔄 Reset Default
            </button>
            <button className="btn-primary" onClick={handleSave} style={{ gap: 8, display: 'flex', alignItems: 'center' }}>
              💾 Simpan Pengaturan
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Profile Section */}
            <Section title="Profil Pengguna" subtitle="Informasi akun dan identitas Anda" icon="👤">
              {/* Avatar Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24, padding: '16px 20px', background: '#f8faff', borderRadius: 14, border: '1px solid #e0e7ff' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontWeight: 900, color: '#fff',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                }}>
                  {(settings.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{settings.name || 'Nama Anda'}</div>
                  <div style={{ fontSize: 12.5, color: '#6366f1', fontWeight: 600, marginTop: 2 }}>{settings.role || 'Role'}</div>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>{settings.email || 'email@domain.com'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Nama Lengkap" helper="Ditampilkan di sidebar dan header">
                  <Input value={settings.name} onChange={(v) => update('name', v)} placeholder="Muhammad Abid Yasir" />
                </Field>
                <Field label="Role / Jabatan">
                  <Input value={settings.role} onChange={(v) => update('role', v)} placeholder="Administrator" />
                </Field>
              </div>
              <Field label="Email" helper="Untuk notifikasi dan laporan">
                <Input type="email" value={settings.email} onChange={(v) => update('email', v)} placeholder="abid@example.com" />
              </Field>
            </Section>

            {/* Preferences Section */}
            <Section title="Preferensi Dashboard" subtitle="Konfigurasi tampilan dan behaviour" icon="⚙️">
              <Field label="Rentang Waktu Default">
                <Select
                  value={settings.defaultDatePreset}
                  onChange={(v) => update('defaultDatePreset', v)}
                  options={[
                    { value: 'last_7d', label: 'Last 7 Days' },
                    { value: 'last_14d', label: 'Last 14 Days' },
                    { value: 'last_30d', label: 'Last 30 Days' },
                    { value: 'last_90d', label: 'Last 90 Days' },
                    { value: 'this_month', label: 'This Month' },
                    { value: 'last_month', label: 'Last Month' },
                  ]}
                />
              </Field>
              <Field label="Mata Uang">
                <Select
                  value={settings.currency}
                  onChange={(v) => update('currency', v)}
                  options={[
                    { value: 'IDR', label: 'IDR — Rupiah Indonesia' },
                    { value: 'USD', label: 'USD — US Dollar' },
                    { value: 'SGD', label: 'SGD — Singapore Dollar' },
                  ]}
                />
              </Field>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 4 }}>
                <Toggle
                  checked={settings.autoRefresh}
                  onChange={(v) => update('autoRefresh', v)}
                  label="Auto-refresh data otomatis"
                />
                {settings.autoRefresh && (
                  <Field label="Interval Refresh">
                    <Select
                      value={String(settings.refreshInterval)}
                      onChange={(v) => update('refreshInterval', parseInt(v))}
                      options={[
                        { value: '1', label: 'Setiap 1 menit' },
                        { value: '5', label: 'Setiap 5 menit' },
                        { value: '10', label: 'Setiap 10 menit' },
                        { value: '30', label: 'Setiap 30 menit' },
                      ]}
                    />
                  </Field>
                )}
              </div>
            </Section>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div>
            {/* Meta Ads Config */}
            <Section title="Konfigurasi Meta Ads" subtitle="Hubungkan akun iklan Facebook / Instagram" icon="🎯">
              {/* Connection Status */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 12, marginBottom: 20,
                background: verifyStatus === 'ok' ? '#d1fae5' : verifyStatus === 'error' ? '#fee2e2' : '#f0f4ff',
                border: `1px solid ${verifyStatus === 'ok' ? '#a7f3d0' : verifyStatus === 'error' ? '#fca5a5' : '#c7d2fe'}`,
              }}>
                <span style={{ fontSize: 20 }}>
                  {verifyStatus === 'ok' ? '✅' : verifyStatus === 'error' ? '❌' : '🔗'}
                </span>
                <div>
                  <div style={{
                    fontSize: 12.5, fontWeight: 700,
                    color: verifyStatus === 'ok' ? '#065f46' : verifyStatus === 'error' ? '#991b1b' : '#3730a3',
                  }}>
                    {verifyStatus === 'ok' ? 'Terkoneksi' : verifyStatus === 'error' ? 'Koneksi Gagal' : 'Belum Diverifikasi'}
                  </div>
                  <div style={{
                    fontSize: 11.5,
                    color: verifyStatus === 'ok' ? '#047857' : verifyStatus === 'error' ? '#b91c1c' : '#6366f1',
                  }}>
                    {verifyMsg || 'Klik "Verifikasi Koneksi" untuk mengecek'}
                  </div>
                </div>
              </div>

              <Field
                label="Ad Account ID"
                helper='Tanpa prefix "act_". Contoh: 682716181447477. Cek di Meta Ads Manager → pojok kiri atas.'
              >
                <Input
                  value={settings.adAccountId}
                  onChange={(v) => update('adAccountId', v.replace(/\D/g, ''))}
                  placeholder="682716181447477"
                  prefix="act_"
                />
              </Field>

              <button
                onClick={handleVerify}
                disabled={verifying}
                style={{
                  width: '100%', padding: '10px 18px', borderRadius: 11,
                  fontSize: 13, fontWeight: 700, cursor: verifying ? 'not-allowed' : 'pointer',
                  border: '1.5px solid #c7d2fe',
                  background: verifying ? '#f1f5f9' : '#eef2ff',
                  color: verifying ? '#94a3b8' : '#4338ca',
                  transition: 'all 0.18s', marginBottom: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {verifying ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span>
                    Memverifikasi...
                  </>
                ) : '🔍 Verifikasi Koneksi Meta'}
              </button>

              <Field label="Access Token" helper="Token diambil dari Meta for Developers. Aman tersimpan di server (.env.local).">
                <div style={{
                  padding: '10px 14px', borderRadius: 11, border: '1.5px solid #e2e8f0',
                  background: '#f8fafc', fontSize: 12, fontFamily: 'monospace',
                  color: '#475569', letterSpacing: '0.02em', wordBreak: 'break-all',
                }}>
                  <span style={{
                    display: 'inline-block', background: '#1e293b', color: '#94a3b8',
                    padding: '1px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                    marginRight: 8, letterSpacing: '0.05em',
                  }}>ENV</span>
                  EAAV...YRuFf
                  <span style={{ marginLeft: 8, color: '#10b981', fontSize: 11, fontWeight: 600 }}>• Dikonfigurasi</span>
                </div>
              </Field>

              {/* Meta Ads Info */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⚠️</span> Cara mendapatkan Ad Account ID
                </div>
                <ol style={{ paddingLeft: 16, color: '#78350f', fontSize: 12, lineHeight: 1.8 }}>
                  <li>Buka <a href="https://www.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>Meta Ads Manager</a></li>
                  <li>Lihat dropdown nama akun di pojok kiri atas</li>
                  <li>ID ada di bawah nama akun (angka panjang)</li>
                  <li>Atau cek URL: <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: 4 }}>?act=XXXXXXXXX</code></li>
                </ol>
              </div>
            </Section>

            {/* API Info Section */}
            <Section title="Informasi API" subtitle="Status koneksi dan konfigurasi teknis" icon="📡">
              {[
                { key: 'API Version', value: 'v19.0', badge: 'active' },
                { key: 'Base URL', value: 'graph.facebook.com', badge: null },
                { key: 'Metrics', value: 'Spend, Impressions, Clicks, CTR, CPC, CPM, Conversions, ROAS', badge: null },
                { key: 'Account ID', value: settings.adAccountId ? `act_${settings.adAccountId}` : '—', badge: settings.adAccountId ? 'configured' : null },
              ].map(item => (
                <div key={item.key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '10px 0', borderBottom: '1px solid #f1f5f9',
                }}>
                  <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>{item.key}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'right', maxWidth: '60%' }}>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#1e293b', wordBreak: 'break-all' }}>
                      {item.value}
                    </span>
                    {item.badge && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        background: item.badge === 'active' ? '#d1fae5' : '#eef2ff',
                        color: item.badge === 'active' ? '#065f46' : '#4338ca',
                      }}>{item.badge === 'active' ? '✓ Active' : '✓ Set'}</span>
                    )}
                  </div>
                </div>
              ))}
            </Section>

            {/* Danger Zone */}
            <div style={{
              background: '#fff', border: '1.5px solid #fca5a5', borderRadius: 18,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #fee2e2', background: '#fff5f5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#991b1b' }}>Danger Zone</div>
                    <div style={{ fontSize: 12, color: '#b91c1c' }}>Tindakan ini tidak dapat dibatalkan</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '18px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Reset Semua Pengaturan</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      Kembalikan ke konfigurasi default
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    style={{
                      padding: '8px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 700,
                      border: '1.5px solid #fca5a5', background: '#fff', color: '#dc2626',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#dc2626'; }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button Bottom */}
        <div style={{
          position: 'sticky', bottom: 0, padding: '16px 0 0',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          background: 'linear-gradient(transparent, var(--bg-main) 30%)',
          paddingTop: 20, marginTop: 4,
        }}>
          <button
            onClick={handleReset}
            style={{
              padding: '11px 22px', borderRadius: 11, fontSize: 13.5, fontWeight: 600,
              border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b',
              cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button className="btn-primary" onClick={handleSave} style={{ padding: '11px 28px', fontSize: 13.5 }}>
            💾 Simpan Pengaturan
          </button>
        </div>

        <div style={{ height: 24 }} />
      </main>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
