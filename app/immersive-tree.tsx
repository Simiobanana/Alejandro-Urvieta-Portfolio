"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { StoredProject } from "@/lib/content-types";
import type { Settings } from "@/lib/site-settings";
import { categoryColor, categoryLabels, hotspotPosition, normalizeCategory } from "@/lib/project-presentation";

type Lang="en"|"es"; type Realm="dark"|"light";
type Renderer="checking"|"webgl"|"svg";

function canUseWebGL(){try{const canvas=document.createElement("canvas");return !!(canvas.getContext("webgl2")||canvas.getContext("webgl"));}catch{return false;}}

function WebGLTree({realm,effects,onReady}:{realm:Realm;effects:boolean;onReady:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{let disposed=false,stop=()=>{};(async()=>{
  const THREE=await import("three");if(disposed||!canvas.current)return;
  const renderer=new THREE.WebGLRenderer({canvas:canvas.current,alpha:true,antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,1.7,10.5);
  const group=new THREE.Group();group.position.y=-1.45;scene.add(group);
  const wood=new THREE.MeshStandardMaterial({color:realm==="dark"?0x251b31:0x765033,roughness:.87,metalness:.02,emissive:realm==="dark"?0x130d22:0x241207,emissiveIntensity:.32});
  const glow=new THREE.MeshBasicMaterial({color:realm==="dark"?0x34e0c8:0xffb454,transparent:true,opacity:.35,blending:THREE.AdditiveBlending});
  const tube=(points:InstanceType<typeof THREE.Vector3>[],radius:number,material=wood)=>{const curve=new THREE.CatmullRomCurve3(points);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*8),radius,7,false),material);group.add(mesh);return mesh;};
  tube([new THREE.Vector3(0,-2,0),new THREE.Vector3(-.2,-.2,0),new THREE.Vector3(.1,1.8,0),new THREE.Vector3(0,3.45,0)],.72);
  for(let i=0;i<11;i++){const side=i%2?1:-1,level=1.1+(i%6)*.39,reach=1.7+(i%3)*.55,depth=((i%4)-1.5)*.16;tube([new THREE.Vector3(side*.05,level,0),new THREE.Vector3(side*.75,level+.55,depth),new THREE.Vector3(side*reach,level+.86+(i%2)*.25,depth-.08),new THREE.Vector3(side*(reach+1.05),level+.62+(i%3)*.16,depth)],.18-(i%3)*.025);}
  for(let i=0;i<7;i++){const a=(i/6-.5)*Math.PI*.92;tube([new THREE.Vector3(0,-1.75,.08),new THREE.Vector3(Math.sin(a)*.8,-2.05,0),new THREE.Vector3(Math.sin(a)*2.4,-2.35,Math.cos(a)*.2)],.16);}
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=1.45+(i%4)*.42;const orb=new THREE.Mesh(new THREE.SphereGeometry(.045+(i%3)*.012,8,8),glow);orb.position.set(Math.cos(a)*r,2.55+Math.sin(a*2)*.72,(i%5)*.04);group.add(orb);}
  scene.add(new THREE.HemisphereLight(realm==="dark"?0x8e74ff:0xffefd2,realm==="dark"?0x07101a:0x6d5237,2.1));const key=new THREE.PointLight(realm==="dark"?0x7c5cfc:0xffb454,28,18);key.position.set(-2,4,4);scene.add(key);
  const stars=new THREE.BufferGeometry(),coords=[] as number[];for(let i=0;i<420;i++)coords.push((Math.random()-.5)*24,(Math.random()-.35)*14,-2-Math.random()*8);stars.setAttribute("position",new THREE.Float32BufferAttribute(coords,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:realm==="dark"?0xc8c3ff:0xffe1a8,size:.025,transparent:true,opacity:realm==="dark"?.65:.22})));
  let frame=0,mouseX=0,mouseY=0;const pointer=(event:PointerEvent)=>{mouseX=(event.clientX/innerWidth-.5)*.38;mouseY=(event.clientY/innerHeight-.5)*.2;};window.addEventListener("pointermove",pointer,{passive:true});
  const resize=()=>{if(!canvas.current)return;const box=canvas.current.getBoundingClientRect();renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(canvas.current);resize();
  const render=()=>{camera.position.x+=(mouseX-camera.position.x)*.025;camera.position.y+=(1.7-mouseY-camera.position.y)*.025;group.rotation.y=Math.sin(performance.now()*.00012)*.045;renderer.render(scene,camera);if(effects)frame=requestAnimationFrame(render);};render();onReady();
  stop=()=>{cancelAnimationFrame(frame);window.removeEventListener("pointermove",pointer);ro.disconnect();group.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();}});wood.dispose();glow.dispose();stars.dispose();renderer.dispose();};
 })();return()=>{disposed=true;stop();};},[realm,effects,onReady]);
 return <canvas className="ygg-webgl" ref={canvas} aria-hidden="true"/>;
}

