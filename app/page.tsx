import Portfolio from "./portfolio";
import { loadPublicContent } from "@/lib/content-repository";
export default async function Home(){return <Portfolio initialData={await loadPublicContent()}/>;}
