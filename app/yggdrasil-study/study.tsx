"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect,useRef,useState } from 'react';
import Link from 'next/link';
import { ArrowLeft,ArrowUpRight,Moon,Sun,RotateCcw,Pause,Play,Code2,Sparkles,Compass } from 'lucide-react';
import type { StoredProject } from '@/lib/content-types';
import { normalizeCategory } from '@/lib/project-presentation';
import './study.css';

type Realm='programming'|'art'|'experiences';
type View='tree'|Realm;
const realms={
 programming:{number:'01',name:'El observatorio de las ideas',short:'Observatorio',discipline:'Programación y herramientas',description:'Observar, experimentar y construir. Sistemas, herramientas y desarrollo web que hacen posibles otras experiencias.',anchor:'Realm_Programming',fallback:[-4.65,4.05,.45],direction:[-3.3,2.65,7.7],icon:Code2},
 art:{number:'02',name:'El santuario de la materia',short:'Santuario',discipline:'Arte técnico y VFX',description:'La luz transforma la materia. Efectos visuales, materiales y entornos donde el arte encuentra su expresión en tiempo real.',anchor:'Realm_Art',fallback:[5.3,5.05,.25],direction:[3.3,2.8,7.7],icon:Sparkles},
 experiences:{number:'03',name:'El umbral de las historias',short:'Umbral',discipline:'Videojuegos y experiencias',description:'Cruzar el umbral y descubrir qué hay al otro lado. Mecánicas, interacción y mundos que cobran sentido al jugarlos.',anchor:'Realm_Experiences',fallback:[-.55,2.55,4.15],direction:[1.4,2.45,8.2],icon:Compass},
} as const;
const realmIds=Object.keys(realms) as Realm[];
function projectRealm(project:StoredProject):Realm{
 const category=normalizeCategory(project),title=`${project.title} ${project.titleEs}`.toLowerCase();
 if(category==='Pure Art'||/vfx|shader|material|escudo|shield|environment|entorno/.test(title))return 'art';
 if(category==='Engine + Art')return 'experiences';
 return 'programming';
}
function Scene({view,night,motion,pose,onStatus}:{view:View;night:boolean;motion:boolean;pose:number;onStatus:(s:string)=>void}){
 const ref=useRef<HTMLCanvasElement>(null),state=useRef({view,night,motion,pose});
 useEffect(()=>{state.current={view,night,motion,pose};},[view,night,motion,pose]);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  let disposed=false,cleanup=()=>{};
  const run=async()=>{
   try{
    const [T,{GLTFLoader},{DRACOLoader},{OrbitControls},{RoomEnvironment}]=await Promise.all([import('three'),import('three/examples/jsm/loaders/GLTFLoader.js'),import('three/examples/jsm/loaders/DRACOLoader.js'),import('three/examples/jsm/controls/OrbitControls.js'),import('three/examples/jsm/environments/RoomEnvironment.js')]);
    if(disposed)return;
    const mobile=matchMedia('(max-width:700px)').matches;
    const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'default'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.7));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,100);
    camera.position.set(10,12,26);const target=new T.Vector3(-.35,3.5,0);camera.lookAt(target);
    const controls=new OrbitControls(camera,canvas);controls.target.copy(target);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=false;controls.enableRotate=!matchMedia('(pointer:coarse)').matches;controls.enabled=!matchMedia('(pointer:coarse)').matches;canvas.style.touchAction='pan-y';controls.minPolarAngle=.45;controls.maxPolarAngle=1.6;
    const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.32;room.dispose();pmrem.dispose();
    const hemi=new T.HemisphereLight(0xb4c7e9,0x172522,1.45);scene.add(hemi);
    const key=new T.DirectionalLight(0xffd1a0,3.1);key.position.set(-5,14,10);key.castShadow=true;key.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(key.shadow.camera,{left:-12,right:12,top:13,bottom:-8,near:1,far:45});key.shadow.normalBias=.025;key.shadow.bias=-.00015;key.target.position.set(0,3,0);scene.add(key,key.target);
    const rim=new T.DirectionalLight(0x7ab5ff,2.4);rim.position.set(6,10,-7);scene.add(rim);
    const fill=new T.DirectionalLight(0x91a1ee,.6);fill.position.set(-10,7,-4);scene.add(fill);
    const lamp=new T.PointLight(0xffca7c,5,5,2);lamp.position.set(-4.65,4.5,1);scene.add(lamp);
    const decoder=new DRACOLoader();decoder.setDecoderPath('/draco/');decoder.setWorkerLimit(1);const loader=new GLTFLoader();loader.setDRACOLoader(decoder);
    const resources:{model?:import('three').Group}={};
    let frame=0,last=0,visible=true,dirty=true,flight=true,currentView:View='tree',currentPose=state.current.pose,blend=1,seconds=0;
    const materials=new Set<import('three').Material>(),textures=new Set<import('three').Texture>();
    const disposeModel=()=>{resources.model?.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const mat of Array.isArray(o.material)?o.material:[o.material]){materials.add(mat);for(const value of Object.values(mat))if(value instanceof T.Texture)textures.add(value);}}});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());};
    const destination=new T.Vector3(),aim=new T.Vector3(),waterClock={value:0};
    const desired=()=>{
     const selected=state.current.view;
     if(selected!=='tree'){
      const realm=realms[selected],anchor=resources.model?.getObjectByName(realm.anchor);
      if(anchor){anchor.getWorldPosition(aim);}else aim.fromArray(realm.fallback);
      // Include the root cradle beneath each realm, not just its upper landmark.
      aim.y-=.5;
      const distance=Math.max(5.4,6.2/camera.aspect)/(2*Math.tan(Math.PI*18/180));
      destination.fromArray(realm.direction).normalize().multiplyScalar(distance).add(aim);
     }else{
      const distance=Math.max(16.8,18.8/camera.aspect)/(2*Math.tan(Math.PI*18/180));
      const heart=resources.model?.getObjectByName('Tree_Heart');
      if(heart)heart.getWorldPosition(aim);else aim.set(1,3.7,0);
      aim.x=0;aim.z=.5;
      destination.set(5.5,7.5,28).normalize().multiplyScalar(distance).add(aim);
     }
    };
    const resize=()=>{const box=canvas.getBoundingClientRect();renderer.setSize(box.width,box.height,false);camera.aspect=box.width/Math.max(1,box.height);camera.updateProjectionMatrix();desired();flight=true;dirty=true;};
    const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
    const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;dirty=true;});io.observe(canvas);
    const change=()=>{dirty=true;};const start=()=>{flight=false;};controls.addEventListener('change',change);controls.addEventListener('start',start);
    const lost=(event:Event)=>{event.preventDefault();onStatus('fallback');};canvas.addEventListener('webglcontextlost',lost);
    cleanup=()=>{cancelAnimationFrame(frame);ro.disconnect();io.disconnect();controls.dispose();decoder.dispose();canvas.removeEventListener('webglcontextlost',lost);disposeModel();env.dispose();renderer.dispose();};
    const gltf=await loader.loadAsync('/models/yggdrasil-realms/yggdrasil-realms.glb');const model=gltf.scene;resources.model=model;if(disposed){disposeModel();return;}
    model.traverse(o=>{
     if(!(o instanceof T.Mesh))return;o.castShadow=true;o.receiveShadow=true;
     for(const mat of Array.isArray(o.material)?o.material:[o.material]){
      if(mat.name.startsWith('Jade foliage')){mat.onBeforeCompile=(s:import('three').WebGLProgramParametersWithUniforms)=>{s.uniforms.studyTime=waterClock;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float studyTime;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(position.y*.8+position.x*1.7+studyTime*.65)*.025;transformed.z += cos(position.x+studyTime*.5)*.018;');};}
      if(mat.name.startsWith('Waterfall')){o.castShadow=false;mat.depthWrite=false;mat.onBeforeCompile=(s:import('three').WebGLProgramParametersWithUniforms)=>{s.uniforms.studyTime=waterClock;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying float fallY;').replace('#include <begin_vertex>','#include <begin_vertex>\nfallY=position.y;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float studyTime;varying float fallY;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=.78+.22*sin(fallY*15.0+studyTime*4.0);');};}
     }
    });scene.add(model);desired();camera.position.copy(destination);controls.target.copy(aim);controls.update();renderer.render(scene,camera);onStatus('ready');
    const draw=(now:number)=>{
     frame=requestAnimationFrame(draw);if(!visible||document.hidden||now-last<1000/30)return;
     const dt=Math.min((now-last)*.001,.05);last=now;
     if(currentView!==state.current.view||currentPose!==state.current.pose){currentView=state.current.view;currentPose=state.current.pose;flight=true;dirty=true;desired();}
     const goal=state.current.night?1:0;if(Math.abs(goal-blend)>.001){blend+=(goal-blend)*(state.current.motion ? .07 : 1);dirty=true;}
     hemi.intensity=1.8-blend*.65;key.intensity=3.5-blend*.7;rim.intensity=1.1+blend*1.2;scene.environmentIntensity=.4-blend*.16;
     if(flight){const step=state.current.motion ? .07 : 1;camera.position.lerp(destination,step);controls.target.lerp(aim,step);controls.update();dirty=true;if(camera.position.distanceTo(destination)<.008&&controls.target.distanceTo(aim)<.008)flight=false;}
     if(state.current.motion){seconds+=dt;waterClock.value=seconds;lamp.intensity=5+Math.sin(seconds*.8)*.35;dirty=true;}
     if(dirty){renderer.render(scene,camera);dirty=false;}
    };frame=requestAnimationFrame(draw);
   }catch(error){cleanup();if(!disposed){console.warn('Study uses its Blender preview.',error);onStatus('fallback');}}
  };void run();return()=>{disposed=true;cleanup();};
 },[onStatus]);
 return <canvas className="study-canvas" ref={ref} aria-label="Yggdrasil 3D con tres reinos: observatorio, santuario y umbral. Usa los botones para explorar; en computadora también puedes girar con el ratón."/>;
}

