ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "brand" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "stock" integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0;

UPDATE "products"
SET "sort_order" = "id"
WHERE "sort_order" = 0;
