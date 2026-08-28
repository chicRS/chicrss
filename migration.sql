-- Chic.rs: safe schema repair.
-- Works on a fresh database and on the existing production database.
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'patike',
  sizes TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

UPDATE products SET description = '' WHERE description IS NULL;
UPDATE products SET brand = '' WHERE brand IS NULL;
UPDATE products SET stock = 0 WHERE stock IS NULL;
UPDATE products SET sort_order = id WHERE sort_order IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products) THEN
    INSERT INTO products (name,price,category,sizes,badge,image,description,brand,stock,sort_order)
    VALUES
      ('TN Triple Black',12990,'patike','40,41,42,43,44,45','BESTSELLER','["/assets/tn-black.svg"]','Triple Black model.','Nike',5,1),
      ('TN Carbon',13990,'patike','40,41,42,43,44','NEW','["/assets/tn-carbon.svg"]','Carbon streetwear model.','Nike',4,2),
      ('TN Grey / Neon',14990,'patike','40,41,42,43,44,45','NEW','["/assets/tn-grey-neon.svg"]','Grey / Neon model.','Nike',3,3);
  END IF;
END $$;
