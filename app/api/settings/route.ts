import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { siteSettings } from "../../../db/schema";
const defaults={id:1,accentCyan:"#31e9ff",accentViolet:"#9d6cff",motionLevel:2,heroTitleEn:"I engineer playable ideas.",heroTitleEs:"Convierto ideas en experiencias jugables.",heroTextEn:"Game and software developer focused on Unity, C# and Unreal Engine 5.",heroTextEs:"Desarrollador de videojuegos y software enfocado en Unity, C# y Unreal Engine 5.",availabilityEn:"Available for new opportunities",availabilityEs:"Disponible para nuevas oportunidades"};
export async function GET(){try{const[settings]=await getDb().select().from(siteSettings).where(eq(siteSettings.id,1));return Response.json({settings:settings??defaults})}catch{return Response.json({settings:defaults})}}
