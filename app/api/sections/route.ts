import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { customSections } from "../../../db/schema";
export async function GET(){try{return Response.json({sections:await getDb().select().from(customSections).orderBy(asc(customSections.sortOrder),asc(customSections.id))})}catch(error){return Response.json({sections:[],error:error instanceof Error?error.message:"Database unavailable"})}}
