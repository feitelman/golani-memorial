// Admin session — a single shared password, exchanged for a signed, HttpOnly
// cookie. Built on Web Crypto so the same code runs in middleware (Edge
// runtime) and in the API route handlers (Node).
//
// Cookie value: "<expiresAtMs>.<hex HMAC-SHA256(expiresAtMs)>". The HMAC key
// mixes ADMIN_SESSION_SECRET with ADMIN_PASSWORD, so changing the password
// instantly invalidates every existing session.

export const ADMIN_COOKIE = "admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const enc = new TextEncoder();

/** True when both env vars are set; without them admin stays locked. */
export function authConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

async function hmacHex(message: string): Promise<string> {
  const keyMaterial = `${process.env.ADMIN_SESSION_SECRET}:${process.env.ADMIN_PASSWORD}`;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(keyMaterial),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Length-independent comparison so timing doesn't leak how much matched. */
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function checkPassword(candidate: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  return Boolean(real) && safeEqual(candidate, real!);
}

export async function createSessionToken(): Promise<string> {
  const expires = String(Date.now() + SESSION_TTL_MS);
  return `${expires}.${await hmacHex(expires)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !authConfigured()) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const expires = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  return safeEqual(sig, await hmacHex(expires));
}

/** Route-handler guard (defense in depth on top of middleware). */
export async function isAdminRequest(req: { cookies: { get(name: string): { value: string } | undefined } }): Promise<boolean> {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}
