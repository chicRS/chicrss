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

const STORE_NAME = "chic-products";
const PRODUCTS_KEY = "products";

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

function getProductsStore() {
  return getStore(STORE_NAME);
}

async function readProducts(): Promise<Product[]> {
  const store = getProductsStore();

  const data = await store.get(PRODUCTS_KEY, {
    type: "json"
  }) as Product[] | null;

  if (Array.isArray(data)) {
    return data;
  }

  await store.setJSON(PRODUCTS_KEY, seed);

  return seed;
}

async function writeProducts(products: Product[]) {
  const store = getProductsStore();
  await store.setJSON(PRODUCTS_KEY, products);
}

function getImages(body: any): string[] {
  if (Array.isArray(body?.images)) {
    return body.images
      .map((x: unknown) => String(x || "").trim())
      .filter(Boolean);
  }

  if (body?.image) {
    return [String(body.image).trim()];
  }

  return [];
}

function getSizes(body: any): string[] {
  if (Array.isArray(body?.sizes)) {
    return body.sizes
      .map((x: unknown) => String(x || "").trim())
      .filter(Boolean);
  }

  return String(body?.sizes || "")
    .split(",")
    .map((x: string) => x.trim())
    .filter(Boolean);
}

function cleanProduct(body: any, old?: Product): Product {
  const images = getImages(body);

  const priceNumber = Number(body?.price);
  const stockNumber = Number(body?.stock);
  const orderNumber = Number(body?.sortOrder);

  const price = Number.isFinite(priceNumber)
    ? Math.floor(priceNumber)
    : 0;

  const stock = Number.isFinite(stockNumber)
    ? Math.max(0, Math.floor(stockNumber))
    : 0;

  const sortOrder = Number.isFinite(orderNumber)
    ? Math.max(1, Math.floor(orderNumber))
    : 1;

  return {
    id: old?.id ?? 0,

    name: String(body?.name || "").trim(),

    price,

    category:
      body?.category === "garderoba"
        ? "garderoba"
        : "patike",

    sizes: getSizes(body),

    badge: String(body?.badge || "").trim(),

    image: images[0] || "",

    images,

    description: String(body?.description || "").trim(),

    brand: String(body?.brand || "").trim(),

    stock,

    sortOrder,

    createdAt:
      old?.createdAt ||
      new Date().toISOString()
  };
}

function getId(context: {
  params?: Record<string, string>;
}): number | null {
  const rawId = context?.params?.id;

  if (!rawId) {
    return null;
  }

  const id = Number(rawId);

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  return Math.floor(id);
}

export default async (
  req: Request,
  context: {
    params?: Record<string, string>;
  }
) => {
  try {
    /*
     * GET
     * Svi proizvodi mogu da se čitaju bez admin prijave.
     */
    if (req.method === "GET") {
      const products = await readProducts();

      products.sort(
        (a, b) =>
          (Number(a.sortOrder) - Number(b.sortOrder)) ||
          (Number(a.id) - Number(b.id))
      );

      return Response.json(products);
    }

    /*
     * Sve ostale akcije zahtevaju admin sesiju.
     */
    if (!isAuthorized(req)) {
      return unauthorized();
    }

    const products = await readProducts();

    /*
     * POST
     * Novi proizvod.
     */
    if (req.method === "POST") {
      const body = await req.json();

      const product = cleanProduct(body);

      if (
        !product.name ||
        !Number.isFinite(product.price) ||
        product.price <= 0 ||
        !product.category ||
        product.images.length === 0
      ) {
        return Response.json(
          {
            error:
              "Nedostaju obavezna polja: naziv, cena, kategorija ili slika."
          },
          { status: 400 }
        );
      }

      const highestId = products.reduce(
        (max, item) =>
          Math.max(max, Number(item.id) || 0),
        0
      );

      product.id = highestId + 1;

      products.push(product);

      await writeProducts(products);

      return Response.json(product, {
        status: 201
      });
    }

    /*
     * PUT
     * Izmena postojećeg proizvoda.
     */
    if (req.method === "PUT") {
      const id = getId(context);

      if (!id) {
        return Response.json(
          { error: "Nedostaje ID proizvoda." },
          { status: 400 }
        );
      }

      const index = products.findIndex(
        item => Number(item.id) === id
      );

      if (index === -1) {
        return Response.json(
          { error: "Proizvod nije pronađen." },
          { status: 404 }
        );
      }

      const body = await req.json();

      const product = cleanProduct(
        body,
        products[index]
      );

      if (
        !product.name ||
        !Number.isFinite(product.price) ||
        product.price <= 0 ||
        !product.category ||
        product.images.length === 0
      ) {
        return Response.json(
          {
            error:
              "Nedostaju obavezna polja: naziv, cena, kategorija ili slika."
          },
          { status: 400 }
        );
      }

      products[index] = product;

      await writeProducts(products);

      return Response.json(product);
    }

    /*
     * DELETE
     * Brisanje proizvoda.
     */
    if (req.method === "DELETE") {
      const id = getId(context);

      if (!id) {
        return Response.json(
          { error: "Nedostaje ID proizvoda." },
          { status: 400 }
        );
      }

      const index = products.findIndex(
        item => Number(item.id) === id
      );

      if (index === -1) {
        return Response.json(
          { error: "Proizvod nije pronađen." },
          { status: 404 }
        );
      }

      products.splice(index, 1);

      await writeProducts(products);

      return new Response(null, {
        status: 204
      });
    }

    return new Response(
      "Method not allowed",
      {
        status: 405,
        headers: {
          Allow: "GET, POST, PUT, DELETE"
        }
      }
    );

  } catch (error: any) {
    console.error(
      "CHIC_PRODUCTS_ERROR",
      error
    );

    return Response.json(
      {
        error: "Greška pri radu sa proizvodima.",
        detail: String(
          error?.message || error
        )
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
