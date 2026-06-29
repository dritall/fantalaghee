import type { Metadata } from "next";
import { Outfit, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { IscrivitiFab } from "@/components/ui/IscrivitiFab";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});
const greatVibes = Great_Vibes({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-great-vibes"
});

export const metadata: Metadata = {
  title: "Fanta Laghèe",
  description: "Il fantacalcio d'élite della Brianza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link
          rel="preload"
          as="image"
          href="/image/bg-desktop-2627.webp"
          media="(min-width: 768px)"
        />
        <link
          rel="preload"
          as="image"
          href="/image/bg-mobile-2627.webp"
          media="(max-width: 767px)"
        />
      </head>
      <body className={`${outfit.variable} ${inter.variable} ${greatVibes.variable} font-sans antialiased text-[#10241a] bg-[#0d0a2a] stadium-bg relative overflow-x-hidden min-h-screen flex flex-col`}>
        <div className="ambient-blobs" aria-hidden="true" />
        <Navbar />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <IscrivitiFab />
        <Footer />
      </body>
    </html>
  );
}
