-- Additive migration: never drops or renames existing data.
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Backfill NULLs so old rows are immediately compatible with the admin panel.
UPDATE products SET description = '' WHERE description IS NULL;
UPDATE products SET brand = '' WHERE brand IS NULL;
UPDATE products SET stock = 0 WHERE stock IS NULL;
UPDATE products SET sort_order = id WHERE sort_order IS NULL;

-- Keep future inserts safe even if the frontend omits optional fields.
ALTER TABLE products ALTER COLUMN description SET DEFAULT '';
ALTER TABLE products ALTER COLUMN brand SET DEFAULT '';
ALTER TABLE products ALTER COLUMN stock SET DEFAULT 0;
ALTER TABLE products ALTER COLUMN sort_order SET DEFAULT 0;
