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

function getId(
  req: Request,
  context: { params: Record<string, string> }
): number | null {
  // Prvo pokušaj /api/products/:id
  const paramId = context.params?.id;

  if (paramId !== undefined && paramId !== "") {
    const n = Number(paramId);

    if (Number.isInteger(n) && n > 0) {
      return n;
    }
  }

  // Zatim pokušaj ?id=123
  try {
    const url = new URL(req.url);
    const queryId = url.searchParams.get("id");

    if (queryId) {
      const n = Number(queryId);

      if (Number.isInteger(n) && n > 0) {
        return n;
      }
    }
  } catch {
    // ignorisanje greške URL-a
  }

function normalize(body: any, id: number): Product | null {
  const existingImages = Array.isArray(body.images)
    ? body.images
        .filter(Boolean)
        .map(String)
    : [];

  const newImages = Array.isArray(body.newImages)
    ? body.newImages
        .filter(
          (x: any) =>
            x &&
            typeof x.data === "string"
        )
        .map(
          (x: any) =>
            `data:${x.type || "image/jpeg"};base64,${x.data}`
        )
    : [];

  const images = [
    ...existingImages,
    ...newImages
  ];

  const sizes = Array.isArray(body.sizes)
    ? body.sizes
        .map(String)
        .map((s: string) => s.trim())
        .filter(Boolean)
    : String(body.sizes || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

  const product: Product = {
    id,

    name: String(body.name || "").trim(),

    price: Number(body.price),

    category: String(body.category || "").trim(),

    description: String(body.description || "").trim(),

    brand: String(body.brand || "").trim(),

    stock: Math.max(
      0,
      Number(body.stock || 0)
    ),

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
  context: {
    params: Record<string, string>;
  }
) => {
  try {
    const method = req.method.toUpperCase();

    // =========================
    // JAVNO UČITAVANJE PROIZVODA
    // =========================

    if (method === "GET") {
      const products = await readProducts();

      products.sort(
        (a, b) =>
          Number(a.sortOrder || 0) -
            Number(b.sortOrder || 0) ||
          Number(a.id) - Number(b.id)
      );

      return Response.json(products);
    }

    // =========================
    // ADMIN PROVERA
    // =========================

    if (!isAuthorized(req)) {
      return unauthorized();
    }

    const products = await readProducts();

    // =========================
    // NOVI PROIZVOD
    // =========================

    if (method === "POST") {
      const body = await req.json();

      const nextId =
        products.reduce(
          (max, p) =>
            Math.max(
              max,
              Number(p.id) || 0
            ),
          0
        ) + 1;

      const product =
        normalize(body, nextId);

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

      return Response.json(
        product,
        { status: 201 }
      );
    }

    // =========================
    // IZMENA PROIZVODA
    // =========================

    if (method === "PUT") {
      const id = getId(req, context);

      if (id === null) {
        return Response.json(
          {
            error:
              "Nedostaje ispravan ID."
          },
          { status: 400 }
        );
      }

      const index =
        products.findIndex(
          p => Number(p.id) === id
        );

      if (index === -1) {
        return Response.json(
          {
            error:
              "Proizvod nije pronađen."
          },
          { status: 404 }
        );
      }

      const body = await req.json();

      const product =
        normalize(body, id);

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

    // =========================
    // BRISANJE PROIZVODA
    // =========================

    if (method === "DELETE") {
      const id = getId(req, context);

      if (id === null) {
        return Response.json(
          {
            error:
              "Nedostaje ispravan ID."
          },
          { status: 400 }
        );
      }

      const index =
        products.findIndex(
          p => Number(p.id) === id
        );

      if (index === -1) {
        return Response.json(
          {
            error:
              "Proizvod nije pronađen."
          },
          { status: 404 }
        );
      }

      products.splice(index, 1);

      await saveProducts(products);

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
