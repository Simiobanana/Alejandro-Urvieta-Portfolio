"use client";
import { useEffect, useRef } from "react";

/** Keep the viewport orbit, clipped to the actual bounds of the cosmic sections. */
export default function CelestialCycle(){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=ref.current,journey=el?.closest('.cosmic-journey');if(!el||!journey)return;
  let frame=0;
  const update=()=>{frame=0;const box=journey.getBoundingClientRect(),h=innerHeight;
   const top=Math.min(h,Math.max(0,box.top)),bottom=Math.min(h,Math.max(0,h-box.bottom));
   el.style.clipPath=`inset(${top}px 0 ${bottom}px 0)`;
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const resize=new ResizeObserver(schedule);resize.observe(journey);
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);update();
  return()=>{cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
 },[]);
 return <div ref={ref} className="celestial-cycle" aria-hidden="true"><i className="celestial-sun"/><i className="celestial-moon"/></div>;
}
