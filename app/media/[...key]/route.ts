import { env } from "cloudflare:workers";
type Context={params:Promise<{key:string[]}>};
async function serve(request:Request,context:Context){
 if(!env.BUCKET)return new Response("Unavailable",{status:503});
 const key=(await context.params).key.join("/");
 if(!/^portfolio\/[a-zA-Z0-9._-]+$/.test(key))return new Response("Not found",{status:404});
 const info=await env.BUCKET.head(key);if(!info)return new Response("Not found",{status:404});
 const headers=new Headers({"Content-Type":info.httpMetadata?.contentType||"application/octet-stream","ETag":info.httpEtag,"Cache-Control":"public, max-age=31536000, immutable","Accept-Ranges":"bytes","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox"});
 if(request.headers.get("if-none-match")===info.httpEtag)return new Response(null,{status:304,headers});
 const range=request.headers.get("range");let start=0,end=info.size-1,status=200;
 if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{"Content-Range":"bytes */"+info.size}});
 if(!match[1])start=Math.max(0,info.size-Number(match[2]));else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
 if(start>end||start>=info.size||!Number.isSafeInteger(start)||!Number.isSafeInteger(end))return new Response(null,{status:416,headers:{"Content-Range":"bytes */"+info.size}});
 status=206;headers.set("Content-Range","bytes "+start+"-"+end+"/"+info.size);}
 headers.set("Content-Length",String(end-start+1));if(request.method==="HEAD")return new Response(null,{status,headers});
 const object=await env.BUCKET.get(key,range?{range:{offset:start,length:end-start+1}}:undefined);if(!object)return new Response("Not found",{status:404});
 return new Response(object.body,{status,headers});
}
export const GET=serve;export const HEAD=serve;
