import { env } from "cloudflare:workers";
import { EmailMessage } from "cloudflare:email";
import { contactMime, contactSchema } from "@/lib/contact";

const respond = (status: number, error?: string) => Response.json(error ? { error } : { sent: true }, {
  status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) },
});

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return respond(403, "origin");
  if (!request.headers.get("content-type")?.startsWith("application/json")) return respond(415, "format");
  if (!env.CONTACT_EMAIL || !env.CONTACT_LIMIT || !env.CONTACT_TOTAL_LIMIT) return respond(503, "unavailable");
  try {
    const ip = request.headers.get("cf-connecting-ip") || "local";
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const key = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
    if (!(await env.CONTACT_LIMIT.limit({ key })).success) return respond(429, "rate");
    const reader = request.body?.getReader();
    if (!reader) return respond(400, "invalid");
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 24000) { await reader.cancel(); return respond(413, "size"); }
      chunks.push(value);
    }
    let input: unknown;
    try { input = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { return respond(400, "invalid"); }
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) return respond(400, "invalid");
    if (!(await env.CONTACT_TOTAL_LIMIT.limit({ key: "portfolio-contact" })).success) return respond(429, "rate");
    const { from, to, raw } = contactMime(parsed.data);
    await env.CONTACT_EMAIL.send(new EmailMessage(from, to, raw));
    return respond(200);
  } catch {
    // Never log message contents, addresses or provider errors containing them.
    console.error("Contact delivery failed");
    return respond(503, "unavailable");
  }
}
