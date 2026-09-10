import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alejandro Urvieta — Game & Software Developer",
  description: "Unity tools, Unreal Engine gameplay, C++ graphics and interactive web development from Querétaro, Mexico.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-theme="dark"><body>{children}</body></html>;
}
