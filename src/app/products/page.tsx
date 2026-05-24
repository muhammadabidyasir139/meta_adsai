'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';

type Rec = 'Increase' | 'Maintain' | 'Decrease';
interface Product {
  id: string;
  metaAdsId: string;
  emoji: string;
  name: string;
  category: string;
  price: number;
  clicks: number;
  spend: number;
  revenue: number;
  roas: number;
  rec: Rec;
  status: 'Active' | 'Paused';
}

const INIT: Product[] = [
  { id:'PRD-001', metaAdsId:'23851234560', emoji:'🧵', name:'Kain Batik Premium', category:'Fashion', price:285000, clicks:4820, spend:3200000, revenue:15800000, roas:4.94, rec:'Increase', status:'Active' },
  { id:'PRD-002', metaAdsId:'23851234561', emoji:'👗', name:'Gamis Syari Exclusive', category:'Fashion', price:420000, clicks:3210, spend:2800000, revenue:10500000, roas:3.75, rec:'Maintain', status:'Active' },
  { id:'PRD-003', metaAdsId:'23851234562', emoji:'🧕', name:'Mukena Bordir', category:'Ibadah', price:195000, clicks:2890, spend:1950000, revenue:7200000, roas:3.69, rec:'Maintain', status:'Active' },
  { id:'PRD-004', metaAdsId:'23851234563', emoji:'👫', name:'Baju Couple Set', category:'Fashion', price:380000, clicks:5120, spend:2100000, revenue:6900000, roas:3.29, rec:'Decrease', status:'Paused' },
  { id:'PRD-005', metaAdsId:'23851234564', emoji:'🧣', name:'Hijab Pashmina', category:'Aksesori', price:85000, clicks:1870, spend:1600000, revenue:5200000, roas:3.25, rec:'Decrease', status:'Active' },
  { id:'PRD-006', metaAdsId:'23851234565', emoji:'🪡', name:'Sarung Tenun', category:'Fashion', price:165000, clicks:1420, spend:980000, revenue:2800000, roas:2.86, rec:'Decrease', status:'Paused' },
  { id:'PRD-007', metaAdsId:'23851234566', emoji:'👔', name:'Blouse Batik Modern', category:'Fashion', price:245000, clicks:3760, spend:1570000, revenue:6300000, roas:4.01, rec:'Increase', status:'Active' },
];

const EMPTY: Omit<Product,'id'|'roas'> = { metaAdsId:'', emoji:'📦', name:'', category:'Fashion', price:0, clicks:0, spend:0, revenue:0, rec:'Maintain', status:'Active' };
const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const fmtM = (n: number) => n >= 1_000_000 ? 'Rp '+(n/1_000_000).toFixed(1)+'M' : fmt(n);

function RecPill({ rec }: { rec: Rec }) {
  const map = { Increase:['rec-increase','▲ Increase Budget'], Maintain:['rec-maintain','→ Maintain'], Decrease:['rec-decrease','▼ Decrease Budget'] };
  const [cls, label] = map[rec];
  return <span className={`rec-pill ${cls}`}>{label}</span>;
}

