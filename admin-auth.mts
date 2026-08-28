import crypto from "node:crypto";

const COOKIE_NAME = "chic_admin_session";
const ONE_DAY = 60 * 60 * 24;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "chic-rs-dev-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionCookie(): string {
  const payload = `admin.${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ONE_DAY}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAuthorized(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;
  const token = match.slice(COOKIE_NAME.length + 1);
  const [prefix, ts, providedSig] = token.split(".");
  if (!prefix || !ts || !providedSig) return false;
  const payload = `${prefix}.${ts}`;
  const expectedSig = sign(payload);
  if (expectedSig.length !== providedSig.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(providedSig));
  } catch {
    return false;
  }
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "chic2026";
  return password === expected;
}

export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
