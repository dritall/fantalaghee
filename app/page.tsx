"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, BookOpen, Newspaper, Gavel, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Classifica Lega",
    description: "Consulta la graduatoria aggiornata.",
    href: "/classifica",
    icon: Trophy,
    color: "text-amber-400",
    glow: "rgba(251,191,36,0.5)"
  },
  {
    title: "Il Verdetto",
    description: "Pronostici su vincitori e retrocessi.",
    href: "/verdetto",
    icon: ShieldCheck,
    color: "text-emerald-400",
    glow: "rgba(52,211,153,0.5)"
  },
  {
    title: "Risultati Serie A",
    description: "Calendario, dirette e statistiche.",
    href: "/risultati-serie-a",
    icon: Activity,
    color: "text-cyan-400",
    glow: "rgba(34,211,238,0.5)"
  },
  {
    title: "La Gazzetta",
    description: "Ultime news e approfondimenti.",
    href: "/gazzetta",
    icon: Newspaper,
    color: "text-rose-400",
    glow: "rgba(251,113,133,0.5)"
  },
  {
    title: "Il Regolamento",
    description: "Norme ufficiali del fantacalcio.",
    href: "/regolamento",
    icon: BookOpen,
    color: "text-indigo-400",
    glow: "rgba(129,140,248,0.5)"
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
  const [selectedRound, setSelectedRound] = useState<number>(1);

  useEffect(() => {
    fetch('/api/football?endpoint=football-get-all-matches-by-league&leagueid=55')
      .then(res => res.json())
      .then(data => {
        const res = data?.raw?.response || data?.response || [];
        let matches = Array.isArray(res) ? res.flatMap((r: any) => r.matches || []) : (res.matches || []);
        
        // Sort matches
        matches.sort((a: any, b: any) => new Date(a.status?.utcTime || a.status?.startTime || 0).getTime() - new Date(b.status?.utcTime || b.status?.startTime || 0).getTime());

        // Chunk into rounds of 10
        const chunks = [];
        for (let i = 0; i < matches.length; i += 10) {
          chunks.push(matches.slice(i, i + 10));
        }

        // Selection Logic: Find latest started or finished round
        let bestIdx = 0;
        for (let i = chunks.length - 1; i >= 0; i--) {
           if (chunks[i].some((m: any) => m.status?.started || m.statusId === 6)) {
              bestIdx = i;
              break;
           }
        }
        
        setSelectedRound(bestIdx + 1);
        setResults(chunks[bestIdx] || []);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center px-4 pt-24 pb-12">

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

        {/* Main Grid: 5 Symmetric Boxes */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {sections.map((section) => (
            <motion.div key={section.title} variants={itemVariants}>
              <Link href={section.href} className="block group h-full" aria-label={section.title}>
                <div 
                  className={cn(
                  "h-full relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-500 flex flex-col items-center text-center justify-center hover:-translate-y-2 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(120,119,198,0.4)]",
                )}>
                  <div className="flex items-center justify-center mb-4">
                    <section.icon className={cn("w-10 h-10 mb-2", section.color)} />
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight">
                      {section.title}
                    </h2>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                  
                  {/* Glowing Flash effect on active box */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-[flash_3s_infinite]" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Dynamic Matchday Widget */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full" />
          
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4 relative z-10">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                 <Trophy className="w-6 h-6 text-cyan-400" />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Serie A: Diretta & Risultati</h3>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Giornata {selectedRound} • Dati in tempo reale</p>
               </div>
            </div>
            <Link href="/risultati-serie-a" className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest transition-all">Hub Completo</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
            {results.length > 0 ? results.map((m, i) => {
              const isLive = m.status?.started && !m.status?.finished;
              const isFinished = m.status?.finished || m.statusId === 6;
              const isStarted = m.status?.started || m.statusId === 6;
              
              return (
                <div 
                   key={i} 
                   style={{ '--team-color': isLive ? '16, 185, 129' : '34, 211, 238' } as any}
                   className="relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-500 flex flex-col items-center text-center justify-center group hover:-translate-y-2 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(var(--team-color),0.4)]"
                >
                  <div className="flex w-full justify-between items-center mb-4">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{m.status?.reason?.short || 'SERIE A'}</span>
                     <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-[pulse_1.5s_infinite]' : isFinished ? 'bg-red-500/60' : 'bg-slate-600'}`} />
                  </div>
                  
                  <div className="flex w-full items-center justify-around gap-2 mb-4">
                    <div className="flex flex-col items-center gap-2 w-1/3">
                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}.png`} className="w-8 h-8 object-contain relative z-10" alt="" />
                      <span className="text-[8px] font-black text-slate-400 uppercase truncate w-full text-center relative z-10">{m.home.name}</span>
                    </div>
                    
                    <div className="flex-1 text-center relative z-10">
                       {isStarted ? (
                         <span className="text-sm font-black text-white italic">
                            {m.status?.scoreStr || `${m.home.score} - ${m.away.score}`}
                         </span>
                       ) : (
                         <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">TBD</span>
                       )}
                    </div>

                    <div className="flex flex-col items-center gap-2 w-1/3">
                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${m.away.id}.png`} className="w-8 h-8 object-contain relative z-10" alt="" />
                      <span className="text-[8px] font-black text-slate-400 uppercase truncate w-full text-center relative z-10">{m.away.name}</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-white/10 w-full flex justify-center">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                       {isLive ? 'IN CORSO' : isFinished ? 'FINALE' : m.time || 'A BREVE'}
                     </span>
                  </div>
                </div>
              );
            }) : (
              Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="h-28 bg-white/5 rounded-3xl animate-pulse" />
              ))
            )}
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
