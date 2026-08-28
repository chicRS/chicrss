import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { isAuthorized, unauthorized } from "./lib/admin-auth.js";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  sizes: string[];
  badge: string;
  image: string;
  images: string[];
  description: string;
  brand: string;
  stock: number;
  sortOrder: number;
  createdAt: string;
};

const STORE = "chic-products";
const KEY = "products";

const seed: Product[] = [
  {
    id: 1,
    name: "TN Triple Black",
    price: 12990,
    category: "patike",
    sizes: ["40", "41", "42", "43", "44", "45"],
    badge: "BESTSELLER",
    image: "/assets/tn-black.svg",
    images: ["/assets/tn-black.svg"],
    description: "Triple Black model.",
    brand: "Nike",
    stock: 5,
    sortOrder: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "TN Carbon",
    price: 13990,
    category: "patike",
    sizes: ["40", "41", "42", "43", "44"],
    badge: "NEW",
    image: "/assets/tn-carbon.svg",
    images: ["/assets/tn-carbon.svg"],
    description: "Carbon streetwear model.",
    brand: "Nike",
    stock: 4,
    sortOrder: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "TN Grey / Neon",
    price: 14990,
    category: "patike",
    sizes: ["40", "41", "42", "43", "44", "45"],
    badge: "NEW",
    image: "/assets/tn-grey-neon.svg",
    images: ["/assets/tn-grey-neon.svg"],
    description: "Grey / Neon model.",
    brand: "Nike",
    stock: 3,
    sortOrder: 3,
    createdAt: new Date().toISOString()
  }
];

function store() {
  return getStore({ name: STORE, consistency: "strong" });
}

async function readProducts(): Promise<Product[]> {
  const data = await store().get(KEY, { type: "json", consistency: "strong" }) as Product[] | null;
  if (Array.isArray(data)) return data;
  await store().setJSON(KEY, seed);
  return seed;
}

async function writeProducts(products: Product[]) {
  await store().setJSON(KEY, products);
}

function bodyImages(body: any): string[] {
  if (Array.isArray(body.images)) return body.images.map(String).filter(Boolean);
  return body.image ? [String(body.image)] : [];
}

function cleanProduct(body: any, old?: Product): Product {
  const images = bodyImages(body);
  const price = Math.floor(Number(body.price));
  const stock = Math.max(0, Math.floor(Number(body.stock || 0)));
  const sortOrder = Math.max(1, Math.floor(Number(body.sortOrder || 1)));
  return {
    id: old?.id ?? 0,
    name: String(body.name || "").trim(),
    price,
    category: String(body.category || "patike").trim(),
    sizes: Array.isArray(body.sizes)
      ? body.sizes.map(String).map(x => x.trim()).filter(Boolean)
      : String(body.sizes || "").split(",").map((x: string) => x.trim()).filter(Boolean),
    badge: String(body.badge || "").trim(),
    image: images[0] || "",
    images,
    description: String(body.description || ""),
    brand: String(body.brand || "").trim(),
    stock,
    sortOrder,
    createdAt: old?.createdAt || new Date().toISOString()
  };
}

export default async (req: Request, context: { params: Record<string, string> }) => {
  try {
    const id = context.params.id ? Number(context.params.id) : null;

    if (req.method === "GET") {
      const products = await readProducts();
      products.sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id));
      return Response.json(products);
    }

    if (!isAuthorized(req)) return unauthorized();

    const products = await readProducts();

    if (req.method === "POST") {
      const body = await req.json();
      const product = cleanProduct(body);
      if (!product.name || !Number.isFinite(product.price) || product.price <= 0 || !product.category || product.images.length === 0) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }
      product.id = products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
      products.push(product);
      await writeProducts(products);
      return Response.json(product, { status: 201 });
    }

    if (req.method === "PUT") {
      if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
      const index = products.findIndex(p => Number(p.id) === id);
      if (index < 0) return Response.json({ error: "Not found" }, { status: 404 });
      const body = await req.json();
      const product = cleanProduct(body, products[index]);
      if (!product.name || !Number.isFinite(product.price) || product.price <= 0 || !product.category || product.images.length === 0) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }
      products[index] = product;
      await writeProducts(products);
      return Response.json(product);
    }

    if (req.method === "DELETE") {
      if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
      const next = products.filter(p => Number(p.id) !== id);
      if (next.length === products.length) return Response.json({ error: "Not found" }, { status: 404 });
      await writeProducts(next);
      return new Response(null, { status: 204 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error: any) {
    console.error("PRODUCTS_API_ERROR", error);
    return Response.json({ error: "Products storage error", detail: String(error?.message || error) }, { status: 500 });
  }
};

export const config: Config = { path: ["/api/products", "/api/products/:id"] };
