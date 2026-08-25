CREATE TABLE "products" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"category" text NOT NULL,
	"sizes" text DEFAULT '' NOT NULL,
	"badge" text DEFAULT '' NOT NULL,
	"image" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

INSERT INTO "products" ("name", "price", "category", "sizes", "badge", "image") VALUES
('TN Triple Black', 12990, 'patike', '40,41,42,43,44,45', 'BESTSELLER', 'assets/tn-black.jpeg'),
('TN Carbon Black', 13990, 'patike', '40,41,42,43,44', 'NEW', 'assets/tn-carbon.jpeg'),
('TN Grey / Neon', 14990, 'patike', '40,41,42,43,44,45', 'NEW', 'assets/tn-grey-neon.jpeg');
