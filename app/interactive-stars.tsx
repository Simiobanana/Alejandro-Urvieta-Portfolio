"use client";
import { useEffect, useRef } from "react";

type Star={x:number;y:number;vx:number;vy:number;r:number;glow:number};
type Trail={x:number;y:number;life:number};

export default function InteractiveStars({active}:{active:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(!active||!canvas.current)return;const el=canvas.current,ctx=el.getContext("2d",{alpha:true});if(!ctx)return;
  let frame=0,width=0,height=0,pointer={x:-9999,y:-9999,inside:false},stars:Star[]=[],trail:Trail[]=[];
  const seed=()=>{const count=Math.min(220,Math.max(90,Math.round(width*height/7000)));stars=Array.from({length:count},()=>({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.14,vy:(Math.random()-.5)*.14,r:.45+Math.random()*1.25,glow:Math.random()}));};
  const resize=()=>{const box=el.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.5);width=box.width;height=box.height;el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);seed();};
  const move=(event:PointerEvent)=>{const box=el.getBoundingClientRect();pointer={x:event.clientX-box.left,y:event.clientY-box.top,inside:true};trail.push({x:pointer.x,y:pointer.y,life:1});if(trail.length>28)trail.shift();};
  const leave=()=>{pointer.inside=false;};
  const draw=()=>{ctx.clearRect(0,0,width,height);for(const point of trail){point.life-=.035;if(point.life<=0)continue;const glow=ctx.createRadialGradient(point.x,point.y,0,point.x,point.y,46);glow.addColorStop(0,`rgba(124,92,252,${point.life*.12})`);glow.addColorStop(1,"rgba(52,224,200,0)");ctx.fillStyle=glow;ctx.fillRect(point.x-46,point.y-46,92,92);}trail=trail.filter(point=>point.life>0);
   for(const star of stars){star.x+=star.vx;star.y+=star.vy;if(star.x<0)star.x=width;if(star.x>width)star.x=0;if(star.y<0)star.y=height;if(star.y>height)star.y=0;let intensity=.35+star.glow*.45;if(pointer.inside){const dx=star.x-pointer.x,dy=star.y-pointer.y,distance=Math.hypot(dx,dy);if(distance<105&&distance>0){const force=(105-distance)/105;star.x+=dx/distance*force*2.4;star.y+=dy/distance*force*2.4;intensity+=force*.9;}}ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fillStyle=`rgba(235,239,255,${Math.min(1,intensity)})`;ctx.shadowColor="#8e7cff";ctx.shadowBlur=intensity>1?12:3;ctx.fill();}ctx.shadowBlur=0;frame=requestAnimationFrame(draw);};
  const observer=new ResizeObserver(resize);observer.observe(el);el.addEventListener("pointermove",move,{passive:true});el.addEventListener("pointerleave",leave);resize();draw();return()=>{cancelAnimationFrame(frame);observer.disconnect();el.removeEventListener("pointermove",move);el.removeEventListener("pointerleave",leave);};
 },[active]);
 return <canvas ref={canvas} className="interactive-stars" aria-hidden="true"/>;
}
