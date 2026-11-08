CREATE TABLE "library_measure_refs" (
	"id" serial PRIMARY KEY NOT NULL,
	"library_code" text NOT NULL,
	"standard_key" text NOT NULL,
	"section_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurement_references" (
	"key" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"kind" text DEFAULT 'guide' NOT NULL,
	"issuer" text DEFAULT '' NOT NULL,
	"year" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"relevance" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurement_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"standard_key" text NOT NULL,
	"section_code" text NOT NULL,
	"ref" text DEFAULT '' NOT NULL,
	"item" text NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"rule" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_measure_refs" ADD CONSTRAINT "library_measure_refs_library_code_library_items_code_fk" FOREIGN KEY ("library_code") REFERENCES "public"."library_items"("code") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "library_measure_refs" ADD CONSTRAINT "library_measure_refs_standard_key_measurement_standards_key_fk" FOREIGN KEY ("standard_key") REFERENCES "public"."measurement_standards"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_rules" ADD CONSTRAINT "measurement_rules_standard_key_measurement_standards_key_fk" FOREIGN KEY ("standard_key") REFERENCES "public"."measurement_standards"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "library_measure_refs_idx" ON "library_measure_refs" USING btree ("library_code","standard_key");--> statement-breakpoint
CREATE INDEX "measurement_rules_std_idx" ON "measurement_rules" USING btree ("standard_key","section_code");--> statement-breakpoint
-- Keep references entered under the previous columns (0005): copy them into library_measure_refs
INSERT INTO "library_measure_refs" ("library_code", "standard_key", "section_code")
SELECT l."code", 'smm_ea', l."smm_ref" FROM "library_items" l WHERE l."smm_ref" <> '' AND EXISTS (SELECT 1 FROM "measurement_standards" s WHERE s."key" = 'smm_ea')
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "library_measure_refs" ("library_code", "standard_key", "section_code")
SELECT l."code", 'cesmm4', l."cesmm_ref" FROM "library_items" l WHERE l."cesmm_ref" <> '' AND EXISTS (SELECT 1 FROM "measurement_standards" s WHERE s."key" = 'cesmm4')
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "library_items" DROP COLUMN "smm_ref";--> statement-breakpoint
ALTER TABLE "library_items" DROP COLUMN "cesmm_ref";--> statement-breakpoint
-- On Supabase: keep the new tables closed to the public API roles (see 0004_hardening). No-op elsewhere.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.measurement_rules, public.library_measure_refs, public.measurement_references FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON SEQUENCE public.measurement_rules_id_seq, public.library_measure_refs_id_seq FROM anon, authenticated';
    EXECUTE 'ALTER TABLE public.measurement_rules ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.library_measure_refs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.measurement_references ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
