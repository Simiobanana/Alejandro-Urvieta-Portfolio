import { getEditorUser } from "../../lib/editor-auth";
import EditorClient from "./editor-client";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata:Metadata={robots:{index:false,follow:false,nocache:true}};

export default async function EditorPage(){
  const user=await getEditorUser();
  if(!user)return <main className="editor-shell"><section className="editor-auth glass"><p className="kicker">PORTFOLIO CMS</p><h1>Editor privado</h1><p>El acceso se habilita exclusivamente para el correo propietario mediante Cloudflare Access.</p><Link className="back-link" href="/">← Volver al portafolio</Link></section></main>;
  return <EditorClient userName={user.displayName}/>;
}

