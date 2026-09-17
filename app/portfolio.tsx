"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Braces, Code2, ExternalLink, Gamepad2, GitFork, Languages, Mail, Moon, Palette, Sparkles, Sun, X, Zap, Eye, EyeOff } from "lucide-react";
import type { StoredProject, StoredSection, MediaItem } from "@/lib/content-types";
import { paletteStyle, type Settings } from "@/lib/site-settings";
import "./portfolio-effects.css";
type Lang="en"|"es";
type Content={projects:StoredProject[];sections:StoredSection[];settings:Settings};
const text=(en:string,es:string,lang:Lang)=>lang==="es"?(es||en):en;
const sectionId=(s:StoredSection)=>s.kind==="hero"?"top":s.kind==="profile"?"about":s.kind==="custom"?"section-"+s.id:s.kind;
const mediaList=(item:{media:MediaItem[];mediaUrl:string;mediaType:string;mediaAlt?:string})=>item.media.length?item.media:item.mediaUrl?[{id:"legacy",url:item.mediaUrl,type:item.mediaType,alt:item.mediaAlt||""}]:[];
const labels={en:{work:"Work",profile:"Profile",experience:"Experience",contact:"Contact",all:"All work",programming:"Programming",art:"Art & VFX",hybrid:"Hybrid",view:"Open case study",preview:"Show preview",hide:"Hide preview",live:"Visit project",source:"Source",close:"Close case study",effects:"Effects",auto:"Auto",on:"On",off:"Off",theme:"Change color theme",built:"Designed and built in Querétaro"},es:{work:"Proyectos",profile:"Perfil",experience:"Experiencia",contact:"Contacto",all:"Todos",programming:"Programación",art:"Arte y VFX",hybrid:"Híbridos",view:"Abrir caso",preview:"Ver previsualización",hide:"Ocultar previsualización",live:"Visitar proyecto",source:"Código",close:"Cerrar caso",effects:"Efectos",auto:"Auto",on:"Sí",off:"No",theme:"Cambiar tema de colores",built:"Diseñado y construido en Querétaro"}};
function Reveal({children,id,className="",enabled,style}:{children:ReactNode;id:string;className?:string;enabled:boolean;style:Settings["revealStyle"]}) {
 const ref=useRef<HTMLElement>(null); const [seen,setSeen]=useState(false);
 useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setSeen(true);observer.disconnect();}},{threshold:.04});observer.observe(node);return()=>observer.disconnect();},[]);
 return <section ref={ref} id={id} className={className+" section-reveal "+(seen?"is-seen":"")} data-reveal={enabled?style:"none"}>{children}</section>;
}
function Gallery({items,title}:{items:MediaItem[];title:string}) {
 const [active,setActive]=useState(0);const item=items[active]||items[0];if(!item)return null;
 return <div className="media-gallery"><div className="gallery-stage">{item.type.startsWith("video")?<video key={item.url} src={item.url} controls playsInline preload="metadata" poster={item.poster} aria-label={item.alt||title}/>:<img src={item.url} alt={item.alt||title} loading="lazy" decoding="async"/>}</div>{items.length>1&&<div className="gallery-tabs" role="group" aria-label="Galería / Gallery">{items.map((m,i)=><button key={m.id} type="button" aria-pressed={i===active} onClick={()=>setActive(i)}>{i+1} · {m.type.startsWith("video")?"Video":"Image"}</button>)}</div>}</div>;
}
function ProjectCard({project:p,index,lang,effects,seconds,cooldown,onOpen}:{project:StoredProject;index:number;lang:Lang;effects:boolean;seconds:number;cooldown:number;onOpen:()=>void}) {
 const ref=useRef<HTMLDivElement>(null);
 const [visible,setVisible]=useState(false),[preview,setPreview]=useState(false),[manual,setManual]=useState<boolean|null>(null);
 const control=useRef<(shown:boolean)=>void>(()=>{});
 const media=mediaList(p)[0],poster=media?.type.startsWith("video")?media.poster:media?.url,t=labels[lang];
 useEffect(()=>{
  const node=ref.current;if(!node)return;
  let timer:ReturnType<typeof setTimeout>|undefined,intersecting=false;
  const clear=()=>{if(timer!==undefined)clearTimeout(timer);};
  const phase=(show:boolean)=>{
   clear();setPreview(show);setManual(null);
   if(intersecting&&!document.hidden&&effects&&seconds>0)
    timer=setTimeout(()=>phase(!show),(show?seconds*1000+700:cooldown*1000));
  };
  control.current=(show:boolean)=>{
   clear();setPreview(show);setManual(show);
   if(intersecting&&!document.hidden&&effects&&seconds>0)
    timer=setTimeout(()=>phase(!show),(show?seconds*1000+700:cooldown*1000));
  };
  const sync=()=>{const active=intersecting&&!document.hidden;setVisible(active);if(active)phase(true);else clear();};
  const observer=new IntersectionObserver(([entry])=>{intersecting=entry.isIntersecting;sync();},{threshold:.15});
  observer.observe(node);document.addEventListener("visibilitychange",sync);
  return()=>{clear();observer.disconnect();document.removeEventListener("visibilitychange",sync);control.current=()=>{};};
 },[effects,seconds,cooldown]);
 const shown=manual??(!effects||seconds===0||preview);
 return <article className={"project-card glass accent-"+p.accent+(p.featured?" featured":"")}><div className="project-media radar" ref={ref} data-preview={shown} data-active={visible&&effects}>
 <span className="visual-grid" aria-hidden="true"/><span className="visual-ring" aria-hidden="true"/><span className="radar-sweep" aria-hidden="true"/>
 <div className="radar-preview">{poster?<img src={poster} alt={media.alt||text(p.title,p.titleEs,lang)} loading="lazy" decoding="async"/>:<div className="radar-text-preview"><Gamepad2 size={34}/><strong>{text(p.title,p.titleEs,lang)}</strong><span>{p.stack.slice(0,3).join(" · ")}</span></div>}</div>
 <span className="project-number" aria-hidden="true">{String(index+1).padStart(2,"0")}</span><span className="project-kind">{p.category}</span>
 <button type="button" className="radar-toggle" onClick={()=>control.current(!shown)} aria-pressed={shown} aria-label={shown?t.hide:t.preview} title={shown?t.hide:t.preview}>{shown?<EyeOff size={19} aria-hidden="true"/>:<Eye size={19} aria-hidden="true"/>}</button>
 </div><div className="project-body"><p className="outcome">{text(p.outcome,p.outcomeEs,lang)}</p><h3>{text(p.title,p.titleEs,lang)}</h3><p>{text(p.description,p.descriptionEs,lang)}</p><div className="tags">{p.stack.map((x,i)=><span key={i}>{x}</span>)}</div><button className="case-link" onClick={onOpen}>{t.view}<ArrowUpRight size={16}/></button></div></article>;
}
function CaseModal({project:p,lang,onClose}:{project:StoredProject;lang:Lang;onClose:()=>void}) {
 const ref=useRef<HTMLElement>(null);const t=labels[lang];
 useEffect(()=>{const before=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow="hidden";ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
 const key=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();if(event.key!=="Tab")return;const controls=Array.from(ref.current?.querySelectorAll<HTMLElement>('button,a[href],video[controls],[tabindex="0"]')||[]);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}};
 document.addEventListener("keydown",key);return()=>{document.body.style.overflow=overflow;document.removeEventListener("keydown",key);before?.focus();};},[onClose]);
 return <div className="case-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><article ref={ref} className={"case-modal glass accent-"+p.accent} role="dialog" aria-modal="true" aria-labelledby="case-title"><button className="case-close" onClick={onClose} aria-label={t.close}><X size={20}/></button><p className="section-index">{p.code} / {p.category}</p><h2 id="case-title">{text(p.title,p.titleEs,lang)}</h2><p className="case-outcome">{text(p.outcome,p.outcomeEs,lang)}</p><p className="case-summary">{text(p.description,p.descriptionEs,lang)}</p><Gallery items={mediaList(p)} title={p.title}/><div className="case-details">{(lang==="es"&&p.detailsEs.length?p.detailsEs:p.details).map((d,i)=><div key={i}><span>{String(i+1).padStart(2,"0")}</span><p>{d}</p></div>)}</div><div className="tags">{p.stack.map((x,i)=><span key={i}>{x}</span>)}</div><div className="case-actions">{p.href&&p.href!=="#"&&<a className="button primary" href={p.href} target="_blank" rel="noreferrer">{t.live}<ArrowUpRight size={17}/></a>}{p.repo&&p.repo!==p.href&&<a className="button ghost" href={p.repo} target="_blank" rel="noreferrer">{t.source}<GitFork size={17}/></a>}</div></article></div>;
}
export default function Portfolio({initialData}:{initialData:Content}) {
 const {projects,sections,settings}=initialData;
 const [theme,setTheme]=useState<"dark"|"light">("dark"),[lang,setLang]=useState<Lang>("en"),[filter,setFilter]=useState("all"),[selected,setSelected]=useState<StoredProject|null>(null),[navVisible,setNavVisible]=useState(true),[preference,setPreference]=useState<"auto"|"on"|"off">("auto"),[lowPower,setLowPower]=useState(true),[reduced,setReduced]=useState(false),[ready,setReady]=useState(false);
 const t=labels[lang]; const effects=ready&&!reduced&&settings.motionLevel>0&&preference!=="off"&&(preference==="on"||!lowPower);
 useEffect(()=>{queueMicrotask(()=>{try{const th=localStorage.getItem("au-theme"),la=localStorage.getItem("au-lang"),ef=localStorage.getItem("au-effects");if(th==="light")setTheme("light");if(la==="es")setLang("es");if(ef==="off"||ef==="on")setPreference(ef);}catch{}const nav=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}};setLowPower((nav.hardwareConcurrency||8)<=4||(nav.deviceMemory||8)<=4||!!nav.connection?.saveData);const mq=matchMedia("(prefers-reduced-motion: reduce)");const change=()=>setReduced(mq.matches);change();setReady(true);});const mq=matchMedia("(prefers-reduced-motion: reduce)");const change=()=>setReduced(mq.matches);mq.addEventListener("change",change);return()=>mq.removeEventListener("change",change);},[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.lang=lang;for(const [key,value] of Object.entries(paletteStyle(settings.palette[theme])))document.documentElement.style.setProperty(key,String(value));if(ready)try{localStorage.setItem("au-theme",theme);localStorage.setItem("au-lang",lang);localStorage.setItem("au-effects",preference);}catch{}},[theme,lang,preference,ready,settings.palette]);
 useEffect(()=>{let previous=window.scrollY,timer:ReturnType<typeof setTimeout>;const scroll=()=>{const y=window.scrollY;if(Math.abs(y-previous)>3){setNavVisible(y<80||y<previous);previous=y;}clearTimeout(timer);timer=setTimeout(()=>setNavVisible(true),220);};window.addEventListener("scroll",scroll,{passive:true});return()=>{window.removeEventListener("scroll",scroll);clearTimeout(timer);};},[]);
 const visible=useMemo(()=>projects.filter(p=>filter==="all"||(p.category.toLowerCase().includes("art")?"art":p.category==="Hybrid"?"hybrid":"programming")===filter),[filter,projects]);
 const sectionText=(s:StoredSection,key:"title"|"body"|"eyebrow"|"linkLabel")=>text(s[(key+"En") as "titleEn"],s[(key+"Es") as "titleEs"],lang);
 const itemText=(s:StoredSection["items"][number],key:"title"|"body")=>text(s[(key+"En") as "titleEn"],s[(key+"Es") as "titleEs"],lang);
 const link=(s:StoredSection)=>s.href&&<a className="button primary" href={s.href}>{sectionText(s,"linkLabel")||t.live}<ArrowUpRight size={16}/></a>;
 const header=(s:StoredSection)=><><div className="section-index">{sectionText(s,"eyebrow")}</div>{(s.titleEn||s.bodyEn)&&<div className="section-head"><h2>{sectionText(s,"title")}</h2><p>{sectionText(s,"body")}</p></div>}</>;
 return <main className="portfolio" style={paletteStyle(settings.palette[theme])} data-effects={effects?"on":"off"} data-motion={settings.motionLevel}>
 <a className="skip-link" href="#content">{lang==="es"?"Ir al contenido":"Skip to content"}</a><div className="ambient-light" aria-hidden="true"><i/><i/></div>
 <header className={"nav-wrap "+(navVisible?"":"nav-hidden")} onFocusCapture={()=>setNavVisible(true)}><a className="brand" href="#" aria-label="Alejandro Urvieta"><span className="brand-mark">AU</span><span><strong>Alejandro Urvieta</strong><small>Game & Software Developer</small></span></a><nav aria-label={lang==="es"?"Navegación principal":"Main navigation"}>{sections.filter(s=>["work","profile","experience","contact"].includes(s.kind)).map(s=><a key={s.id} href={"#"+sectionId(s)}>{t[s.kind as "work"]}</a>)}</nav><div className="nav-controls"><label className="control effects-control"><Zap size={14}/><span>{t.effects}</span><select aria-label={t.effects} value={preference} onChange={e=>setPreference(e.target.value as typeof preference)}><option value="auto">{t.auto}</option><option value="on">{t.on}</option><option value="off">{t.off}</option></select></label><button className="control" onClick={()=>setLang(lang==="en"?"es":"en")} aria-label={lang==="en"?"Cambiar a español":"Switch to English"}><Languages size={16}/><span>{lang==="en"?"ES":"EN"}</span></button><button className="control icon-only" onClick={()=>setTheme(theme==="dark"?"light":"dark")} aria-label={t.theme}>{theme==="dark"?<Sun size={17}/>:<Moon size={17}/>}</button></div></header>
 <div id="content"/>
 {sections.map(s=>{
 const title=sectionText(s,"title"),body=sectionText(s,"body"),eyebrow=sectionText(s,"eyebrow"),common={id:sectionId(s),enabled:effects,style:settings.revealStyle};
 if(s.kind==="hero")return <Reveal key={s.id} {...common} className="hero"><div className="hero-copy"><div className="status"><i/>{text(settings.availabilityEn,settings.availabilityEs,lang)}</div><p className="kicker">{eyebrow}</p><h1>{title}</h1><p className="hero-lede">{body}</p><div className="hero-actions">{link(s)}{s.items.filter(i=>i.label==="action").map((i,n)=><a className="button ghost" key={n} href={i.href}>{itemText(i,"title")}<Mail size={16}/></a>)}</div><div className="hero-facts">{s.items.filter(i=>i.label!=="action").map((i,n)=><span key={n}>{itemText(i,"title")}</span>)}</div><Gallery items={mediaList(s)} title={title}/></div><div className="hero-console glass"><div className="console-top"><span>CREATIVE_SYSTEMS.EXE</span><span className="live-dot">LIVE</span></div><div className="console-stage"><div className="core"><Gamepad2 size={30}/><strong>PLAY</strong><small>code × craft</small></div><span className="node n1"><Code2/>GAMEPLAY</span><span className="node n2"><Braces/>TOOLS</span><span className="node n3"><Palette/>VFX</span><span className="node n4"><Sparkles/>WORLDS</span></div><div className="console-foot"><span>UNITY · UE5 · C++ · WEB</span><strong>READY_01</strong></div></div></Reveal>;
 if(s.kind==="highlights")return <Reveal key={s.id} {...common} className="highlights-shell section-shell">{header(s)}<div className="proof-strip">{s.items.map((i,n)=><div key={n}><strong>{itemText(i,"title")}</strong><span>{itemText(i,"body")}</span>{i.href&&<a href={i.href}>{t.live}</a>}</div>)}</div><Gallery items={mediaList(s)} title={title}/>{link(s)}</Reveal>;
 if(s.kind==="work")return <Reveal key={s.id} {...common} className="work section-shell">{header(s)}<Gallery items={mediaList(s)} title={title}/>{link(s)}<div className="filters" role="group" aria-label={lang==="es"?"Filtrar proyectos":"Filter projects"}>{["all","programming","art","hybrid"].map(k=><button key={k} className={filter===k?"active":""} aria-pressed={filter===k} onClick={()=>setFilter(k)}>{t[k as "all"]}</button>)}</div><div className="project-grid">{visible.map((p,i)=><ProjectCard key={p.id} project={p} index={i} lang={lang} effects={effects} seconds={settings.previewSeconds} cooldown={settings.radarCooldownSeconds} onOpen={()=>setSelected(p)}/>)}</div></Reveal>;
 if(s.kind==="profile")return <Reveal key={s.id} {...common} className="about section-shell">{header(s)}<div className="principles">{s.items.filter(i=>i.label!=="skill").map((i,n)=><article key={n}><span>{String(n+1).padStart(2,"0")}</span><h3>{itemText(i,"title")}</h3><p>{itemText(i,"body")}</p>{i.href&&<a href={i.href}>{t.live}</a>}</article>)}</div><div className="skill-rail">{s.items.filter(i=>i.label==="skill").map((i,n)=><span key={n}>{itemText(i,"title")}</span>)}</div><Gallery items={mediaList(s)} title={title}/>{link(s)}</Reveal>;
 if(s.kind==="experience")return <Reveal key={s.id} {...common} className="experience section-shell">{header(s)}<div className="timeline">{s.items.map((i,n)=>{const [role,...detail]=itemText(i,"body").split("\n");return <article key={n}><span className="timeline-no">{String(n+1).padStart(2,"0")}</span><span className="timeline-date">{lang==="es"?i.label.replace("NOW","AHORA"):i.label}</span><div><strong>{itemText(i,"title")}</strong><h3>{role}</h3></div><p>{detail.join("\n")}{i.href&&<a href={i.href}>{t.live}</a>}</p></article>;})}</div><Gallery items={mediaList(s)} title={title}/>{link(s)}</Reveal>;
 if(s.kind==="contact")return <Reveal key={s.id} {...common} className="contact section-shell glass"><p className="kicker">{eyebrow}</p><h2>{title}</h2><p>{body}</p><div className="hero-actions">{link(s)}{s.items.map((i,n)=><a key={n} className="button ghost" href={i.href} target="_blank" rel="noreferrer">{itemText(i,"title")}{itemText(i,"body")&&<small>{itemText(i,"body")}</small>}<ExternalLink size={15}/></a>)}</div><Gallery items={mediaList(s)} title={title}/></Reveal>;
 return <Reveal key={s.id} {...common} className="custom-feature section-shell glass"><div className="custom-copy"><p className="section-index">{eyebrow}</p><h2>{title}</h2><p>{body}</p>{s.items.map((i,n)=><div key={n}><h3>{itemText(i,"title")}</h3><p>{itemText(i,"body")}</p>{i.href&&<a href={i.href}>{t.live}</a>}</div>)}{link(s)}</div><Gallery items={mediaList(s)} title={title}/></Reveal>;
 })}
 <footer><span>© {new Date().getFullYear()} Alejandro Urvieta González</span><span>{t.built}</span></footer>
 {selected&&<CaseModal project={selected} lang={lang} onClose={()=>setSelected(null)}/>}
 </main>;
}
