import { pgTable, uuid, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  metaAccessToken: text('meta_access_token'), // This will be encrypted at app level
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
