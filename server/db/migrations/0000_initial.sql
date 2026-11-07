CREATE TYPE "public"."bq_item_type" AS ENUM('measured', 'provisional', 'pc_sum', 'lump_sum');--> statement-breakpoint
CREATE TYPE "public"."mix_kind" AS ENUM('concrete', 'mortar');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'submitted', 'approved', 'issued');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'professional', 'member');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"created_by" uuid,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_name" text,
	"project_id" uuid,
	"action" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_templates" (
	"key" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "building_types" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"factor" numeric(6, 3) DEFAULT 1 NOT NULL,
	"default_floors" integer DEFAULT 1 NOT NULL,
	"min_floors" integer DEFAULT 1 NOT NULL,
	"max_floors" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calc_constants" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"value" numeric(14, 5) NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"group_name" text DEFAULT 'General' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calc_modules" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"defaults" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier_id" integer NOT NULL,
	"finish_key" text NOT NULL,
	"min_rate" numeric(14, 2) NOT NULL,
	"max_rate" numeric(14, 2) NOT NULL,
	"effective_from" date NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"currency" text NOT NULL,
	"vat_percent" numeric(6, 2) DEFAULT 16 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "element_splits" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"percent" numeric(6, 2) NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimate_addons" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"percent" numeric(6, 2) NOT NULL,
	"enabled_by_default" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimate_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"inputs" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'system' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finish_levels" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"labour_percent" numeric(6, 2) NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issued_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"lineage_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"issued_by" uuid,
	"snapshot" jsonb NOT NULL,
	"grand_total" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"bill_key" text NOT NULL,
	"section" text DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"unit" text NOT NULL,
	"rate" numeric(14, 2) DEFAULT 0 NOT NULL,
	"item_type" "bq_item_type" DEFAULT 'measured' NOT NULL,
	"driver" text DEFAULT 'none' NOT NULL,
	"factor" numeric(12, 4) DEFAULT 1 NOT NULL,
	"finish_sensitive" boolean DEFAULT false NOT NULL,
	"include_by_default" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "library_items_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier_id" integer NOT NULL,
	"name" text NOT NULL,
	"adjustment_percent" numeric(6, 2) DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer NOT NULL,
	"location_id" integer,
	"price" numeric(14, 2) NOT NULL,
	"effective_from" date NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "materials_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "mix_designs" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"kind" "mix_kind" NOT NULL,
	"cement" numeric(6, 2) NOT NULL,
	"sand" numeric(6, 2) NOT NULL,
	"ballast" numeric(6, 2) DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "mix_designs_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "project_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"template_key" text,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"provisional" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"bill_id" uuid NOT NULL,
	"section" text DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"unit" text NOT NULL,
	"quantity" numeric(14, 3) DEFAULT 0 NOT NULL,
	"rate" numeric(14, 2) DEFAULT 0 NOT NULL,
	"item_type" "bq_item_type" DEFAULT 'measured' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"library_code" text,
	"calc_snapshot" jsonb,
	"notes" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"lineage_id" uuid NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"previous_project_id" uuid,
	"name" text NOT NULL,
	"client" text DEFAULT '' NOT NULL,
	"site_address" text DEFAULT '' NOT NULL,
	"prepared_by" text DEFAULT '' NOT NULL,
	"location_id" integer,
	"building_type_key" text,
	"finish_key" text,
	"currency" text DEFAULT 'KES' NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"prerequisites" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"assumptions" text DEFAULT '' NOT NULL,
	"exclusions" text DEFAULT '' NOT NULL,
	"contingency_percent" numeric(6, 2) DEFAULT 5 NOT NULL,
	"vat_percent" numeric(6, 2) DEFAULT 16 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"organisation" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_rates" ADD CONSTRAINT "cost_rates_tier_id_rate_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."rate_tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_rates" ADD CONSTRAINT "cost_rates_finish_key_finish_levels_key_fk" FOREIGN KEY ("finish_key") REFERENCES "public"."finish_levels"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_bill_key_bill_templates_key_fk" FOREIGN KEY ("bill_key") REFERENCES "public"."bill_templates"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_tier_id_rate_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."rate_tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_prices" ADD CONSTRAINT "material_prices_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_prices" ADD CONSTRAINT "material_prices_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_bills" ADD CONSTRAINT "project_bills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_bill_id_project_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."project_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_building_type_key_building_types_key_fk" FOREIGN KEY ("building_type_key") REFERENCES "public"."building_types"("key") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_finish_key_finish_levels_key_fk" FOREIGN KEY ("finish_key") REFERENCES "public"."finish_levels"("key") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_tiers" ADD CONSTRAINT "rate_tiers_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_at_idx" ON "audit_events" USING btree ("at");--> statement-breakpoint
CREATE INDEX "cost_rates_lookup_idx" ON "cost_rates" USING btree ("tier_id","finish_key","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "issued_documents_rev_idx" ON "issued_documents" USING btree ("lineage_id","revision");--> statement-breakpoint
CREATE INDEX "material_prices_lookup_idx" ON "material_prices" USING btree ("material_id","location_id","effective_from");--> statement-breakpoint
CREATE INDEX "project_bills_project_idx" ON "project_bills" USING btree ("project_id","sort");--> statement-breakpoint
CREATE INDEX "project_items_bill_idx" ON "project_items" USING btree ("bill_id","sort");--> statement-breakpoint
CREATE INDEX "projects_owner_idx" ON "projects" USING btree ("owner_id","updated_at");--> statement-breakpoint
CREATE INDEX "projects_lineage_idx" ON "projects" USING btree ("lineage_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_tiers_country_key_idx" ON "rate_tiers" USING btree ("country_code","key");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree (lower("email"));