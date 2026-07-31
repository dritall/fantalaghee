import type { Metadata, Viewport } from "next";
import { Outfit, Inter, Great_Vibes, Lora, Oswald } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { IscrivitiFab } from "@/components/ui/IscrivitiFab";
import { LEAGUE_TAGLINE } from "@/lib/seasons";

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
// Coppia tipografica della Gazzetta: Lora per il testo (grazie da lettura),
// Oswald condensato per titoli, occhielli e tabelle.
const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-lora"
});
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-condensed"
});

export const metadata: Metadata = {
  title: {
    default: `Fanta Laghèe — ${LEAGUE_TAGLINE}`,
    template: "%s · Fanta Laghèe",
  },
  description: `${LEAGUE_TAGLINE}: classifica, verdetti, risultati di Serie A e La Gazzetta del Laghèe.`,
  openGraph: {
    title: `Fanta Laghèe — ${LEAGUE_TAGLINE}`,
    description: `${LEAGUE_TAGLINE}: classifica, verdetti, risultati di Serie A e La Gazzetta del Laghèe.`,
    locale: "it_IT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0a2a",
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
      <body className={`${outfit.variable} ${inter.variable} ${greatVibes.variable} ${lora.variable} ${oswald.variable} font-sans antialiased text-[#10241a] bg-[#0d0a2a] stadium-bg relative overflow-x-hidden min-h-screen flex flex-col`}>
        <a
          href="#contenuto"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]
                     focus:rounded-full focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Vai al contenuto
        </a>
        <div className="ambient-blobs" aria-hidden="true" />
        <Navbar />
        <div id="contenuto" className="flex-1 flex flex-col">
          {children}
        </div>
        <IscrivitiFab />
        <Footer />
      </body>
    </html>
  );
}
