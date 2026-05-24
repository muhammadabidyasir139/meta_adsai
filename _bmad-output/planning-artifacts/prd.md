stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish"]
releaseMode: phased
inputDocuments: [
  "_bmad-output/planning-artifacts/product-brief-ads-machine-learning-monitoring-dashboard.md",
  "_bmad-output/planning-artifacts/product-brief-ads-machine-learning-monitoring-dashboard-distillate.md"
]
documentCounts:
  briefCount: 1
  researchCount: 1
  brainstormingCount: 0
  projectDocsCount: 0
classification:
  projectType: "SaaS (Micro-B2B / AI Ad Assistant)"
  domain: "AdTech (Automated Growth Management)"
  complexity: "High (Integration Reliability) / Medium (Functional)"
  projectContext: "Productization (Research-to-Web)"
workflowType: 'prd'
---

# Product Requirements Document - Ads Machine Learning Monitoring Dashboard

**Author:** abid
**Date:** 2026-05-03

## Executive Summary

The **Ads Machine Learning Monitoring Dashboard** is an **AI Ad Assistant** tailored for Indonesian MSMEs (UMKMs). Its primary goal is to resolve "Budget Anxiety" by providing a trusted **"Aman Gak?" (Is it safe?)** confidence layer for Meta Ads management. The platform consumes external AI insights—specifically **IndoBERT sentiment analysis** and **Prophet demand forecasting**—and transforms them into a simple, one-click interface. By automating the transition from raw marketplace data to ad-budget optimization, the dashboard empowers small business owners to scale their digital presence without technical overhead or fear of manual budgeting errors.

## Project Classification

*   **Project Type:** SaaS (Micro-B2B / AI Ad Assistant)
*   **Domain:** AdTech (Automated Growth Management)
*   **Complexity:** High (Integration Reliability) / Medium (Functional)
*   **Project Context:** Web platform consuming external ML APIs.

## Success Criteria

### User Success
*   **Decision Efficiency:** Users reduce weekly manual budgeting time from hours to under 15 minutes.
*   **Onboarding Speed:** Connect Meta Ads and view first "Ad Readiness Score" within 15 minutes of logging in.
*   **Trust:** Perceived reliability of AI recommendations (measured via TAM survey).

### Business & Technical Success
*   **API Resilience:** 99.9% availability for Meta Ads API and external AI API interactions.
*   **Data Integrity:** Zero cross-tenant data leaks in the shared-database architecture.
*   **Model Benchmarks (Dependency):** Reliance on external AI achieving F1-score >= 0.80 and MAPE < 15%.

## System Architecture & AI Integration

The dashboard functions as a **consumer** of a specialized AI Service. This boundary defines our technical scope:
1.  **Web Platform:** Handles UI, OAuth, Tenant Isolation, and Meta Ads execution.
2.  **External AI API (Dependency):** Provides the **Ad Readiness Score (ARS)**, Aspect-Based Sentiment, and Demand Forecasts.
3.  **Data Ingestion:** The Web Platform fetches marketplace reviews and sends sanitized text to the AI API for processing.

## Product Scope (MVP 1)

### Must-Have Capabilities
*   **Meta Ads Hub:** Secure OAuth connection and real-time budget update pushing.
*   **Intelligence Connector:** Integration with the external AI API to fetch ARS and forecasts.
*   **"One-Click" Dashboard:** Mobile-responsive recommendation feed with rationale and approval buttons.
*   **Tenant Security:** Shared PostgreSQL database with application-level tenant isolation (`org_id`).

### Out-of-Scope (Post-MVP)
*   Subscription tiers and payments.
*   TikTok/Google Ads integration.
*   In-platform ML model training (handled by the external AI project).

## User Journeys

### 1. Siska's "Aha!" Moment (Happy Path)
*   **Scenario:** Siska sees a "High Readiness" recommendation for her serum. The dashboard explains *why* (95% positive texture sentiment + upcoming payday demand).
*   **Action:** She clicks **Approve**, and the dashboard pushes the budget update to Meta instantly.
*   **Outcome:** Siska feels "Aman" (safe) and saves 30 minutes of manual analysis.

### 2. Andi's "Safety Check" (Edge Case)
*   **Scenario:** Andi sees a "Not Recommended" score for his jacket. He drills down and discovers a shipping sentiment drop he hadn't noticed.
*   **Action:** He chooses to **Ignore** the suggestion to increase budget, saving his ROAS from a logistics bottleneck.

## Functional Requirements

### Onboarding & Authentication
*   **FR1:** Users can authenticate via email/password or Google.
*   **FR2:** Users can link/unlink Meta Business accounts via secure OAuth.
*   **FR3:** System initializes isolated organization-level workspace for each user.

### Decision Engine & Dashboard
*   **FR4:** Users can view "Ad Readiness Scores" (0-100) per product.
*   **FR5:** Users can view sentiment charts for specific product aspects (Quality, Price, etc.).
*   **FR6:** Users can review budget recommendations with clear textual rationales.
*   **FR7:** Users can push approved budget changes to Meta Ads API with one click.

### Data & System
*   **FR8:** System fetches product reviews from Indonesian marketplaces.
*   **FR9:** System scrubs PII (phone/names) before sending text to external AI API.
*   **FR10:** Admins can monitor API health and background task success rates.

## Non-Functional Requirements

### Performance & Security
*   **NFR1:** Dashboard feed must load in < 2 seconds.
*   **NFR2:** Meta OAuth tokens must be encrypted at rest (AES-256).
*   **NFR3:** Database isolation must prevent cross-tenant data access.
*   **NFR4:** System must support 100+ concurrent users on the Bun/Elysia stack.

### Integration & Reliability
*   **NFR5:** Handle external AI API latency using async loading or 1-hour result caching.
*   **NFR6:** Target 99.9% uptime for the web dashboard.
*   **NFR7:** Ensure budget updates are delivered "At-Least-Once" to the Meta API.
