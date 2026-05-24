import os
import joblib
import pandas as pd
import numpy as np
import datetime
import requests
from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="ML Ads Decision API",
    description="Service API Machine Learning untuk prediksi optimasi budget Meta Ads",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_FILE = "best_ads_model.pkl"
model_data = None

def load_model():
    global model_data
    if not os.path.exists(MODEL_FILE):
        return False
    try:
        model_data = joblib.load(MODEL_FILE)
        print(f"Model '{model_data.get('model_name')}' loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

# Load model on startup
load_model()

class CampaignData(BaseModel):
    campaign_id: str
    campaign_name: str
    spend: float
    impressions: int
    clicks: int
    ctr: float
    cpc: float
    cpm: float
    conversions: float
    roas: float

class PredictRequest(BaseModel):
    campaigns: List[CampaignData]
    callback_url: Optional[str] = "http://localhost:3000/api/meta/insights/recommendation"

# Callback worker function
def send_recommendations_callback(callback_url: str, payload: list):
    try:
        print(f"Sending callback to {callback_url} with {len(payload)} recommendations...")
        res = requests.post(callback_url, json=payload, timeout=10)
        print(f"Callback response status: {res.status_code}, body: {res.text}")
    except Exception as e:
        print(f"Failed to send callback to {callback_url}: {e}")

@app.get("/health")
def health_check():
    loaded = model_data is not None or load_model()
    return {
        "status": "healthy",
        "model_loaded": loaded,
        "model_name": model_data.get('model_name') if loaded else None
    }

@app.post("/predict")
def predict_ads(request: PredictRequest, background_tasks: BackgroundTasks):
    global model_data
    # Reload model if not loaded yet
    if model_data is None:
        if not load_model():
            raise HTTPException(
                status_code=503, 
                detail="Model Machine Learning (.pkl) belum tersedia atau gagal dimuat. Silakan jalankan training model terlebih dahulu."
            )
            
    best_model = model_data['model']
    scaler = model_data['scaler']
    le_target = model_data['le_target']
    feature_cols = model_data['feature_cols']
    use_scaled = model_data['use_scaled']
    class_names = le_target.classes_
    
    recommendations = []
    
    # Ambil info waktu saat ini
    now = datetime.datetime.now()
    year = now.year
    month = now.month
    quarter = (now.month - 1) // 3 + 1
    day_of_week = now.weekday()
    week_of_year = now.isocalendar().week
    
    for c in request.campaigns:
        # Mapping metrik Meta Ads ke data sales untuk model ML
        total_ad_spend = c.spend
        
        # Estimasi gross sales dari ROAS dan Spend (ROAS = Gross Sales / Spend)
        gross_sales = total_ad_spend * c.roas
        
        # Estimasi net sales (asumsi retur & diskon rata-rata 5%)
        net_sales = gross_sales * 0.95
        total_sales = gross_sales
        order_count = int(c.conversions)
        return_amount = gross_sales * 0.05
        
        # Hitung derived features sesuai feature engineering training
        input_dict = {
            'Gross Sales':       gross_sales,
            'Net Sales':         net_sales,
            'Total Sales':       total_sales,
            'Order Count':       order_count,
            'Return Amount':     return_amount,
            'Year':              year,
            'Month':             month,
            'Quarter':           quarter,
            'DayOfWeek':         day_of_week,
            'WeekOfYear':        week_of_year,
            'Return_Rate':       return_amount / (gross_sales + 1),
            'Net_Margin':        (net_sales - total_ad_spend) / (net_sales + 1),
            'AdSpend_per_Order': total_ad_spend / (order_count + 1),
            'Sales_Efficiency':  net_sales / (total_ad_spend + 1),
            'ROAS':              gross_sales / (total_ad_spend + 1),
            'ROAS_lag1':         gross_sales / (total_ad_spend + 1),   # simplified
            'AdSpend_lag1':      total_ad_spend,
            'NetSales_lag1':     net_sales,
            'ROAS_rolling3':     gross_sales / (total_ad_spend + 1),
            'AdSpend_growth':    0.0,
            'Sales_growth':      0.0,
        }
        
        # Tambahkan kolom kategorikal brand name & country default 0
        for col in feature_cols:
            if col not in input_dict:
                input_dict[col] = 0
                
        # Bentuk dataframe dengan urutan kolom yang tepat
        input_df = pd.DataFrame([input_dict])[feature_cols]
        
        # Lakukan scaling jika model memerlukannya
        if use_scaled:
            input_arr = scaler.transform(input_df)
        else:
            input_arr = input_df
            
        # Prediksi
        pred_enc = best_model.predict(input_arr)[0]
        pred_label = le_target.inverse_transform([pred_enc])[0] # 'INCREASE', 'DECREASE', 'MAINTAIN'
        
        # Ambil probabilitas tiap keputusan
        proba_dict = {}
        if hasattr(best_model, 'predict_proba'):
            proba_raw = best_model.predict_proba(input_arr)[0]
            proba_dict = {class_names[i]: round(float(proba_raw[i]), 3) for i in range(len(class_names))}
            
        # Buat deskripsi saran/advice berdasarkan performa riil
        if pred_label == 'INCREASE':
            advice = (
                f"🚀 TINGKATKAN BUDGET (ROAS={c.roas:.2f}x). "
                f"Kampanye ini berkinerja luar biasa dengan {c.conversions:.0f} konversi. "
                f"Model menyarankan menaikkan budget harian sebesar 15-20% untuk menjangkau lebih banyak audiens potensial."
            )
        elif pred_label == 'DECREASE':
            advice = (
                f"⚠️ KURANGI BUDGET (ROAS={c.roas:.2f}x). "
                f"Efisiensi belanja iklan sangat rendah dengan spend {int(c.spend):,} "
                f"tapi hanya menghasilkan {c.conversions:.0f} konversi. Disarankan kurangi budget atau pause sementara iklan ini."
            )
        else:
            advice = (
                f"⚖️ PERTAHANKAN BUDGET (ROAS={c.roas:.2f}x). "
                f"Performa kampanye stabil. Pertahankan budget saat ini dan pantau tren konversi selama 3-5 hari ke depan."
            )
            
        recommendations.append({
            "campaign_id": c.campaign_id,
            "ml_decision": pred_label,
            "ml_advice": advice,
            "ml_probability": str(proba_dict)
        })
        
    # Jalankan callback asinkron jika callback_url diberikan
    if request.callback_url:
        background_tasks.add_task(send_recommendations_callback, request.callback_url, recommendations)
        return {
            "success": True, 
            "message": f"Prediksi selesai. Callback akan dikirimkan ke {request.callback_url} secara background.",
            "data": recommendations
        }
        
    return {
        "success": True,
        "message": "Prediksi selesai tanpa callback.",
        "data": recommendations
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
