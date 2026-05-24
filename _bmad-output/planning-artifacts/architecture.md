---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-05-03'
project_name: 'Ads Machine Learning Monitoring Dashboard'
user_name: 'abid'
date: '2026-05-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The system must manage a complex lifecycle starting from **Marketplace Ingestion** (scraping) → **Data Sanitization** (PII scrubbing) → **AI Insight Retrieval** (External API) → **Human Validation** (Dashboard) → **Meta Ads Execution** (Budget Updates). This necessitates a distributed architecture with strong background processing and state management.

**Non-Functional Requirements:**
- **Performance:** < 2s UI latency requires aggressive caching of AI insights and efficient database indexing.
- **Security:** Encryption of OAuth tokens and strict tenant isolation are non-negotiable for business trust.
- **Reliability:** 99.9% uptime targets require robust error handling for external dependencies (Meta and AI API).

**Scale & Complexity:**
The project is a **Micro-B2B SaaS** with high integration complexity. While the user base starts small (100+ concurrent), the data processing per user is significant.

- Primary domain: Web / Full-stack (ElysiaJS / Bun)
- Complexity level: Medium-High
- Estimated architectural components: 6 (Auth, Ingestion, AI Connector, Meta Hub, Dashboard, Admin Hub)

### Technical Constraints & Dependencies
- **External Dependency:** External AI API (IndoBERT/Prophet). The system is a consumer, not a trainer.
- **Third-Party Dependency:** Meta Ads API (OAuth + Budget Controls).
- **Regulatory:** UU PDP (Indonesian Data Privacy) for PII scrubbing.

### Cross-Cutting Concerns Identified
- **Tenant Isolation:** Enforced via `org_id` at the database and middleware layers.
- **Error Propagation:** Graceful UI degradation when the external AI or Meta APIs are down.
- **Token Lifecycle:** Secure storage and proactive refresh of Meta Ads OAuth tokens.

## Starter Template Evaluation

### Primary Technology Domain
**Full-stack Next.js** with an integrated **ElysiaJS** backend. This stack combines a premium React frontend with an ultra-fast, WinterCG-compliant API layer.

### Starter Options Considered
1. **Monolithic ElysiaJS:** High performance, but lacks the rich component ecosystem of Next.js for a premium dashboard.
2. **Decoupled Monorepo (Bun Workspaces):** Robust, but introduces deployment complexity on Vercel compared to a unified Next.js project.
3. **Hybrid Next.js + Elysia (Selected):** Best for Vercel. Uses a catch-all route handler for Elysia logic inside a standard Next.js project.

### Selected Starter: Next.js + Elysia Hybrid
**Rationale for Selection:**
Maximizes Vercel's native Next.js optimizations while leveraging Elysia's speed and **Eden Treaty** for end-to-end type safety between the UI and API.

