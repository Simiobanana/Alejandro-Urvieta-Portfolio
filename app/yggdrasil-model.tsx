"use client";
import { useEffect, useRef } from "react";

type Props={realm:"dark"|"light";effects:boolean;onReady:()=>void;onError:()=>void};

/** Loads the actual Blender asset, once. Interaction does not recreate the GPU context. */
export default function YggdrasilModel({realm,effects,onReady,onError}:Props){
 const canvas=useRef<HTMLCanvasElement>(null);
 const current=useRef({realm,effects});
 useEffect(()=>{current.current={realm,effects};},[realm,effects]);
 useEffect(()=>{
  const element=canvas.current;if(!element)return;
  let disposed=false,started=false,visible=false,cleanup=()=>{};
  const boot=async()=>{
   if(started||disposed)return;started=true;
   try{
    const [THREE,{GLTFLoader},{DRACOLoader}]=await Promise.all([import("three"),import("three/examples/jsm/loaders/GLTFLoader.js"),import("three/examples/jsm/loaders/DRACOLoader.js")]);
    if(disposed)return;
    const renderer=new THREE.WebGLRenderer({canvas:element,alpha:true,antialias:true,powerPreference:"default"});
    const mobile=matchMedia("(max-width:700px)").matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;
    const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-10,10,7,-7,.1,100);
    camera.position.set(.4,11.2,24);camera.lookAt(0,4.5,0);
    const decoder=new DRACOLoader();decoder.setDecoderPath('/draco/');decoder.setWorkerLimit(1);
    const loader=new GLTFLoader();loader.setDRACOLoader(decoder);
    let frame=0,dirty=true;
    const resources:{model?:InstanceType<typeof THREE.Group>;resizeObserver?:ResizeObserver}={};
    const materials=new Set<InstanceType<typeof THREE.Material>>(),textures=new Set<InstanceType<typeof THREE.Texture>>();
    const contextLost=(event:Event)=>{event.preventDefault();onError();};
    element.addEventListener('webglcontextlost',contextLost);
    const disposeModel=()=>{resources.model?.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();for(const m of Array.isArray(obj.material)?obj.material:[obj.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);}}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());};
    cleanup=()=>{cancelAnimationFrame(frame);resources.resizeObserver?.disconnect();window.removeEventListener('pointermove',pointer);element.removeEventListener('webglcontextlost',contextLost);disposeModel();decoder.dispose();renderer.dispose();};
    const gltf=await loader.loadAsync(`/models/yggdrasil/yggdrasil-${mobile?'mobile':'web'}.glb`);
    const model=gltf.scene;resources.model=model;if(disposed){disposeModel();return;}
    scene.add(model);
    const hemisphere=new THREE.HemisphereLight(0xb9caff,0x131e18,2.1);scene.add(hemisphere);
    const key=new THREE.DirectionalLight(0xffd6a1,3.4);key.position.set(-5,13,8);scene.add(key);
    const rim=new THREE.DirectionalLight(0x44dbb3,2.3);rim.position.set(4,9,-5);scene.add(rim);
    const fill=new THREE.DirectionalLight(0x899eee,1.15);fill.position.set(-6,6,-3);scene.add(fill);
    let mouse=0,last=0,night=current.current.realm==='dark'?1:0;
    function pointer(event:PointerEvent){if(event.pointerType==='mouse')mouse=(event.clientX/innerWidth-.5)*.10;}
    window.addEventListener('pointermove',pointer,{passive:true});
    const resize=()=>{const box=element.getBoundingClientRect(),aspect=box.width/Math.max(1,box.height),height=Math.max(13.2,19.5/aspect);camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();renderer.setSize(box.width,box.height,false);dirty=true;};
    resources.resizeObserver=new ResizeObserver(resize);resources.resizeObserver.observe(element);resize();
    const anchorNodes=Array.from(element.closest('section')?.querySelectorAll<HTMLElement>('[data-model-anchor]')??[]).map(el=>({el,anchor:model?.getObjectByName(el.dataset.modelAnchor!)}));
    const point=new THREE.Vector3();
    const draw=(time:number)=>{
     frame=requestAnimationFrame(draw);
     if(!visible||document.hidden||time-last<1000/30)return;
     last=time;const target=current.current.realm==='dark'?1:0;
     if(!dirty&&!current.current.effects&&Math.abs(target-night)<.001&&Math.abs(model.rotation.y)<.001)return;
     dirty=false;night+=(target-night)*.075;
     if(model){const targetRotation=current.current.effects?mouse+Math.sin(time*.00012)*.018:0;model.rotation.y+=(targetRotation-model.rotation.y)*.08;model.updateMatrixWorld();}
     hemisphere.intensity=2.5-night*.6;key.intensity=3.8-night*.7;rim.intensity=1.0+night*1.35;
     for(const {el,anchor} of anchorNodes){if(!anchor)continue;anchor.getWorldPosition(point);point.project(camera);el.style.left=`${(point.x*.5+.5)*100}%`;el.style.top=`${(-point.y*.5+.5)*100}%`;}
     renderer.render(scene,camera);
    };
    renderer.render(scene,camera);onReady();frame=requestAnimationFrame(draw);
   }catch(error){cleanup();if(!disposed){console.warn('Yggdrasil uses its rendered fallback.',error);onError();}}
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)void boot();},{rootMargin:'180px'});observer.observe(element);
  return()=>{disposed=true;observer.disconnect();cleanup();};
 },[onReady,onError]);
 return <canvas ref={canvas} className="ygg-webgl" aria-hidden="true"/>;
}
