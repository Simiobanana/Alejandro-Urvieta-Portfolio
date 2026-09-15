import { getDb } from "@/db";
import { customSections } from "@/db/schema";
import { requireEditor } from "@/lib/editor-auth";
import { sectionInput, readInput, inputError } from "@/lib/content-validation";
import { readSections, serializeSection } from "@/lib/content-repository";
export async function GET(request:Request){const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});try{return Response.json({sections:await readSections(true)},{headers:{"Cache-Control":"no-store"}});}catch(error){return inputError(error);}}
export async function POST(request:Request){const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});try{const body=await readInput(request,sectionInput);const [row]=await getDb().insert(customSections).values({...body,items:JSON.stringify(body.items),media:JSON.stringify(body.media)}).returning();return Response.json({section:serializeSection(row)},{status:201});}catch(error){return inputError(error);}}
