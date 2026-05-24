# Next.js Integration Guide: Python ML Ads Decision Service

Dokumen ini menjelaskan langkah-langkah yang diperlukan untuk menghubungkan aplikasi **Next.js** dengan **Python ML Service** (FastAPI) yang telah berjalan mandiri.

---

## 1. Skema Database (Drizzle ORM)
Pastikan kolom rekomendasi ML berikut telah ditambahkan di `src/db/schema.ts` pada tabel `metaAdsCampaigns`:

```typescript
export const metaAdsCampaigns = pgTable('meta_ads_campaigns', {
  // ... kolom yang sudah ada ...

  // Kolom Baru Rekomendasi ML
  mlDecision: varchar('ml_decision', { length: 20 }),
  mlAdvice: text('ml_advice'),
  mlProbability: text('ml_probability'), // Menyimpan format JSON string probabilitas
});
```

*Catatan: Migrasi database telah berhasil diterapkan secara lokal pada database `adsai`.*

---

## 2. API Trigger di Next.js
Modifikasi route **`GET /api/meta/insights`** di file [route.ts](file:///e:/Kuliah/Semester%206/Metopen/Dashboard%20ads%20machine%20learning/src/app/api/meta/insights/route.ts). 

Setelah proses pengambilan data dari Meta API dan penyimpanan ke database PostgreSQL selesai, tambahkan logic untuk mengirim data tersebut ke Python FastAPI service secara asynchronous (background).

### Kode Tambahan di `GET /api/meta/insights`:
```typescript
// Setelah saveToDatabase(...) selesai dijalankan:

// Trigger Python ML Service secara background (tidak memblokir response Next.js)
const pythonServiceUrl = process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:8000/predict';
const callbackUrl = `${request.nextUrl.origin}/api/meta/insights/recommendation`;

fetch(pythonServiceUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaigns: normalizedCampaigns,
    callback_url: callbackUrl
  })
}).catch(err => {
  console.error("Gagal menembak Python ML Service:", err);
});
```

---

## 3. Callback Endpoint di Next.js
Buat file API Route baru di **`src/app/api/meta/insights/recommendation/route.ts`** dengan method `POST` untuk menerima callback hasil prediksi dari Python dan memperbarui database.

### File Baru: `src/app/api/meta/insights/recommendation/route.ts`
```typescript
import { NextRequest } from 'next/server';
import { db } from '@/db';
import { metaAdsCampaigns } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const recommendations = await request.json(); // Array dari { campaign_id, ml_decision, ml_advice, ml_probability }
    
    if (!Array.isArray(recommendations)) {
      return Response.json({ success: false, error: 'Payload harus berupa array' }, { status: 400 });
    }

    const updatePromises = recommendations.map((rec) => {
      return db
        .update(metaAdsCampaigns)
        .set({
          mlDecision: rec.ml_decision,
          mlAdvice: rec.ml_advice,
          mlProbability: rec.ml_probability,
        })
        .where(eq(metaAdsCampaigns.campaignId, rec.campaign_id));
    });

    await Promise.all(updatePromises);
    console.log(`Berhasil memperbarui ${recommendations.length} rekomendasi kampanye dari Python ML.`);

    return Response.json({ success: true, updated: recommendations.length });
  } catch (error: any) {
    console.error("Error pada callback rekomendasi ML:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## 4. Integrasi Frontend Dashboard

### A. Halaman Analytics (`src/app/analytics/page.tsx`)
Ubah cara pengambilan saran tindakan pada daftar kampanye iklan. Alih-alih menggunakan logic `getRecommendation` statis di frontend, tampilkan data prediksi dari database.

1. **Tambahkan field rekomendasi pada tipe data Campaign:**
```typescript
interface Campaign {
  // ... metrik lainnya ...
  ml_decision?: string | null;
  ml_advice?: string | null;
}
```

2. **Perbarui Render Loop Kampanye:**
```tsx
// Ganti getRecommendation(c) dengan logic dinamis:
const getCampaignRecommendation = (c: Campaign) => {
  if (c.ml_decision && c.ml_advice) {
    const statusMap: Record<string, { label: string; action: string; color: string; bg: string; icon: string }> = {
      INCREASE: { label: 'Scale Up', action: 'Tingkatkan Budget', color: '#10b981', bg: '#d1fae5', icon: '🚀' },
      DECREASE: { label: 'Reduce', action: 'Kurangi/Hentikan', color: '#ef4444', bg: '#fee2e2', icon: '⚠️' },
      MAINTAIN: { label: 'Maintain', action: 'Pertahankan', color: '#6366f1', bg: '#eef2ff', icon: '⚖️' },
    };
    const info = statusMap[c.ml_decision] || statusMap.MAINTAIN;
    return {
      status: info.label,
      action: info.action,
      desc: c.ml_advice,
      color: info.color,
      bg: info.bg,
      icon: info.icon,
    };
  }
  // Fallback ke rule heuristic frontend lama jika ML prediction belum selesai
  return getRecommendation(c); 
};
```

---

### B. Halaman Products (`src/app/products/page.tsx`)
Hubungkan data produk mock dengan data kampanye real-time dari database.

1. **Fetch data dari `/api/meta/insights` saat page load:**
```typescript
const [campaigns, setCampaigns] = useState<any[]>([]);

useEffect(() => {
  fetch('/api/meta/insights?save=false')
    .then(res => res.json())
    .then(json => {
      if (json.success && json.campaigns) {
        setCampaigns(json.campaigns);
      }
    })
    .catch(err => console.error("Gagal mengambil data kampanye:", err));
}, []);
```

2. **Mapping Data Produk secara Dinamis:**
```typescript
const mappedProducts = products.map((prod) => {
  // Cari kampanye yang memiliki ID sama dengan metaAdsId produk
  const relatedCampaign = campaigns.find(c => c.campaign_id === prod.metaAdsId);
  
  if (relatedCampaign) {
    // Mapping rekomendasi string ML ('INCREASE', 'DECREASE', 'MAINTAIN') ke tipe Rec ('Increase', 'Decrease', 'Maintain')
    const recMap: Record<string, 'Increase' | 'Decrease' | 'Maintain'> = {
      INCREASE: 'Increase',
      DECREASE: 'Decrease',
      MAINTAIN: 'Maintain'
    };
    
    return {
      ...prod,
      clicks: relatedCampaign.clicks,
      spend: relatedCampaign.spend,
      roas: relatedCampaign.roas,
      rec: recMap[relatedCampaign.ml_decision] || 'Maintain',
      status: relatedCampaign.spend > 0 ? 'Active' : 'Paused'
    };
  }
  return prod;
});
```
Gunakan `mappedProducts` untuk merender tabel produk.
