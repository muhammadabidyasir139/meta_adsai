CREATE TABLE "ad_readiness_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"narrative" text NOT NULL,
	"recommendations" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_account_id" varchar(50) NOT NULL,
	"campaign_id" varchar(50) NOT NULL,
	"campaign_name" text NOT NULL,
	"spend" real DEFAULT 0 NOT NULL,
	"impressions" bigint DEFAULT 0 NOT NULL,
	"clicks" bigint DEFAULT 0 NOT NULL,
	"ctr" real DEFAULT 0 NOT NULL,
	"cpc" real DEFAULT 0 NOT NULL,
	"cpm" real DEFAULT 0 NOT NULL,
	"conversions" real DEFAULT 0 NOT NULL,
	"roas" real DEFAULT 0 NOT NULL,
	"date_preset" varchar(30) NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_account_id" varchar(50) NOT NULL,
	"date_preset" varchar(30) NOT NULL,
	"spend" real DEFAULT 0 NOT NULL,
	"impressions" bigint DEFAULT 0 NOT NULL,
	"clicks" bigint DEFAULT 0 NOT NULL,
	"ctr" real DEFAULT 0 NOT NULL,
	"cpc" real DEFAULT 0 NOT NULL,
	"cpm" real DEFAULT 0 NOT NULL,
	"conversions" real DEFAULT 0 NOT NULL,
	"roas" real DEFAULT 0 NOT NULL,
	"date_start" date,
	"date_stop" date,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_account_id" varchar(50) NOT NULL,
	"date_preset" varchar(30) NOT NULL,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"campaign_count" integer DEFAULT 0,
	"timeseries_count" integer DEFAULT 0,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_timeseries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_account_id" varchar(50) NOT NULL,
	"date" date NOT NULL,
	"spend" real DEFAULT 0 NOT NULL,
	"impressions" bigint DEFAULT 0 NOT NULL,
	"clicks" bigint DEFAULT 0 NOT NULL,
	"ctr" real DEFAULT 0 NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"meta_access_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ad_readiness_scores" ADD CONSTRAINT "ad_readiness_scores_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_meta_campaigns_account" ON "meta_ads_campaigns" USING btree ("ad_account_id");--> statement-breakpoint
CREATE INDEX "idx_meta_campaigns_campaign_id" ON "meta_ads_campaigns" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_meta_campaigns_fetched" ON "meta_ads_campaigns" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "idx_meta_summary_account" ON "meta_ads_summary" USING btree ("ad_account_id");--> statement-breakpoint
CREATE INDEX "idx_meta_summary_fetched" ON "meta_ads_summary" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_account" ON "meta_ads_sync_logs" USING btree ("ad_account_id");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_synced" ON "meta_ads_sync_logs" USING btree ("synced_at");--> statement-breakpoint
CREATE INDEX "idx_meta_timeseries_account_date" ON "meta_ads_timeseries" USING btree ("ad_account_id","date");