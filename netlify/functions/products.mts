import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { isAuthorized, unauthorized } from "./lib/admin-auth.js";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  brand: string;
  stock: number;
  sortOrder: number;
  sizes: string[];
  badge: string;
  image: string;
  images: string[];
};

const store = () => getStore("chic-products");
const KEY = "products.json";

async function readProducts(): Promise<Product[]> {
  const raw = await store().get(KEY, { type: "text" });

  if (!raw) return [];

  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function saveProducts(products: Product[]) {
  await store().set(KEY, JSON.stringify(products));
}

function normalize(body: any, id: number): Product | null {
  const images = Array.isArray(body.images)
    ? body.images.filter(Boolean).map(String)
    : body.image
      ? [String(body.image)]
      : [];

  const sizes = Array.isArray(body.sizes)
    ? body.sizes.map(String).filter(Boolean)
    : String(body.sizes || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

  const product: Product = {
    id,
    name: String(body.name || "").trim(),
    price: Number(body.price),
    category: String(body.category || "").trim(),
    description: String(body.description || "").trim(),
    brand: String(body.brand || "").trim(),
    stock: Math.max(0, Number(body.stock || 0)),
    sortOrder: Number(body.sortOrder || 0),
    sizes,
    badge: String(body.badge || "").trim(),
    image: images[0] || "",
    images
  };

  if (
    !product.name ||
    !Number.isFinite(product.price) ||
    product.price <= 0 ||
    !product.category ||
    product.images.length === 0
  ) {
    return null;
  }

  return product;
}

export default async (
  req: Request,
  context: { params: Record<string, string> }
) => {
  try {
    const method = req.method.toUpperCase();
    const id = context.params?.id
      ? Number(context.params.id)
      : null;

    // JAVNO — učitavanje proizvoda
    if (method === "GET") {
      const products = await readProducts();

      products.sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.id - b.id
      );

      return Response.json(products);
    }

    // ADMIN
    if (!isAuthorized(req)) {
      return unauthorized();
    }

    const products = await readProducts();

    // NOVI PROIZVOD
    if (method === "POST") {
      const body = await req.json();

      const nextId =
        products.reduce(
          (max, p) => Math.max(max, Number(p.id) || 0),
          0
        ) + 1;

      const product = normalize(body, nextId);

      if (!product) {
        return Response.json(
          {
            error:
              "Nedostaju naziv, cena, kategorija ili slika."
          },
          { status: 400 }
        );
      }

      products.push(product);

      await saveProducts(products);

      return Response.json(product, {
        status: 201
      });
    }

    // IZMENA
    if (method === "PUT") {
      if (!id || !Number.isInteger(id)) {
        return Response.json(
          { error: "Nedostaje ispravan ID." },
          { status: 400 }
        );
      }

      const index = products.findIndex(
        p => p.id === id
      );

      if (index === -1) {
        return Response.json(
          { error: "Proizvod nije pronađen." },
          { status: 404 }
        );
      }

      const body = await req.json();

      const product = normalize(body, id);

      if (!product) {
        return Response.json(
          {
            error:
              "Nedostaju naziv, cena, kategorija ili slika."
          },
          { status: 400 }
        );
      }

      products[index] = product;

      await saveProducts(products);

      return Response.json(product);
    }

    // BRISANJE
    if (method === "DELETE") {
      if (!id || !Number.isInteger(id)) {
        return Response.json(
          { error: "Nedostaje ispravan ID." },
          { status: 400 }
        );
      }

      const filtered = products.filter(
        p => p.id !== id
      );

      if (filtered.length === products.length) {
        return Response.json(
          { error: "Proizvod nije pronađen." },
          { status: 404 }
        );
      }

      await saveProducts(filtered);

      return new Response(null, {
        status: 204
      });
    }

    return new Response(
      "Method not allowed",
      { status: 405 }
    );

  } catch (error) {
    console.error(
      "Products API error:",
      error
    );

    return Response.json(
      {
        error:
          "Greška na serveru."
      },
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: [
    "/api/products",
    "/api/products/:id"
  ]
};
