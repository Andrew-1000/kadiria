-- Re-order the material modules into construction (site) sequence.
-- Only rows still carrying the original seed order are changed, so an order customised
-- by an administrator is left alone.
UPDATE "calc_modules" SET "sort" = CASE "key"
    WHEN 'excavation' THEN 1
    WHEN 'blinding' THEN 2
    WHEN 'strip_footing' THEN 3
    WHEN 'column_bases' THEN 4
    WHEN 'foundation_walling' THEN 5
    WHEN 'hardcore' THEN 6
    WHEN 'ground_slab' THEN 7
    WHEN 'columns' THEN 8
    WHEN 'walling' THEN 9
    WHEN 'beams' THEN 10
    WHEN 'suspended_slab' THEN 11
    WHEN 'plaster' THEN 12
  END
WHERE ("key", "sort") IN (
  ('excavation', 1), ('hardcore', 2), ('blinding', 3), ('strip_footing', 4), ('column_bases', 5),
  ('foundation_walling', 6), ('columns', 7), ('beams', 8), ('ground_slab', 9), ('suspended_slab', 10),
  ('walling', 11), ('plaster', 12)
);
