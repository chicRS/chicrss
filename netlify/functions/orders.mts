import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const store = () => getStore("chic-orders");

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }

  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const city = String(body.city || "").trim();
    const address = String(body.address || "").trim();

    if (!name || !phone || !city || !address) {
      return Response.json(
        {
          error: "Nedostaju podaci za porudžbinu.",
        },
        { status: 400 }
      );
    }

    const id =
      Date.now().toString() +
      "-" +
      Math.random().toString(36).slice(2, 8);

    const order = {
      id,
      createdAt: new Date().toISOString(),
      name,
      phone,
      city,
      postalCode: String(body.postalCode || ""),
      address,
      note: String(body.note || ""),
      payment: String(body.payment || "POUZEĆEM"),
      items: Array.isArray(body.items)
        ? body.items
        : [],
      subtotal: Number(body.subtotal || 0),
      shipping: Number(body.shipping || 680),
      total: Number(body.total || 0),
    };

    await store().set(
      `${id}.json`,
      JSON.stringify(order)
    );

    return Response.json({
      success: true,
      orderId: id,
      message: "Porudžbina je uspešno poslata.",
    });
  } catch (error) {
    console.error("ORDER ERROR:", error);

    return Response.json(
      {
        error: "Greška prilikom slanja porudžbine.",
      },
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: "/api/orders",
};
