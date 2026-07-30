import { AppProviders } from "@/components/Providers";
import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AfroLang-Library",
  description: "Index des datasets de langues africaines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-cream-paper font-serif text-ink-black antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
