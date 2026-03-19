"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, BookOpen, Newspaper, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Risultati Serie A",
    description: "Calendario, risultati LIVE e statistiche avanzate.",
    href: "/risultati-serie-a",
    icon: Trophy,
    color: "text-cyan-400",
    bg: "hover:bg-cyan-400/10",
    border: "hover:border-cyan-400/50"
  },
  {
    title: "Classifica Lega",
    description: "Consulta la classifica aggiornata della nostra lega.",
    href: "/classifica",
    icon: Trophy,
    color: "text-yellow-400",
    bg: "hover:bg-yellow-400/10",
    border: "hover:border-yellow-400/50"
  },
  {
    title: "La Gazzetta",
    description: "Leggi le ultime notizie e gli approfondimenti.",
    href: "/gazzetta",
    icon: Newspaper,
    color: "text-rose-400",
    bg: "hover:bg-rose-400/10",
    border: "hover:border-rose-400/50"
  },
  {
    title: "Regolamento",
    description: "Scopri le regole ufficiali della lega.",
    href: "/regolamento",
    icon: BookOpen,
    color: "text-indigo-400",
    bg: "hover:bg-indigo-400/10",
    border: "hover:border-indigo-400/50"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { stiffness: 50 } }
};

export default function Home() {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/football?endpoint=football-get-all-matches-by-league&leagueid=55')
      .then(res => res.json())
      .then(data => {
        const res = data?.raw?.response || data?.response || [];
        let matches = Array.isArray(res) ? res.flatMap((r: any) => r.matches || []) : (res.matches || []);
        
        // Filter finished matches and sort by time (desc)
        const finished = matches
          .filter((m: any) => m.status?.finished || m.statusId === 6)
          .sort((a: any, b: any) => new Date(b.status?.utcTime || b.status?.startTime || 0).getTime() - new Date(a.status?.utcTime || a.status?.startTime || 0).getTime())
          .slice(0, 4);
          
        setResults(finished);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center px-4 py-32">

      {/* Background Layer - FINAL NEON FIELD V2 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#050505]/85 z-10" />
        <Image
          src="/image/bg-field-neon-v2.png"
          alt="Background"
          fill
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] z-20" />
      </div>

      <div className="relative z-30 max-w-6xl w-full flex flex-col gap-12">

        {/* Hero Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center text-center space-y-2"
        >
          <div className="relative z-50 flex items-center justify-center p-2 md:p-4 select-none w-full max-w-[600px] mx-auto">
            <Image
              src="/image/logo-fantalaghee.png"
              alt="Fantalaghee Official Logo"
              width={600}
              height={300}
              className="w-full h-auto drop-shadow-2xl"
              priority={true}
            />
            <div className="absolute inset-0 bg-green-500/10 blur-[120px] z-0 rounded-full opacity-40 pointer-events-none mix-blend-screen" />
          </div>
        </motion.div>

        {/* Main Hub Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Sections Cards */}
          <div className="lg:col-span-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {sections.map((section) => (
                <motion.div key={section.title} variants={itemVariants}>
                  <Link href={section.href} className="block group" aria-label={section.title}>
                    <div className={cn(
                      "relative overflow-hidden bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl rounded-[2rem] p-7 transition-all duration-300 hover:-translate-y-2",
                      section.bg, section.border
                    )}>
                      <div className="flex items-center justify-between mb-4">
                        <section.icon className={cn("w-8 h-8", section.color)} />
                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-all transform -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                      </div>
                      <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">
                        {section.title}
                      </h2>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed group-hover:text-slate-200">
                        {section.description}
                      </p>
                      <div className={cn(
                        "absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        section.color
                      )} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Ultimi Risultati Widget */}
          <div className="lg:col-span-4">
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                   Ultimi Risultati
                </h3>
                <Link href="/risultati-serie-a" className="text-[10px] font-black text-cyan-400 hover:text-white uppercase tracking-widest transition-colors">Vedi Tutti</Link>
              </div>

              <div className="space-y-6 flex-1">
                {results.length > 0 ? results.map((m, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                    <div className="flex flex-col items-center gap-1 w-[35%]">
                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}.png`} className="w-8 h-8 object-contain" alt="" />
                      <span className="text-[9px] font-black text-slate-400 uppercase truncate w-full text-center">{m.home.name}</span>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-lg font-black text-white italic">
                        {m.status?.scoreStr || `${m.home.score} - ${m.away.score}`}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 w-[35%]">
                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${m.away.id}.png`} className="w-8 h-8 object-contain" alt="" />
                      <span className="text-[9px] font-black text-slate-400 uppercase truncate w-full text-center">{m.away.name}</span>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Trophy className="w-12 h-12 mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">In attesa di dati...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </main>
  );
}
