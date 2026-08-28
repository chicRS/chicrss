import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import {
  isAuthorized,
  unauthorized
} from "./lib/admin-auth.js";

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

const store = () =>
  getStore("chic-products");

const KEY = "products.json";


async function readProducts(): Promise<Product[]> {
  const raw =
    await store().get(KEY, {
      type: "text"
    });

  if (!raw) {
    return [];
  }

  try {
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch {
    return [];
  }
}


async function saveProducts(
  products: Product[]
) {
  await store().set(
    KEY,
    JSON.stringify(products)
  );
}


/* =========================
   NORMALIZE PRODUCT
========================= */

function normalize(
  body: any,
  id: number
): Product | null {

  const existingImages =
    Array.isArray(body.images)
      ? body.images
          .filter(Boolean)
          .map(String)
      : [];

  const newImages =
    Array.isArray(body.newImages)
      ? body.newImages
          .filter(
            (x: any) =>
              x &&
              typeof x.data === "string"
          )
          .map(
            (x: any) =>
              `data:${
                x.type || "image/jpeg"
              };base64,${x.data}`
          )
      : [];

  const images = [
    ...existingImages,
    ...newImages
  ];


  const sizes =
    Array.isArray(body.sizes)

      ? body.sizes
          .map(String)
          .map(
            (s: string) =>
              s.trim()
          )
          .filter(Boolean)

      : String(
          body.sizes || ""
        )
          .split(",")
          .map(
            (s: string) =>
              s.trim()
          )
          .filter(Boolean);


  const product: Product = {

    id,

    name:
      String(
        body.name || ""
      ).trim(),

    price:
      Number(body.price),

    category:
      String(
        body.category || ""
      ).trim(),

    description:
      String(
        body.description || ""
      ).trim(),

    brand:
      String(
        body.brand || ""
      ).trim(),

    stock:
      Math.max(
        0,
        Number(
          body.stock || 0
        )
      ),

    sortOrder:
      Math.max(
        1,
        Number(
          body.sortOrder || 1
        )
      ),

    sizes,

    badge:
      String(
        body.badge || ""
      ).trim(),

    image:
      images[0] || "",

    images
  };


  if (
    !product.name ||
    !Number.isFinite(
      product.price
    ) ||
    product.price <= 0 ||
    !product.category ||
    product.images.length === 0
  ) {
    return null;
  }


  return product;
}


/* =========================
   API
========================= */

export default async (
  req: Request,
  context: {
    params: Record<string, string>;
  }
) => {

  try {

    const method =
      req.method.toUpperCase();


    /*
      Netlify može proslediti ID
      kao params.id.
    */

    const rawId =
      context?.params?.id;


    const id =
      rawId !== undefined &&
      rawId !== null &&
      String(rawId).trim() !== ""
        ? Number(rawId)
        : null;


    /* =========================
       GET
       /api/products
    ========================= */

    if (method === "GET") {

      const products =
        await readProducts();

      products.sort(
        (a, b) =>
          Number(
            a.sortOrder || 0
          ) -
          Number(
            b.sortOrder || 0
          ) ||
          Number(a.id) -
          Number(b.id)
      );

      return Response.json(
        products
      );
    }


    /* =========================
       ADMIN PROVERA
    ========================= */

    if (!isAuthorized(req)) {
      return unauthorized();
    }


    const products =
      await readProducts();


    /* =========================
       POST
       NOVI PROIZVOD
       /api/products
    ========================= */

    if (method === "POST") {

      const body =
        await req.json();


      const nextId =
        products.reduce(
          (
            max,
            p
          ) =>
            Math.max(
              max,
              Number(
                p.id
              ) || 0
            ),
          0
        ) + 1;


      const product =
        normalize(
          body,
          nextId
        );


      if (!product) {

        return Response.json(
          {
            error:
              "Nedostaju naziv, cena, kategorija ili slika."
          },
          {
            status: 400
          }
        );
      }


      products.push(
        product
      );


      await saveProducts(
        products
      );


      return Response.json(
        product,
        {
          status: 201
        }
      );
    }


    /* =========================
       PUT
       IZMENA PROIZVODA

       /api/products/:id
    ========================= */

    if (method === "PUT") {

      if (
        id === null ||
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return Response.json(
          {
            error:
              "Nedostaje ispravan ID."
          },
          {
            status: 400
          }
        );
      }


      const index =
        products.findIndex(
          p =>
            Number(p.id) ===
            id
        );


      if (index === -1) {

        return Response.json(
          {
            error:
              "Proizvod nije pronađen."
          },
          {
            status: 404
          }
        );
      }


      const body =
        await req.json();


      /*
        Ako frontend ne šalje
        slike, zadržavamo stare.
      */

      if (
        !Array.isArray(
          body.images
        ) &&
        !Array.isArray(
          body.newImages
        )
      ) {

        body.images =
          products[index]
            .images || [];

      }


      const product =
        normalize(
          body,
          id
        );


      if (!product) {

        return Response.json(
          {
            error:
              "Nedostaju naziv, cena, kategorija ili slika."
          },
          {
            status: 400
          }
        );
      }


      products[index] =
        product;


      await saveProducts(
        products
      );


      return Response.json(
        product
      );
    }


    /* =========================
       DELETE
       BRISANJE PROIZVODA

       /api/products/:id
    ========================= */

    if (method === "DELETE") {

      if (
        id === null ||
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return Response.json(
          {
            error:
              "Nedostaje ispravan ID."
          },
          {
            status: 400
          }
        );
      }


      const index =
        products.findIndex(
          p =>
            Number(p.id) ===
            id
        );


      if (index === -1) {

        return Response.json(
          {
            error:
              "Proizvod nije pronađen."
          },
          {
            status: 404
          }
        );
      }


      products.splice(
        index,
        1
      );


      await saveProducts(
        products
      );


      return Response.json(
        {
          success: true
        }
      );
    }


    /* =========================
       MOVE / PATCH
       Pomera poziciju proizvoda
    ========================= */

    if (method === "PATCH") {

      if (
        id === null ||
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return Response.json(
          {
            error:
              "Nedostaje ispravan ID."
          },
          {
            status: 400
          }
        );
      }


      const index =
        products.findIndex(
          p =>
            Number(p.id) ===
            id
        );


      if (index === -1) {

        return Response.json(
          {
            error:
              "Proizvod nije pronađen."
          },
          {
            status: 404
          }
        );
      }


      const body =
        await req.json();


      if (
        body &&
        body.sortOrder !== undefined
      ) {

        const sortOrder =
          Number(
            body.sortOrder
          );


        if (
          !Number.isFinite(
            sortOrder
          )
        ) {

          return Response.json(
            {
              error:
                "Neispravna pozicija."
            },
            {
              status: 400
            }
          );
        }


        products[index]
          .sortOrder =
            Math.max(
              1,
              Math.floor(
                sortOrder
              )
            );
      }


      await saveProducts(
        products
      );


      return Response.json(
        products[index]
      );
    }


    return new Response(
      "Method not allowed",
      {
        status: 405,
        headers: {
          Allow:
            "GET, POST, PUT, PATCH, DELETE"
        }
      }
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
      {
        status: 500
      }
    );
  }
};


/* =========================
   NETLIFY ROUTES
========================= */

export const config: Config = {
  path: [
    "/api/products",
    "/api/products/:id"
  ]
};
