# -*- coding: utf-8 -*-
"""
ML Ads Spend Decision Model
============================
Tujuan: Memutuskan apakah produk harus INCREASE, DECREASE, atau MAINTAIN budget iklan
Dataset: Brand Sales & Ad Spend Data (Kaggle)
"""

# ============================================================
# 1. INSTALL & IMPORT
# ============================================================
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (classification_report, confusion_matrix,
                             accuracy_score, roc_auc_score, f1_score)
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (RandomForestClassifier, GradientBoostingClassifier,
                               AdaBoostClassifier, ExtraTreesClassifier)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("XGBoost not installed. Skipping XGBClassifier.")

try:
    from lightgbm import LGBMClassifier
    LGBM_AVAILABLE = True
except ImportError:
    LGBM_AVAILABLE = False
    print("LightGBM not installed. Skipping LGBMClassifier.")

import kagglehub

# ============================================================
# 2. LOAD DATASET
# ============================================================
print("=" * 60)
print("STEP 1: LOADING DATASET")
print("=" * 60)

path = kagglehub.dataset_download("shreyanshverma27/brands-sales-and-ad-spend-data")
dataset_path = os.path.join(path, "Brand_Sales_AdSpend_Data.csv")

df = pd.read_csv(dataset_path)
df.columns = df.columns.str.strip().str.replace('\xa0', '', regex=False)
print(f"Dataset loaded: {df.shape[0]} rows x {df.shape[1]} columns")
print(f"Columns: {df.columns.tolist()}")
print(df.head())

# ============================================================
# 3. EXPLORATORY DATA ANALYSIS (EDA)
# ============================================================
print("\n" + "=" * 60)
print("STEP 2: EXPLORATORY DATA ANALYSIS")
print("=" * 60)

print("\n[INFO] Data Types:")
print(df.dtypes)
print("\n[INFO] Missing Values:")
print(df.isnull().sum())
print("\n[INFO] Descriptive Statistics:")
print(df.describe())

# ============================================================
# 4. FEATURE ENGINEERING
# ============================================================
print("\n" + "=" * 60)
print("STEP 3: FEATURE ENGINEERING")
print("=" * 60)

# 4a. Datetime features
df['Date'] = pd.to_datetime(df['Date'])
df['Year']       = df['Date'].dt.year
df['Month']      = df['Date'].dt.month
df['Quarter']    = df['Date'].dt.quarter
df['DayOfWeek']  = df['Date'].dt.dayofweek
df['WeekOfYear'] = df['Date'].dt.isocalendar().week.astype(int)
df = df.drop(columns=['Date'])

# 4b. Derived financial ratios
df['Return_Rate']    = df['Return Amount'] / (df['Gross Sales'] + 1)
df['Net_Margin']     = (df['Net Sales'] - df['Total Ad Spend']) / (df['Net Sales'] + 1)
df['AdSpend_per_Order'] = df['Total Ad Spend'] / (df['Order Count'] + 1)
df['Sales_Efficiency']  = df['Net Sales'] / (df['Total Ad Spend'] + 1)

# 4c. ROAS (Return on Ad Spend)
df['ROAS'] = df['Gross Sales'] / (df['Total Ad Spend'] + 1)

# 4d. Rolling statistics (by Brand Name if available)
# Sort by brand and time
if 'Brand Name' in df.columns:
    df = df.sort_values(['Brand Name', 'Year', 'Month'])
    df['ROAS_lag1']       = df.groupby('Brand Name')['ROAS'].shift(1)
    df['AdSpend_lag1']    = df.groupby('Brand Name')['Total Ad Spend'].shift(1)
    df['NetSales_lag1']   = df.groupby('Brand Name')['Net Sales'].shift(1)
    df['ROAS_rolling3']   = df.groupby('Brand Name')['ROAS'].transform(lambda x: x.rolling(3, min_periods=1).mean())
    df['AdSpend_growth']  = df.groupby('Brand Name')['Total Ad Spend'].pct_change().fillna(0)
    df['Sales_growth']    = df.groupby('Brand Name')['Net Sales'].pct_change().fillna(0)
else:
    df = df.sort_values(['Year', 'Month'])
    df['ROAS_lag1']       = df['ROAS'].shift(1).fillna(df['ROAS'].mean())
    df['AdSpend_lag1']    = df['Total Ad Spend'].shift(1).fillna(df['Total Ad Spend'].mean())
    df['NetSales_lag1']   = df['Net Sales'].shift(1).fillna(df['Net Sales'].mean())
    df['ROAS_rolling3']   = df['ROAS'].rolling(3, min_periods=1).mean()
    df['AdSpend_growth']  = df['Total Ad Spend'].pct_change().fillna(0)
    df['Sales_growth']    = df['Net Sales'].pct_change().fillna(0)

