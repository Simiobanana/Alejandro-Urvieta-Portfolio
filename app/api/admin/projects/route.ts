import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { requireEditor } from "@/lib/editor-auth";
import { projectInput, readInput, inputError } from "@/lib/content-validation";
import { readProjects, serializeProject } from "@/lib/content-repository";
export async function GET(request:Request){const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});try{return Response.json({projects:await readProjects(true)},{headers:{"Cache-Control":"no-store"}});}catch(error){return inputError(error);}}
export async function POST(request:Request){const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});try{const body=await readInput(request,projectInput);const [row]=await getDb().insert(projects).values({...body,details:JSON.stringify(body.details),detailsEs:JSON.stringify(body.detailsEs),stack:JSON.stringify(body.stack),media:JSON.stringify(body.media)}).returning();return Response.json({project:serializeProject(row)},{status:201});}catch(error){return inputError(error);}}
