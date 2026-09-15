import { readSettings } from "@/lib/content-repository";
export async function GET(){try{return Response.json({settings:await readSettings()},{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({error:"Contenido temporalmente no disponible."},{status:503});}}
