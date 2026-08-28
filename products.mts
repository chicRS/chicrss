import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { isAuthorized, unauthorized } from "./lib/admin-auth.js";

const db = getDatabase();

function imagesOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const s = String(value || "");
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : (s ? [s] : []);
  } catch {
    return s ? [s] : [];
  }
}

function clientRow(p: any) {
  const images = imagesOf(p.image);
  return {
    id: Number(p.id),
    name: String(p.name || ""),
    price: Number(p.price || 0),
    category: String(p.category || "patike"),
    sizes: String(p.sizes || "").split(",").map(x => x.trim()).filter(Boolean),
    badge: String(p.badge || ""),
    image: images[0] || "",
    images,
    description: String(p.description || ""),
    brand: String(p.brand || ""),
    stock: Math.max(0, Number(p.stock || 0)),
    sortOrder: Number(p.sort_order || 0)
  };
}

async function ensureSchema() {
  await db.sql`
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
    )
  `;
  await db.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`;
  await db.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT ''`;
  await db.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0`;
  await db.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`;
  await db.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW`;
}

function bodyImages(body: any) {
  if (Array.isArray(body.images)) return body.images.map(String).filter(Boolean);
  return body.image ? [String(body.image)] : [];
}

export default async (req: Request, context: { params: Record<string, string> }) => {
  try {
    await ensureSchema();
    const id = context.params.id ? Number(context.params.id) : null;

    if (req.method === "GET") {
      const rows = await db.sql`SELECT * FROM products ORDER BY sort_order ASC, id ASC`;
      return Response.json(rows.map(clientRow));
    }

    if (!isAuthorized(req)) return unauthorized();

    if (req.method === "POST" || req.method === "PUT") {
      if (req.method === "PUT" && !id) return Response.json({ error: "Missing id" }, { status: 400 });

      const body = await req.json();
      const name = String(body.name || "").trim();
      const price = Math.floor(Number(body.price));
      const category = String(body.category || "patike").trim();
      const brand = String(body.brand || "").trim();
      const description = String(body.description || "");
      const badge = String(body.badge || "");
      const sizes = Array.isArray(body.sizes) ? body.sizes.map(String).join(",") : String(body.sizes || "");
      const stock = Math.max(0, Math.floor(Number(body.stock || 0)));
      const sortOrder = Math.max(0, Math.floor(Number(body.sortOrder || 0)));
      const images = bodyImages(body);

      if (!name || !Number.isFinite(price) || price <= 0 || !category || images.length === 0) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }

      const image = JSON.stringify(images);

      if (req.method === "POST") {
        const rows = await db.sql`
          INSERT INTO products
            (name, price, category, sizes, badge, image, description, brand, stock, sort_order)
          VALUES
            (${name}, ${price}, ${category}, ${sizes}, ${badge}, ${image}, ${description}, ${brand}, ${stock}, ${sortOrder})
          RETURNING *
        `;
        return Response.json(clientRow(rows[0]), { status: 201 });
      }

      const rows = await db.sql`
        UPDATE products SET
          name=${name},
          price=${price},
          category=${category},
          sizes=${sizes},
          badge=${badge},
          image=${image},
          description=${description},
          brand=${brand},
          stock=${stock},
          sort_order=${sortOrder}
        WHERE id=${id}
        RETURNING *
      `;
      if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(clientRow(rows[0]));
    }

    if (req.method === "DELETE") {
      if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
      await db.sql`DELETE FROM products WHERE id=${id}`;
      return new Response(null, { status: 204 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error: any) {
    console.error("PRODUCTS_API_ERROR", error);
    return Response.json(
      { error: "Database error", detail: String(error?.message || error) },
      { status: 500 }
    );
  }
};

export const config: Config = { path: ["/api/products", "/api/products/:id"] };
