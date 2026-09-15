export type MediaItem = { id: string; url: string; type: string; alt: string; poster?: string };
export type SectionKind = "hero" | "highlights" | "work" | "profile" | "experience" | "contact" | "custom";
export type SectionItem = { titleEn: string; titleEs: string; bodyEn: string; bodyEs: string; label: string; href: string };
export type StoredProject = {
  id: number; title: string; titleEs: string; category: string; description: string; descriptionEs: string;
  outcome: string; outcomeEs: string; details: string[]; detailsEs: string[]; stack: string[];
  href: string; repo: string; mediaUrl: string; mediaType: string; mediaAlt: string; media: MediaItem[];
  featured: boolean; published: boolean; sortOrder: number; code: string; accent: string;
};
export type StoredSection = {
  id: number; kind: SectionKind; eyebrowEn: string; eyebrowEs: string; titleEn: string; titleEs: string;
  bodyEn: string; bodyEs: string; linkLabelEn: string; linkLabelEs: string; href: string;
  mediaUrl: string; mediaType: string; media: MediaItem[]; items: SectionItem[]; published: boolean; sortOrder: number;
};
export const sectionLabels: Record<SectionKind,string> = { hero:"Portada", highlights:"Cifras destacadas", work:"Proyectos", profile:"Perfil", experience:"Experiencia", contact:"Contacto", custom:"Sección libre" };
