"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Code2, Compass, RotateCcw, Sparkles } from 'lucide-react';
import type { StoredProject } from '@/lib/content-types';
import type { Settings } from '@/lib/site-settings';
import { categoryColor } from '@/lib/project-presentation';
import { projectRealm, realmIds, realms, type RealmId, type RealmStatus, type RealmView } from '@/lib/portfolio-realms';
import RealmScene from './realm-scene';
import './realm-explorer.css';

type Lang='en'|'es';
const icons={programming:Code2,art:Sparkles,experiences:Compass};
const copy=(lang:Lang,en:string,es:string)=>lang==='es'?es:en;

function previewMedia(project:StoredProject){
 const items=project.media.length?project.media:project.mediaUrl?[{url:project.mediaUrl,type:project.mediaType,alt:project.mediaAlt,poster:undefined}]:[];
 const still=items.find(item=>!item.type.startsWith('video'));
 const video=items.find(item=>item.type.startsWith('video'));
 return {poster:video?.poster||still?.url,videoUrl:project.previewUrl||video?.url};
}

function ProjectPreview({project,title}:{project:StoredProject;title:string}){
 const {poster}=previewMedia(project);
 return <span className="realms-project-preview">
  {poster?<img src={poster} loading="lazy" alt=""/>:<span aria-hidden="true">{title.slice(0,1)}</span>}
 </span>;
}

function PreviewClip({src,poster}:{src:string;poster?:string}){
 const video=useRef<HTMLVideoElement>(null);
 const [playing,setPlaying]=useState(false);
 useEffect(()=>{
  const player=video.current;if(!player)return;
  player.muted=true;
  void player.play().catch(()=>{/* The still image remains visible when autoplay is unavailable. */});
  return()=>{player.pause();player.removeAttribute('src');player.load();};
 },[src]);
 return <video ref={video} src={src} poster={poster} muted autoPlay loop playsInline preload="metadata" data-playing={playing} onPlaying={()=>setPlaying(true)} onError={()=>setPlaying(false)}/>;
}

function ProjectBackdrop({project,visible,motion}:{project:StoredProject|null;visible:boolean;motion:boolean}){
 const media=project?previewMedia(project):null;
 return <div className="realms-project-backdrop" data-visible={visible&&Boolean(media?.poster||(motion&&media?.videoUrl))} aria-hidden="true">
  {media?.poster&&<img key={media.poster} src={media.poster} alt="" decoding="async"/>}
  {visible&&motion&&media?.videoUrl&&<PreviewClip key={media.videoUrl} src={media.videoUrl} poster={media.poster}/>}
 </div>;
}

