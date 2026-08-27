import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { products } from "../../db/schema.js";
import { isAuthorized, unauthorized } from "./lib/admin-auth.js";

function toClient(p: typeof products.$inferSelect) {
  let images: string[] = [];

  try {
    const parsed = JSON.parse(p.image || "");
    if (Array.isArray(parsed)) {
      images = parsed.filter(Boolean);
    }
  } catch {
    if (p.image) images = [p.image];
  }

  return {
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    sizes: p.sizes ? p.sizes.split(",").filter(Boolean) : [],
    badge: p.badge,
    image: images[0] || "",
    images,
  };
}

function getImages(body: any): string[] {
  if (Array.isArray(body.images)) {
    return body.images.filter(Boolean).map(String);
  }

  if (body.image) {
    return [String(body.image)];
  }

  return [];
}

export default async (
  req: Request,
  context: { params: Record<string, string> }
) => {
  const id = context.params.id ? Number(context.params.id) : null;

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(products)
      .orderBy(products.id);

    return Response.json(rows.map(toClient));
  }

  if (!isAuthorized(req)) return unauthorized();

  if (req.method === "POST") {
    const body = await req.json();

    const {
      name,
      price,
      category,
      sizes,
      badge
    } = body;

    const images = getImages(body);

    if (!name || !price || !category || images.length === 0) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(products)
      .values({
        name: String(name),
        price: Number(price),
        category: String(category),
        sizes: Array.isArray(sizes)
          ? sizes.join(",")
          : String(sizes || ""),
        badge: String(badge || ""),
        image: JSON.stringify(images),
      })
      .returning();

    return Response.json(toClient(row), { status: 201 });
  }

  if (req.method === "PUT") {
    if (!id) {
      return Response.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      name,
      price,
      category,
      sizes,
      badge
    } = body;

    const images = getImages(body);

    if (!name || !price || !category || images.length === 0) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [row] = await db
      .update(products)
      .set({
        name: String(name),
        price: Number(price),
        category: String(category),
        sizes: Array.isArray(sizes)
          ? sizes.join(",")
          : String(sizes || ""),
        badge: String(badge || ""),
        image: JSON.stringify(images),
      })
      .where(eq(products.id, id))
      .returning();

    if (!row) {
      return Response.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    return Response.json(toClient(row));
  }

  if (req.method === "DELETE") {
    if (!id) {
      return Response.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    await db
      .delete(products)
      .where(eq(products.id, id));

    return new Response(null, { status: 204 });
  }

  return new Response("Method not allowed", {
    status: 405
  });
};

export const config: Config = {
  path: ["/api/products", "/api/products/:id"],
};
