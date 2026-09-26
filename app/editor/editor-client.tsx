"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, CloudUpload, ExternalLink, Eye, EyeOff, FolderKanban, GripVertical, LayoutPanelTop, LogOut, Palette as PaletteIcon, Pencil, Plus, Save, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { projectCategories, sectionLabels, type MediaItem, type SectionItem, type SectionKind, type StoredProject, type StoredSection } from "@/lib/content-types";
import { colorLabels, defaultSettings, paletteStyle, type Palette, type Settings } from "@/lib/site-settings";
import { projectRealm, realms } from '@/lib/portfolio-realms';
import "./editor.css";

type ProjectForm = Omit<StoredProject, "id" | "details" | "detailsEs" | "stack"> & { details: string; detailsEs: string; stack: string };
type SectionForm = Omit<StoredSection, "id">;
type Message = { text: string; error: boolean } | null;
const emptyProject: ProjectForm = { title: "", titleEs: "", category: "Pure Programming", description: "", descriptionEs: "", outcome: "", outcomeEs: "", details: "", detailsEs: "", stack: "", href: "", repo: "", mediaUrl: "", mediaType: "", mediaAlt: "", media: [], featured: false, published: true, sortOrder: 100, code: "", accent: "cyan", hotspotX:null, hotspotY:null, accentColor:"", previewUrl:"" };
const emptySection: SectionForm = { kind: "custom", eyebrowEn: "FEATURED NOTE", eyebrowEs: "NOTA DESTACADA", titleEn: "", titleEs: "", bodyEn: "", bodyEs: "", linkLabelEn: "Explore", linkLabelEs: "Explorar", href: "", mediaUrl: "", mediaType: "", media: [], items: [], published: true, sortOrder: 100 };
const emptyItem: SectionItem = { titleEn: "", titleEs: "", bodyEn: "", bodyEs: "", label: "", href: "" };
const ordered = <T extends { sortOrder: number; id: number }>(items: T[]) => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
const isMediaUrl = (url: string) => /^https:\/\/[^\s]+$/i.test(url) || /^\/(?!\/)[^\s]*$/.test(url);
const isLink = (url: string) => !url || isMediaUrl(url) || /^(#[\w-]+|mailto:[^\s]+|tel:[+\d ()-]+)$/.test(url);
const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value);
const errorText = (error: unknown) => error instanceof Error ? error.message : "No se pudo completar la operación. Intenta de nuevo.";
function reorder<T>(items: T[], from: number, to: number): T[] { if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items; const result = [...items]; const [item] = result.splice(from, 1); result.splice(to, 0, item); return result; }
function legacyMedia(value: { media?: MediaItem[]; mediaUrl?: string; mediaType?: string; mediaAlt?: string }): MediaItem[] { return value.media?.length ? value.media : value.mediaUrl ? [{ id: "legacy", url: value.mediaUrl, type: value.mediaType || "image", alt: value.mediaAlt || "" }] : []; }
function asProject(project: StoredProject): ProjectForm { return { ...emptyProject, ...project, details: (project.details || []).join("\n"), detailsEs: (project.detailsEs || []).join("\n"), stack: (project.stack || []).join(", "), media: legacyMedia(project) }; }
function asSection(section: StoredSection): SectionForm { return { ...emptySection, ...section, media: legacyMedia(section), items: section.items || [] }; }
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: "same-origin", headers: { ...(init?.body instanceof FormData ? {} : { "content-type": "application/json" }), ...init?.headers } });
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error(`La sesión no está disponible (${response.status}). Vuelve a abrir /editor para iniciar sesión; tus cambios en este formulario se conservan.`);
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(`${data.error || "La operación fue rechazada"} (${response.status}).`);
  return data as T;
}

