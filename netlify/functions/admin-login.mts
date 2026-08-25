import type { Config } from "@netlify/functions";
import { checkPassword, createSessionCookie } from "./lib/admin-auth.js";

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { password } = await req.json();
  if (typeof password !== "string" || !checkPassword(password)) {
    return Response.json({ error: "Pogrešna lozinka." }, { status: 401 });
  }
  return Response.json({ ok: true }, { headers: { "Set-Cookie": createSessionCookie() } });
};

export const config: Config = {
  path: "/api/admin/login",
};
