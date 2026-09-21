"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, GitFork, X } from "lucide-react";
import type { MediaItem, StoredProject } from "@/lib/content-types";
import { categoryLabels, normalizeCategory } from "@/lib/project-presentation";

type Lang="en"|"es";

function WorldGallery({items,title}:{items:MediaItem[];title:string}){
 const [active,setActive]=useState(0),item=items[active];
 if(!item)return <div className="world-media-empty"><span>{title}</span></div>;
 return <div className="world-gallery"><div className="world-media-stage"><div key={item.id} className="world-media-slide">{item.type.startsWith("video")?<video src={item.url} controls playsInline preload="metadata" poster={item.poster} aria-label={item.alt||title}/>:<img src={item.url} alt={item.alt||title}/>}</div><div className="world-media-veil"/></div>{items.length>1&&<div className="world-gallery-nav" role="group" aria-label="Gallery">{items.map((entry,index)=><button key={entry.id} onClick={()=>setActive(index)} aria-pressed={index===active} aria-label={`${entry.type.startsWith("video")?"Video":"Image"} ${index+1}`}><span>{String(index+1).padStart(2,"0")}</span><i/></button>)}</div>}</div>;
}

export default function WorldView({project,lang,color,onClose}:{project:StoredProject;lang:Lang;color:string;onClose:()=>void}){
 const ref=useRef<HTMLElement>(null),category=normalizeCategory(project),items=project.media.length?project.media:project.mediaUrl?[{id:"legacy",url:project.mediaUrl,type:project.mediaType,alt:project.mediaAlt}]:[],title=lang==="es"?project.titleEs:project.title,outcome=lang==="es"?project.outcomeEs:project.outcome,details=lang==="es"&&project.detailsEs.length?project.detailsEs:project.details;
 useEffect(()=>{const overflow=document.body.style.overflow,before=document.activeElement as HTMLElement|null;document.body.style.overflow="hidden";ref.current?.querySelector<HTMLButtonElement>("button")?.focus();const key=(event:KeyboardEvent)=>event.key==="Escape"&&onClose();document.addEventListener("keydown",key);return()=>{document.body.style.overflow=overflow;document.removeEventListener("keydown",key);before?.focus();};},[onClose]);
 return <div className="world-overlay" style={{"--world-color":color} as React.CSSProperties}><div className="portal-transition" aria-hidden="true"/><article ref={ref} className="world-view" role="dialog" aria-modal="true" aria-labelledby="world-title">
  <header><button className="world-back" onClick={onClose}><ArrowLeft/>{lang==="es"?"Volver al árbol":"Back to the tree"}</button><span>{categoryLabels[category][lang]}</span><button className="world-x" onClick={onClose} aria-label={lang==="es"?"Cerrar proyecto":"Close project"}><X/></button></header>
  <WorldGallery items={items} title={title}/>
  <section className="world-editorial"><h2 id="world-title">{title}</h2><div className="world-statement"><p>{outcome}</p></div><dl><div><dt>{lang==="es"?"Categoría":"Discipline"}</dt><dd>{categoryLabels[category][lang]}</dd></div><div><dt>{lang==="es"?"Tecnologías":"Technology"}</dt><dd>{project.stack.join(" · ")}</dd></div></dl></section>
  <section className="world-story"><p className="world-lead">{lang==="es"?project.descriptionEs:project.description}</p><div>{details.map((detail,index)=><p key={index}>{detail}</p>)}</div></section>
  {(project.href||project.repo)&&<footer className="world-actions">{project.href&&project.href!=="#"&&<a href={project.href} target="_blank" rel="noreferrer">{lang==="es"?"Visitar proyecto":"Visit project"}<ExternalLink/></a>}{project.repo&&project.repo!==project.href&&<a href={project.repo} target="_blank" rel="noreferrer">{lang==="es"?"Ver código":"View source"}<GitFork/></a>}</footer>}
 </article></div>;
}