type ModalType = 'add'|'edit'|'view'|'delete'|null;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(INIT);
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Product|null>(null);
  const [form, setForm] = useState<Omit<Product,'id'|'roas'>>(EMPTY);
  const [search, setSearch] = useState('');
  const [filterRec, setFilterRec] = useState<string>('All');

  const openAdd  = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (p: Product) => { setSelected(p); setForm({ metaAdsId:p.metaAdsId, emoji:p.emoji, name:p.name, category:p.category, price:p.price, clicks:p.clicks, spend:p.spend, revenue:p.revenue, rec:p.rec, status:p.status }); setModal('edit'); };
  const openView = (p: Product) => { setSelected(p); setModal('view'); };
  const openDel  = (p: Product) => { setSelected(p); setModal('delete'); };
  const close    = () => { setModal(null); setSelected(null); };

  const nextId = () => 'PRD-' + String(products.length + 1).padStart(3,'0');

  const handleSave = () => {
    if (!form.name || !form.metaAdsId) return;
    const roas = form.spend > 0 ? parseFloat((form.revenue / form.spend).toFixed(2)) : 0;
    if (modal === 'add') {
      setProducts(prev => [...prev, { ...form, id: nextId(), roas }]);
    } else if (modal === 'edit' && selected) {
      setProducts(prev => prev.map(p => p.id === selected.id ? { ...form, id: p.id, roas } : p));
    }
    close();
  };

  const handleDelete = () => {
    if (selected) setProducts(prev => prev.filter(p => p.id !== selected.id));
    close();
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchQ = p.name.toLowerCase().includes(q) || p.metaAdsId.includes(q) || p.id.toLowerCase().includes(q);
    const matchR = filterRec === 'All' || p.rec === filterRec;
    return matchQ && matchR;
  });

  const inp = (field: keyof typeof form, val: string | number) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        {/* Header */}
        <div className="page-header">
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#1e293b', letterSpacing:'-0.03em' }}>Products</h2>
            <p style={{ fontSize:13, color:'#94a3b8', marginTop:2 }}>{products.length} produk terdaftar · terhubung ke Meta Ads</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div className="user-avatar">A</div>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
          {[
            { label:'Total Produk', value: products.length, color:'#6366f1', bg:'#eef2ff', icon:'📦' },
            { label:'Perlu Naik Budget', value: products.filter(p=>p.rec==='Increase').length, color:'#10b981', bg:'#d1fae5', icon:'📈' },
            { label:'Perlu Turun Budget', value: products.filter(p=>p.rec==='Decrease').length, color:'#ef4444', bg:'#fee2e2', icon:'📉' },
            { label:'Total Spend Iklan', value: fmtM(products.reduce((a,p)=>a+p.spend,0)), color:'#f59e0b', bg:'#fef3c7', icon:'💸' },
          ].map(c => (
            <div key={c.label} className="stat-card">
              <div className="card-icon" style={{ background:c.bg, color:c.color }}>{c.icon}</div>
              <div className="card-label">{c.label}</div>
              <div className="card-value" style={{ fontSize:20 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="chart-card" style={{ padding:0, overflow:'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding:'20px 24px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div className="search-bar">
                <span style={{ color:'#94a3b8' }}>🔍</span>
                <input placeholder="Cari produk, ID, Meta Ads ID…" value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              <select
                className="form-input form-select"
                style={{ width:160 }}
                value={filterRec}
                onChange={e=>setFilterRec(e.target.value)}
              >
                <option value="All">Semua Rekomendasi</option>
                <option value="Increase">▲ Increase</option>
                <option value="Maintain">→ Maintain</option>
                <option value="Decrease">▼ Decrease</option>
              </select>
            </div>
            <button className="btn-primary" onClick={openAdd}>+ Tambah Produk</button>
          </div>

          {/* Table */}
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft:24 }}>Produk</th>
                  <th>Meta Ads ID</th>
                  <th>Harga</th>
                  <th>Clicks</th>
                  <th>Total Spend</th>
                  <th>Revenue</th>
                  <th>ROAS</th>
                  <th>Status</th>
                  <th>Rekomendasi ML</th>
                  <th style={{ paddingRight:24, textAlign:'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ paddingLeft:24 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div className="product-img">{p.emoji}</div>
                        <div>
                          <div style={{ fontWeight:700, color:'#1e293b' }}>{p.name}</div>
                          <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{p.id} · {p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="meta-chip">📘 {p.metaAdsId}</span></td>
                    <td style={{ fontWeight:600 }}>{fmt(p.price)}</td>
                    <td>
                      <span style={{ fontWeight:700, color:'#6366f1' }}>{p.clicks.toLocaleString()}</span>
                      <span style={{ fontSize:11, color:'#94a3b8', display:'block' }}>klik</span>
                    </td>
                    <td style={{ fontWeight:600, color:'#ef4444' }}>{fmtM(p.spend)}</td>
                    <td style={{ fontWeight:600, color:'#10b981' }}>{fmtM(p.revenue)}</td>
                    <td>
                      <span style={{ fontWeight:800, fontSize:14, color: p.roas>=4?'#6366f1':p.roas>=3.5?'#f59e0b':'#ef4444' }}>
                        {p.roas.toFixed(2)}x
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.status==='Active'?'badge-green':'badge-yellow'}`}>
                        {p.status==='Active'?'● Active':'⏸ Paused'}
                      </span>
                    </td>
                    <td><RecPill rec={p.rec} /></td>
                    <td style={{ paddingRight:24 }}>
                      <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                        <button className="btn-icon btn-icon-view" title="Lihat Detail" onClick={()=>openView(p)}>👁</button>
                        <button className="btn-icon btn-icon-edit" title="Edit" onClick={()=>openEdit(p)}>✏️</button>
                        <button className="btn-icon btn-icon-del"  title="Hapus" onClick={()=>openDel(p)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign:'center', padding:'40px', color:'#94a3b8', fontWeight:600 }}>
                      🔍 Tidak ada produk yang cocok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding:'14px 24px', borderTop:'1px solid #f1f5f9', background:'#fafbfc', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12.5, color:'#64748b', fontWeight:600 }}>Menampilkan {filtered.length} dari {products.length} produk</span>
            <span style={{ fontSize:12, color:'#94a3b8' }}>Data terupdate: {new Date().toLocaleDateString('id-ID')}</span>
          </div>
        </div>

        <div style={{ height:32 }} />
      </main>

      {/* ── Add / Edit Modal ── */}
      {(modal==='add'||modal==='edit') && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal-box modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontWeight:800, fontSize:17, color:'#1e293b' }}>
                  {modal==='add'?'➕ Tambah Produk Baru':'✏️ Edit Produk'}
                </div>
                <div style={{ fontSize:12, color:'#94a3b8', marginTop:3 }}>
                  {modal==='edit'?`ID: ${selected?.id}`:'Isi detail produk dan sambungkan ke Meta Ads'}
                </div>
              </div>
              <button className="btn-ghost" style={{ padding:'6px 12px' }} onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              {/* Emoji & name */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Emoji / Ikon</label>
                  <input className="form-input" placeholder="📦" value={form.emoji} onChange={e=>inp('emoji',e.target.value)} style={{ fontSize:22 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Meta Ads ID *</label>
                  <input className="form-input" placeholder="23851234567" value={form.metaAdsId} onChange={e=>inp('metaAdsId',e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Produk *</label>
                <input className="form-input" placeholder="Nama produk…" value={form.name} onChange={e=>inp('name',e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-input form-select" value={form.category} onChange={e=>inp('category',e.target.value)}>
                    {['Fashion','Ibadah','Aksesori','Elektronik','Kuliner','Lainnya'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Harga (Rp)</label>
                  <input className="form-input" type="number" placeholder="0" value={form.price||''} onChange={e=>inp('price',+e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Clicks</label>
                  <input className="form-input" type="number" placeholder="0" value={form.clicks||''} onChange={e=>inp('clicks',+e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status Iklan</label>
                  <select className="form-input form-select" value={form.status} onChange={e=>inp('status',e.target.value as 'Active'|'Paused')}>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Spend Iklan (Rp)</label>
                  <input className="form-input" type="number" placeholder="0" value={form.spend||''} onChange={e=>inp('spend',+e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Revenue (Rp)</label>
                  <input className="form-input" type="number" placeholder="0" value={form.revenue||''} onChange={e=>inp('revenue',+e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Rekomendasi Spend Action (ML)</label>
                <select className="form-input form-select" value={form.rec} onChange={e=>inp('rec',e.target.value as Rec)}>
                  <option value="Increase">▲ Increase Budget</option>
                  <option value="Maintain">→ Maintain Budget</option>
                  <option value="Decrease">▼ Decrease Budget</option>
                </select>
              </div>
              {/* ROAS Preview */}
              {form.spend > 0 && (
                <div style={{ background:'#f8f9ff', border:'1px solid #c7d2fe', borderRadius:10, padding:'12px 16px', display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, color:'#64748b', fontWeight:600 }}>ROAS (auto-hitung)</span>
                  <span style={{ fontSize:15, fontWeight:800, color:'#6366f1' }}>
                    {form.revenue > 0 ? (form.revenue/form.spend).toFixed(2) : '0.00'}x
                  </span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={close}>Batal</button>
              <button className="btn-primary" onClick={handleSave}>
                {modal==='add'?'Simpan Produk':'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {modal==='view' && selected && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal-box modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ fontSize:40 }}>{selected.emoji}</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:17, color:'#1e293b' }}>{selected.name}</div>
                  <div style={{ fontSize:12, color:'#94a3b8', marginTop:3 }}>{selected.id} · {selected.category}</div>
                </div>
              </div>
              <button className="btn-ghost" style={{ padding:'6px 12px' }} onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              {/* Meta chip */}
              <div style={{ marginBottom:20 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>Meta Ads ID</span>
                <div style={{ marginTop:6 }}>
                  <span className="meta-chip" style={{ fontSize:14, padding:'6px 14px' }}>📘 {selected.metaAdsId}</span>
                </div>
              </div>
              {/* Stats grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
                {[
                  { label:'Harga Produk', value: fmt(selected.price), color:'#1e293b' },
                  { label:'Total Clicks', value: selected.clicks.toLocaleString()+' klik', color:'#6366f1' },
                  { label:'Status Iklan', value: selected.status, color: selected.status==='Active'?'#10b981':'#f59e0b' },
                  { label:'Total Spend', value: fmtM(selected.spend), color:'#ef4444' },
                  { label:'Total Revenue', value: fmtM(selected.revenue), color:'#10b981' },
                  { label:'ROAS', value: selected.roas.toFixed(2)+'x', color: selected.roas>=4?'#6366f1':selected.roas>=3.5?'#f59e0b':'#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#fafbfc', border:'1px solid #e2e8f0', borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{s.label}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {/* Recommendation */}
              <div style={{ background:'#f8f9ff', border:'1px solid #c7d2fe', borderRadius:12, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Rekomendasi ML</div>
                  <RecPill rec={selected.rec} />
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>Profit Estimasi</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#1e293b', marginTop:2 }}>
                    {fmtM(selected.revenue - selected.spend)}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={close}>Tutup</button>
              <button className="btn-primary" onClick={()=>{ close(); setTimeout(()=>openEdit(selected),50); }}>Edit Produk</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {modal==='delete' && selected && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal-box" style={{ maxWidth:420 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign:'center', paddingTop:32 }}>
              <div className="delete-icon-wrap">🗑️</div>
              <div style={{ fontWeight:800, fontSize:18, color:'#1e293b', marginBottom:8 }}>Hapus Produk?</div>
              <div style={{ fontSize:13.5, color:'#64748b', lineHeight:1.6, marginBottom:8 }}>
                Produk <strong>{selected.name}</strong> akan dihapus permanen beserta data Meta Ads ID <span className="meta-chip">{selected.metaAdsId}</span>.
              </div>
              <div style={{ fontSize:12, color:'#ef4444', fontWeight:600 }}>Tindakan ini tidak dapat dibatalkan.</div>
            </div>
            <div className="modal-footer" style={{ justifyContent:'center' }}>
              <button className="btn-ghost" onClick={close}>Batal</button>
              <button className="btn-danger" onClick={handleDelete}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
