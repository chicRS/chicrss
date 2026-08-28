import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { isAuthorized, unauthorized } from "./lib/admin-auth.js";

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!isAuthorized(req)) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const filename = String(body.filename || "");
  const dataBase64 = String(body.dataBase64 || "");
  const contentType = String(body.contentType || "application/octet-stream");

  if (!filename || !dataBase64) {
    return Response.json({ error: "Missing filename or data" }, { status: 400 });
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const bytes = Buffer.from(dataBase64, "base64");
  const store = getStore("product-images");

  await store.set(key, bytes, { metadata: { contentType } });
  return Response.json({ image: `/api/images/${key}` }, { status: 201 });
};

export const config: Config = { path: "/api/admin/upload" };
