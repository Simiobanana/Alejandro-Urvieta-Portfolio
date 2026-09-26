"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { ArrowLeft,ArrowUpRight,Moon,Sun,RotateCcw,Pause,Play,Code2,Sparkles,Compass } from 'lucide-react';
import type { StoredProject } from '@/lib/content-types';
import { realms as definitions, realmIds, projectRealm, type RealmId as Realm, type RealmView as View, type RealmStatus } from '@/lib/portfolio-realms';
import Scene from '../realm-scene';
import './study.css';
const icons={programming:Code2,art:Sparkles,experiences:Compass};
const localize=(id:Realm)=>({...definitions[id],name:definitions[id].name.es,short:definitions[id].short.es,discipline:definitions[id].discipline.es,description:definitions[id].description.es,icon:icons[id]});
const realms={programming:localize('programming'),art:localize('art'),experiences:localize('experiences')};

export default function Study({projects}:{projects:StoredProject[]}){
 const [pose,setPose]=useState(0);
 const [view,setView]=useState<View>('tree'),[night,setNight]=useState(true),[motion,setMotion]=useState(false),[status,setStatus]=useState<RealmStatus>('loading');
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
    <Scene className="study-canvas" label="Yggdrasil 3D. Pulsa una isla o usa los botones para explorar los tres reinos." view={view} night={night} motion={motion} pose={pose} onStatus={setStatus} onSelect={selectRealm}/>
    <div className="study-stage-label" aria-live="polite"><span>{selected?selected.name:'YGGDRASIL'}</span><small>{status==='loading'?'Cargando escena…':status==='fallback'?'Vista de estudio · WebGL no disponible':<><span className="study-mouse-hint">Arrastra con el ratón para girar · </span>Explora los tres reinos</>}</small></div>
    <div className="study-controls" role="group" aria-label="Controles de la escena"><button aria-pressed={view==='tree'} onClick={()=>selectRealm('tree')}><RotateCcw size={14}/> General</button>{realmIds.map(id=><button key={id} aria-label={`Acercar a ${realms[id].name}`} aria-pressed={view===id} onClick={()=>selectRealm(id)}>{realms[id].number}</button>)}<button aria-label={motion?'Pausar efectos':'Activar efectos'} aria-pressed={motion} onClick={()=>setMotion(!motion)}>{motion?<Pause size={14}/>:<Play size={14}/>}</button></div>
   </section>
  </div>
  <footer className="study-footer">{realmIds.map(id=><button key={id} aria-pressed={view===id} onClick={()=>selectRealm(id)}>{realms[id].number} / {realms[id].discipline}</button>)}</footer>
 </main>;
}
