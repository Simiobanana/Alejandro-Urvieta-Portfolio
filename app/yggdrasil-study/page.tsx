import type { Metadata } from 'next';
import Study from './study';
export const metadata: Metadata={title:'Yggdrasil · Estudio de los tres reinos',robots:{index:false,follow:false}};
export default function Page(){return <Study/>;}
