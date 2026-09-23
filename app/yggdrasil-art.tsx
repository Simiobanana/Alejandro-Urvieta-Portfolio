"use client";
import { useEffect, useRef } from "react";

export default function YggdrasilArt({effects,lang}:{effects:boolean;lang:"en"|"es"}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=ref.current,section=el?.closest('section');if(!el||!section)return;
  let frame=0,x=0,y=0,targetX=0,targetY=0;
  const draw=()=>{x+=(targetX-x)*.09;y+=(targetY-y)*.09;section.style.setProperty('--art-x',`${x.toFixed(2)}px`);section.style.setProperty('--art-y',`${y.toFixed(2)}px`);if(Math.abs(x-targetX)+Math.abs(y-targetY)>.03)frame=requestAnimationFrame(draw);else frame=0;};
  const move=(e:PointerEvent)=>{if(!effects||e.pointerType!=='mouse')return;const box=el.getBoundingClientRect();targetX=(e.clientX-box.left-box.width/2)*.009;targetY=(e.clientY-box.top-box.height/2)*.006;if(!frame)frame=requestAnimationFrame(draw);};
  const leave=()=>{targetX=targetY=0;if(!frame)frame=requestAnimationFrame(draw);};
  section.addEventListener('pointermove',move,{passive:true});section.addEventListener('pointerleave',leave);
  return()=>{cancelAnimationFrame(frame);section.removeEventListener('pointermove',move);section.removeEventListener('pointerleave',leave);section.style.removeProperty('--art-x');section.style.removeProperty('--art-y');};
 },[effects]);
 return <div ref={ref} className="art-frame"><picture className="art-painting"><source media="(max-width:700px)" srcSet="/art/yggdrasil/yggdrasil-celtic-mobile.webp"/><img src="/art/yggdrasil/yggdrasil-celtic.webp" width="1536" height="1024" loading="lazy" decoding="async" alt={lang==="es"?"Yggdrasil ancestral: raíces sobre piedra, corteza entrelazada y un halo celta tallado bajo luz dorada":"Ancient Yggdrasil: roots resting on stone, braided bark and a carved Celtic halo in golden light"}/></picture><div className="art-atmosphere" aria-hidden="true"><i/><i/><i/></div></div>;
}
