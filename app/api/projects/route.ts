import { readProjects } from "@/lib/content-repository";
export async function GET(){try{return Response.json({projects:await readProjects()},{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({error:"Contenido temporalmente no disponible."},{status:503});}}
