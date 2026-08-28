import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { isAuthorized, unauthorized } from "./lib/admin-auth.js";

const database = getDatabase();

function parseImages(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const text = String(value);
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}
  return text ? [text] : [];
}

function toClient(p: any) {
  const images = parseImages(p.image);
  return {
    id: Number(p.id),
    name: String(p.name || ""),
    price: Number(p.price || 0),
    category: String(p.category || "patike"),
    description: String(p.description || ""),
    sizes: String(p.sizes || "").split(",").map((x: string) => x.trim()).filter(Boolean),
    badge: String(p.badge || ""),
    brand: String(p.brand || ""),
    stock: Math.max(0, Number(p.stock || 0)),
    sortOrder: Number(p.sort_order || 0),
    image: images[0] || "",
    images
  };
}

async function ensureSchema() {
  // Runtime safety net. The real schema change is also versioned in migrations.
  await database.sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'patike',
      sizes TEXT NOT NULL DEFAULT '',
      badge TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await database.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`;
  await database.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT ''`;
  await database.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0`;
  await database.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;
  await database.sql`UPDATE products SET description='' WHERE description IS NULL`;
  await database.sql`UPDATE products SET brand='' WHERE brand IS NULL`;
  await database.sql`UPDATE products SET stock=0 WHERE stock IS NULL`;
  await database.sql`UPDATE products SET sort_order=id WHERE sort_order IS NULL`;
}

function imageList(body: any): string[] {
  if (Array.isArray(body.images)) return body.images.map(String).filter(Boolean);
  if (body.image) return [String(body.image)];
  return [];
}

export default async (req: Request, context: { params: Record<string, string> }) => {
  const id = context.params.id ? Number(context.params.id) : null;
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const rows = await database.sql`SELECT * FROM products ORDER BY sort_order ASC, id ASC`;
      return Response.json(rows.map(toClient));
    }

    if (!isAuthorized(req)) return unauthorized();

    if (req.method === "POST" || req.method === "PUT") {
      if (req.method === "PUT" && !id) return Response.json({ error: "Missing id" }, { status: 400 });
      const body = await req.json();
      const name = String(body.name || "").trim();
      const price = Number(body.price);
      const category = String(body.category || "patike").trim();
      const images = imageList(body);
      if (!name || !Number.isFinite(price) || price <= 0 || !category || !images.length) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }

      const description = String(body.description || "");
      const sizes = Array.isArray(body.sizes) ? body.sizes.map(String).join(",") : String(body.sizes || "");
      const badge = String(body.badge || "");
      const brand = String(body.brand || "");
      const stock = Math.max(0, Math.floor(Number(body.stock || 0)));
      const sortOrder = Math.max(0, Math.floor(Number(body.sortOrder || 0)));
      const image = JSON.stringify(images);

      if (req.method === "POST") {
        const rows = await database.sql`
          INSERT INTO products (name, price, category, sizes, badge, image, description, brand, stock, sort_order)
          VALUES (${name}, ${price}, ${category}, ${sizes}, ${badge}, ${image}, ${description}, ${brand}, ${stock}, ${sortOrder})
          RETURNING *
        `;
        return Response.json(toClient(rows[0]), { status: 201 });
      }

      const rows = await database.sql`
        UPDATE products SET
          name=${name}, price=${price}, category=${category}, sizes=${sizes}, badge=${badge},
          image=${image}, description=${description}, brand=${brand}, stock=${stock}, sort_order=${sortOrder}
        WHERE id=${id}
        RETURNING *
      `;
      if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(toClient(rows[0]));
    }

    if (req.method === "DELETE") {
      if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
      await database.sql`DELETE FROM products WHERE id=${id}`;
      return new Response(null, { status: 204 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error: any) {
    console.error("PRODUCTS_API_ERROR", error);
    return Response.json({
      error: "Database error",
      detail: String(error?.message || error)
    }, { status: 500 });
  }
};

export const config: Config = { path: ["/api/products", "/api/products/:id"] };
