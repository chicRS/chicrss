import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  const key = context.params.key;
  if (!key) return new Response("Not found", { status: 404 });

  const store = getStore("product-images");
  const entry = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!entry) return new Response("Not found", { status: 404 });

  const contentType = (entry.metadata?.contentType as string) || "application/octet-stream";
  return new Response(entry.data as ArrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

export const config: Config = {
  path: "/api/images/:key",
};
