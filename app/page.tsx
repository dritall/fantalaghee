"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Activity, Trophy, ShieldCheck, BookOpen, UserPlus, ArrowRight, Download, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import { ISCRIZIONE_FORM_URL, REGOLAMENTO_PDF_URL, LEAGUE_TAGLINE } from "@/lib/seasons";
import { NavTile, type NavTileData } from "@/components/ui/NavTile";
import { SeasonBanner } from "@/components/ui/SeasonBanner";
import { SeasonLink } from "@/components/ui/SeasonLink";

const navItems: NavTileData[] = [
  { href: "/classifica", icon: Trophy, title: "Classifica", desc: "Chi comanda la lega, giornata per giornata", hex: "#22d3ee" },
  { href: "/verdetto", icon: ShieldCheck, title: "Verdetto", desc: "Premi, statistiche e record di stagione", hex: "#10b981" },
  { href: "/risultati-serie-a", icon: Activity, title: "Serie A", desc: "Risultati, formazioni e classifica reale", hex: "#2563EB" },
  { href: "/regolamento", icon: BookOpen, title: "Regolamento", desc: "Le regole del gioco, senza discussioni", hex: "#8b5cf6" },
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
    <main className="min-h-screen pt-28 md:pt-32 p-4 font-sans relative z-10">
      <div className="max-w-5xl mx-auto space-y-8 pb-24">

        <SeasonBanner />

        {/* ================= INSEGNA ================= */}
        <header className="flex flex-col items-center text-center gap-4">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* alone dell'insegna al neon */}
            <span
              className="absolute inset-0 -z-10 blur-[70px] opacity-60 pointer-events-none"
              style={{ background: "radial-gradient(circle at 50% 55%, rgba(99,102,241,0.55), rgba(236,72,153,0.25) 45%, transparent 70%)" }}
              aria-hidden="true"
            />
            <Image
              src="/image/logo-mark.png"
              alt="Fanta Laghèe"
              width={319}
              height={246}
              priority
              className="w-[240px] md:w-[330px] h-auto drop-shadow-2xl transition-transform duration-500 hover:scale-[1.03]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex items-center gap-3 sm:gap-4 w-full max-w-md"
          >
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/25" />
            <h1 className="text-[11px] md:text-xs font-black uppercase tracking-[0.34em] text-white/70 whitespace-nowrap">
              {LEAGUE_TAGLINE}
            </h1>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/25" />
          </motion.div>
        </header>

        {/* ================= ISCRIZIONI ================= */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <a href={ISCRIZIONE_FORM_URL} target="_blank" rel="noopener noreferrer" className="block relative group">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-white bg-secondary shadow-[0_4px_16px_rgba(37,99,235,0.5)]">
              Iscrizioni Aperte
            </span>
            <div className="relative rounded-[2.5rem] p-[1.5px] bg-gradient-to-r from-secondary/70 via-cyan-400/60 to-indigo-500/70 shadow-[0_14px_44px_rgba(8,15,40,0.55)] transition-shadow duration-300 group-hover:shadow-[0_18px_58px_rgba(37,99,235,0.45)]">
              <div className="relative rounded-[calc(2.5rem-1.5px)] bg-gradient-to-b from-[#0d1430] to-[#080b22] overflow-hidden">
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <span className="absolute -top-20 left-1/2 -translate-x-1/2 w-[60%] h-40 bg-secondary/25 blur-[80px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-150" />
                <div className="relative p-6 md:p-8 flex flex-col items-center text-center gap-2">
                  <span className="text-cyan-300 font-black text-xs tracking-[0.3em] uppercase px-3 py-1 bg-cyan-400/10 border border-cyan-400/20 rounded-full">
                    Stagione 2026/27
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black font-oswald uppercase tracking-tight text-3d-metallic flex items-center gap-3">
                    <UserPlus className="w-7 h-7 md:w-9 md:h-9 text-cyan-300 transition-transform duration-300 group-hover:scale-110" />
                    Iscriviti alla Nuova Stagione
                  </h2>
                  <p className="text-sm text-white/70 font-semibold mt-1 flex items-center gap-1.5">
                    Compila il form di partecipazione
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </p>
                </div>
              </div>
            </div>
          </a>
        </motion.div>

        {/* ================= NAVIGAZIONE ================= */}
        <section aria-label="Sezioni del sito">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">Esplora la lega</h2>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {navItems.map((item, index) => (
              <NavTile key={item.href} item={item} index={index} />
            ))}
          </div>
        </section>

        {/* ================= ULTIMA GAZZETTA ================= */}
        {latestArticle && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Ultimo articolo della Gazzetta"
          >
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">Ultima uscita</h2>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <SeasonLink
              href={`/gazzetta/${latestArticle.id}`}
              className="group block relative rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_16px_50px_rgba(6,10,30,0.6)] bg-[#0a0a1e]"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                style={{ backgroundImage: `url(${latestArticle.imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06060f] via-[#06060f]/80 to-[#06060f]/25" />
              <div className="relative z-10 p-7 md:p-10 flex flex-col justify-end min-h-[320px]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-pink-200 font-bold text-xs tracking-[0.24em] uppercase px-3 py-1 bg-pink-500/15 border border-pink-400/30 rounded-full backdrop-blur-sm">
                    <Newspaper className="w-3.5 h-3.5" />
                    La Gazzetta
                  </span>
                </div>
                <h3 className="text-3xl md:text-5xl font-black font-oswald text-white uppercase leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                  {latestArticle.title}
                </h3>
                {latestArticle.description && (
                  <p className="mt-3 text-sm text-white/65 line-clamp-2 md:max-w-2xl font-serif italic">
                    {latestArticle.description}
                  </p>
                )}
                <span className="mt-5 inline-flex items-center gap-2 text-cyan-300 text-xs font-black uppercase tracking-[0.2em]">
                  Leggi l&apos;articolo
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </div>
            </SeasonLink>
          </motion.section>
        )}

        {/* ================= REGOLAMENTO ================= */}
        <motion.a
          href={REGOLAMENTO_PDF_URL}
          download
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4
                     backdrop-blur-md transition-all duration-300 hover:bg-white/[0.07] hover:border-white/20"
        >
          <span className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-violet-300 transition-transform duration-300 group-hover:translate-y-0.5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-black uppercase tracking-wider text-white">Scarica il Regolamento</span>
            <span className="block text-xs text-white/45 mt-0.5">PDF completo della stagione 2026/27</span>
          </span>
          <ArrowRight className="w-4 h-4 text-white/30 transition-all duration-300 group-hover:text-white group-hover:translate-x-1" />
        </motion.a>

      </div>
    </main>
  );
}
