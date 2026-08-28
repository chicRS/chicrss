import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: { params: Record<string, string> }) => {
  const key = context.params.key;
  if (!key) return new Response("Not found", { status: 404 });

  const store = getStore("chic-images");
  const result = await store.get(key, { type: "arrayBuffer", metadata: true });
  if (!result) return new Response("Not found", { status: 404 });

  const meta = (result as any).metadata || {};
  return new Response((result as any).data, {
    headers: {
      "Content-Type": meta.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
};

export const config: Config = { path: "/api/image/:key" };
