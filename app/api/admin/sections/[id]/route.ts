import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { customSections } from "@/db/schema";
import { requireEditor } from "@/lib/editor-auth";
import { sectionInput, readInput, inputError } from "@/lib/content-validation";
import { serializeSection } from "@/lib/content-repository";
type Context={params:Promise<{id:string}>};
export async function PUT(request:Request,context:Context){const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});const id=Number((await context.params).id);if(!Number.isSafeInteger(id)||id<1)return Response.json({error:"ID inválido."},{status:400});try{const body=await readInput(request,sectionInput);const [row]=await getDb().update(customSections).set({...{...body,items:JSON.stringify(body.items),media:JSON.stringify(body.media)},updatedAt:sql`CURRENT_TIMESTAMP`}).where(eq(customSections.id,id)).returning();return row?Response.json({section:serializeSection(row)}):Response.json({error:"No encontrado."},{status:404});}catch(error){return inputError(error);}}
export async function DELETE(request:Request,context:Context){const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});const id=Number((await context.params).id);if(!Number.isSafeInteger(id)||id<1)return Response.json({error:"ID inválido."},{status:400});try{const rows=await getDb().delete(customSections).where(eq(customSections.id,id)).returning({id:customSections.id});return rows.length?Response.json({ok:true}):Response.json({error:"No encontrado."},{status:404});}catch(error){return inputError(error);}}
