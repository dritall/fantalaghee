import type { Metadata } from "next";
import { Outfit, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

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
      <body className={`${outfit.variable} ${inter.variable} ${greatVibes.variable} font-sans antialiased text-white bg-[#050505] relative overflow-x-hidden`}>
        {/* Global Background Layer - New HUD Style */}
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute inset-0 bg-[#050505] z-10" />
        </div>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
