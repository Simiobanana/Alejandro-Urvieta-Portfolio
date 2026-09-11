import { getChatGPTUser } from "../app/chatgpt-auth";
export const OWNER_USER_ID="0df9999e-fc9c-4e55-beac-6f7eb796929c";
export function isPortfolioOwner(userId:string){return userId===OWNER_USER_ID||(process.env.NODE_ENV==="development"&&userId==="local_seedy")}
export async function requireEditor(){const user=await getChatGPTUser();if(!user)return{ok:false as const,status:401,message:"Inicia sesión con ChatGPT para continuar."};if(!isPortfolioOwner(user.userId))return{ok:false as const,status:403,message:"Esta cuenta no tiene acceso al editor."};return{ok:true as const,user};}
