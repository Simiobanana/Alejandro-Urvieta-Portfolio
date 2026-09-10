import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";
import { OWNER_USER_ID } from "../../lib/editor-auth";
import EditorClient from "./editor-client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditorPage(){
  const user=await getChatGPTUser();
  if(!user)return <main className="editor-shell"><section className="editor-auth glass"><p className="kicker">PORTFOLIO CMS</p><h1>Editor privado</h1><p>Inicia sesión con la cuenta propietaria para administrar proyectos y archivos.</p><a className="button primary" href={chatGPTSignInPath("/editor")}>Iniciar sesión con ChatGPT</a><Link className="back-link" href="/">← Volver al portafolio</Link></section></main>;
  if(user.userId!==OWNER_USER_ID)return <main className="editor-shell"><section className="editor-auth glass"><p className="kicker">ACCESO RESTRINGIDO</p><h1>Esta cuenta no puede editar.</h1><p>La sesión corresponde a {user.email}.</p><a className="button ghost" href={chatGPTSignOutPath("/editor")}>Cambiar de cuenta</a></section></main>;
  return <EditorClient userName={user.displayName}/>;
}

