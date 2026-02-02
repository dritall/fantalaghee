import type { Metadata } from "next";
import { Oswald, Merriweather, Great_Vibes } from "next/font/google"; // Added Great_Vibes
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-serif"
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
      <body className={`${oswald.variable} ${merriweather.variable} ${greatVibes.variable} font-sans antialiased text-white bg-[#050505] relative overflow-x-hidden`}>
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
