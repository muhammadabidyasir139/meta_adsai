# API Documentation: ML Ads Decision Service

Service ini menyediakan endpoint HTTP API untuk melakukan prediksi optimasi budget Meta Ads menggunakan model Machine Learning (Random Forest Classifier).

**Base URL:** `http://localhost:8000`

---

## 1. Health Check
Mengecek status kesehatan server dan status pemuatan model ML (`best_ads_model.pkl`).

* **Method:** `GET`
* **Path:** `/health`
* **Response (JSON):**
  ```json
  {
    "status": "healthy",
    "model_loaded": true,
    "model_name": "Random Forest"
  }
  ```

---

## 2. Predict Recommendation
Menerima metrik iklan Meta Ads untuk beberapa kampanye sekaligus, memprosesnya dengan model ML, menghasilkan rekomendasi, dan mengirimkan hasil rekomendasi tersebut ke callback URL Next.js.

* **Method:** `POST`
* **Path:** `/predict`
* **Headers:** `Content-Type: application/json`
* **Request Body (JSON):**
  ```json
  {
    "campaigns": [
      {
        "campaign_id": "23851234560",
        "campaign_name": "Promo Ramadhan - Batik",
        "spend": 3200000.0,
        "impressions": 150000,
        "clicks": 4820,
        "ctr": 3.21,
        "cpc": 663.9,
        "cpm": 21333.3,
        "conversions": 12.0,
        "roas": 4.94
      }
    ],
    "callback_url": "http://localhost:3000/api/meta/insights/recommendation"
  }
  ```
  
  ### Deskripsi Request Body Fields:
  | Nama Field | Tipe Data | Deskripsi |
  | :--- | :--- | :--- |
  | `campaigns` | Array | Daftar kampanye iklan yang ingin dianalisis. |
  | `campaigns[].campaign_id` | String | ID Kampanye unik dari Meta Ads API. |
  | `campaigns[].campaign_name`| String | Nama Kampanye Iklan. |
  | `campaigns[].spend` | Float | Total uang yang telah dibelanjakan untuk iklan ini (IDR/USD). |
  | `campaigns[].impressions` | Integer | Jumlah tayangan iklan. |
  | `campaigns[].clicks` | Integer | Jumlah klik yang didapatkan oleh iklan. |
  | `campaigns[].ctr` | Float | Click-Through Rate (%) yaitu (Clicks/Impressions) * 100. |
  | `campaigns[].cpc` | Float | Cost Per Click (Biaya per klik). |
  | `campaigns[].cpm` | Float | Cost Per Mille (Biaya per 1000 tayangan). |
  | `campaigns[].conversions` | Float | Jumlah konversi (pembelian/purchases) yang didapatkan. |
  | `campaigns[].roas` | Float | Return on Ad Spend (Pendapatan/Spend). |
  | `callback_url` | String | URL Next.js yang akan menerima HTTP POST callback hasil rekomendasi. Default: `http://localhost:3000/api/meta/insights/recommendation`. Set ke `null` atau kosongkan jika tidak ingin menggunakan callback. |

* **Response (JSON):**
  ```json
  {
    "success": true,
    "message": "Prediksi selesai. Callback akan dikirimkan ke http://localhost:3000/api/meta/insights/recommendation secara background.",
    "data": [
      {
        "campaign_id": "23851234560",
        "ml_decision": "INCREASE",
        "ml_advice": "🚀 TINGKATKAN BUDGET (ROAS=4.94x). Kampanye ini berkinerja luar biasa dengan 12 konversi. Model menyarankan menaikkan budget harian sebesar 15-20% untuk menjangkau lebih banyak audiens potensial.",
        "ml_probability": "{'DECREASE': 0.05, 'INCREASE': 0.85, 'MAINTAIN': 0.1}"
      }
    ]
  }
  ```

---

## 3. Webhook / Callback Payload (Python -> Next.js)
Saat memanggil `/predict`, Python service akan mengirimkan HTTP POST request ke `callback_url` yang dispesifikasikan secara background.

* **Method:** `POST`
* **Path:** `[Sesuai callback_url yang diberikan]` (Contoh: `/api/meta/insights/recommendation`)
* **Headers:** `Content-Type: application/json`
* **Callback Body (JSON):**
  ```json
  [
    {
      "campaign_id": "23851234560",
      "ml_decision": "INCREASE",
      "ml_advice": "🚀 TINGKATKAN BUDGET (ROAS=4.94x). Kampanye ini berkinerja luar biasa dengan 12 konversi. Model menyarankan menaikkan budget harian sebesar 15-20% untuk menjangkau lebih banyak audiens potensial.",
      "ml_probability": "{'DECREASE': 0.05, 'INCREASE': 0.85, 'MAINTAIN': 0.1}"
    }
  ]
  ```

---

## 4. Algoritma Pemetaan Metrik Meta Ads ke Fitur ML
Model ML dilatih menggunakan data penjualan e-commerce (`Gross Sales`, `Net Sales`, dsb). Karena data metrik kampanye Meta Ads tidak menyertakan data penjualan internal secara langsung, Python Service melakukan aproksimasi cerdas secara otomatis menggunakan rumus berikut sebelum melakukan prediksi:

1. **Aproksimasi Nilai Penjualan:**
   * $Gross\ Sales = Spend \times ROAS$
   * $Net\ Sales = Gross\ Sales \times 0.95$ (Mengurangi estimasi operasional/retur 5%)
   * $Return\ Amount = Gross\ Sales \times 0.05$ (Estimasi retur 5%)
   * $Order\ Count = Conversions$ (Jumlah konversi pembelian)
   * $Total\ Sales = Gross\ Sales$

2. **Perhitungan Rasio Derivatif:**
   * $Return\ Rate = Return\ Amount / (Gross\ Sales + 1)$
   * $Net\ Margin = (Net\ Sales - Spend) / (Net\ Sales + 1)$
   * $AdSpend\ per\ Order = Spend / (Order\ Count + 1)$
   * $Sales\ Efficiency = Net\ Sales / (Spend + 1)$
   * $ROAS = Gross\ Sales / (Spend + 1)$
