"use client";
import { useEffect, useRef } from "react";
type Star={x:number;y:number;vx:number;vy:number;r:number;phase:number};
type Trail={x:number;y:number;life:number};
/** One continuous sky; mouse observation never captures touch or clicks. */
export default function InteractiveStars({active}:{active:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=canvas.current,ctx=el?.getContext("2d",{alpha:true});if(!el||!ctx)return;
  let frame=0,width=0,height=0,last=0,visible=true;
  let pointer={x:-9999,y:-9999,inside:false},stars:Star[]=[],trail:Trail[]=[];
  const paint=(time:number,step:number)=>{
   ctx.clearRect(0,0,width,height);
   for(const p of trail){p.life-=.035*step;if(p.life<=0)continue;const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,65);glow.addColorStop(0,`rgba(132,116,255,${p.life*.15})`);glow.addColorStop(1,"rgba(52,224,200,0)");ctx.fillStyle=glow;ctx.fillRect(p.x-65,p.y-65,130,130);}trail=trail.filter(p=>p.life>0);
   for(const star of stars){
    star.x=(star.x+star.vx*step+width)%width;star.y=(star.y+star.vy*step+height)%height;
    let intensity=.42+.2*Math.sin(time*.0005+star.phase);
    if(active&&pointer.inside){const dx=star.x-pointer.x,dy=star.y-pointer.y,d=Math.hypot(dx,dy);if(d<115&&d>0){const f=(115-d)/115;star.x+=dx/d*f*3*step;star.y+=dy/d*f*3*step;intensity+=f*.8;}}
    ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fillStyle=`rgba(225,236,255,${Math.min(1,intensity)})`;ctx.fill();
   }
  };
  const resize=()=>{const box=el.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.25);width=box.width;height=box.height;if(!width||!height)return;el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);stars=Array.from({length:Math.min(320,Math.max(100,Math.round(width*height/6500)))},()=>({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.33,vy:(Math.random()-.5)*.33,r:.4+Math.random()*1.1,phase:Math.random()*Math.PI*2}));paint(0,0);};
  const move=(event:PointerEvent)=>{if(event.pointerType!=="mouse"||!active)return;const box=el.getBoundingClientRect();pointer={x:event.clientX-box.left,y:event.clientY-box.top,inside:event.clientY>=box.top&&event.clientY<=box.bottom};if(pointer.inside){trail.push({x:pointer.x,y:pointer.y,life:1});if(trail.length>20)trail.shift();}};
  const leave=()=>{pointer.inside=false;};
  const draw=(time:number)=>{frame=requestAnimationFrame(draw);if(!visible||document.hidden||time-last<1000/30)return;const step=Math.min(2,(time-last)/33.33);last=time;paint(time,step);};
  const ro=new ResizeObserver(resize);ro.observe(el);const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});io.observe(el);
  window.addEventListener("pointermove",move,{passive:true});window.addEventListener("blur",leave);window.addEventListener("scroll",leave,{passive:true});resize();if(active)frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);ro.disconnect();io.disconnect();window.removeEventListener("pointermove",move);window.removeEventListener("blur",leave);window.removeEventListener("scroll",leave);};
 },[active]);
 return <canvas ref={canvas} className="interactive-stars" aria-hidden="true"/>;
}
