ALTER TABLE "products"
ADD COLUMN "brand" text DEFAULT '' NOT NULL;

ALTER TABLE "products"
ADD COLUMN "stock" integer DEFAULT 0 NOT NULL;

ALTER TABLE "products"
ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;
