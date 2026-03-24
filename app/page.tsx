"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Activity, Trophy, ShieldCheck, Clock, Trophy as TrophyIcon, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { MagicCard } from "@/components/ui/MagicCard"; // Assicurati che il path sia corretto in base alla tua struttura

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
    { href: "/risultati-serie-a", icon: Activity, title: "RISULTATI", desc: "La Serie A", color: "text-cyan-400", hex: "#22d3ee" },
    { href: "/classifica", icon: Trophy, title: "CLASSIFICA", desc: "Chi domina la lega?", color: "text-amber-400", hex: "#fbbf24" },
    { href: "/verdetto", icon: ShieldCheck, title: "VERDETTO", desc: "Statistiche e Premi", color: "text-emerald-400", hex: "#34d399" },
    { href: "/regolamento", icon: Clock, title: "REGOLE", desc: "Tutto quello che ti serve", color: "text-indigo-400", hex: "#818cf8" }
  ];

  return (
    <main className="min-h-screen text-white pt-24 p-4 font-sans selection:bg-cyan-500/30 relative z-10">
      <div className="fixed inset-0 bg-[url('/image/bg-homepage-final.png')] bg-cover bg-center bg-fixed opacity-20 pointer-events-none z-[-1]" />
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="flex justify-center">
          <Image src="/image/logo-fantalaghee.png" alt="Logo Fantalaghee" width={350} height={150} priority className="hover:scale-105 transition-transform duration-500 drop-shadow-2xl" />
        </motion.div>
        
        {latestArticle && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <MagicCard href={`/gazzetta/${latestArticle.id}`} glowColor="#f43f5e">
              <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${latestArticle.imageUrl})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
              <div className="relative z-10 p-8 md:p-10 flex flex-col justify-end min-h-[300px]">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-rose-500 font-bold text-xs tracking-[0.3em] uppercase px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">La Gazzetta</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black font-oswald tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-300 to-zinc-600 drop-shadow-lg uppercase leading-tight">{latestArticle.title}</h2>
                <p className="mt-3 text-sm text-zinc-400 line-clamp-2 md:max-w-2xl font-serif italic">{latestArticle.description}</p>
              </div>
            </MagicCard>
          </motion.div>
        )}

        {/* LE FINALI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <MagicCard glowColor="#f97316" className="h-full">
              <div className="p-8 text-center flex flex-col items-center justify-center h-full bg-gradient-to-br from-orange-500/5 to-transparent relative overflow-hidden">
                <TrophyIcon className="absolute -right-4 -top-4 w-32 h-32 text-orange-500/10 rotate-12 pointer-events-none" />
                <div className="text-orange-500 font-black text-[10px] tracking-[0.3em] uppercase mb-6 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">Finale Coppa UEFA</div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full text-xl font-oswald font-black uppercase">
                  <span className="text-white">Cippalippa418</span>
                  <Swords className="w-5 h-5 text-orange-500 mx-2 animate-pulse" />
                  <span className="text-white">FATTORE C</span>
                </div>
              </div>
            </MagicCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <MagicCard glowColor="#a855f7" className="h-full">
              <div className="p-8 text-center flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-500/5 to-transparent relative overflow-hidden">
                <TrophyIcon className="absolute -right-4 -top-4 w-32 h-32 text-purple-500/10 rotate-12 pointer-events-none" />
                <div className="text-purple-400 font-black text-[10px] tracking-[0.3em] uppercase mb-6 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">Finale Super Lega</div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full text-xl font-oswald font-black uppercase">
                  <span className="text-white">Cuccioloni</span>
                  <Swords className="w-5 h-5 text-purple-400 mx-2 animate-pulse" />
                  <span className="text-white">Bollicine25</span>
                </div>
              </div>
            </MagicCard>
          </motion.div>
        </div>

        {/* NAVIGAZIONE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navItems.map((item, index) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} style={{ animation: `float ${4 + index}s ease-in-out infinite` }}>
              <MagicCard href={item.href} glowColor={item.hex} className="h-full">
                <div className="p-6 h-full flex flex-col group/inner">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-black tracking-[0.2em] text-white uppercase">{item.title}</span>
                    <item.icon className={`w-6 h-6 ${item.color} group-hover/inner:scale-110 group-hover/inner:rotate-3 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`}/>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium mt-auto">{item.desc}</p>
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}} />
    </main>
  );
}