export default function EditorClient({ userName }: { userName: string }) {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [sections, setSections] = useState<StoredSection[]>([]);
  const [project, setProject] = useState<ProjectForm>({ ...emptyProject });
  const [section, setSection] = useState<SectionForm>({ ...emptySection });
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  const [previewLanguage, setPreviewLanguage] = useState<"en" | "es">("en");
  const [previewTheme, setPreviewTheme] = useState<"dark" | "light">("dark");
  const locked = busy || !loaded;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [p, s, c] = await Promise.all([request<{ projects: StoredProject[] }>("/api/admin/projects"), request<{ sections: StoredSection[] }>("/api/admin/sections"), request<{ settings: Settings }>("/api/admin/settings")]);
        if (cancelled) return;
        setProjects(p.projects); setSections(s.sections);
        setSettings({ ...defaultSettings, ...c.settings, palette: { dark: { ...defaultSettings.palette.dark, ...c.settings?.palette?.dark }, light: { ...defaultSettings.palette.light, ...c.settings?.palette?.light } } });
        setLoaded(true); setMessage(null);
      } catch (error) { if (!cancelled) setMessage({ text: errorText(error), error: true }); }
    }
    void load(); return () => { cancelled = true; };
  }, [retry]);

  const updateProject = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => setProject(current => ({ ...current, [key]: value }));
  const updateSection = <K extends keyof SectionForm>(key: K, value: SectionForm[K]) => setSection(current => ({ ...current, [key]: value }));
  const updateSettings = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings(current => ({ ...current, [key]: value }));
  function editProject(value: StoredProject) { setEditingProject(value.id); setProject(asProject(value)); setMessage(null); window.scrollTo({ top: 280, behavior: "auto" }); }
  function editSection(value: StoredSection) { setEditingSection(value.id); setSection(asSection(value)); setMessage(null); window.scrollTo({ top: 280, behavior: "auto" }); }

  async function upload(files: File[], target: "project" | "section") {
    if (!files.length || locked) return;
    setBusy(true);
    let completed = 0;
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) throw new Error(`${file.name}: selecciona una imagen o video.`);
        if (file.size > 90 * 1024 * 1024) throw new Error(`${file.name}: supera el límite de 90 MB.`);
        setMessage({ text: `Subiendo ${completed + 1} de ${files.length}: ${file.name}`, error: false });
        const body = new FormData(); body.append("file", file);
        const data = await request<{ url: string; type: string; key: string }>("/api/admin/uploads", { method: "POST", body });
        const media: MediaItem = { id: crypto.randomUUID(), url: data.url, type: data.type, alt: "" };
        if (target === "project") setProject(current => ({ ...current, media: [...current.media, media] }));
        else setSection(current => ({ ...current, media: [...current.media, media] }));
        completed++;
      }
      setMessage({ text: `${completed} archivo(s) listos. Puedes ordenarlos; guarda el contenido para publicar.`, error: false });
    } catch (error) { setMessage({ text: `${completed ? `${completed} archivo(s) añadidos. ` : ""}${errorText(error)}`, error: true }); }
    finally { setBusy(false); }
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault(); if (locked) return;
    if (!isLink(project.href) || !isLink(project.repo) || (project.previewUrl&&!isMediaUrl(project.previewUrl)) || (project.accentColor&&!isHex(project.accentColor))) { setMessage({ text: "Revisa los enlaces, el video de hover y el color hexadecimal del proyecto.", error: true }); return; }
    setBusy(true); setMessage({ text: "Guardando proyecto…", error: false });
    try {
      const payload = { ...project, stack: project.stack.split(",").map(value => value.trim()).filter(Boolean), details: project.details.split("\n").map(value => value.trim()).filter(Boolean), detailsEs: project.detailsEs.split("\n").map(value => value.trim()).filter(Boolean), mediaUrl: project.media[0]?.url || "", mediaType: project.media[0]?.type || "", mediaAlt: project.media[0]?.alt || "" };
      const data = await request<{ project: StoredProject }>(editingProject !== null ? `/api/admin/projects/${editingProject}` : "/api/admin/projects", { method: editingProject !== null ? "PUT" : "POST", body: JSON.stringify(payload) });
      setProjects(current => [...current.filter(value => value.id !== data.project.id), data.project]);
      setEditingProject(data.project.id); setProject(asProject(data.project));
      setMessage({ text: data.project.published ? "Proyecto guardado y publicado." : "Proyecto guardado como borrador; no aparece en el sitio público.", error: false });
    } catch (error) { setMessage({ text: errorText(error), error: true }); }
    finally { setBusy(false); }
  }

  async function saveSection(event: FormEvent) {
    event.preventDefault(); if (locked) return;
    if (!isLink(section.href) || section.items.some(item => !isLink(item.href))) { setMessage({ text: "Revisa los enlaces de la sección y sus elementos. Usa HTTPS, rutas locales, anclas, mailto: o tel:.", error: true }); return; }
    setBusy(true); setMessage({ text: "Guardando sección…", error: false });
    try {
      const data = await request<{ section: StoredSection }>(editingSection !== null ? `/api/admin/sections/${editingSection}` : "/api/admin/sections", { method: editingSection !== null ? "PUT" : "POST", body: JSON.stringify({ ...section, mediaUrl: section.media[0]?.url || "", mediaType: section.media[0]?.type || "" }) });
      setSections(current => [...current.filter(value => value.id !== data.section.id), data.section]);
      setEditingSection(data.section.id); setSection(asSection(data.section));
      setMessage({ text: data.section.published ? "Sección guardada y publicada." : "Sección guardada como borrador; no aparece en el sitio público.", error: false });
    } catch (error) { setMessage({ text: errorText(error), error: true }); }
    finally { setBusy(false); }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault(); if (locked) return;
    if ([...Object.values(settings.palette.dark), ...Object.values(settings.palette.light),...Object.values(settings.categoryColors)].some(value => !isHex(value))) { setMessage({ text: "Usa colores hexadecimales de seis dígitos, por ejemplo #31e9ff.", error: true }); return; }
    setBusy(true); setMessage({ text: "Guardando apariencia…", error: false });
    try { const data = await request<{ settings: Settings }>("/api/admin/settings", { method: "PUT", body: JSON.stringify({ ...settings, accentCyan: settings.palette.dark.cyan, accentViolet: settings.palette.dark.violet }) }); setSettings(data.settings); setMessage({ text: "Apariencia, portada y efectos guardados.", error: false }); }
    catch (error) { setMessage({ text: errorText(error), error: true }); }
    finally { setBusy(false); }
  }

  async function remove(kind: "projects" | "sections", id: number, title: string) {
    if (locked || !window.confirm(`¿Eliminar «${title}» de forma permanente? Esta acción no se puede deshacer.`)) return;
    setBusy(true); setMessage({ text: "Eliminando contenido…", error: false });
    try {
      await request(`/api/admin/${kind}/${id}`, { method: "DELETE" });
      if (kind === "projects") { setProjects(current => current.filter(value => value.id !== id)); if (editingProject === id) { setEditingProject(null); setProject({ ...emptyProject }); } }
      else { setSections(current => current.filter(value => value.id !== id)); if (editingSection === id) { setEditingSection(null); setSection({ ...emptySection }); } }
      setMessage({ text: "Contenido eliminado.", error: false });
    } catch (error) { setMessage({ text: errorText(error), error: true }); }
    finally { setBusy(false); }
  }

  const previewPalette = Object.fromEntries(Object.entries(settings.palette[previewTheme]).map(([key, value]) => [key, isHex(value) ? value : defaultSettings.palette[previewTheme][key as keyof Palette]])) as Palette;
  const previewControls = <div className="preview-options"><Field label="Idioma de la vista previa"><select value={previewLanguage} onChange={event => setPreviewLanguage(event.target.value as "en" | "es")}><option value="en">English</option><option value="es">Español</option></select></Field><Field label="Tema de la vista previa"><select value={previewTheme} onChange={event => setPreviewTheme(event.target.value as "dark" | "light")}><option value="dark">Noche</option><option value="light">Día</option></select></Field></div>;
  return <main className="admin-shell">
    <header className="admin-topbar"><div><span className="brand-mark">AU</span><div><strong>Portfolio Control Room</strong><small>Sesión privada · {userName}</small></div></div><nav><Link href="/" target="_blank"><Eye size={16} /> Ver sitio</Link><a href="/cdn-cgi/access/logout"><LogOut size={16} /> Salir</a></nav></header>
    <section className="admin-heading"><p className="kicker">OWNER CONSOLE / PRIVATE</p><h1>Tu portafolio, bajo tu control.</h1><p>Edita todos tus proyectos y secciones, ordena sus archivos y prueba los colores antes de publicar. Las vistas previas no guardan cambios.</p></section>
    {!loaded && <div className="editor-load" role="status">{message?.error ? <><p>No se cargó el contenido. Los formularios permanecerán protegidos hasta recuperar tus datos.</p><button type="button" className="button" onClick={() => { setMessage(null); setRetry(value => value + 1); }}>Reintentar carga</button></> : "Cargando biblioteca y configuración…"}</div>}
    {message && <div className={`editor-message${message.error ? " is-error" : ""}`} role={message.error ? "alert" : "status"} aria-live="polite">{message.text}</div>}
    <Tabs defaultValue="projects" className="admin-tabs"><TabsList className="admin-tablist"><TabsTrigger value="projects"><FolderKanban />Proyectos</TabsTrigger><TabsTrigger value="sections"><LayoutPanelTop />Secciones</TabsTrigger><TabsTrigger value="appearance"><PaletteIcon />Apariencia</TabsTrigger></TabsList>
      <TabsContent value="projects"><div className="admin-grid"><form className="admin-form glass" onSubmit={saveProject}><fieldset disabled={locked} className="editor-fieldset">
        <FormTitle icon={<FolderKanban />} title={editingProject !== null ? "Editar proyecto" : "Nuevo proyecto"} action={() => { setEditingProject(null); setProject({ ...emptyProject }); }} />
        <LanguageColumns><Field label="Title · English"><input required maxLength={180} value={project.title} onChange={event => updateProject("title", event.target.value)} /></Field><Field label="Título · Español"><input required maxLength={180} value={project.titleEs} onChange={event => updateProject("titleEs", event.target.value)} /></Field></LanguageColumns>
        <div className="field-pair"><Field label="Categoría"><select value={project.category} onChange={event => updateProject("category", event.target.value)}>{projectCategories.map(value=><option key={value} value={value}>{value==="Pure Programming"?"Programación pura":value==="Web Programming"?"Programación web":value==="Engine + Art"?"Unity/Unreal + Arte":"Arte puro"}</option>)}</select></Field><Field label="Orden · menor número primero"><input type="number" required value={project.sortOrder} onChange={event => updateProject("sortOrder", Number(event.target.value))} /></Field></div>
        <section className="immersive-fields"><div className="editor-block-heading"><h3>Presentación en los tres reinos</h3><span>{realms[projectRealm(project)].short.es}</span></div><p className="editor-hint">Programación pura y web aparecen en el Observatorio; arte en el Santuario; Unity/Unreal + Arte en el Umbral, salvo estudios de VFX, materiales y entornos, que van al Santuario. El orden se conserva dentro de cada reino. El color vacío hereda el de la categoría.</p><details className="editor-legacy-positions"><summary>Posiciones de la versión anterior (conservadas)</summary><p className="editor-hint">Estos valores se guardan para el árbol anterior; no cambian la distribución de los tres reinos.</p><div className="field-pair"><Field label="Posición horizontal · 5–95"><input type="number" min={5} max={95} placeholder="Automática" value={project.hotspotX??""} onChange={event=>updateProject("hotspotX",event.target.value===""?null:Number(event.target.value))}/></Field><Field label="Posición vertical · 5–95"><input type="number" min={5} max={95} placeholder="Automática" value={project.hotspotY??""} onChange={event=>updateProject("hotspotY",event.target.value===""?null:Number(event.target.value))}/></Field></div></details><div className="field-pair"><Field label="Color propio · opcional"><input type="text" pattern="#[0-9a-fA-F]{6}|^$" placeholder="Color de categoría" value={project.accentColor} onChange={event=>updateProject("accentColor",event.target.value)}/></Field><Field label="Video de hover · HTTPS o /media/"><input value={project.previewUrl} onChange={event=>updateProject("previewUrl",event.target.value)} placeholder="Opcional"/></Field></div></section>
        <LanguageColumns><Field label="Description · English"><textarea required rows={4} value={project.description} onChange={event => updateProject("description", event.target.value)} /></Field><Field label="Descripción · Español"><textarea required rows={4} value={project.descriptionEs} onChange={event => updateProject("descriptionEs", event.target.value)} /></Field></LanguageColumns>
        <LanguageColumns><Field label="Outcome · English"><input value={project.outcome} onChange={event => updateProject("outcome", event.target.value)} /></Field><Field label="Resultado · Español"><input value={project.outcomeEs} onChange={event => updateProject("outcomeEs", event.target.value)} /></Field></LanguageColumns>
        <LanguageColumns><Field label="Case points · one per line"><textarea rows={3} value={project.details} onChange={event => updateProject("details", event.target.value)} /></Field><Field label="Puntos del caso · uno por línea"><textarea rows={3} value={project.detailsEs} onChange={event => updateProject("detailsEs", event.target.value)} /></Field></LanguageColumns>
        <Field label="Tecnologías · separadas por comas"><input value={project.stack} onChange={event => updateProject("stack", event.target.value)} /></Field>
        <div className="field-pair"><Field label="Enlace principal · opcional"><input value={project.href} onChange={event => updateProject("href", event.target.value)} placeholder="https://…" /></Field><Field label="Repositorio · opcional"><input value={project.repo} onChange={event => updateProject("repo", event.target.value)} placeholder="https://github.com/…" /></Field></div>
        <div className="field-pair"><Field label="Código visual · opcional"><input value={project.code} onChange={event => updateProject("code", event.target.value)} placeholder="01" /></Field><Field label="Acento visual"><select value={project.accent} onChange={event => updateProject("accent", event.target.value)}><option value="cyan">Cian</option><option value="violet">Violeta</option><option value="amber">Ámbar</option><option value="lime">Verde</option><option value="rose">Rosa</option></select></Field></div>
        <MediaEditor media={project.media} onChange={media => updateProject("media", media)} onUpload={files => void upload(files, "project")} disabled={locked} />
        <div className="switch-row"><Toggle label="Destacado" checked={project.featured} onChange={value => updateProject("featured", value)} /><Toggle label="Publicado" checked={project.published} onChange={value => updateProject("published", value)} /></div>
        <button className="button primary" type="submit"><Save size={17} />{busy ? "Procesando…" : editingProject !== null ? "Guardar cambios" : "Crear proyecto"}</button>
      </fieldset></form><div className="editor-right-column"><section className="editor-preview-panel glass"><h2>Vista previa del proyecto</h2>{previewControls}<ProjectPreview project={project} lang={previewLanguage} palette={previewPalette} /><PositionPreview entries={projects.map(item => ({ id: item.id, title: previewLanguage === "es" ? item.titleEs : item.title, sortOrder: item.sortOrder, published: item.published }))} id={editingProject} title={(previewLanguage === "es" ? project.titleEs : project.title) || "Nuevo proyecto"} sortOrder={project.sortOrder} published={project.published} /></section>
        <Manager title="Todos tus proyectos" count={projects.length}>{ordered(projects).map(value => <ManagerCard key={value.id} label={`${value.sortOrder} · ${value.category}`} title={value.titleEs || value.title} text={value.descriptionEs || value.description} published={value.published} href={value.href} disabled={locked} onEdit={() => editProject(value)} onDelete={() => void remove("projects", value.id, value.titleEs || value.title)} />)}{loaded && !projects.length && <Empty text="Tu biblioteca está vacía. Crea tu primer proyecto." />}</Manager>
      </div></div></TabsContent>
      <TabsContent value="sections"><div className="admin-grid"><form className="admin-form glass" onSubmit={saveSection}><fieldset disabled={locked} className="editor-fieldset">
        <FormTitle icon={<LayoutPanelTop />} title={editingSection !== null ? "Editar sección" : "Nueva sección"} action={() => { setEditingSection(null); setSection({ ...emptySection }); }} />
        <div className="field-pair"><Field label="Tipo de sección"><select value={section.kind} onChange={event => updateSection("kind", event.target.value as SectionKind)}>{Object.entries(sectionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Orden · menor número primero"><input type="number" required value={section.sortOrder} onChange={event => updateSection("sortOrder", Number(event.target.value))} /></Field></div>
        <p className="editor-hint">El orden incluye portada, cifras, proyectos, perfil, experiencia, contacto y secciones libres. Usa la lista de posición para colocarlas.</p>
        <LanguageColumns><Field label="Eyebrow · English"><input value={section.eyebrowEn} onChange={event => updateSection("eyebrowEn", event.target.value)} /></Field><Field label="Etiqueta · Español"><input value={section.eyebrowEs} onChange={event => updateSection("eyebrowEs", event.target.value)} /></Field></LanguageColumns>
        <LanguageColumns><Field label="Title · English"><input value={section.titleEn} onChange={event => updateSection("titleEn", event.target.value)} /></Field><Field label="Título · Español"><input value={section.titleEs} onChange={event => updateSection("titleEs", event.target.value)} /></Field></LanguageColumns>
        <LanguageColumns><Field label="Body · English"><textarea rows={4} value={section.bodyEn} onChange={event => updateSection("bodyEn", event.target.value)} /></Field><Field label="Contenido · Español"><textarea rows={4} value={section.bodyEs} onChange={event => updateSection("bodyEs", event.target.value)} /></Field></LanguageColumns>
        {section.kind === "hero" && <p className="editor-hint">La portada usa estos títulos y textos. El mensaje de disponibilidad y los efectos se configuran en Apariencia.</p>}
        {section.kind === "work" && <p className="editor-hint">Esta sección muestra la biblioteca de proyectos publicados. Edítalos desde la pestaña Proyectos.</p>}
        <Field label="Enlace opcional"><input value={section.href} onChange={event => updateSection("href", event.target.value)} placeholder="https://…" /></Field>
        <LanguageColumns><Field label="Link label · English"><input value={section.linkLabelEn} onChange={event => updateSection("linkLabelEn", event.target.value)} /></Field><Field label="Texto del enlace · Español"><input value={section.linkLabelEs} onChange={event => updateSection("linkLabelEs", event.target.value)} /></Field></LanguageColumns>
        <SectionItemsEditor items={section.items} kind={section.kind} onChange={items => updateSection("items", items)} />
        <MediaEditor media={section.media} onChange={media => updateSection("media", media)} onUpload={files => void upload(files, "section")} disabled={locked} />
        <Toggle label="Publicada" checked={section.published} onChange={value => updateSection("published", value)} />
        <button className="button primary" type="submit"><Save size={17} />{busy ? "Procesando…" : editingSection !== null ? "Guardar cambios" : "Crear sección"}</button>
      </fieldset></form><div className="editor-right-column"><section className="editor-preview-panel glass"><h2>Vista previa de la sección</h2>{previewControls}<SectionPreview section={section} lang={previewLanguage} palette={previewPalette} projects={projects} /><PositionPreview entries={sections.map(item => ({ id: item.id, title: item.titleEs || item.titleEn || sectionLabels[item.kind], sortOrder: item.sortOrder, published: item.published }))} id={editingSection} title={section.titleEs || section.titleEn || "Nueva sección"} sortOrder={section.sortOrder} published={section.published} /></section>
        <Manager title="Todas tus secciones" count={sections.length}>{ordered(sections).map(value => <ManagerCard key={value.id} label={`${value.sortOrder} · ${sectionLabels[value.kind] || "Sección"}`} title={value.titleEs || value.titleEn} text={value.bodyEs || value.bodyEn} published={value.published} href={value.href} disabled={locked} onEdit={() => editSection(value)} onDelete={() => void remove("sections", value.id, value.titleEs || value.titleEn)} />)}{loaded && !sections.length && <Empty text="Crea y organiza las secciones de tu página." />}</Manager>
      </div></div></TabsContent>
      <TabsContent value="appearance"><form className="appearance-panel glass" onSubmit={saveSettings}><fieldset disabled={locked} className="editor-fieldset"><FormTitle icon={<Settings2 />} title="Identidad visual y efectos" />
        <div className="editor-preview-panel appearance-preview"><h3>Prueba tus colores</h3>{previewControls}<AppearancePreview palette={previewPalette} lang={previewLanguage} /></div>
        <div className="palette-tabs" role="group" aria-label="Paleta que editas"><button type="button" aria-pressed={previewTheme === "dark"} onClick={() => setPreviewTheme("dark")}>Paleta de noche</button><button type="button" aria-pressed={previewTheme === "light"} onClick={() => setPreviewTheme("light")}>Paleta de día</button></div>
        <div className="editor-colors">{Object.entries(colorLabels).map(([key, label]) => <ColorField key={`${previewTheme}-${key}`} label={label} value={settings.palette[previewTheme][key as keyof Palette]} onChange={value => setSettings(current => ({ ...current, palette: { ...current.palette, [previewTheme]: { ...current.palette[previewTheme], [key]: value } } }))} />)}</div>
        <div className="field-pair"><Field label="Vista inicial"><select value={settings.defaultPresentation} onChange={event=>updateSettings("defaultPresentation",event.target.value as Settings["defaultPresentation"])}><option value="immersive">Immersive · Yggdrasil</option><option value="standard">Standard · grilla editorial</option></select></Field><div/></div><div className="editor-block-heading"><h3>Colores de categorías</h3><span>Proyectos y reinos</span></div><div className="editor-colors"><ColorField label="Programación pura" value={settings.categoryColors.pureProgramming} onChange={value=>updateSettings("categoryColors",{...settings.categoryColors,pureProgramming:value})}/><ColorField label="Programación web" value={settings.categoryColors.webProgramming} onChange={value=>updateSettings("categoryColors",{...settings.categoryColors,webProgramming:value})}/><ColorField label="Unity/Unreal + Arte" value={settings.categoryColors.engineArt} onChange={value=>updateSettings("categoryColors",{...settings.categoryColors,engineArt:value})}/><ColorField label="Arte puro" value={settings.categoryColors.pureArt} onChange={value=>updateSettings("categoryColors",{...settings.categoryColors,pureArt:value})}/></div>
        <p className="editor-hint">Las dos paletas se guardan juntas. La vista previa cambia al escribir un código válido; el texto debe mantener suficiente contraste con su fondo.</p>
        <div className="field-pair"><Field label="Movimiento ambiental · nivel predeterminado"><select value={settings.motionLevel} onChange={event => updateSettings("motionLevel", Number(event.target.value))}><option value={0}>0 · Apagado</option><option value={1}>1 · Ligero</option><option value={2}>2 · Completo</option></select></Field><Field label="Transición al entrar una sección"><select value={settings.revealStyle} onChange={event => updateSettings("revealStyle", event.target.value as Settings["revealStyle"])}><option value="pixels">Bloques de píxeles</option><option value="fade">Desvanecimiento</option><option value="rise">Desplazamiento suave</option><option value="none">Sin transición</option></select></Field></div>
        <Field label="Pausa entre escaneos · segundos"><input type="number" min={1} max={300} step={1} required value={settings.radarCooldownSeconds} onChange={event => updateSettings("radarCooldownSeconds", Number(event.target.value))} /></Field><p className="editor-hint">Tiempo que la portada permanece oculta antes del siguiente escaneo. Se repite mientras la tarjeta está en pantalla y los efectos están activos.</p><Field label="Previsualización de proyectos · segundos"><input type="number" min={0} max={60} step={1} required value={settings.previewSeconds} onChange={event => updateSettings("previewSeconds", Number(event.target.value))} /></Field><p className="editor-hint">0 mantiene las miniaturas visibles. De 1 a 60 indica cuánto se muestran después del escaneo al llegar a los proyectos. Cada visitante puede cambiar los efectos y se respeta su preferencia de movimiento reducido.</p>
        <LanguageColumns><Field label="Availability · English"><input value={settings.availabilityEn} onChange={event => updateSettings("availabilityEn", event.target.value)} /></Field><Field label="Disponibilidad · Español"><input value={settings.availabilityEs} onChange={event => updateSettings("availabilityEs", event.target.value)} /></Field></LanguageColumns>
        <p className="editor-hint">Para cambiar el título y texto de portada, edita la sección de tipo Portada en Secciones.</p>
        <button className="button primary" type="submit"><Save size={17} />{busy ? "Procesando…" : "Guardar apariencia"}</button>
      </fieldset></form></TabsContent>
    </Tabs>
  </main>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="admin-field"><span>{label}</span>{children}</label>; }
function LanguageColumns({ children }: { children: ReactNode }) { return <div className="language-columns">{children}</div>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="editor-checkbox"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><span>{label} · <strong>{checked ? "Sí" : "No"}</strong></span></label>; }
function FormTitle({ icon, title, action }: { icon: ReactNode; title: string; action?: () => void }) { return <div className="form-title"><div>{icon}<h2>{title}</h2></div>{action && <button type="button" onClick={action}>Nuevo / limpiar</button>}</div>; }
function Manager({ title, count, children }: { title: string; count: number; children: ReactNode }) { return <aside className="manager"><div className="manager-head"><div><p className="kicker">CONTENT LIBRARY</p><h2>{title}</h2></div><span>{count}</span></div>{children}</aside>; }
function ManagerCard({ label, title, text, published, href, disabled, onEdit, onDelete }: { label: string; title: string; text: string; published: boolean; href: string; disabled: boolean; onEdit: () => void; onDelete: () => void }) { return <article className="manager-card glass"><div className="manager-copy"><span>{published ? <Eye size={13} /> : <EyeOff size={13} />} {published ? "Publicado" : "Borrador"} · {label}</span><h3>{title}</h3><p>{text}</p></div><div className="manager-actions">{href && isLink(href) && <a href={href} target="_blank" rel="noreferrer" aria-label={`Abrir enlace de ${title}`}><ExternalLink size={16} /></a>}<button type="button" disabled={disabled} onClick={onEdit} aria-label={`Editar ${title}`}><Pencil size={16} /></button><button type="button" disabled={disabled} onClick={onDelete} aria-label={`Eliminar ${title}`}><Trash2 size={16} /></button></div></article>; }
function Empty({ text }: { text: string }) { return <div className="empty-projects"><Plus size={20} /><p>{text}</p></div>; }

function MediaVisual({ item, controls = false }: { item?: MediaItem; controls?: boolean }) {
  if (!item || !isMediaUrl(item.url)) return <div className="editor-media-placeholder"><Eye size={26} /><span>Imagen o video del proyecto</span></div>;
  return item.type.startsWith("video") ? <video src={item.url} controls={controls} playsInline preload="metadata" poster={item.poster && isMediaUrl(item.poster) ? item.poster : undefined} aria-label={item.alt || "Video"} /> : <img src={item.url} alt={item.alt || "Vista previa"} loading="lazy" />; // eslint-disable-line @next/next/no-img-element
}

function MediaEditor({ media, onChange, onUpload, disabled }: { media: MediaItem[]; onChange: (value: MediaItem[]) => void; onUpload: (files: File[]) => void; disabled: boolean }) {
  const [url, setUrl] = useState(""); const [type, setType] = useState("image"); const [error, setError] = useState(""); const [dragged, setDragged] = useState<number | null>(null);
  function addUrl() { if (!isMediaUrl(url.trim())) { setError("Introduce una URL HTTPS o una ruta que comience con /."); return; } onChange([...media, { id: crypto.randomUUID(), url: url.trim(), type, alt: "" }]); setUrl(""); setError(""); }
  function update(index: number, patch: Partial<MediaItem>) { onChange(media.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  return <section className="editor-media-library"><div className="editor-block-heading"><h3>Galería de imágenes y videos</h3><span>{media.length} archivos</span></div><p className="editor-hint">El primer archivo es la portada. Arrastra el asa para ordenar en computadora o usa las flechas en teléfono y teclado. Guarda al terminar.</p>
    <label className="editor-upload"><CloudUpload size={24} /><span>Seleccionar uno o varios archivos</span><small>Imágenes y videos · hasta 90 MB por archivo</small><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" multiple disabled={disabled} onChange={event => { onUpload(Array.from(event.target.files || [])); event.target.value = ""; }} /></label>
    <div className="editor-url-row"><Field label="O añadir un enlace"><input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://… o /media/…" /></Field><Field label="Tipo"><select value={type} onChange={event => setType(event.target.value)}><option value="image">Imagen</option><option value="video">Video</option></select></Field><button type="button" className="editor-small-button" onClick={addUrl} disabled={disabled || !url.trim()}>Añadir</button></div>{error && <p role="alert" className="editor-inline-error">{error}</p>}
    <ol className="editor-media-list">{media.map((item, index) => <li key={item.id} className={dragged === index ? "is-dragged" : ""} onDragOver={event => { if (dragged !== null && !disabled) event.preventDefault(); }} onDrop={event => { event.preventDefault(); if (dragged !== null && !disabled) onChange(reorder(media, dragged, index)); setDragged(null); }}>
      <div className="editor-media-toolbar"><span>{index + 1}{index === 0 ? " · Portada" : ""}</span><div><button type="button" className="editor-drag-handle" draggable={!disabled} onDragStart={event => { setDragged(index); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(index)); }} onDragEnd={() => setDragged(null)} aria-label={`Arrastrar archivo ${index + 1}`} title="Arrastrar para ordenar"><GripVertical size={17} /></button><button type="button" disabled={disabled || index === 0} onClick={() => onChange(reorder(media, index, index - 1))} aria-label={`Mover archivo ${index + 1} arriba`}><ArrowUp size={17} /></button><button type="button" disabled={disabled || index === media.length - 1} onClick={() => onChange(reorder(media, index, index + 1))} aria-label={`Mover archivo ${index + 1} abajo`}><ArrowDown size={17} /></button><button type="button" disabled={disabled} onClick={() => onChange(media.filter((_, i) => i !== index))} aria-label={`Quitar archivo ${index + 1} de la galería`}><Trash2 size={17} /></button></div></div>
      <div className="editor-media-thumb"><MediaVisual item={item} controls /></div><Field label="Descripción accesible de este archivo"><input value={item.alt} onChange={event => update(index, { alt: event.target.value })} placeholder="Describe lo visible" /></Field>{item.type.startsWith("video") && <Field label="Miniatura del video · URL HTTPS o ruta local opcional"><input value={item.poster || ""} onChange={event => update(index, { poster: event.target.value })} onBlur={event => { if (event.target.value && !isMediaUrl(event.target.value)) setError("La miniatura debe ser una URL HTTPS o una ruta local."); else setError(""); }} /></Field>}
    </li>)}</ol>
  </section>;
}

function SectionItemsEditor({ items, kind, onChange }: { items: SectionItem[]; kind: SectionKind; onChange: (items: SectionItem[]) => void }) {
  function update(index: number, key: keyof SectionItem, value: string) { onChange(items.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  return <section className="editor-section-items"><div className="editor-block-heading"><h3>Elementos de la sección</h3><button type="button" className="editor-small-button" onClick={() => onChange([...items, { ...emptyItem }])}><Plus size={15} />Añadir</button></div><p className="editor-hint">{kind === "experience" ? "Cada elemento es una experiencia. Usa la etiqueta para la fecha o periodo." : kind === "highlights" ? "Cada elemento es una cifra o logro destacado. Usa el título para el valor y el texto para describirlo." : kind === "profile" ? "Edita aquí los bloques de conocimientos y principios de tu perfil." : "Añade bloques bilingües; puedes cambiar su posición con las flechas."}</p>{items.map((item, index) => <div className="editor-section-item" key={index}><div className="editor-media-toolbar"><strong>Elemento {index + 1}</strong><div><button type="button" disabled={index === 0} onClick={() => onChange(reorder(items, index, index - 1))} aria-label={`Subir elemento ${index + 1}`}><ArrowUp size={17} /></button><button type="button" disabled={index === items.length - 1} onClick={() => onChange(reorder(items, index, index + 1))} aria-label={`Bajar elemento ${index + 1}`}><ArrowDown size={17} /></button><button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label={`Quitar elemento ${index + 1}`}><Trash2 size={17} /></button></div></div><LanguageColumns><Field label="Title · English"><input value={item.titleEn} onChange={event => update(index, "titleEn", event.target.value)} /></Field><Field label="Título · Español"><input value={item.titleEs} onChange={event => update(index, "titleEs", event.target.value)} /></Field></LanguageColumns><LanguageColumns><Field label="Text · English"><textarea rows={2} value={item.bodyEn} onChange={event => update(index, "bodyEn", event.target.value)} /></Field><Field label="Texto · Español"><textarea rows={2} value={item.bodyEs} onChange={event => update(index, "bodyEs", event.target.value)} /></Field></LanguageColumns><div className="field-pair"><Field label="Etiqueta / periodo"><input value={item.label} onChange={event => update(index, "label", event.target.value)} /></Field><Field label="Enlace opcional"><input value={item.href} onChange={event => update(index, "href", event.target.value)} /></Field></div></div>)}</section>;
}

function PositionPreview({ entries, id, title, sortOrder, published }: { entries: { id: number; title: string; sortOrder: number; published: boolean }[]; id: number | null; title: string; sortOrder: number; published: boolean }) {
  const list = ordered([...entries.filter(item => item.id !== id), { id: id ?? Number.MAX_SAFE_INTEGER, title, sortOrder, published }]);
  return <div className="editor-position"><h3>Posición en la página</h3><p className="editor-hint">Los borradores se muestran aquí para organizarte; solo lo publicado aparece en el sitio. Si dos órdenes coinciden, se usa el orden de creación.</p><ol>{list.map(item => <li key={item.id} aria-current={item.id === (id ?? Number.MAX_SAFE_INTEGER) ? "true" : undefined}><span>{item.sortOrder}</span><div>{item.title}<small>{item.id === (id ?? Number.MAX_SAFE_INTEGER) ? "Vista previa actual · " : ""}{item.published ? "Publicado" : "Borrador"}</small></div></li>)}</ol></div>;
}

function ProjectPreview({ project, lang, palette }: { project: ProjectForm; lang: "en" | "es"; palette: Palette }) {
  const title = (lang === "es" ? project.titleEs : project.title) || (lang === "es" ? "Título de tu proyecto" : "Your project title");
  const details = (lang === "es" ? project.detailsEs : project.details).split("\n").filter(Boolean);
  const world=realms[projectRealm(project)],color=isHex(project.accentColor)?project.accentColor:palette.violet;
  return <article className="editor-site-preview" style={paletteStyle(palette)}>
    <div className="editor-realm-preview" style={{borderColor:color}}><span>{lang==='es'?'Reino del proyecto':'Project realm'} · {world.number}</span><strong>{world.name[lang]}</strong><small>{world.discipline[lang]}</small></div>
    <div className="editor-preview-media"><MediaVisual item={project.media[0]} controls /></div>
    <div className="editor-preview-copy"><span className="preview-kicker">{project.category}</span><h3>{title}</h3><p>{(lang === "es" ? project.descriptionEs : project.description) || (lang === "es" ? "Tu descripción aparecerá aquí." : "Your description appears here.")}</p><strong className="preview-outcome">{lang === "es" ? project.outcomeEs : project.outcome}</strong><div className="preview-tags">{project.stack.split(",").map(value => value.trim()).filter(Boolean).map((value, index) => <span key={`${value}-${index}`}>{value}</span>)}</div>{details.length > 0 && <ul>{details.map((value, index) => <li key={index}>{value}</li>)}</ul>}{project.media.length > 1 && <div className="preview-gallery">{project.media.slice(1).map(item => <div key={item.id}><MediaVisual item={item} controls /></div>)}</div>}{project.href && <span className="preview-button">{lang === "es" ? "Explorar proyecto" : "Explore project"}<ExternalLink size={13} /></span>}</div>
  </article>;
}

function SectionPreview({ section, lang, palette, projects }: { section: SectionForm; lang: "en" | "es"; palette: Palette; projects: StoredProject[] }) {
  const title = lang === "es" ? section.titleEs : section.titleEn;
  return <article className={`editor-site-preview section-preview preview-kind-${section.kind}`} style={paletteStyle(palette)}><div className="editor-preview-copy"><span className="preview-kicker">{lang === "es" ? section.eyebrowEs : section.eyebrowEn}</span><h3>{title || (lang === "es" ? "Tu nueva sección" : "Your new section")}</h3><p>{lang === "es" ? section.bodyEs : section.bodyEn}</p>{section.kind === "work" && <div className="preview-section-items">{ordered(projects).filter(project => project.published).map(project => <div key={project.id}><MediaVisual item={legacyMedia(project)[0]} /><h4>{lang === "es" ? project.titleEs : project.title}</h4><p>{lang === "es" ? project.descriptionEs : project.description}</p></div>)}</div>}{section.items.length > 0 && <div className="preview-section-items">{section.items.map((item, index) => <div key={index}><small>{item.label}</small><h4>{lang === "es" ? item.titleEs : item.titleEn}</h4><p>{lang === "es" ? item.bodyEs : item.bodyEn}</p></div>)}</div>}{section.media.length > 0 && <div className="preview-gallery">{section.media.map(item => <div key={item.id}><MediaVisual item={item} controls /></div>)}</div>}{section.href && <span className="preview-button">{(lang === "es" ? section.linkLabelEs : section.linkLabelEn) || (lang === "es" ? "Explorar" : "Explore")}<ExternalLink size={13} /></span>}</div><small className="preview-layout-label">{sectionLabels[section.kind]} · Previsualización de contenido a escala</small></article>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div className="editor-color-field"><span>{label}</span><div><input type="color" aria-label={`Selector: ${label}`} value={isHex(value) ? value : "#000000"} onChange={event => onChange(event.target.value)} /><input type="text" aria-label={`Código hexadecimal: ${label}`} value={value} pattern="#[0-9a-fA-F]{6}" maxLength={7} required onChange={event => onChange(event.target.value)} spellCheck={false} /></div></div>; }
function contrast(first: string, second: string): string { const luminance = (hex: string) => { const values = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4); return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722; }; const a = luminance(first), b = luminance(second); return ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(1); }
function AppearancePreview({ palette, lang }: { palette: Palette; lang: "en" | "es" }) { return <div className="editor-site-preview palette-preview" style={paletteStyle(palette)}><div className="preview-nav"><strong>AU</strong><span>{lang === "es" ? "Proyectos · Perfil · Contacto" : "Work · About · Contact"}</span></div><div className="editor-preview-copy"><span className="preview-kicker">UNITY · UNREAL · WEB</span><h3>{lang === "es" ? "Ideas que cobran vida." : "Ideas made playable."}</h3><p>{lang === "es" ? "Texto secundario para describir tus proyectos con claridad." : "Secondary text that describes your projects clearly."}</p><div className="preview-example-card"><strong>{lang === "es" ? "Tarjeta de proyecto" : "Project card"}</strong><p>{lang === "es" ? "Contenido, bordes y acentos de tu paleta." : "Content, borders and accents from your palette."}</p><div className="preview-swatches">{(["cyan", "violet", "amber", "lime", "rose"] as const).map(color => <span key={color} style={{ color: palette[color] }}>{color}</span>)}</div></div><span className="preview-button">{lang === "es" ? "Ver proyecto" : "View project"}<ExternalLink size={14} /></span><small className="preview-success">● {lang === "es" ? "Disponible" : "Available"}</small><small className="preview-faint">{lang === "es" ? "Texto auxiliar · Información adicional" : "Auxiliary text · Additional information"}</small><div className="preview-contrast">Contraste texto/fondo: {contrast(palette.text, palette.bg)}:1 · botón: {contrast(palette.buttonText, palette.buttonBg)}:1 <span>Referencia para texto normal: 4.5:1</span></div></div></div>; }