# Fill remaining NaN from lags
df = df.fillna(df.median(numeric_only=True))

print(f"Features after engineering: {df.shape[1]} columns")

# ============================================================
# 5. CREATE TARGET LABEL (Decision: INCREASE / MAINTAIN / DECREASE)
# ============================================================
print("\n" + "=" * 60)
print("STEP 4: CREATING TARGET LABEL")
print("=" * 60)

def classify_ad_decision(row):
    """
    Aturan bisnis untuk memutuskan keputusan spending iklan:
    - INCREASE  : ROAS tinggi (>= 3.0) DAN Sales_Efficiency baik DAN Return_Rate rendah
    - DECREASE  : ROAS rendah (< 1.5) ATAU Return_Rate sangat tinggi (> 0.2)
    - MAINTAIN  : Kondisi di antara keduanya
    """
    roas      = row['ROAS']
    efficiency = row['Sales_Efficiency']
    ret_rate  = row['Return_Rate']
    margin    = row['Net_Margin']

    if roas >= 3.0 and efficiency >= 2.5 and ret_rate <= 0.1:
        return 'INCREASE'
    elif roas < 1.5 or ret_rate > 0.20 or margin < -0.1:
        return 'DECREASE'
    else:
        return 'MAINTAIN'

df['Ad_Decision'] = df.apply(classify_ad_decision, axis=1)

print("\n[INFO] Label Distribution:")
print(df['Ad_Decision'].value_counts())
print(df['Ad_Decision'].value_counts(normalize=True).round(3) * 100)

# ============================================================
# 6. PREPARE FEATURES & TARGET
# ============================================================
print("\n" + "=" * 60)
print("STEP 5: PREPARING FEATURES")
print("=" * 60)

# Encode categorical columns
cat_cols = df.select_dtypes(include=['object']).columns.tolist()
cat_cols = [c for c in cat_cols if c != 'Ad_Decision']

for col in cat_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))

# Target encoding
le_target = LabelEncoder()
df['Ad_Decision_enc'] = le_target.fit_transform(df['Ad_Decision'])
class_names = le_target.classes_

# Drop target string column and non-feature columns
drop_cols = ['Ad_Decision', 'Total Ad Spend']  # drop target & the column used to derive it
feature_cols = [c for c in df.columns if c not in drop_cols + ['Ad_Decision_enc']]

X = df[feature_cols]
y = df['Ad_Decision_enc']

print(f"Features used ({len(feature_cols)}): {feature_cols}")
print(f"Target classes: {class_names}")

# ============================================================
# 7. TRAIN / TEST SPLIT & SCALING
# ============================================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc  = scaler.transform(X_test)

print(f"\nTrain size: {X_train.shape}, Test size: {X_test.shape}")

# ============================================================
# 8. TRAIN MULTIPLE MODELS & COMPARE
# ============================================================
print("\n" + "=" * 60)
print("STEP 6: TRAINING & COMPARING MODELS")
print("=" * 60)

models = {
    "Logistic Regression":      LogisticRegression(max_iter=1000, random_state=42),
    "Decision Tree":            DecisionTreeClassifier(random_state=42),
    "Random Forest":            RandomForestClassifier(n_estimators=200, random_state=42),
    "Extra Trees":              ExtraTreesClassifier(n_estimators=200, random_state=42),
    "Gradient Boosting":        GradientBoostingClassifier(n_estimators=200, random_state=42),
    "AdaBoost":                 AdaBoostClassifier(n_estimators=100, random_state=42),
    "K-Nearest Neighbors":      KNeighborsClassifier(n_neighbors=5),
    "SVM":                      SVC(kernel='rbf', probability=True, random_state=42),
    "Naive Bayes":              GaussianNB(),
}

if XGBOOST_AVAILABLE:
    models["XGBoost"] = XGBClassifier(n_estimators=200, random_state=42,
                                       use_label_encoder=False, eval_metric='mlogloss')
if LGBM_AVAILABLE:
    models["LightGBM"] = LGBMClassifier(n_estimators=200, random_state=42)

results = []
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Models that need scaling
scaled_models = {"Logistic Regression", "SVM", "K-Nearest Neighbors"}

