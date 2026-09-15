import type { CSSProperties } from "react";
export const colorLabels = {
  bg:"Fondo", bg2:"Fondo secundario", surface:"Tarjetas", surfaceStrong:"Paneles y navegación", solid:"Elementos sólidos",
  text:"Texto principal", muted:"Texto secundario", faint:"Texto auxiliar", line:"Bordes", lineStrong:"Bordes destacados",
  cyan:"Neón cian", violet:"Neón violeta", amber:"Ámbar", lime:"Verde", rose:"Rosa",
  buttonBg:"Botón principal", buttonText:"Texto del botón", success:"Estado disponible"
};
export type Palette = Record<keyof typeof colorLabels,string>;
export const defaultPalette: {dark:Palette;light:Palette} = {
  dark:{bg:"#05070b",bg2:"#090c13",surface:"#0e131d",surfaceStrong:"#121824",solid:"#101620",text:"#f4f8ff",muted:"#9ba8bd",faint:"#8c98ab",line:"#303642",lineStrong:"#515968",cyan:"#31e9ff",violet:"#9d6cff",amber:"#ffbd59",lime:"#87ef67",rose:"#ff6cae",buttonBg:"#f4f8ff",buttonText:"#05070b",success:"#87ef67"},
  light:{bg:"#f4f7fb",bg2:"#e9eef6",surface:"#ffffff",surfaceStrong:"#ffffff",solid:"#ffffff",text:"#0a1423",muted:"#445166",faint:"#58657a",line:"#c0c9d5",lineStrong:"#8a98ad",cyan:"#006579",violet:"#6333a5",amber:"#915400",lime:"#397800",rose:"#a51e5a",buttonBg:"#0a1423",buttonText:"#f4f7fb",success:"#397800"}
};
export type Settings = {
  accentCyan:string;accentViolet:string;motionLevel:number;heroTitleEn:string;heroTitleEs:string;
  heroTextEn:string;heroTextEs:string;availabilityEn:string;availabilityEs:string;
  palette: { dark:Palette;light:Palette }; previewSeconds:number; revealStyle:"pixels"|"fade"|"rise"|"none";
};
export const defaultSettings:Settings={
  accentCyan:"#31e9ff",accentViolet:"#9d6cff",motionLevel:2,
  heroTitleEn:"I engineer playable ideas.",heroTitleEs:"Convierto ideas en experiencias jugables.",
  heroTextEn:"Game and software developer focused on Unity, C# and Unreal Engine 5.",heroTextEs:"Desarrollador de videojuegos y software enfocado en Unity, C# y Unreal Engine 5.",
  availabilityEn:"Available for new opportunities",availabilityEs:"Disponible para nuevas oportunidades",
  palette:defaultPalette,previewSeconds:6,revealStyle:"pixels"
};
const cssNames:Partial<Record<keyof Palette,string>>={bg2:"bg-2",surfaceStrong:"surface-strong",lineStrong:"line-strong",buttonBg:"button-bg",buttonText:"button-text"};
export function paletteStyle(palette:Palette):CSSProperties {
  return Object.fromEntries(Object.entries(palette).map(([k,v])=>[`--${cssNames[k as keyof Palette]??k}`,v])) as CSSProperties;
}
