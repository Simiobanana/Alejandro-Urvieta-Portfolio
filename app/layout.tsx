import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alejandro Urvieta | Game Developer & Technical Artist",
  description: "Portfolio of Alejandro Urvieta: Unity tools, Unreal Engine gameplay, real-time VFX, C++ graphics and interactive web development.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark"><body>{children}</body></html>;
}
