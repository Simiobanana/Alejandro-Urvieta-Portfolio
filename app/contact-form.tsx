"use client";
import { useState, type FormEvent } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export default function ContactForm({ lang }: { lang: "en" | "es" }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "rate">("idle");
  const es = lang === "es";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const result = await response.json();
      if (!response.ok || !result || typeof result !== "object" || !("sent" in result) || result.sent !== true) { setStatus(response.status === 429 ? "rate" : "error"); return; }
      form.reset();
      setStatus("sent");
    } catch { setStatus("error"); }
  }
  return <form id="contact-form" className="contact-form" onSubmit={submit} aria-busy={status === "sending"}>
    <div className="contact-fields">
      <label>{es ? "Nombre (opcional)" : "Name (optional)"}<input name="name" autoComplete="name" maxLength={100}/></label>
      <label>{es ? "Tu correo" : "Your email"}<input name="email" type="email" autoComplete="email" maxLength={254} required/></label>
    </div>
    <label>{es ? "Asunto" : "Subject"}<input name="subject" maxLength={160} required/></label>
    <label>{es ? "Mensaje" : "Message"}<textarea name="message" rows={5} maxLength={5000} required/></label>
    <div className="contact-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <div className="contact-submit"><button className="button primary" type="submit" disabled={status === "sending"}>{status === "sending" ? (es ? "Enviando…" : "Sending…") : (es ? "Enviar mensaje" : "Send message")}<Send size={16}/></button>
      <small>{es ? "Directo a mi correo. Usaré tus datos solo para responderte." : "Straight to my inbox. Your details are used only to reply."}</small></div>
    <div className="contact-status" role="status" aria-live="polite">
      {status === "sent" && <p className="contact-success"><CheckCircle2 size={18}/>{es ? "Mensaje enviado. ¡Gracias por escribir!" : "Message sent. Thanks for reaching out!"}</p>}
      {status === "rate" && <p>{es ? "Demasiados intentos. Espera un minuto y vuelve a enviar." : "Too many attempts. Please wait a minute and try again."}</p>}
      {status === "error" && <p>{es ? "No se pudo enviar. Tu mensaje sigue aquí; inténtalo de nuevo más tarde." : "Could not send. Your message is still here; please try again later."}</p>}
    </div>
  </form>;
}
