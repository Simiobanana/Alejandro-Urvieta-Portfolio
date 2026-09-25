import type { Metadata } from 'next';
import Study from './study';
import { loadPublicContent } from '@/lib/content-repository';
export const metadata: Metadata={title:'Yggdrasil · Estudio de los tres reinos',robots:{index:false,follow:false}};
export default async function Page(){const {projects}=await loadPublicContent();return <Study projects={projects}/>;}
