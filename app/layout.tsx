import type { Metadata } from "next";
import { Cinzel, Manrope } from "next/font/google";
import "./globals.css";

const cinzel=Cinzel({subsets:["latin"],weight:["500","700"],variable:"--font-display"});
const manrope=Manrope({subsets:["latin"],weight:["400","500","600","700"],variable:"--font-body"});

export const metadata: Metadata = {
  title: "Alejandro Urvieta | Game Developer & Technical Artist",
  description: "Portfolio of Alejandro Urvieta: Unity tools, Unreal Engine gameplay, real-time VFX, C++ graphics and interactive web development.",

  icons: { icon: "/favicon.svg?v=code-1", shortcut: "/favicon.svg?v=code-1" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark" className={`${cinzel.variable} ${manrope.variable}`}><body>{children}</body></html>;
}