for name, model in models.items():
    use_scaled = name in scaled_models
    Xtr = X_train_sc if use_scaled else X_train
    Xte = X_test_sc  if use_scaled else X_test

    # Cross-validation
    cv_scores = cross_val_score(model, Xtr, y_train, cv=cv, scoring='accuracy')

    # Fit & predict
    model.fit(Xtr, y_train)
    y_pred = model.predict(Xte)

    acc  = accuracy_score(y_test, y_pred)
    f1   = f1_score(y_test, y_pred, average='weighted')

    results.append({
        "Model":        name,
        "CV Accuracy":  cv_scores.mean(),
        "CV Std":       cv_scores.std(),
        "Test Accuracy": acc,
        "F1 Score":     f1,
    })

    print(f"  [{name:25s}] CV={cv_scores.mean():.4f}±{cv_scores.std():.4f} | Test={acc:.4f} | F1={f1:.4f}")

results_df = pd.DataFrame(results).sort_values("Test Accuracy", ascending=False)
print("\n[RANKING] Model Comparison:")
print(results_df.to_string(index=False))

# ============================================================
# 9. BEST MODEL — DETAILED EVALUATION
# ============================================================
print("\n" + "=" * 60)
print("STEP 7: BEST MODEL DETAILED EVALUATION")
print("=" * 60)

best_model_name = results_df.iloc[0]["Model"]
best_model      = models[best_model_name]
use_scaled_best = best_model_name in scaled_models
Xte_best        = X_test_sc if use_scaled_best else X_test
Xtr_best        = X_train_sc if use_scaled_best else X_train

best_model.fit(Xtr_best, y_train)
y_pred_best = best_model.predict(Xte_best)