**Initialization Command:**
```bash
# Initialize Next.js with Bun
bun create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install Elysia and Backend Core
bun add elysia @elysiajs/eden drizzle-orm postgres
bun add -d drizzle-kit
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript (Strict Mode) running on the **Bun v1.3** runtime (configured via `vercel.json`).

**Styling Solution:**
**Vanilla CSS** for premium aesthetic control, with Tailwind as an optional utility layer.

**Build Tooling:**
Next.js Compiler (SWC) + Bun for lightning-fast builds and HMR.

**API Pattern:**
Centralized "Catch-All" route at `src/app/api/[[...slugs]]/route.ts`.

**Note:** Project initialization using these commands will be the first implementation story.

## Core Architectural Decisions

### Data Architecture
*   **Database:** PostgreSQL (Hosted on Vercel Postgres or Neon).
*   **Multi-tenancy:** **Row Level Security (RLS)** enforced at the database layer to ensure strict isolation between UMKMs.
*   **ORM:** **Drizzle ORM** for type-safe schema management and queries.
*   **Caching:** **Upstash Redis** for 1-hour persistence of Ad Readiness Scores and external AI insights.

### Authentication & Security
*   **Auth Framework:** **Better-Auth** (Next.js + Elysia compatible). Supports secure session management and social logins.
*   **Token Protection:** **AES-256 Encryption** implemented at the application level for all Meta Ads API OAuth tokens stored in the database.
*   **Access Model:** Flat access within organizations for MVP 1.

### API & Communication
*   **API Pattern:** **Hybrid Next.js/Elysia** catch-all route.
*   **Type Safety:** **Eden Treaty** for shared types between Next.js frontend and Elysia backend.
*   **Background Jobs:** **Inngest** for managing marketplace scraping, PII scrubbing, and external AI API orchestration.

### Infrastructure & Deployment
*   **Platform:** **Vercel** with the **Bun** runtime.
*   **CI/CD:** Automated Vercel deployments from GitHub main branch.
*   **Environment:** Production-ready `.env` management with encrypted secrets on Vercel.

## Implementation Patterns & Consistency Rules

### Naming Patterns
*   **Database:** `snake_case` for all tables and columns (e.g., `ad_readiness_scores`).
*   **Code (Files):** `kebab-case` (e.g., `budget-manager.tsx`).
*   **Code (Logic):** `camelCase` for variables/functions; `PascalCase` for types/interfaces.
*   **API:** `kebab-case` for paths; `camelCase` for JSON body fields.

### Structure Patterns
*   **Organization:** **Feature-First Architecture**. Code is grouped by domain rather than type.
    *   `src/features/intelligence/`: AI Connector logic.
    *   `src/features/meta-ads/`: Integration with Meta Ads API.
    *   `src/features/marketplace/`: Scraping and data cleaning logic.
*   **Testing:** **Co-location**. Unit tests live in the same directory as the source file (`*.test.ts`).

### Format Patterns
*   **API Response Wrapper:**
    ```json
    {
      "success": boolean,
      "data": T | null,
      "error": { "message": string, "code": string } | null
    }
    ```
*   **Dates:** Strict **ISO 8601** strings for all data exchange.

### Enforcement Guidelines
*   **Mandatory:** Every new API endpoint must include a TypeBox schema for validation.
*   **Mandatory:** Every database query must be wrapped in a tenant-isolation check (`org_id`).

## Project Structure & Boundaries

### Directory Structure (Next.js + Elysia Hybrid)
```text
/ (Root)
├── package.json
├── next.config.js
├── vercel.json               <-- Bun runtime config
├── tsconfig.json
├── drizzle.config.ts
├── src/
│   ├── app/                  <-- Next.js Pages & Layouts
│   │   ├── api/
│   │   │   └── [[...slugs]]/
│   │   │       └── route.ts  <-- Elysia Entry Point
│   │   └── dashboard/        <-- Feature UI
│   ├── features/             <-- Domain-Specific Logic
│   │   ├── auth/             <-- Better-Auth setup
│   │   ├── intelligence/     <-- AI Client & Logic
│   │   ├── meta-ads/         <-- Ad Controls & OAuth
│   │   └── marketplace/      <-- Scraping & Scrubbing
│   ├── db/                   <-- Drizzle Schema & RLS
│   ├── lib/                  <-- Shared Utils (Eden, Redis, Crypto)
│   └── components/           <-- Global UI (Vanilla CSS)
└── tests/                    <-- Integration/E2E
```

### Requirements Mapping
*   **Onboarding:** `src/features/auth/`
*   **Ad Intelligence:** `src/features/intelligence/`
*   **Budget Engine:** `src/features/meta-ads/`
*   **Data Ingestion:** `src/features/marketplace/` & Inngest Jobs.

### Architectural Boundaries
*   **Frontend/Backend:** Next.js (Client/Server Components) communicates with Elysia via **Eden Treaty** for 100% type safety.
*   **AI Boundary:** The system acts as a consumer. All external AI calls are encapsulated in `src/features/intelligence/`.
*   **Security Boundary:** Multi-tenancy is enforced via **Postgres RLS** at the database level.

## Architecture Validation Results

### Coherence Validation ✅
All technical decisions (Next.js 15, ElysiaJS, Bun, Drizzle, RLS) are WinterCG compliant and optimized for Vercel deployment. Naming and structural patterns align perfectly with the chosen stack.

### Requirements Coverage Validation ✅
*   **Onboarding:** Fully supported via Better-Auth and organization-level schemas.
*   **Ad Intelligence:** Encapsulated in `src/features/intelligence/` with Redis caching for performance.
*   **Budgeting:** Handled by `src/features/meta-ads/` with human-in-the-loop validation.
*   **Data Ingestion:** Managed by Inngest jobs and marketplace scraping logic.
*   **Non-Functional:** RLS for security, Redis for performance, Bun for scalability.

### Gap Analysis
*   **AI API Contract:** Final format mapping is deferred until the external intelligence service API is finalized.
*   **Inngest Setup:** Requires setting up an Inngest Cloud or Self-hosted instance for background job management.

### Architecture Readiness Assessment
**Overall Status:** **READY FOR IMPLEMENTATION** 🚀
**Confidence Level:** High

**Key Strengths:**
*   Extreme type-safety via Eden Treaty.
*   Strict multi-tenancy via Database RLS.
*   Optimized for modern serverless deployment (Vercel + Bun).

### Implementation Handoff
*   **First Implementation Priority:** Initialize the Next.js + Elysia hybrid project using the commands specified in the "Starter Template Evaluation" section.
*   **Mandatory Pattern:** Use `src/features/` organization from Day 1.






