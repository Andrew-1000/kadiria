CREATE TABLE "measurement_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"standard_key" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"guidance" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurement_standards" (
	"key" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"scope" text DEFAULT 'building' NOT NULL,
	"edition" text DEFAULT '' NOT NULL,
	"publisher" text DEFAULT '' NOT NULL,
	"cover_note" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_items" ADD COLUMN "smm_ref" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "library_items" ADD COLUMN "cesmm_ref" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "measurement_standard" text DEFAULT 'smm_ea' NOT NULL;--> statement-breakpoint
ALTER TABLE "measurement_sections" ADD CONSTRAINT "measurement_sections_standard_key_measurement_standards_key_fk" FOREIGN KEY ("standard_key") REFERENCES "public"."measurement_standards"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "measurement_sections_std_code_idx" ON "measurement_sections" USING btree ("standard_key","code");--> statement-breakpoint
-- On Supabase: keep the new tables closed to the public API roles (see 0004_hardening). No-op elsewhere.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.measurement_standards, public.measurement_sections FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON SEQUENCE public.measurement_sections_id_seq FROM anon, authenticated';
    EXECUTE 'ALTER TABLE public.measurement_standards ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.measurement_sections ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
