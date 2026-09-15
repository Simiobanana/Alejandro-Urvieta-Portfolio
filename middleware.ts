import { NextResponse, type NextRequest } from "next/server";

export function middleware(request:NextRequest) {
  const response=NextResponse.next();
  response.headers.set("X-Content-Type-Options","nosniff");
  if(process.env.NODE_ENV==="production")response.headers.set("X-Frame-Options","DENY");
  response.headers.set("Referrer-Policy","strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy","camera=(), microphone=(), geolocation=()");
  if(request.nextUrl.pathname.startsWith("/editor")||request.nextUrl.pathname.startsWith("/api/admin/"))response.headers.set("Cache-Control","private, no-store");
  if(process.env.NODE_ENV==="production") response.headers.set("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests");
  if(request.nextUrl.pathname.startsWith("/media/"))response.headers.set("Content-Security-Policy","default-src 'none'; sandbox");
  return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.svg).*)"]};

