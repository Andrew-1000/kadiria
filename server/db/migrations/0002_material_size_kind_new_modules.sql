ALTER TABLE "materials" ADD COLUMN "size" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "kind" text DEFAULT 'material' NOT NULL;--> statement-breakpoint
-- New takeoff elements (roofing, tiling, painting) slot into site order: roofing after the
-- suspended slab, then plaster, tiling and painting. Plaster moves only if it still has the
-- standard position, so custom orders set by an administrator are kept.
UPDATE "calc_modules" SET "sort" = 13 WHERE "key" = 'plaster' AND "sort" = 12;--> statement-breakpoint
INSERT INTO "calc_modules" ("key", "enabled", "sort", "defaults") VALUES
  ('roofing', true, 12, '{}'::jsonb),
  ('tiling', true, 14, '{}'::jsonb),
  ('painting', true, 15, '{}'::jsonb)
ON CONFLICT ("key") DO NOTHING;--> statement-breakpoint
-- Sizes for materials that already exist (only where none has been entered).
UPDATE "materials" SET "size" = CASE "key"
    WHEN 'cement' THEN '50 kg bag'
    WHEN 'sand' THEN 'per tonne'
    WHEN 'ballast' THEN '20 mm, per tonne'
    WHEN 'hardcore' THEN 'per tonne'
    WHEN 'stone_200' THEN '9″ (200 mm) × 400 mm face'
    WHEN 'stone_150' THEN '6″ (150 mm) × 400 mm face'
    WHEN 'hoop_iron' THEN '20 gauge × 32 mm'
    WHEN 'r6' THEN '6 mm × 12 m'
    WHEN 'r8' THEN '8 mm × 12 m'
    WHEN 'y8' THEN '8 mm × 12 m'
    WHEN 'y10' THEN '10 mm × 12 m'
    WHEN 'y12' THEN '12 mm × 12 m'
    WHEN 'y16' THEN '16 mm × 12 m'
    WHEN 'y20' THEN '20 mm × 12 m'
    WHEN 'y25' THEN '25 mm × 12 m'
    WHEN 'binding_wire' THEN 'per kg (25 kg rolls)'
    WHEN 'brc_a142' THEN '2.4 × 4.8 m sheet'
    WHEN 'brc_a98' THEN '2.4 × 4.8 m sheet'
    WHEN 'dpm' THEN '1000 gauge polythene'
    ELSE "size"
  END
WHERE "size" = '';
