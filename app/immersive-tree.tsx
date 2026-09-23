"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { StoredProject } from "@/lib/content-types";
import type { Settings } from "@/lib/site-settings";
import { categoryColor, categoryLabels, hotspotPosition, normalizeCategory } from "@/lib/project-presentation";

import YggdrasilModel from "./yggdrasil-model";
import YggdrasilArt from "./yggdrasil-art";
import treeLayout from "@/lib/yggdrasil-layout.json";

type Lang="en"|"es"; type Realm="dark"|"light";
type Renderer="art"|"webgl"|"svg";
const artAnchors=[[.48,.265],[.255,.315],[.78,.365],[.355,.395],[.657,.407],[.37,.23],[.70,.275],[.52,.37],[.30,.48],[.73,.48],[.44,.55],[.58,.55]];

function canUseWebGL(){try{const gl=document.createElement("canvas").getContext("webgl2");if(!gl)return false;gl.getExtension("WEBGL_lose_context")?.loseContext();return true;}catch{return false;}}

export default function ImmersiveTree({projects,settings,lang,realm,effects,onOpen}:{projects:StoredProject[];settings:Settings;lang:Lang;realm:Realm;effects:boolean;onOpen:(p:StoredProject)=>void}){
 const [renderer,setRenderer]=useState<Renderer>("art"),[hovered,setHovered]=useState<StoredProject|null>(null),[ready,setReady]=useState(false);
 const section=useRef<HTMLElement>(null);
 const [markers,setMarkers]=useState<"runes"|"orbs">("runes");
 const [unavailable,setUnavailable]=useState(false);
 const chooseRenderer=(value:Renderer)=>{if(renderer===value)return;setHovered(null);setReady(false);setUnavailable(false);if(value==="webgl"&&!canUseWebGL()){setUnavailable(true);setRenderer("svg");return;}setRenderer(value);};
 const modelReady=useCallback(()=>setReady(true),[]);
 const modelError=useCallback(()=>{setRenderer("svg");setReady(false);setUnavailable(true);},[]);
 const ordered=useMemo(()=>[...projects].sort((a,b)=>Number(b.featured)-Number(a.featured)||a.sortOrder-b.sortOrder),[projects]);
 useEffect(()=>{
  const el=section.current;if(!el||(renderer==="webgl"&&ready))return;
  const place=()=>{
   const frame=renderer==="art"?el.querySelector<HTMLElement>('.art-frame')||el:el;
   const {width,height}=frame.getBoundingClientRect(),aspect=renderer==="art"?1.5:treeLayout.aspect;
   const cover=renderer==="art"&&matchMedia('(max-width:700px)').matches;
   const w=cover?Math.max(width,height*aspect):Math.min(width,height*aspect),h=w/aspect;
   for(const node of el.querySelectorAll<HTMLElement>('[data-model-anchor]')){
    const slot=Number(node.dataset.artSlot)||0;
    const anchor=renderer==="art"?{x:artAnchors[slot%12][0],y:artAnchors[slot%12][1]}:treeLayout.anchors.find(a=>a.name===node.dataset.modelAnchor);
    if(anchor){const x=(width-w)/2+anchor.x*w;node.style.left=`${cover?Math.max(22,Math.min(width-22,x)):x}px`;node.style.top=`${(height-h)/2+anchor.y*h}px`;}
   }
  };
  const observer=new ResizeObserver(place);observer.observe(el);place();return()=>observer.disconnect();
 },[renderer,ready,ordered]);
 const preview=hovered&&(effects
  ? hovered.previewUrl||hovered.media.find(m=>m.type.startsWith("video"))?.url||hovered.media[0]?.url||hovered.mediaUrl
  : hovered.media.find(m=>!m.type.startsWith("video"))?.url||hovered.media.find(m=>m.type.startsWith("video"))?.poster||hovered.mediaUrl);
 const previewVideo=Boolean(effects&&hovered&&(hovered.previewUrl?.match(/\.(mp4|webm)(\?|$)/i)||hovered.media.find(m=>m.url===preview)?.type.startsWith("video")));
 return <section ref={section} className="ygg-scene" id="work" data-realm={realm} data-renderer={renderer} data-markers={markers}>
  <div className="world-preview" data-visible={!!preview}>{preview&&(previewVideo?<video key={preview} src={preview} autoPlay muted loop playsInline poster={hovered?.media[0]?.poster}/>:<img src={preview} alt=""/>)}</div><div className="world-preview-shade"/>
  <div className="island-mist" aria-hidden="true"><i/><i/></div>
  {renderer==="art"?<YggdrasilArt effects={effects} lang={lang}/>:<img className="ygg-poster" data-hidden={renderer==="webgl"&&ready} src="/models/yggdrasil/yggdrasil-poster.webp" alt={lang==="es"?"Yggdrasil: árbol ancestral de raíces entrelazadas y copa luminosa":"Yggdrasil: ancient braided roots and luminous canopy"}/>}{renderer==="webgl"&&<YggdrasilModel realm={realm} effects={effects} onReady={modelReady} onError={modelError}/>}<div className="tree-ground" aria-hidden="true"/>
  <div className="scene-copy"><p>{lang==="es"?"Ocho mundos, un mismo oficio":"Eight worlds, one connected craft"}</p><h2>{lang==="es"?"Explora las ramas":"Explore the branches"}</h2><span>{lang==="es"?"Pasa sobre una luz y entra en su mundo":"Hover a light, then enter its world"}</span></div>
  <div className="hotspot-layer" data-ready="true">{ordered.map((project,index)=>{const pos=hotspotPosition(project,index),color=categoryColor(project,settings),category=normalizeCategory(project);return <button key={project.id} data-art-slot={index} data-model-anchor={project.hotspotX===null&&project.hotspotY===null?`ProjectAnchor_${String(([4,1,8,2,6,3,7,5,9,10,11,12][index%12])).padStart(2,"0")}`:undefined} className={"world-hotspot "+(project.featured?"is-featured":"")} style={{"--hotspot":color,left:`${pos.x}%`,top:`${pos.y}%`} as React.CSSProperties} onPointerEnter={event=>{if(event.pointerType==="mouse")setHovered(project)}} onPointerLeave={()=>setHovered(null)} onFocus={event=>{if(event.currentTarget.matches(":focus-visible"))setHovered(project)}} onBlur={()=>setHovered(null)} onClick={()=>onOpen(project)} aria-label={`${lang==="es"?"Abrir":"Open"} ${lang==="es"?project.titleEs:project.title}`}><span className="hotspot-core">{markers==="runes"?<span className="rune-index">{String(index+1).padStart(2,"0")}</span>:<Sparkles aria-hidden="true"/>}</span><span className="hotspot-label" data-placement={index===5||index===7?"above":"below"}><strong>{lang==="es"?project.titleEs:project.title}</strong><small>{categoryLabels[category][lang]}</small></span></button>})}</div>
  <div className="mobile-world-list">{ordered.map(project=><button key={project.id} onClick={()=>onOpen(project)} style={{"--hotspot":categoryColor(project,settings)} as React.CSSProperties}><i aria-hidden="true"/>{lang==="es"?project.titleEs:project.title}</button>)}</div>
  <div className="tree-view-tools" aria-label={lang==="es"?"Opciones del árbol":"Tree options"}>
   <button onClick={()=>setMarkers(markers==="runes"?"orbs":"runes")} title={lang==="es"?"Cambiar marcadores de proyectos":"Change project markers"}>{markers==="runes"?"◇":"○"} {markers==="runes"?(lang==="es"?"Runas":"Runes"):(lang==="es"?"Orbes":"Orbs")}</button>
   <span aria-hidden="true">·</span><button aria-pressed={renderer==="art"} onClick={()=>chooseRenderer("art")}>{lang==="es"?"Arte 2D":"2D Art"}</button><button aria-pressed={renderer==="svg"} onClick={()=>chooseRenderer("svg")}>{lang==="es"?"Ligera":"Light"}</button><button aria-pressed={renderer==="webgl"} onClick={()=>chooseRenderer("webgl")}>3D</button>
   <small className="renderer-note" role="status">{unavailable?(lang==="es"?"WebGL no disponible":"WebGL unavailable"):renderer==="webgl"&&!ready?(lang==="es"?"Cargando…":"Loading…"):""}</small>
  </div>
 </section>;
}
