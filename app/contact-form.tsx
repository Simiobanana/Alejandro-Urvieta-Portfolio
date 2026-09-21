"use client";
import { useEffect, useRef, useState, type FormEvent, type FormEventHandler } from "react";
import { Send, CheckCircle2 } from "lucide-react";

type Particle={id:number;field:string;x:number;y:number;dx:number;delay:number};
export default function ContactForm({ lang, magical=false }: { lang: "en" | "es"; magical?:boolean }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "rate">("idle");
  const [particles,setParticles]=useState<Particle[]>([]),[typing,setTyping]=useState("");
  const particleId=useRef(0),typingTimer=useRef<ReturnType<typeof setTimeout>|null>(null),particleTimers=useRef<ReturnType<typeof setTimeout>[]>([]);
  const es = lang === "es";
  useEffect(()=>()=>{if(typingTimer.current)clearTimeout(typingTimer.current);particleTimers.current.forEach(clearTimeout);},[]);
  const magic:FormEventHandler<HTMLInputElement|HTMLTextAreaElement>=event=>{
    if(!magical)return;const element=event.currentTarget,name=element.name,style=getComputedStyle(element),canvas=document.createElement("canvas"),context=canvas.getContext("2d");
    if(!context)return;context.font=style.font;const cursor=element.selectionStart??element.value.length,before=element.value.slice(0,cursor),lines=before.split("\n"),line=lines.at(-1)||"";const x=Math.min(element.clientWidth-24,14+context.measureText(line).width-(element instanceof HTMLInputElement?element.scrollLeft:0));const lineHeight=parseFloat(style.lineHeight)||24,y=element instanceof HTMLTextAreaElement?Math.min(element.clientHeight-16,14+(lines.length-1)*lineHeight):element.clientHeight/2;
    const fresh=Array.from({length:2+Math.floor(Math.random()*2)},()=>({id:++particleId.current,field:name,x,y,dx:(Math.random()-.5)*26,delay:Math.random()*.12}));setParticles(current=>[...current.slice(-22),...fresh]);for(const item of fresh)particleTimers.current.push(setTimeout(()=>setParticles(current=>current.filter(value=>value.id!==item.id)),950));
    setTyping(name);if(typingTimer.current)clearTimeout(typingTimer.current);typingTimer.current=setTimeout(()=>setTyping(""),550);
  };
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
  const field=(name:string,children:React.ReactNode)=><span className="magic-field" data-typing={typing===name}>{children}{magical&&particles.filter(p=>p.field===name).map(p=><i key={p.id} className="typing-star" style={{left:p.x,top:p.y,"--drift":`${p.dx}px`,animationDelay:`${p.delay}s`} as React.CSSProperties}/>)}</span>;
  return <form id="contact-form" className="contact-form" data-magical={magical} onSubmit={submit} aria-busy={status === "sending"}>
    <div className="contact-fields">
      <label>{es ? "Nombre (opcional)" : "Name (optional)"}{field("name",<input name="name" autoComplete="name" maxLength={100} onInput={magic}/>)}</label>
      <label>{es ? "Tu correo" : "Your email"}{field("email",<input name="email" type="email" autoComplete="email" maxLength={254} required onInput={magic}/>)}</label>
    </div>
    <label>{es ? "Asunto" : "Subject"}{field("subject",<input name="subject" maxLength={160} required onInput={magic}/>)}</label>
    <label>{es ? "Mensaje" : "Message"}{field("message",<textarea name="message" rows={5} maxLength={5000} required onInput={magic}/>)}</label>
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
