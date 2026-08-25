import type { Config } from "@netlify/functions";
import { clearSessionCookie } from "./lib/admin-auth.js";

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
};

export const config: Config = {
  path: "/api/admin/logout",
};
