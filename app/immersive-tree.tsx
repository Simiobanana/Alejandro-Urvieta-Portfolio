"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import type { StoredProject } from "@/lib/content-types";
import type { Settings } from "@/lib/site-settings";
import { categoryColor, categoryLabels, hotspotPosition, normalizeCategory } from "@/lib/project-presentation";

import YggdrasilModel from "./yggdrasil-model";

type Lang="en"|"es"; type Realm="dark"|"light";
type Renderer="checking"|"webgl"|"svg";

function canUseWebGL(){try{const canvas=document.createElement("canvas");return !!(canvas.getContext("webgl2")||canvas.getContext("webgl"));}catch{return false;}}

export default function ImmersiveTree({projects,settings,lang,realm,effects,onOpen}:{projects:StoredProject[];settings:Settings;lang:Lang;realm:Realm;effects:boolean;onOpen:(p:StoredProject)=>void}){
 const [renderer,setRenderer]=useState<Renderer>("checking"),[hovered,setHovered]=useState<StoredProject|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>{queueMicrotask(()=>{const nav=navigator as Navigator&{connection?:{saveData?:boolean}};const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;setRenderer(reduced||nav.connection?.saveData||!canUseWebGL()?"svg":"webgl");});},[]);
 const modelReady=useCallback(()=>setReady(true),[]);
 const modelError=useCallback(()=>{setRenderer("svg");setReady(false);},[]);
 const ordered=useMemo(()=>[...projects].sort((a,b)=>Number(b.featured)-Number(a.featured)||a.sortOrder-b.sortOrder),[projects]);
 const preview=hovered&&(effects
  ? hovered.previewUrl||hovered.media.find(m=>m.type.startsWith("video"))?.url||hovered.media[0]?.url||hovered.mediaUrl
  : hovered.media.find(m=>!m.type.startsWith("video"))?.url||hovered.media.find(m=>m.type.startsWith("video"))?.poster||hovered.mediaUrl);
 const previewVideo=Boolean(effects&&hovered&&(hovered.previewUrl?.match(/\.(mp4|webm)(\?|$)/i)||hovered.media.find(m=>m.url===preview)?.type.startsWith("video")));
 return <section className="ygg-scene" id="work" data-realm={realm} data-renderer={renderer}>
  <div className="world-preview" data-visible={!!preview}>{preview&&(previewVideo?<video key={preview} src={preview} autoPlay muted loop playsInline poster={hovered?.media[0]?.poster}/>:<img src={preview} alt=""/>)}</div><div className="world-preview-shade"/>
  <div className="cosmic-field" aria-hidden="true"><i/><i/><i/></div>
  <img className="ygg-poster" data-hidden={renderer==="webgl"&&ready} src="/models/yggdrasil/yggdrasil-poster.webp" alt={lang==="es"?"Yggdrasil: árbol ancestral de raíces entrelazadas y copa luminosa":"Yggdrasil: ancient braided roots and luminous canopy"}/>{renderer==="webgl"&&<YggdrasilModel realm={realm} effects={effects} onReady={modelReady} onError={modelError}/>}<div className="tree-ground" aria-hidden="true"/>
  <div className="scene-copy"><p>{lang==="es"?"Ocho mundos, un mismo oficio":"Eight worlds, one connected craft"}</p><h2>{lang==="es"?"Explora las ramas":"Explore the branches"}</h2><span>{lang==="es"?"Pasa sobre una luz y entra en su mundo":"Hover a light, then enter its world"}</span></div>
  <div className="hotspot-layer" data-ready="true">{ordered.map((project,index)=>{const pos=hotspotPosition(project,index),color=categoryColor(project,settings),category=normalizeCategory(project);return <button key={project.id} data-model-anchor={project.hotspotX===null&&project.hotspotY===null?`ProjectAnchor_${String(([9,1,6,2,5,7,8,12,3,4,10,11][index%12])).padStart(2,"0")}`:undefined} className={"world-hotspot "+(project.featured?"is-featured":"")} style={{"--hotspot":color,left:`${pos.x}%`,top:`${pos.y}%`} as React.CSSProperties} onPointerEnter={event=>{if(event.pointerType==="mouse")setHovered(project)}} onPointerLeave={()=>setHovered(null)} onFocus={event=>{if(event.currentTarget.matches(":focus-visible"))setHovered(project)}} onBlur={()=>setHovered(null)} onClick={()=>onOpen(project)} aria-label={`${lang==="es"?"Abrir":"Open"} ${lang==="es"?project.titleEs:project.title}`}><span className="hotspot-core"><Sparkles aria-hidden="true"/></span><span className="hotspot-label"><strong>{lang==="es"?project.titleEs:project.title}</strong><small>{categoryLabels[category][lang]}</small></span></button>})}</div>
  <div className="mobile-world-list">{ordered.map(project=><button key={project.id} onClick={()=>onOpen(project)} style={{"--hotspot":categoryColor(project,settings)} as React.CSSProperties}><i aria-hidden="true"/>{lang==="es"?project.titleEs:project.title}</button>)}</div>
  <small className="renderer-note">{renderer==="webgl"&&ready?"3D":lang==="es"?"Vista ligera":"Light view"}</small>
 </section>;
}