export default function Study({projects}:{projects:StoredProject[]}){
 const [pose,setPose]=useState(0);
 const [view,setView]=useState<View>('tree'),[night,setNight]=useState(true),[motion,setMotion]=useState(false),[status,setStatus]=useState('loading');
 const selected=view==='tree'?null:realms[view],realmProjects=view==='tree'?[]:projects.filter(project=>projectRealm(project)===view);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion:reduce)');const sync=()=>setMotion(!media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 const selectRealm=(realm:View)=>{setView(realm);setPose(n=>n+1);};
 return <main className="realm-study" lang="es" data-night={night} data-motion={motion} data-world={view}>
  <header className="study-header"><Link href="/#work" prefetch={false}><ArrowLeft size={15}/> Portafolio</Link><span>AU <i/> LOS TRES REINOS</span><button aria-label={night?'Cambiar a día':'Cambiar a noche'} onClick={()=>setNight(!night)}>{night?<Sun size={17}/>:<Moon size={17}/>}</button></header>
  <div className="study-layout">
   <section className="study-editorial"><p className="study-eyebrow">YGGDRASIL / TRES REINOS, UNA RAÍZ</p><h1>Un árbol.<br/>Distintos <em>mundos.</em></h1><p className="study-lead">Las ideas nacen de una misma raíz. Cada rama las transforma en una experiencia distinta.</p>
    <nav className="realm-navigation" aria-label="Explorar los tres reinos">{realmIds.map(id=>{const realm=realms[id],Icon=realm.icon;return <button key={id} aria-pressed={view===id} aria-controls="realm-detail" onClick={()=>selectRealm(id)}><span>{realm.number}</span><Icon size={17}/><span><strong>{realm.short}</strong><small>{realm.discipline}</small></span><ArrowUpRight size={14}/></button>;})}</nav>
    <div className="realm-description" id="realm-detail" aria-live="polite"><span>{selected?`REINO ${selected.number}`:'EL ÁRBOL DE LOS MUNDOS'}</span><h2>{selected?selected.name:'Tres formas de crear'}</h2><p>{selected?selected.description:'Sigue una rama hacia el observatorio, el santuario o el umbral. Cada lugar reúne una faceta de mi trabajo y sus proyectos.'}</p>{selected&&<button className="realm-enter" onClick={()=>selectRealm('tree')}><ArrowLeft size={14}/> Volver al árbol</button>}</div>
    {selected&&realmProjects.length>0&&<div className="realm-projects"><h3>Proyectos de este reino <span>{String(realmProjects.length).padStart(2,'0')}</span></h3>{realmProjects.map(project=><Link key={project.id} href={`/#world-${project.id}`} prefetch={false}><span><strong>{project.titleEs||project.title}</strong><small>{project.stack.slice(0,3).join(' · ')}</small></span><ArrowUpRight size={15}/></Link>)}</div>}
    <p className="study-caption">{selected?'Los proyectos abren su caso completo en el portafolio.':'Elige un reino para acercarte y descubrir sus proyectos.'}</p>
   </section>
   <section className="study-stage" aria-label="Vista de la composición">
    <div className="study-aura" aria-hidden="true"/><div className="study-floor-glow" aria-hidden="true"/>
    <img className="study-poster" data-hidden={status==='ready'} src="/models/yggdrasil-realms/composition.webp" alt="Yggdrasil y sus tres reinos: el observatorio de las ideas, el santuario de la materia y el umbral de las historias"/>
    <Scene view={view} night={night} motion={motion} pose={pose} onStatus={setStatus}/>
    <div className="study-stage-label" aria-live="polite"><span>{selected?selected.name:'YGGDRASIL'}</span><small>{status==='loading'?'Cargando escena…':status==='fallback'?'Vista de estudio · WebGL no disponible':<><span className="study-mouse-hint">Arrastra con el ratón para girar · </span>Explora los tres reinos</>}</small></div>
    <div className="study-controls" role="group" aria-label="Controles de la escena"><button aria-pressed={view==='tree'} onClick={()=>selectRealm('tree')}><RotateCcw size={14}/> General</button>{realmIds.map(id=><button key={id} aria-label={`Acercar a ${realms[id].name}`} aria-pressed={view===id} onClick={()=>selectRealm(id)}>{realms[id].number}</button>)}<button aria-label={motion?'Pausar efectos':'Activar efectos'} aria-pressed={motion} onClick={()=>setMotion(!motion)}>{motion?<Pause size={14}/>:<Play size={14}/>}</button></div>
   </section>
  </div>
  <footer className="study-footer">{realmIds.map(id=><button key={id} aria-pressed={view===id} onClick={()=>selectRealm(id)}>{realms[id].number} / {realms[id].discipline}</button>)}</footer>
 </main>;
}
