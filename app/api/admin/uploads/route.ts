import { env } from "cloudflare:workers";
import { requireEditor } from "@/lib/editor-auth";
const allowed:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","video/mp4":"mp4","video/webm":"webm"};
function matches(bytes:Uint8Array,type:string){const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));if(type==="image/jpeg")return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;if(type==="image/png")return bytes[0]===137&&ascii(1,4)==="PNG";if(type==="image/gif")return ["GIF87a","GIF89a"].includes(ascii(0,6));if(type==="image/webp")return ascii(0,4)==="RIFF"&&ascii(8,12)==="WEBP";if(type==="video/mp4")return ascii(4,8)==="ftyp";return bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163;}
export async function POST(request:Request){
 const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});
 if(!env.BUCKET)return Response.json({error:"Almacenamiento no disponible."},{status:503});
 const limit=90*1024*1024;
 if(Number(request.headers.get("content-length")||0)>limit+65536)return Response.json({error:"El archivo supera 90 MB."},{status:413});
 try{
 if(!request.body)return Response.json({error:"Archivo requerido."},{status:400});
 let size=0;
 const limited=request.body.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({transform(chunk,controller){size+=chunk.byteLength;if(size>limit+65536)throw new Error("Upload too large");controller.enqueue(chunk);}}));
 const form=await new Response(limited,{headers:{"Content-Type":request.headers.get("content-type")||""}}).formData(),file=form.get("file");
 if(!(file instanceof File)||!file.size)return Response.json({error:"Selecciona un archivo."},{status:400});
 if(file.size>limit)return Response.json({error:"El archivo supera 90 MB."},{status:413});
 const extension=allowed[file.type];if(!extension||!matches(new Uint8Array(await file.slice(0,32).arrayBuffer()),file.type))return Response.json({error:"Formato no permitido. Usa JPG, PNG, WebP, GIF, MP4 o WebM; no SVG."},{status:415});
 const key="portfolio/"+Date.now()+"-"+crypto.randomUUID()+"."+extension;
 await env.BUCKET.put(key,file.stream(),{httpMetadata:{contentType:file.type}});
 return Response.json({key,url:"/media/"+key,type:file.type});
 }catch{return Response.json({error:"No se pudo procesar el archivo."},{status:400});}
}