export default function RealmExplorer({projects,settings,lang,realm,effects,active,onOpen}:{projects:StoredProject[];settings:Settings;lang:Lang;realm:'dark'|'light';effects:boolean;active:boolean;onOpen:(project:StoredProject)=>void}){
 const [view,setView]=useState<RealmView>('tree'),[pose,setPose]=useState(0),[status,setStatus]=useState<RealmStatus>('loading');
 const [renderer,setRenderer]=useState<'3d'|'light'>('3d'),[hydrated,setHydrated]=useState(false),[near,setNear]=useState(false);
 const [previewProject,setPreviewProject]=useState<StoredProject|null>(null),[previewVisible,setPreviewVisible]=useState(false);
 const [inView,setInView]=useState(false),[pageVisible,setPageVisible]=useState(true),[reducedMotion,setReducedMotion]=useState(false);
 const section=useRef<HTMLElement>(null);
 useEffect(()=>{
  queueMicrotask(()=>{
   let preference:string|null=null;try{preference=localStorage.getItem('au-realms-renderer');}catch{}
   const saveData=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData;
   setRenderer(preference==='light'||(!preference&&saveData)?'light':'3d');setHydrated(true);
  });
  const el=section.current;if(!el)return;
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setNear(true);observer.disconnect();}},{rootMargin:'450px'});
  observer.observe(el);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion=()=>setReducedMotion(preference.matches);
  const syncVisibility=()=>{setPageVisible(!document.hidden);if(document.hidden)setPreviewVisible(false);};
  queueMicrotask(()=>{syncMotion();syncVisibility();});
  preference.addEventListener('change',syncMotion);document.addEventListener('visibilitychange',syncVisibility);
  const observer=new IntersectionObserver(([entry])=>{setInView(entry.isIntersecting);if(!entry.isIntersecting)setPreviewVisible(false);});
  if(section.current)observer.observe(section.current);
  return()=>{preference.removeEventListener('change',syncMotion);document.removeEventListener('visibilitychange',syncVisibility);observer.disconnect();};
 },[]);
 useEffect(()=>{if(!active)queueMicrotask(()=>setPreviewVisible(false));},[active]);
 const showPreview=(project:StoredProject)=>{setPreviewProject(project);setPreviewVisible(true);};
 const select=(next:RealmView)=>{setPreviewVisible(false);setView(next);setPose(n=>n+1);};
 const chooseRenderer=(next:'3d'|'light')=>{if(next===renderer&&status!=='fallback')return;setStatus('loading');setRenderer(next);setPose(n=>n+1);try{localStorage.setItem('au-realms-renderer',next);}catch{}};
 const selected=view==='tree'?null:realms[view];
 const shown=projects.filter(project=>view==='tree'||projectRealm(project)===view);
 const accent=(id:RealmId)=>settings.categoryColors[id==='programming'?'pureProgramming':id==='art'?'pureArt':'engineArt'];
 const has3D=renderer==='3d'&&status==='ready';
 return <section ref={section} id="work" className="realms-work" style={{'--realm-ink':settings.palette[realm].text,'--realm-muted':settings.palette[realm].muted,'--realm-gold':settings.palette[realm].amber} as React.CSSProperties} data-night={realm==='dark'} data-motion={effects} data-world={view} aria-labelledby="realms-title">
  <ProjectBackdrop project={previewProject} visible={previewVisible&&active&&inView&&pageVisible} motion={effects&&!reducedMotion}/>
  <div className="realms-layout">
   <div className="realms-editorial">
    <header className="realms-introduction"><p className="realms-eyebrow">{copy(lang,'YGGDRASIL / THREE REALMS, ONE ROOT','YGGDRASIL / TRES REINOS, UNA RAÍZ')}</p><h2 id="realms-title">{copy(lang,'One tree.','Un árbol.')}<br/>{copy(lang,'Different','Distintos')}{' '}<em>{copy(lang,'worlds.','mundos.')}</em></h2><p className="realms-lead">{copy(lang,'Ideas grow from the same root. Each branch turns them into a different experience.','Las ideas nacen de una misma raíz. Cada rama las transforma en una experiencia distinta.')}</p></header>
    <nav className="realms-navigation" aria-label={copy(lang,'Explore the three realms','Explorar los tres reinos')}>{realmIds.map(id=>{const world=realms[id],Icon=icons[id];return <button key={id} style={{'--realm-accent':accent(id)} as React.CSSProperties} aria-pressed={view===id} aria-controls="realms-detail realms-projects" onClick={()=>select(id)}><span>{world.number}</span><Icon size={17}/><span><strong>{world.short[lang]}</strong><small>{world.discipline[lang]}</small></span><ArrowUpRight size={14}/></button>;})}</nav>
    <div className="realms-description" id="realms-detail" aria-live="polite"><span>{selected?`${copy(lang,'REALM','REINO')} ${selected.number}`:copy(lang,'THE WORLD TREE','EL ÁRBOL DE LOS MUNDOS')}</span><h3>{selected?selected.name[lang]:copy(lang,'Three ways to create','Tres formas de crear')}</h3><p>{selected?selected.description[lang]:copy(lang,'Explore a realm or open a project directly below. Programming, art and playable experiences share the same roots.','Explora un reino o abre un proyecto directamente aquí. Programación, arte y experiencias jugables comparten las mismas raíces.')}</p>{selected&&<button className="realms-back" onClick={()=>select('tree')}><ArrowLeft size={14}/>{copy(lang,'All realms','Todos los reinos')}</button>}</div>
   </div>
   <div className="realms-stage" aria-label={copy(lang,'Yggdrasil and its three realms','Yggdrasil y sus tres reinos')}>
    <div className="realms-aura" aria-hidden="true"/>
    <img className="realms-poster" data-hidden={has3D} src="/models/yggdrasil-realms/composition.webp" loading="lazy" alt={copy(lang,'An ancient tree holding an observatory, a crystal sanctuary and a story portal in its branches.','Un árbol ancestral sostiene un observatorio, un santuario de cristales y un portal de historias entre sus ramas.')}/>
    {near&&hydrated&&renderer==='3d'&&status!=='fallback'&&<RealmScene view={view} night={realm==='dark'} motion={effects} active={active} pose={pose} onStatus={setStatus} onSelect={select} className="realms-canvas" label={copy(lang,'Interactive 3D tree. Click an island or choose a realm. Drag with a mouse to orbit.','Árbol 3D interactivo. Pulsa una isla o elige un reino. Arrastra con el ratón para girarlo.')}/>}
    <div className="realms-stage-label" aria-live="polite"><span>{selected?selected.name[lang]:'YGGDRASIL'}</span><small>{renderer==='light'?copy(lang,'Light view','Vista ligera'):status==='fallback'?copy(lang,'Showing the light view. All projects remain available.','Mostrando la vista ligera. Todos los proyectos siguen disponibles.'):!has3D?copy(lang,'Loading the realms…','Cargando los reinos…'):copy(lang,'Click an island or choose a realm','Pulsa una isla o elige un reino')}</small></div>
    <div className="realms-controls" role="group" aria-label={copy(lang,'Scene controls','Controles de la escena')}><button aria-label={copy(lang,'Return to the full tree','Volver al árbol completo')} aria-pressed={view==='tree'} onClick={()=>select('tree')}><RotateCcw size={15}/></button>{realmIds.map(id=><button key={id} aria-label={`${copy(lang,'Explore','Explorar')} ${realms[id].short[lang]}`} aria-pressed={view===id} onClick={()=>select(id)}>{realms[id].number}</button>)}<span aria-hidden="true"/><button aria-pressed={renderer==='light'||status==='fallback'} onClick={()=>chooseRenderer('light')}>{copy(lang,'Light','Ligera')}</button><button aria-pressed={renderer==='3d'&&status!=='fallback'} onClick={()=>chooseRenderer('3d')}>3D</button></div>
   </div>
   <div className="realms-projects" id="realms-projects"><h3>{selected?copy(lang,'Projects in this realm','Proyectos de este reino'):copy(lang,'Selected projects','Proyectos seleccionados')}<span>{String(shown.length).padStart(2,'0')}</span></h3><div className="realms-project-list">{shown.map(project=>{const title=lang==='es'?(project.titleEs||project.title):project.title;return <button key={project.id} style={{'--project-accent':categoryColor(project,settings)} as React.CSSProperties} onPointerEnter={event=>{if(event.pointerType==='mouse')showPreview(project);}} onPointerLeave={event=>{if(!event.currentTarget.matches(':focus-visible'))setPreviewVisible(false);}} onPointerDown={event=>{if(event.pointerType!=='mouse')setPreviewVisible(false);}} onFocus={event=>{if(event.currentTarget.matches(':focus-visible'))showPreview(project);}} onBlur={()=>setPreviewVisible(false)} onClick={()=>{setPreviewVisible(false);if(view==='tree')select(projectRealm(project));onOpen(project);}}><ProjectPreview project={project} title={title}/><span className="realms-project-copy"><strong>{title}</strong><small>{project.stack.slice(0,3).join(' · ')}</small></span><ArrowUpRight size={16}/></button>;})}</div>{shown.length===0&&<p className="realms-empty">{copy(lang,'New projects are on their way. Explore the other realms.','Pronto habrá nuevos proyectos. Explora los otros reinos.')}</p>}</div>
  </div>
 </section>;
}