print(f"\nBest Model: {best_model_name}")
print(f"Test Accuracy: {accuracy_score(y_test, y_pred_best):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred_best, target_names=class_names))

# ============================================================
# 10. VISUALIZATIONS
# ============================================================
print("\n" + "=" * 60)
print("STEP 8: GENERATING VISUALIZATIONS")
print("=" * 60)

# Set style
plt.rcParams['figure.facecolor'] = '#0f0f1a'
plt.rcParams['axes.facecolor']   = '#1a1a2e'
plt.rcParams['text.color']       = 'white'
plt.rcParams['axes.labelcolor']  = 'white'
plt.rcParams['xtick.color']      = 'white'
plt.rcParams['ytick.color']      = 'white'
PALETTE = ['#00d4ff', '#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#ec4899',
           '#3b82f6', '#84cc16', '#f97316']

fig = plt.figure(figsize=(22, 18))
fig.suptitle("ML Ads Spend Decision — Model Analysis Dashboard",
             fontsize=18, fontweight='bold', color='white', y=0.98)

# --- Plot 1: Label Distribution ---
ax1 = fig.add_subplot(3, 3, 1)
label_counts = df['Ad_Decision'].value_counts()
colors_pie   = ['#10b981', '#f59e0b', '#ef4444']
wedges, texts, autotexts = ax1.pie(
    label_counts, labels=label_counts.index, autopct='%1.1f%%',
    colors=colors_pie, startangle=90,
    textprops={'color': 'white', 'fontsize': 10}
)
for at in autotexts:
    at.set_color('white')
    at.set_fontweight('bold')
ax1.set_title("Decision Label Distribution", color='white', fontweight='bold')

# --- Plot 2: Model Accuracy Comparison ---
ax2 = fig.add_subplot(3, 3, 2)
bars = ax2.barh(results_df["Model"], results_df["Test Accuracy"],
                color=PALETTE[:len(results_df)], edgecolor='white', linewidth=0.5)
ax2.set_xlim(0, 1.1)
ax2.set_xlabel("Test Accuracy")
ax2.set_title("Model Accuracy Comparison", color='white', fontweight='bold')
for bar, val in zip(bars, results_df["Test Accuracy"]):
    ax2.text(val + 0.01, bar.get_y() + bar.get_height() / 2,
             f"{val:.3f}", va='center', color='white', fontsize=8)
ax2.invert_yaxis()

# --- Plot 3: CV Accuracy with Error Bars ---
ax3 = fig.add_subplot(3, 3, 3)
x_pos = range(len(results_df))
ax3.bar(x_pos, results_df["CV Accuracy"], color=PALETTE[:len(results_df)],
        yerr=results_df["CV Std"], capsize=4, edgecolor='white', linewidth=0.5)
ax3.set_xticks(x_pos)
ax3.set_xticklabels(results_df["Model"], rotation=45, ha='right', fontsize=7)
ax3.set_ylabel("CV Accuracy")
ax3.set_title("Cross-Validation Accuracy ± Std", color='white', fontweight='bold')
ax3.set_ylim(0, 1.1)

# --- Plot 4: Confusion Matrix (Best Model) ---
ax4 = fig.add_subplot(3, 3, 4)
cm = confusion_matrix(y_test, y_pred_best)
sns.heatmap(cm, annot=True, fmt='d', cmap='RdYlGn',
            xticklabels=class_names, yticklabels=class_names,
            ax=ax4, linewidths=0.5, linecolor='#0f0f1a')
ax4.set_title(f"Confusion Matrix — {best_model_name}", color='white', fontweight='bold')
ax4.set_xlabel("Predicted")
ax4.set_ylabel("Actual")

# --- Plot 5: F1 Score Comparison ---
ax5 = fig.add_subplot(3, 3, 5)
ax5.bar(results_df["Model"], results_df["F1 Score"],
        color=PALETTE[:len(results_df)], edgecolor='white', linewidth=0.5)
ax5.set_xticklabels(results_df["Model"], rotation=45, ha='right', fontsize=7)
ax5.set_ylabel("Weighted F1 Score")
ax5.set_title("F1 Score Comparison", color='white', fontweight='bold')
ax5.set_ylim(0, 1.1)

# --- Plot 6: Feature Importance (Best Model if available) ---
ax6 = fig.add_subplot(3, 3, 6)
if hasattr(best_model, 'feature_importances_'):
    fi = pd.Series(best_model.feature_importances_, index=feature_cols)
    fi_top = fi.nlargest(15)
    ax6.barh(fi_top.index, fi_top.values, color='#00d4ff', edgecolor='white', linewidth=0.5)
    ax6.set_title(f"Top 15 Feature Importances\n({best_model_name})",
                  color='white', fontweight='bold')
    ax6.set_xlabel("Importance")
    ax6.invert_yaxis()
elif hasattr(best_model, 'coef_'):
    coef = pd.Series(np.abs(best_model.coef_[0]), index=feature_cols)
    coef_top = coef.nlargest(15)
    ax6.barh(coef_top.index, coef_top.values, color='#7c3aed', edgecolor='white', linewidth=0.5)
    ax6.set_title(f"Top 15 Feature Coefficients\n({best_model_name})",
                  color='white', fontweight='bold')
    ax6.set_xlabel("|Coefficient|")
    ax6.invert_yaxis()
else:
    ax6.text(0.5, 0.5, "Feature importance\nnot available\nfor this model",
             ha='center', va='center', color='white', fontsize=12)
    ax6.set_title("Feature Importance", color='white', fontweight='bold')

# --- Plot 7: ROAS Distribution by Decision ---
ax7 = fig.add_subplot(3, 3, 7)
for decision, color in zip(['INCREASE', 'MAINTAIN', 'DECREASE'],
                            ['#10b981', '#f59e0b', '#ef4444']):
    subset = df[df['Ad_Decision'] == decision]['ROAS']
    if len(subset) > 0:
        ax7.hist(subset, bins=30, alpha=0.7, label=decision,
                 color=color, edgecolor='white', linewidth=0.3)
ax7.set_xlabel("ROAS (Return on Ad Spend)")
ax7.set_ylabel("Count")
ax7.set_title("ROAS Distribution by Ad Decision", color='white', fontweight='bold')
ax7.legend(facecolor='#1a1a2e', edgecolor='white', labelcolor='white')

# --- Plot 8: Sales Efficiency vs ROAS Scatter ---
ax8 = fig.add_subplot(3, 3, 8)
color_map = {'INCREASE': '#10b981', 'MAINTAIN': '#f59e0b', 'DECREASE': '#ef4444'}
for decision in ['INCREASE', 'MAINTAIN', 'DECREASE']:
    mask = df['Ad_Decision'] == decision
    ax8.scatter(df.loc[mask, 'ROAS'].clip(upper=10),
                df.loc[mask, 'Sales_Efficiency'].clip(upper=10),
                c=color_map[decision], label=decision, alpha=0.6, s=20)
ax8.set_xlabel("ROAS (capped at 10)")
ax8.set_ylabel("Sales Efficiency (capped at 10)")
ax8.set_title("ROAS vs Sales Efficiency", color='white', fontweight='bold')
ax8.legend(facecolor='#1a1a2e', edgecolor='white', labelcolor='white')

# --- Plot 9: Return Rate vs Net Margin ---
ax9 = fig.add_subplot(3, 3, 9)
for decision in ['INCREASE', 'MAINTAIN', 'DECREASE']:
    mask = df['Ad_Decision'] == decision
    ax9.scatter(df.loc[mask, 'Return_Rate'].clip(upper=0.5),
                df.loc[mask, 'Net_Margin'].clip(-1, 1),
                c=color_map[decision], label=decision, alpha=0.6, s=20)
ax9.set_xlabel("Return Rate (capped at 0.5)")
ax9.set_ylabel("Net Margin (capped ±1)")
ax9.set_title("Return Rate vs Net Margin", color='white', fontweight='bold')
ax9.axhline(0, color='white', linewidth=0.5, linestyle='--')
ax9.legend(facecolor='#1a1a2e', edgecolor='white', labelcolor='white')

plt.tight_layout(rect=[0, 0, 1, 0.97])
plt.savefig("ads_decision_dashboard.png", dpi=150, bbox_inches='tight',
            facecolor='#0f0f1a')
plt.show()
print("[INFO] Dashboard saved as 'ads_decision_dashboard.png'")

# ============================================================
# 11. PREDICTION FUNCTION (INFERENCE)
# ============================================================
print("\n" + "=" * 60)
print("STEP 9: INFERENCE EXAMPLE")
print("=" * 60)

def predict_ad_decision(gross_sales, net_sales, total_sales, order_count,
                         return_amount, total_ad_spend,
                         year=2024, month=6, quarter=2,
                         day_of_week=0, week_of_year=24):
    """
    Prediksi keputusan ads spend untuk sebuah produk.

    Parameters
    ----------
    gross_sales, net_sales, total_sales : float  — angka penjualan
    order_count                          : int    — jumlah order
    return_amount                        : float  — nilai return/refund
    total_ad_spend                       : float  — budget iklan saat ini
    year, month, quarter, ...            : int    — waktu referensi

    Returns
    -------
    dict : keputusan, probabilitas, dan saran
    """
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

    # Add encoded cat columns (use median = 0 for unknown)
    for col in feature_cols:
        if col not in input_dict:
            input_dict[col] = 0

    input_df = pd.DataFrame([input_dict])[feature_cols]

    if use_scaled_best:
        input_arr = scaler.transform(input_df)
    else:
        input_arr = input_df

    pred_enc  = best_model.predict(input_arr)[0]
    pred_label = le_target.inverse_transform([pred_enc])[0]

    proba = None
    if hasattr(best_model, 'predict_proba'):
        proba = dict(zip(class_names, best_model.predict_proba(input_arr)[0].round(3)))

    roas = input_dict['ROAS']
    if pred_label == 'INCREASE':
        advice = f"✅ TINGKATKAN BUDGET ADS (ROAS={roas:.2f}x) — Produk menghasilkan return yang sangat baik!"
    elif pred_label == 'DECREASE':
        advice = f"🔴 KURANGI BUDGET ADS (ROAS={roas:.2f}x) — Efisiensi rendah, pertimbangkan realokasi budget."
    else:
        advice = f"🟡 PERTAHANKAN BUDGET ADS (ROAS={roas:.2f}x) — Performa stabil, pantau terus trendnya."

    return {
        "decision":    pred_label,
        "advice":      advice,
        "roas":        roas,
        "probability": proba,
    }


# --- Contoh prediksi ---
examples = [
    # (gross_sales, net_sales, total_sales, order_count, return_amount, ad_spend)
    (50_000_000, 48_000_000, 52_000_000,  800,  1_000_000,  8_000_000),   # High ROAS
    ( 5_000_000,  3_000_000,  5_500_000,  100,  2_000_000, 10_000_000),   # Low ROAS
    (20_000_000, 18_500_000, 21_000_000,  350,    800_000,  7_000_000),   # Medium
]

print("\n--- CONTOH PREDIKSI KEPUTUSAN ADS ---\n")
for i, (gs, ns, ts, oc, ra, ads) in enumerate(examples, 1):
    result = predict_ad_decision(gs, ns, ts, oc, ra, ads)
    print(f"Produk #{i}:")
    print(f"  {result['advice']}")
    if result['probability']:
        print(f"  Probabilitas: {result['probability']}")
    print()

# ============================================================
# 12. SAVE BEST MODEL
# ============================================================
import joblib

joblib.dump({
    'model':       best_model,
    'scaler':      scaler,
    'le_target':   le_target,
    'feature_cols': feature_cols,
    'use_scaled':  use_scaled_best,
    'model_name':  best_model_name,
}, "best_ads_model.pkl")

print(f"[INFO] Best model '{best_model_name}' saved to 'best_ads_model.pkl'")
print("\n✅ SELESAI! Model siap digunakan untuk pengambilan keputusan Ads Spend.")
