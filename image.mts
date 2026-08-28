import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (_req: Request, context: Context) => {
  const key = context.params.key;
  if (!key) return new Response("Not found", { status: 404 });

  const entry = await getStore("product-images").getWithMetadata(key, { type: "arrayBuffer" });
  if (!entry) return new Response("Not found", { status: 404 });

  return new Response(entry.data as ArrayBuffer, {
    headers: {
      "Content-Type": String(entry.metadata?.contentType || "application/octet-stream"),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
};

export const config: Config = { path: "/api/images/:key" };
