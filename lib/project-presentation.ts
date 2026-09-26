import type { ProjectCategory, StoredProject } from "./content-types";
import type { Settings } from "./site-settings";

export const categoryLabels: Record<ProjectCategory,{en:string;es:string}> = {
  "Pure Programming": { en:"Programming", es:"Programación" },
  "Web Programming": { en:"Web programming", es:"Programación web" },
  "Engine + Art": { en:"Engine + Art", es:"Motor + Arte" },
  "Pure Art": { en:"Art", es:"Arte" },
};

export function normalizeCategory(project: Pick<StoredProject,"title"|"category">): ProjectCategory {
  if (Object.prototype.hasOwnProperty.call(categoryLabels, project.category)) return project.category as ProjectCategory;
  const title=project.title.toLowerCase(),category=project.category.toLowerCase();
  if(category.includes("web")||title.includes("há kai")||title.includes("ká hai")||title.includes("ka hai"))return "Web Programming";
  if(category==="pure art"||title.includes("shield")||title.includes("environment"))return "Pure Art";
  if(category==="engine + art"||category.includes("hybrid")||title.includes("exit 8")||title.includes("automaton")||title.includes("material"))return "Engine + Art";
  return "Pure Programming";
}

export function categoryColor(project:StoredProject,settings:Settings){
  if(/^#[\da-f]{6}$/i.test(project.accentColor))return project.accentColor;
  const category=normalizeCategory(project);
  return settings.categoryColors[category==="Pure Programming"?"pureProgramming":category==="Web Programming"?"webProgramming":category==="Engine + Art"?"engineArt":"pureArt"];
}

const positions=[[24,30],[76,30],[13,46],[87,46],[27,61],[73,61],[50,75],[38,45],[62,45]];
export function hotspotPosition(project:StoredProject,index:number){
  if(project.hotspotX!==null&&project.hotspotY!==null)return {x:project.hotspotX,y:project.hotspotY};
  if(project.featured)return {x:50,y:17};
  const slot=positions[Math.max(0,index-1)%positions.length];return {x:slot[0],y:slot[1]};
}
