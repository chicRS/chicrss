import type { Config } from "@netlify/functions";
import { eq, asc, desc, max } from "drizzle-orm";
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
    id: p.id, name: p.name, price: p.price, category: p.category,
    brand: p.brand || "",
    sizes: p.sizes ? p.sizes.split(",").map(x => x.trim()).filter(Boolean) : [],
    stock: p.stock ?? 0, badge: p.badge || "", image: images[0] || "",
    images, sortOrder: p.sortOrder ?? 0,
  };
}
function getImages(body: any): string[] {
  if (Array.isArray(body.images)) return body.images.filter(Boolean).map(String);
  if (body.image) return [String(body.image)];
  return [];
}
function cleanSizes(s: any) {
  return Array.isArray(s) ? s.map(String).map(x=>x.trim()).filter(Boolean).join(",") : String(s || "");
}
export default async (req: Request, context: { params: Record<string, string> }) => {
  const id = context.params.id ? Number(context.params.id) : null;

  if (req.method === "GET") {
    const rows = await db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id));
    return Response.json(rows.map(toClient));
  }

  if (!isAuthorized(req)) return unauthorized();

  if (req.method === "POST") {
    const body = await req.json();
    const images = getImages(body);
    if (!body.name || !body.price || !body.category || !images.length) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const [mx] = await db.select({ value: max(products.sortOrder) }).from(products);
    const nextOrder = Number(mx?.value ?? -1) + 1;
    const [row] = await db.insert(products).values({
      name: String(body.name), price: Number(body.price), category: String(body.category),
      brand: String(body.brand || ""), sizes: cleanSizes(body.sizes),
      stock: Math.max(0, Number(body.stock ?? 0)), badge: String(body.badge || ""),
      image: JSON.stringify(images), sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : nextOrder,
    }).returning();
    return Response.json(toClient(row), { status: 201 });
  }

  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  if (req.method === "PUT") {
    const body = await req.json();
    const images = getImages(body);
    if (!body.name || !body.price || !body.category || !images.length) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const [row] = await db.update(products).set({
      name: String(body.name), price: Number(body.price), category: String(body.category),
      brand: String(body.brand || ""), sizes: cleanSizes(body.sizes),
      stock: Math.max(0, Number(body.stock ?? 0)), badge: String(body.badge || ""),
      image: JSON.stringify(images),
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    }).where(eq(products.id, id)).returning();
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(toClient(row));
  }

  if (req.method === "DELETE") {
    await db.delete(products).where(eq(products.id, id));
    return new Response(null, { status: 204 });
  }
  return new Response("Method not allowed", { status: 405 });
};
export const config: Config = { path: ["/api/products", "/api/products/:id"] };
