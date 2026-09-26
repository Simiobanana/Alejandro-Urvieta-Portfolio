"use client";
import { useEffect, useRef } from "react";
type Star={x:number;y:number;vx:number;vy:number;r:number;phase:number};
type Trail={x:number;y:number;life:number};
/** One continuous sky; mouse observation never captures touch or clicks. */
export default function InteractiveStars({active}:{active:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),isActive=useRef(active),syncActivity=useRef<()=>void>(()=>{});
 useEffect(()=>{isActive.current=active;syncActivity.current();},[active]);
 useEffect(()=>{
  const el=canvas.current,ctx=el?.getContext("2d",{alpha:true});if(!el||!ctx)return;
  const interval=1000/60,glowSize=130,glowCanvas=document.createElement("canvas");
  glowCanvas.width=glowSize;glowCanvas.height=glowSize;
  const glowContext=glowCanvas.getContext("2d");
  if(glowContext){const glow=glowContext.createRadialGradient(65,65,0,65,65,65);glow.addColorStop(0,"rgba(132,116,255,.15)");glow.addColorStop(1,"rgba(52,224,200,0)");glowContext.fillStyle=glow;glowContext.fillRect(0,0,glowSize,glowSize);}
  let frame=0,resizeFrame=0,width=0,height=0,lastTick=0,lastPaint=0,accumulated=interval,visible=false;
  let pointer={x:-9999,y:-9999,inside:false},stars:Star[]=[],trail:Trail[]=[];
  const paint=(time:number,step:number)=>{
   ctx.clearRect(0,0,width,height);
   for(const p of trail){p.life-=.035*step;if(p.life<=0)continue;ctx.globalAlpha=p.life;ctx.drawImage(glowCanvas,p.x-65,p.y-65);}
   ctx.globalAlpha=1;trail=trail.filter(p=>p.life>0);
   for(const star of stars){
    star.x=(star.x+star.vx*step+width)%width;star.y=(star.y+star.vy*step+height)%height;
    let intensity=.42+.2*Math.sin(time*.0005+star.phase);
    if(isActive.current&&pointer.inside){const dx=star.x-pointer.x,dy=star.y-pointer.y,d=Math.hypot(dx,dy);if(d<115&&d>0){const f=(115-d)/115;star.x+=dx/d*f*3*step;star.y+=dy/d*f*3*step;intensity+=f*.8;}}
    ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fillStyle=`rgba(225,236,255,${Math.min(1,intensity)})`;ctx.fill();
   }
  };
  const canAnimate=()=>isActive.current&&visible&&!document.hidden&&width>0&&height>0;
  const stop=()=>{cancelAnimationFrame(frame);frame=0;lastTick=0;lastPaint=0;accumulated=interval;};
  const draw=(time:number)=>{
   frame=0;if(!canAnimate()){stop();return;}
   accumulated+=lastTick?time-lastTick:0;lastTick=time;
   // Keep cadence remainder, but derive motion from elapsed paint time rather than frame count.
   if(accumulated+.5>=interval){
    const step=lastPaint?Math.min(2,(time-lastPaint)/33.33):0;lastPaint=time;
    accumulated=Math.max(0,accumulated-interval*Math.max(1,Math.floor((accumulated+.5)/interval)));
    paint(time,step);
   }
   frame=requestAnimationFrame(draw);
  };
  const sync=()=>{if(canAnimate()){if(!frame)frame=requestAnimationFrame(draw);}else{stop();pointer.inside=false;trail=[];paint(performance.now(),0);}};
  syncActivity.current=sync;
  const resize=()=>{
   const box=el.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.25),oldWidth=width,oldHeight=height;
   if(width===box.width&&height===box.height&&el.width===Math.round(box.width*dpr)&&el.height===Math.round(box.height*dpr))return;
   width=box.width;height=box.height;if(!width||!height){sync();return;}
   el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
   const count=Math.min(320,Math.max(100,Math.round(width*height/6500)));
   stars=Array.from({length:count},(_,index)=>{const star=stars[index];return star&&oldWidth&&oldHeight?{...star,x:star.x/oldWidth*width,y:star.y/oldHeight*height}:{x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.33,vy:(Math.random()-.5)*.33,r:.4+Math.random()*1.1,phase:Math.random()*Math.PI*2};});
   trail=[];paint(performance.now(),0);sync();
  };
  const move=(event:PointerEvent)=>{if(event.pointerType!=="mouse"||!canAnimate())return;const box=el.getBoundingClientRect();pointer={x:event.clientX-box.left,y:event.clientY-box.top,inside:event.clientX>=box.left&&event.clientX<=box.right&&event.clientY>=box.top&&event.clientY<=box.bottom};if(pointer.inside){trail.push({x:pointer.x,y:pointer.y,life:1});if(trail.length>20)trail.shift();}};
  const leave=()=>{pointer.inside=false;};
  // ResizeObserver is read-only; update the canvas backing store on the next frame.
  const ro=new ResizeObserver(()=>{if(!resizeFrame)resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;resize();});});ro.observe(el);const io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;sync();});io.observe(el);
  window.addEventListener("pointermove",move,{passive:true});window.addEventListener("blur",leave);window.addEventListener("scroll",leave,{passive:true});document.addEventListener("visibilitychange",sync);resize();
  return()=>{stop();cancelAnimationFrame(resizeFrame);syncActivity.current=()=>{};ro.disconnect();io.disconnect();window.removeEventListener("pointermove",move);window.removeEventListener("blur",leave);window.removeEventListener("scroll",leave);document.removeEventListener("visibilitychange",sync);};
 },[]);
 return <canvas ref={canvas} className="interactive-stars" aria-hidden="true"/>;
}
