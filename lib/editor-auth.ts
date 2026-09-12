import { env } from "cloudflare:workers";
import { headers } from "next/headers";

export type EditorUser = { email: string; displayName: string };

export function isPortfolioOwner(email: string) {
  return email.toLowerCase() === env.OWNER_EMAIL?.toLowerCase();
}

export async function getEditorUser(): Promise<EditorUser | null> {
  if (process.env.NODE_ENV === "development") {
    const email = env.OWNER_EMAIL || "alejandroug2608@gmail.com";
    return { email, displayName: "Alejandro Urvieta" };
  }
  if (env.ACCESS_ENABLED !== "true") return null;
  const requestHeaders = await headers();
  const email = requestHeaders.get("cf-access-authenticated-user-email")?.trim();
  if (!email || !isPortfolioOwner(email)) return null;
  return { email, displayName: email };
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
  if (request && !hasSameOrigin(request)) return { ok: false as const, status: 403, message: "Solicitud rechazada por seguridad." };
  return { ok: true as const, user };
}
