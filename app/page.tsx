"use client";

import React, { useState, useEffect } from "react";
import { Marchio } from "@/components/ui/Marchio";
import { Activity, Trophy, ShieldCheck, BookOpen, UserPlus, ArrowRight, Download, Newspaper } from "lucide-react";
import { ISCRIZIONE_FORM_URL, REGOLAMENTO_PDF_URL, LEAGUE_TAGLINE } from "@/lib/seasons";
import { NavTile, type NavTileData } from "@/components/ui/NavTile";
import { SeasonBanner } from "@/components/ui/SeasonBanner";
import { SeasonLink } from "@/components/ui/SeasonLink";
import { FasciaScorre } from "@/components/ui/FasciaScorre";
import { Tabellone } from "@/components/layout/Tabellone";

const navItems: NavTileData[] = [
  { href: "/classifica", icon: Trophy, title: "Classifica", desc: "Chi comanda la lega, giornata per giornata", hex: "var(--lario)" },
  { href: "/verdetto", icon: ShieldCheck, title: "Verdetto", desc: "Premi, statistiche e record di stagione", hex: "var(--oro)" },
  { href: "/risultati-serie-a", icon: Activity, title: "Serie A", desc: "Risultati, formazioni e classifica reale", hex: "var(--vermiglio)" },
  { href: "/regolamento", icon: BookOpen, title: "Regolamento", desc: "Le regole del gioco, senza discussioni", hex: "var(--calce)" },
];

export default function Home() {
  const [latestArticle, setLatestArticle] = useState<any>(null);

  useEffect(() => {
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const first = data.find((a: any) => !a.placeholder) || data[0];
          setLatestArticle(first?.placeholder ? null : first);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <main className="min-h-screen pt-16 md:pt-20 font-sans relative z-10">

      {/* La banda dei numeri passa subito sotto la testata: è la prima cosa
          che si muove, e dice cos'è questo posto senza spiegarlo. */}
      <FasciaScorre />

      <div className="max-w-5xl mx-auto px-4 pt-5 pb-32 space-y-8">

        <SeasonBanner />

        {/* ================= INSEGNA ================= */}
        <header className="flex flex-col items-center text-center gap-3">
          <Marchio priority className="w-[180px] md:w-[240px] h-auto" />

          <h1 className="border-y-2 border-[color:var(--calce)]/70 bg-[color:var(--pece)]/70 px-5 py-2
                         text-[10px] md:text-[11px] font-black uppercase tracking-[0.32em] text-[color:var(--calce)] backdrop-blur-sm">
            {LEAGUE_TAGLINE}
          </h1>
        </header>

        {/* ================= LO STRISCIONE =================
            Una sola cosa urlata per pagina: qui sono le iscrizioni. */}
        <a
          href={ISCRIZIONE_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="striscione grana scatto scatto-lario block px-6 py-8 md:px-10 md:py-10 mt-2"
        >
          <span className="relative z-[3] block text-center">
            <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-[color:var(--su-colore)]/70">
              Stagione 2026/27 · iscrizioni aperte
            </span>
            <span className="stampino mt-3 block text-[2.1rem] leading-[0.9] sm:text-5xl md:text-6xl text-[color:var(--su-colore)]">
              Metti la<br />squadra in campo
            </span>
            <span className="mt-5 inline-flex items-center gap-2 border-2 border-[color:var(--su-colore)] px-5 py-2.5
                             text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--su-colore)]">
              <UserPlus className="w-4 h-4" />
              Compila il form
              <ArrowRight className="w-4 h-4" />
            </span>
          </span>
        </a>

        {/* ================= NAVIGAZIONE ================= */}
        <section aria-label="Sezioni del sito" className="pt-2">
          <div className="flex items-center gap-3 mb-4">
            <span className="timbro bg-[color:var(--calce)] text-[color:var(--pece)]">Esplora la lega</span>
            <span className="h-[2px] flex-1 bg-[color:var(--filo)]" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {navItems.map((item, index) => (
              <NavTile key={item.href} item={item} index={index} />
            ))}
          </div>
        </section>

        {/* ================= ULTIMA GAZZETTA ================= */}
        {latestArticle && (
          <section aria-label="Ultimo articolo della Gazzetta">
            <div className="flex items-center gap-3 mb-4">
              <span className="timbro bg-[color:var(--oro)] text-[color:var(--su-chiaro)]">Ultima uscita</span>
              <span className="h-[2px] flex-1 bg-[color:var(--filo)]" />
            </div>

            <SeasonLink
              href={`/gazzetta/${latestArticle.id}`}
              className="group scatto relative block overflow-hidden border-2 border-[color:var(--calce)] bg-[color:var(--pece)]"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                style={{ backgroundImage: `url(${latestArticle.imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--pece)] via-[color:var(--pece)]/92 to-[color:var(--pece)]/45" />
              <div className="relative z-10 flex min-h-[300px] flex-col justify-end p-6 md:p-9">
                <span className="timbro w-fit bg-[color:var(--vermiglio)] text-[color:var(--su-colore)]">
                  <Newspaper className="w-3 h-3" />
                  La Gazzetta
                </span>
                <h3 className="stampino mt-4 text-3xl md:text-5xl text-[color:var(--calce)]">
                  {latestArticle.title}
                </h3>
                {latestArticle.description && (
                  <p className="mt-3 line-clamp-2 font-serif italic text-sm text-[color:var(--calce)]/60 md:max-w-2xl">
                    {latestArticle.description}
                  </p>
                )}
                <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--lario)]">
                  Leggi l&apos;articolo
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </div>
            </SeasonLink>
          </section>
        )}

        {/* ================= IL PUNTO ================= */}
        <section aria-label="Il punto sulla lega">
          <div className="flex items-center gap-3 mb-4">
            <span className="timbro bg-[color:var(--lario)] text-[color:var(--su-chiaro)]">Il punto</span>
            <span className="h-[2px] flex-1 bg-[color:var(--filo)]" />
          </div>
          <Tabellone />
        </section>

        {/* ================= REGOLAMENTO ================= */}
        <a
          href={REGOLAMENTO_PDF_URL}
          download
          className="group scatto flex items-center gap-4 border-2 border-[color:var(--filo)] bg-[color:var(--fondale)] px-5 py-4"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[color:var(--calce)]/25 bg-[color:var(--secca)]">
            <Download className="h-5 w-5 text-[color:var(--calce)] transition-transform duration-300 group-hover:translate-y-0.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black uppercase tracking-wider text-[color:var(--calce)]">
              Scarica il Regolamento
            </span>
            <span className="mt-0.5 block text-xs text-[color:var(--fumo)]">PDF completo della stagione 2026/27</span>
          </span>
          <ArrowRight className="h-4 w-4 text-[color:var(--fumo)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[color:var(--calce)]" />
        </a>

      </div>
    </main>
  );
}
