import type { Config } from "@netlify/functions";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { products } from "../../db/schema.js";
import { isAuthorized, unauthorized } from "./lib/admin-auth.js";

function toClient(p: typeof products.$inferSelect) {
  let images: string[] = [];
  try {
    const parsed = JSON.parse(p.image || "");
    if (Array.isArray(parsed)) images = parsed.filter(Boolean);
  } catch {
    if (p.image) images = [p.image];
  }
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    description: p.description || "",
    sizes: p.sizes ? p.sizes.split(",").filter(Boolean) : [],
    badge: p.badge,
    brand: p.brand || "",
    stock: p.stock ?? 0,
    sortOrder: p.sortOrder ?? 0,
    image: images[0] || "",
    images
  };
}


let schemaReady = false;

async function ensureProductSchema() {
  if (schemaReady) return;
  // Keeps an already-created Chic.rs database compatible with the admin panel.
  // Safe to run repeatedly because every statement uses IF NOT EXISTS.
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sizes TEXT NOT NULL DEFAULT '',
      badge TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `));
  await db.execute(sql.raw(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`));
  await db.execute(sql.raw(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT ''`));
  await db.execute(sql.raw(`ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0`));
  await db.execute(sql.raw(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`));
  await db.execute(sql.raw(`ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`));
  schemaReady = true;
}

function getImages(body: any): string[] {
  if (Array.isArray(body.images)) return body.images.filter(Boolean).map(String);
  if (body.image) return [String(body.image)];
  return [];
}

export default async (req: Request, context: { params: Record<string, string> }) => {
  const id = context.params.id ? Number(context.params.id) : null;

  try {
    await ensureProductSchema();
  } catch (error) {
    console.error("Database initialization failed", error);
    return Response.json({ error: "Database initialization failed" }, { status: 500 });
  }

  if (req.method === "GET") {
    const rows = await db.select().from(products).orderBy(products.sortOrder, products.id);
    return Response.json(rows.map(toClient));
  }

  if (!isAuthorized(req)) return unauthorized();

  if (req.method === "POST" || req.method === "PUT") {
    if (req.method === "PUT" && !id) return Response.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json();
    const images = getImages(body);
    const name = String(body.name || "").trim();
    const price = Number(body.price);
    const category = String(body.category || "").trim();

    if (!name || !price || !category || !images.length) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const values = {
      name,
      price,
      category,
      description: String(body.description || ""),
      sizes: Array.isArray(body.sizes) ? body.sizes.join(",") : String(body.sizes || ""),
      badge: String(body.badge || ""),
      image: JSON.stringify(images),
      brand: String(body.brand || ""),
      stock: Math.max(0, Number(body.stock || 0)),
      sortOrder: Number(body.sortOrder || 0)
    };

    if (req.method === "POST") {
      const [row] = await db.insert(products).values(values).returning();
      return Response.json(toClient(row), { status: 201 });
    }

    const [row] = await db.update(products).set(values).where(eq(products.id, id!)).returning();
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(toClient(row));
  }

  if (req.method === "DELETE") {
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
    await db.delete(products).where(eq(products.id, id));
    return new Response(null, { status: 204 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: ["/api/products", "/api/products/:id"]
};
