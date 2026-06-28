"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Activity, Trophy, ShieldCheck, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { ISCRIZIONE_FORM_URL } from "@/lib/seasons";
import { UserPlus } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [round, setRound] = useState(0);
  const [latestArticle, setLatestArticle] = useState<any>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(true);

  useEffect(() => {
    fetch('/api/sofascore?endpoint=tournaments/get-last-matches&tournamentId=23&seasonId=76457').then(res => res.json()).then(data => {
        const events = data?.events || [];
        if (events.length > 0) {
          const latestRound = Math.max(...events.map((m: any) => m.roundInfo?.round || 0));
          setRound(latestRound);
          setResults(events.filter((m: any) => m.roundInfo?.round === latestRound));
        }
        setIsLoadingResults(false);
      }).catch(() => setIsLoadingResults(false));

    fetch('/api/articles').then(res => res.json()).then(data => {
         if (data && data.length > 0) setLatestArticle(data[0]);
      });
  }, []);

  const getLogo = (id: number) => "/api/sofascore?endpoint=teams/get-logo&teamId=" + id;

  const navItems = [
    { href: "/regolamento", icon: BookOpen, title: "REGOLAMENTO", desc: "Tutto quello che ti serve", color: "text-indigo-400", hex: "#6366f1" },
    { href: "/risultati-serie-a", icon: Activity, title: "RISULTATI", desc: "La Serie A", color: "text-blue-400", hex: "#2563EB" },
    { href: "/classifica", icon: Trophy, title: "CLASSIFICA", desc: "Chi domina la lega?", color: "text-cyan-400", hex: "#06b6d4" },
    { href: "/verdetto", icon: ShieldCheck, title: "VERDETTO", desc: "Statistiche e Premi", color: "text-emerald-400", hex: "#10b981" }
  ];

  return (
    <main className="min-h-screen text-[#10241a] pt-24 p-4 font-sans selection:bg-primary/20 relative z-10">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">

        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="flex justify-center -mb-2">
          <Image src="/image/logo-fantalaghee.png" alt="Logo Fantalaghee" width={320} height={140} priority className="hover:scale-105 transition-transform duration-500 drop-shadow-2xl" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <a href={ISCRIZIONE_FORM_URL} target="_blank" rel="noopener noreferrer" className="block relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-white bg-secondary shadow-md">
              Iscrizioni Aperte
            </span>
            <div className="relative rounded-[2.5rem] p-[1.5px] bg-gradient-to-r from-secondary/70 via-cyan-400/60 to-indigo-500/70 shadow-[0_14px_44px_rgba(8,15,40,0.55)]">
              <div className="relative rounded-[calc(2.5rem-1.5px)] bg-gradient-to-b from-[#0d1430] to-[#080b22] overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[60%] h-40 bg-secondary/20 blur-[80px] rounded-full pointer-events-none" />
                <div className="relative p-6 md:p-8 flex flex-col items-center text-center gap-2 group">
                  <span className="text-cyan-300 font-black text-xs tracking-[0.3em] uppercase px-3 py-1 bg-cyan-400/10 border border-cyan-400/20 rounded-full">
                    Stagione 2026/27
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black font-oswald uppercase tracking-tight text-3d-metallic flex items-center gap-3">
                    <UserPlus className="w-7 h-7 md:w-9 md:h-9 text-cyan-300 group-hover:scale-110 transition-transform" />
                    Iscriviti alla Nuova Stagione
                  </h2>
                  <p className="text-sm text-white/70 font-semibold mt-1 flex items-center gap-1">
                    Clicca qui per compilare il form di partecipazione
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </p>
                </div>
              </div>
            </div>
          </a>
        </motion.div>

        {latestArticle && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Link href={`/gazzetta/${latestArticle.id}`} className="group block relative rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_16px_50px_rgba(6,10,30,0.6)] bg-[#0a0a1e]">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${latestArticle.imageUrl})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06060f] via-[#06060f]/80 to-[#06060f]/30" />
              <div className="relative z-10 p-8 md:p-10 flex flex-col justify-end min-h-[320px]">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-pink-300 font-bold text-xs tracking-[0.3em] uppercase px-3 py-1 bg-pink-500/15 border border-pink-400/30 rounded-full">La Gazzetta</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black font-oswald text-white uppercase leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{latestArticle.title}</h2>
                <p className="mt-3 text-sm text-white/65 line-clamp-2 md:max-w-2xl font-serif italic">{latestArticle.description}</p>
              </div>
            </Link>
          </motion.div>
        )}

        {/* NAVIGAZIONE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 22 } }}
            >
              <Link href={item.href} className="block h-full group">
                <div
                  className="relative h-full rounded-[1.75rem] p-[1.5px] overflow-hidden transition-all duration-300 shadow-[0_10px_34px_rgba(6,10,30,0.5)]"
                  style={{ background: `linear-gradient(160deg, ${item.hex}66, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.02))` }}
                >
                  <div className="relative h-full rounded-[calc(1.75rem-1.5px)] bg-gradient-to-b from-[#0c1228] to-[#080b1e] p-5 flex flex-col overflow-hidden">
                    {/* glow di colore sempre presente in alto, più intenso in hover */}
                    <div
                      className="absolute -inset-px opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `radial-gradient(340px circle at 50% -10%, ${item.hex}33, transparent 65%)` }}
                    />
                    {/* sheen superiore */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                    <div className="relative flex items-center justify-between mb-5">
                      <span
                        className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5"
                        style={{ backgroundColor: `${item.hex}1f`, borderColor: `${item.hex}40` }}
                      >
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </span>
                      <span
                        className="text-[11px] font-black tracking-[0.15em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ color: item.hex }}
                      >
                        →
                      </span>
                    </div>

                    <span className="relative text-base font-black tracking-[0.12em] text-white uppercase leading-none">{item.title}</span>
                    <p className="relative text-xs text-white/55 font-medium mt-1.5">{item.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </main>
  );
}
