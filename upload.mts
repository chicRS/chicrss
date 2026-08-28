import crypto from "node:crypto";
import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { isAuthorized, unauthorized } from "./lib/admin-auth.js";

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-100);
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!isAuthorized(req)) return unauthorized();

  const body = await req.json();
  if (!body?.dataBase64 || !body?.filename) return Response.json({ error: "Missing file" }, { status: 400 });

  const contentType = String(body.contentType || "image/jpeg");
  const ext = safeName(String(body.filename)) || "image.jpg";
  const key = `${Date.now()}-${crypto.randomUUID()}-${ext}`;
  const store = getStore("chic-images");
  await store.set(key, Buffer.from(String(body.dataBase64), "base64"), { metadata: { contentType } });

  return Response.json({ image: `/api/image/${encodeURIComponent(key)}` }, { status: 201 });
};

export const config: Config = { path: "/api/admin/upload" };
