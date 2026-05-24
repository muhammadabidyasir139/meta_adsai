ALTER TABLE "meta_ads_campaigns" ADD COLUMN "ml_decision" varchar(20);--> statement-breakpoint
ALTER TABLE "meta_ads_campaigns" ADD COLUMN "ml_advice" text;--> statement-breakpoint
ALTER TABLE "meta_ads_campaigns" ADD COLUMN "ml_probability" text;