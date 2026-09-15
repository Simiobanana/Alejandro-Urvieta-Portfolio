import { env } from "cloudflare:workers";
import { headers } from "next/headers";

export type EditorUser = { email: string; displayName: string };
type AccessKey = JsonWebKey & { kid: string };
type KeyCache = { issuer: string; keys: AccessKey[]; expiresAt: number };
let keyCache: KeyCache | undefined;
let refreshPromise: Promise<void> | undefined;
let lastRefreshAttempt = 0;
const encoder = new TextEncoder();

export function isPortfolioOwner(email: string) {
  return email.trim().toLowerCase() === env.OWNER_EMAIL?.trim().toLowerCase();
}

function decodePart(part: string) {
  if (!part || !/^[A-Za-z0-9_-]+$/.test(part)) throw new Error("Invalid token encoding");
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), (character) => character.charCodeAt(0));
}

async function signingKey(issuer: string, kid: string) {
  const now = Date.now();
  const cached = keyCache?.issuer === issuer && keyCache.expiresAt > now
    ? keyCache.keys.find((key) => key.kid === kid) : undefined;
  if (cached) return cached;
  if (!refreshPromise && now - lastRefreshAttempt >= 60_000) {
    lastRefreshAttempt = now;
    refreshPromise = (async () => {
      const response = await fetch(`${issuer}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(5000), redirect: "error" });
      if (!response.ok || Number(response.headers.get("content-length") || 0) > 100_000) throw new Error("Signing keys unavailable");
      const text = await response.text();
      if (text.length > 100_000) throw new Error("Invalid signing keys");
      const body = JSON.parse(text) as { keys?: AccessKey[] };
      if (!Array.isArray(body.keys) || body.keys.length > 50) throw new Error("Invalid signing keys");
      const keys = body.keys.filter((key) => key.kty === "RSA" && typeof key.kid === "string" && typeof key.n === "string" && typeof key.e === "string" && (!key.alg || key.alg === "RS256") && (!key.use || key.use === "sig"));
      keyCache = { issuer, keys, expiresAt: Date.now() + 3_600_000 };
    })().finally(() => { refreshPromise = undefined; });
  }
  if (refreshPromise) await refreshPromise;
  if (keyCache?.issuer !== issuer || keyCache.expiresAt <= Date.now()) return undefined;
  return keyCache.keys.find((key) => key.kid === kid);
}

async function verifyAccessToken(token: string, issuer: string, audience: string): Promise<string | null> {
  try {
    if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !audience || token.length > 16_384) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decodePart(parts[0]))) as Record<string, unknown>;
    if (header.alg !== "RS256" || typeof header.kid !== "string" || header.kid.length > 256 || header.crit !== undefined) return null;
    const jwk = await signingKey(issuer, header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decodePart(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`));
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(decodePart(parts[1]))) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== issuer || !audiences.includes(audience)) return null;
    if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp) || claims.exp <= now) return null;
    if (claims.nbf !== undefined && (typeof claims.nbf !== "number" || !Number.isFinite(claims.nbf) || claims.nbf > now + 30)) return null;
    if (claims.iat !== undefined && (typeof claims.iat !== "number" || !Number.isFinite(claims.iat) || claims.iat > now + 30)) return null;
    if (typeof claims.email !== "string" || !isPortfolioOwner(claims.email)) return null;
    return claims.email.trim().toLowerCase();
  } catch {
    return null;
  }
}

export async function getEditorUser(): Promise<EditorUser | null> {
  if (process.env.NODE_ENV === "development") {
    const email = env.OWNER_EMAIL || "alejandroug2608@gmail.com";
    return { email, displayName: "Alejandro Urvieta" };
  }
  if (env.ACCESS_ENABLED !== "true" || !env.ACCESS_ISSUER || !env.ACCESS_AUDIENCE) return null;
  const token = (await headers()).get("cf-access-jwt-assertion");
  if (!token) return null;
  const email = await verifyAccessToken(token, env.ACCESS_ISSUER, env.ACCESS_AUDIENCE);
  return email ? { email, displayName: email } : null;
}

function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

export async function requireEditor(request?: Request) {
  const user = await getEditorUser();
  if (!user) return { ok: false as const, status: 401, message: "Acceso privado no autorizado." };
  if (request && !["GET","HEAD"].includes(request.method) && !hasSameOrigin(request)) return { ok: false as const, status: 403, message: "Solicitud rechazada por seguridad." };
  return { ok: true as const, user };
}