function SvgTree({realm}:{realm:Realm}){return <svg className="ygg-svg" viewBox="0 0 1000 760" role="img" aria-label="Yggdrasil, a cosmic tree connecting portfolio projects"><defs><filter id="treeGlow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="trunk" x1="0" y1="1" x2="0" y2="0"><stop stopColor={realm==="dark"?"#33243c":"#6d452d"}/><stop offset=".55" stopColor={realm==="dark"?"#1c2534":"#98704b"}/><stop offset="1" stopColor={realm==="dark"?"#24473f":"#5e7650"}/></linearGradient></defs><g className="tree-shadow" fill="none" stroke="url(#trunk)" strokeLinecap="round" strokeLinejoin="round"><path strokeWidth="94" d="M500 700C465 600 480 515 505 435C536 336 485 258 505 120"/><path strokeWidth="34" d="M505 410C390 380 310 315 190 236M498 360C610 340 696 260 830 220M502 315C420 270 389 215 300 170M510 284C605 250 644 170 735 125M495 480C393 454 310 435 190 402M520 455C640 430 717 382 860 360"/><path strokeWidth="22" d="M494 170C450 137 410 103 346 78M507 165C560 120 606 85 667 60M500 701C415 720 330 730 225 728M510 700C600 724 690 728 800 720"/></g><g className="tree-energy" fill="none" stroke={realm==="dark"?"#34e0c8":"#ffb454"} strokeWidth="3" filter="url(#treeGlow)" opacity=".8"><path d="M500 690C486 580 520 500 506 415C494 335 516 250 505 122"/><path d="M505 408C397 371 315 307 198 238M503 359C612 329 695 258 824 221M505 476C620 434 720 389 851 362"/></g></svg>}

export default function ImmersiveTree({projects,settings,lang,realm,effects,onOpen}:{projects:StoredProject[];settings:Settings;lang:Lang;realm:Realm;effects:boolean;onOpen:(p:StoredProject)=>void}){
 const [renderer,setRenderer]=useState<Renderer>("checking"),[hovered,setHovered]=useState<StoredProject|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>{let cancelled=false;(async()=>{const nav=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}};const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;if(reduced||nav.connection?.saveData||!canUseWebGL()||(nav.hardwareConcurrency||8)<6||(nav.deviceMemory||8)<4){setRenderer("svg");return;}try{const {getGPUTier}=await import("detect-gpu");const tier=await getGPUTier();if(!cancelled)setRenderer(tier.tier>=2?"webgl":"svg");}catch{if(!cancelled)setRenderer("svg");}})();return()=>{cancelled=true;};},[]);
 const ordered=useMemo(()=>[...projects].sort((a,b)=>Number(b.featured)-Number(a.featured)||a.sortOrder-b.sortOrder),[projects]);
 const preview=hovered&&(effects
  ? hovered.previewUrl||hovered.media.find(m=>m.type.startsWith("video"))?.url||hovered.media[0]?.url||hovered.mediaUrl
  : hovered.media.find(m=>!m.type.startsWith("video"))?.url||hovered.media.find(m=>m.type.startsWith("video"))?.poster||hovered.mediaUrl);
 const previewVideo=Boolean(effects&&hovered&&(hovered.previewUrl?.match(/\.(mp4|webm)(\?|$)/i)||hovered.media.find(m=>m.url===preview)?.type.startsWith("video")));
 return <section className="ygg-scene" id="work" data-realm={realm} data-renderer={renderer}>
  <div className="world-preview" data-visible={!!preview}>{preview&&(previewVideo?<video key={preview} src={preview} autoPlay muted loop playsInline poster={hovered?.media[0]?.poster}/>:<img src={preview} alt=""/>)}</div><div className="world-preview-shade"/>
  <div className="cosmic-field" aria-hidden="true"><i/><i/><i/></div>
  {renderer==="webgl"?<WebGLTree realm={realm} effects={effects} onReady={()=>setReady(true)}/>:<SvgTree realm={realm}/>}<div className="tree-ground" aria-hidden="true"/>
  <div className="scene-copy"><p>{lang==="es"?"Ocho mundos, un mismo oficio":"Eight worlds, one connected craft"}</p><h2>{lang==="es"?"Explora las ramas":"Explore the branches"}</h2><span>{lang==="es"?"Pasa sobre una luz y entra en su mundo":"Hover a light, then enter its world"}</span></div>
  <div className="hotspot-layer" data-ready={renderer!=="webgl"||ready}>{ordered.map((project,index)=>{const pos=hotspotPosition(project,index),color=categoryColor(project,settings),category=normalizeCategory(project);return <button key={project.id} className={"world-hotspot "+(project.featured?"is-featured":"")} style={{"--hotspot":color,left:`${pos.x}%`,top:`${pos.y}%`} as React.CSSProperties} onPointerEnter={()=>setHovered(project)} onPointerLeave={()=>setHovered(null)} onFocus={()=>setHovered(project)} onBlur={()=>setHovered(null)} onClick={()=>onOpen(project)} aria-label={`${lang==="es"?"Abrir":"Open"} ${lang==="es"?project.titleEs:project.title}`}><span className="hotspot-core"><Sparkles aria-hidden="true"/></span><span className="hotspot-label"><strong>{lang==="es"?project.titleEs:project.title}</strong><small>{categoryLabels[category][lang]}</small></span></button>})}</div>
  <small className="renderer-note">{renderer==="webgl"?"3D":"CSS / SVG"}</small>
 </section>;
}
