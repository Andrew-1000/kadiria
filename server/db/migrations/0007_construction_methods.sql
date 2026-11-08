CREATE TABLE "construction_methods" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"factor" numeric(6, 3) DEFAULT 1 NOT NULL,
	"max_floors" integer DEFAULT 20 NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_items" ADD COLUMN "methods" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "construction_method" text DEFAULT 'masonry' NOT NULL;--> statement-breakpoint
-- On Supabase: keep the new table closed to the public API roles (see 0004_hardening). No-op elsewhere.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.construction_methods FROM anon, authenticated';
    EXECUTE 'ALTER TABLE public.construction_methods ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
