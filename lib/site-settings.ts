import type { CSSProperties } from "react";
export const colorLabels = {
  bg:"Fondo", bg2:"Fondo secundario", surface:"Tarjetas", surfaceStrong:"Paneles y navegación", solid:"Elementos sólidos",
  text:"Texto principal", muted:"Texto secundario", faint:"Texto auxiliar", line:"Bordes", lineStrong:"Bordes destacados",
  cyan:"Neón cian", violet:"Neón violeta", amber:"Ámbar", lime:"Verde", rose:"Rosa",
  buttonBg:"Botón principal", buttonText:"Texto del botón", success:"Estado disponible"
};
export type Palette = Record<keyof typeof colorLabels,string>;
export const defaultPalette: {dark:Palette;light:Palette} = {
  dark:{bg:"#0b0e1a",bg2:"#11142c",surface:"#131729",surfaceStrong:"#171b30",solid:"#0f1323",text:"#f3f1fa",muted:"#aaa6b9",faint:"#817d91",line:"#34384d",lineStrong:"#595e78",cyan:"#34e0c8",violet:"#7c5cfc",amber:"#ffb454",lime:"#8ddd79",rose:"#ff6fa0",buttonBg:"#f3f1fa",buttonText:"#0b0e1a",success:"#34e0c8"},
  light:{bg:"#fafaf8",bg2:"#f0efe9",surface:"#ffffff",surfaceStrong:"#fffefa",solid:"#f3f1eb",text:"#14141a",muted:"#575563",faint:"#777481",line:"#d4d1c9",lineStrong:"#aaa5b6",cyan:"#157f74",violet:"#4b3fd6",amber:"#9a5a00",lime:"#477d39",rose:"#b43768",buttonBg:"#4b3fd6",buttonText:"#ffffff",success:"#18766b"}
};
export type Settings = {
  accentCyan:string;accentViolet:string;motionLevel:number;heroTitleEn:string;heroTitleEs:string;
  heroTextEn:string;heroTextEs:string;availabilityEn:string;availabilityEs:string;
  palette: { dark:Palette;light:Palette }; previewSeconds:number; radarCooldownSeconds:number; revealStyle:"pixels"|"fade"|"rise"|"none";
  categoryColors: Record<"pureProgramming"|"webProgramming"|"engineArt"|"pureArt",string>;
  defaultPresentation:"immersive"|"standard";
};
export const defaultSettings:Settings={
  accentCyan:"#31e9ff",accentViolet:"#9d6cff",motionLevel:2,
  heroTitleEn:"I engineer playable ideas.",heroTitleEs:"Convierto ideas en experiencias jugables.",
  heroTextEn:"Game and software developer focused on Unity, C# and Unreal Engine 5.",heroTextEs:"Desarrollador de videojuegos y software enfocado en Unity, C# y Unreal Engine 5.",
  availabilityEn:"Available for new opportunities",availabilityEs:"Disponible para nuevas oportunidades",
  palette:defaultPalette,previewSeconds:6,radarCooldownSeconds:15,revealStyle:"none",
  categoryColors:{pureProgramming:"#7C5CFC",webProgramming:"#34E0C8",engineArt:"#FF6FA0",pureArt:"#FFB454"},
  defaultPresentation:"immersive"
};
const cssNames:Partial<Record<keyof Palette,string>>={bg2:"bg-2",surfaceStrong:"surface-strong",lineStrong:"line-strong",buttonBg:"button-bg",buttonText:"button-text"};
export function paletteStyle(palette:Palette):CSSProperties {
  return Object.fromEntries(Object.entries(palette).map(([k,v])=>[`--${cssNames[k as keyof Palette]??k}`,v])) as CSSProperties;
}
