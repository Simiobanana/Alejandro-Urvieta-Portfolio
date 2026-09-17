import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().max(100).default(""),
  email: z.string().trim().max(254).email().regex(/^[^\r\n]+$/),
  subject: z.string().trim().min(1).max(160).regex(/^[^\r\n]+$/),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(0).optional(),
});

export function contactMime(data: z.infer<typeof contactSchema>) {
  const from = "contact@alejandrourvieta.com";
  const to = "alejandroug2608@gmail.com";
  const body = `Nuevo mensaje desde alejandrourvieta.com\n\nNombre: ${data.name || "No indicado"}\nCorreo: ${data.email}\nAsunto: ${data.subject}\n\n${data.message}`;
  // UTF-8 encoded headers/body prevent user text from becoming MIME headers.
  const letters = Array.from(`[Portfolio] ${data.subject}`);
  const words: string[] = [];
  for (let i = 0; i < letters.length; i += 11) words.push(`=?UTF-8?B?${Buffer.from(letters.slice(i, i + 11).join("")).toString("base64")}?=`);
  const subject = words.join("\r\n ");
  const encodedBody = Buffer.from(body).toString("base64").match(/.{1,76}/g)?.join("\r\n") || "";
  const raw = [`From: Alejandro Urvieta Portfolio <${from}>`, `To: ${to}`, `Reply-To: ${data.email}`,
    `Subject: ${subject}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64", `Date: ${new Date().toUTCString()}`, "", encodedBody].join("\r\n");
  return { from, to, raw };
}
