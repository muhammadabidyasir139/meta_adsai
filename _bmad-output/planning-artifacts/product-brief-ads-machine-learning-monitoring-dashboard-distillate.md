---
title: "Product Brief Distillate: Ads Machine Learning Monitoring Dashboard"
type: llm-distillate
source: "product-brief-ads-machine-learning-monitoring-dashboard.md"
created: "2026-05-03T14:50:00Z"
purpose: "Token-efficient context for downstream PRD creation"
---

## Technical Context & Methodology
*   **Workflow:** Web System -> Meta Ads Data Input -> ML API Model -> Decision Output -> Dashboard.
*   **Tech Stack:** TypeScript, ElysiaJS (Bun), Drizzle ORM, PostgreSQL.
*   **IndoBERT ABSA:** 
    *   Finetuning on Indonesian marketplace corpus.
    *   Aspects: Product quality, price, shipping, seller service, packaging.
    *   Metric: F1-score >= 0.80.
*   **Ad Readiness Score (ARS):** Composite score aggregating aspect-based sentiments to categorize products: Recommended, Recommended with Improvements, or Not Recommended.
*   **Demand Forecasting:**
    *   Models: Prophet and LSTM (Long Short-Term Memory).
    *   Features: Transaction count, revenue, seasonality, special events.
    *   Metric: MAPE < 15%.
*   **Decision Engine:** Integrates ARS and Time-Series predictions to output final ad recommendations (product, timing, budget).

## Requirements Hints
*   **User Control:** Semi-automated "One-Click Approve" mechanism for budget changes.
*   **Monitoring:** Real-time (or near-real-time) dashboard for Meta Ads performance.
*   **Validation:** System must be validated via quantitative testing (test data) and qualitative testing (TAM - Technology Acceptance Model) with UMKM users.
*   **Automation Focus:** Priority is on budgeting decisions and monitoring over creative generation.

## Scope Signals
*   **MVP:** Single-platform focus (Meta Ads).
*   **Out-of-Scope:** Zero-click automation, multi-marketplace support (Shopee/Tokopedia/TikTok), and automated ad creatives.
