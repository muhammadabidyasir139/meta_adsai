import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  integer,
  real,
  bigint,
  index,
  date,
} from 'drizzle-orm/pg-core';

// ── Existing Tables ───────────────────────────────────────────────────────────

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  metaAccessToken: text('meta_access_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adReadinessScores = pgTable('ad_readiness_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  score: integer('score').notNull(),
  narrative: text('narrative').notNull(),
  recommendations: text('recommendations').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Meta Ads Tables ───────────────────────────────────────────────────────────

/**
 * Ringkasan metrik harian per ad account
 * Diisi setiap kali data di-fetch dari Meta API
 */
export const metaAdsSummary = pgTable('meta_ads_summary', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Meta Account
  adAccountId: varchar('ad_account_id', { length: 50 }).notNull(),
  datePreset: varchar('date_preset', { length: 30 }).notNull(),

  // Core Metrics (semua dari Meta API)
  spend: real('spend').notNull().default(0),           // Total spend dalam USD/IDR
  impressions: bigint('impressions', { mode: 'number' }).notNull().default(0),
  clicks: bigint('clicks', { mode: 'number' }).notNull().default(0),
  ctr: real('ctr').notNull().default(0),               // Click-through rate (%)
  cpc: real('cpc').notNull().default(0),               // Cost per click
  cpm: real('cpm').notNull().default(0),               // Cost per 1000 impressions
  conversions: real('conversions').notNull().default(0),
  roas: real('roas').notNull().default(0),             // Return on Ad Spend

  // Periode data dari Meta API
  dateStart: date('date_start'),
  dateStop: date('date_stop'),

  // Metadata
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
}, (t) => [
  index('idx_meta_summary_account').on(t.adAccountId),
  index('idx_meta_summary_fetched').on(t.fetchedAt),
]);

/**
 * Data per kampanye — disimpan setiap sinkronisasi
 */
export const metaAdsCampaigns = pgTable('meta_ads_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Meta IDs
  adAccountId: varchar('ad_account_id', { length: 50 }).notNull(),
  campaignId: varchar('campaign_id', { length: 50 }).notNull(),
  campaignName: text('campaign_name').notNull(),

  // Metrics
  spend: real('spend').notNull().default(0),
  impressions: bigint('impressions', { mode: 'number' }).notNull().default(0),
  clicks: bigint('clicks', { mode: 'number' }).notNull().default(0),
  ctr: real('ctr').notNull().default(0),
  cpc: real('cpc').notNull().default(0),
  cpm: real('cpm').notNull().default(0),
  conversions: real('conversions').notNull().default(0),
  roas: real('roas').notNull().default(0),

  // Date range
  datePreset: varchar('date_preset', { length: 30 }).notNull(),

  // ML Recommendations (Calculated by separate Python service)
  mlDecision: varchar('ml_decision', { length: 20 }),
  mlAdvice: text('ml_advice'),
  mlProbability: text('ml_probability'),

  // Metadata
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
}, (t) => [
  index('idx_meta_campaigns_account').on(t.adAccountId),
  index('idx_meta_campaigns_campaign_id').on(t.campaignId),
  index('idx_meta_campaigns_fetched').on(t.fetchedAt),
]);

/**
 * Data time-series harian untuk grafik tren
 * Satu baris per hari per ad account
 */
export const metaAdsTimeseries = pgTable('meta_ads_timeseries', {
  id: uuid('id').defaultRandom().primaryKey(),

  adAccountId: varchar('ad_account_id', { length: 50 }).notNull(),
  date: date('date').notNull(),

  // Daily metrics
  spend: real('spend').notNull().default(0),
  impressions: bigint('impressions', { mode: 'number' }).notNull().default(0),
  clicks: bigint('clicks', { mode: 'number' }).notNull().default(0),
  ctr: real('ctr').notNull().default(0),

  // Metadata
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
}, (t) => [
  index('idx_meta_timeseries_account_date').on(t.adAccountId, t.date),
]);

/**
 * Log setiap kali data di-fetch dari Meta API
 * Untuk audit trail dan debugging
 */
export const metaAdsSyncLogs = pgTable('meta_ads_sync_logs', {
  id: uuid('id').defaultRandom().primaryKey(),

  adAccountId: varchar('ad_account_id', { length: 50 }).notNull(),
  datePreset: varchar('date_preset', { length: 30 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'success' | 'error'
  errorMessage: text('error_message'),
  campaignCount: integer('campaign_count').default(0),
  timeseriesCount: integer('timeseries_count').default(0),

  syncedAt: timestamp('synced_at').defaultNow().notNull(),
}, (t) => [
  index('idx_sync_logs_account').on(t.adAccountId),
  index('idx_sync_logs_synced').on(t.syncedAt),
]);
