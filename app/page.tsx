"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, Trophy, ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";

const Stardust = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2 + 1, duration: Math.random() * 20 + 15, delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id} className="absolute bg-white rounded-full opacity-0"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: ["0%", "-50vh"], opacity: [0, 0.4, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const MagicBorderCard = ({ children, href, glowColor, className = "" }: { children: React.ReactNode, href?: string, glowColor: string, className?: string }) => {
  const content = (
    <div className={`relative group overflow-hidden rounded-[2.5rem] p-[1px] shadow-2xl backdrop-blur-sm bg-zinc-900/30 ${className}`}>
      <div 
        className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ backgroundImage: `conic-gradient(from 90deg at 50% 50%, transparent 0%, transparent 75%, ${glowColor})` }}
      />
      <div className="relative h-full w-full flex flex-col rounded-[calc(2.5rem-1px)] bg-[#0A0A0A]/95 backdrop-blur-xl transition-colors duration-500 group-hover:bg-[#111111]/95">
        {children}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : content;
};

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [round, setRound] = useState(0);
  const [latestArticle, setLatestArticle] = useState<any>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(true);

  useEffect(() => {
    fetch('/api/sofascore?endpoint=tournaments/get-last-matches&tournamentId=23&seasonId=76457')
      .then(res => res.json())
      .then(data => {
        const events = data?.events || [];
        if (events.length > 0) {
          const latestRound = Math.max(...events.map((m: any) => m.roundInfo?.round || 0));
          setRound(latestRound);
          setResults(events.filter((m: any) => m.roundInfo?.round === latestRound));
        }
        setIsLoadingResults(false);
      })
      .catch(e => {
        console.error("🔥 [HOME ERROR] Fallimento risultati:", e);
        setIsLoadingResults(false);
      });

    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
         if (data && data.length > 0) setLatestArticle(data[0]);
      })
      .catch(e => console.error("🔥 [HOME ERROR] Fallimento articoli:", e));
  }, []);

  const getLogo = (id: number) => "/api/sofascore?endpoint=teams/get-logo&teamId=" + id;

  const navItems = [
    { href: "/risultati-serie-a", icon: Activity, title: "RISULTATI", desc: "La Serie A?", color: "text-cyan-400", hex: "#22d3ee" },
    { href: "/classifica", icon: Trophy, title: "CLASSIFICA", desc: "Chi domina la lega?", color: "text-amber-400", hex: "#fbbf24" },
    { href: "/verdetto", icon: ShieldCheck, title: "VERDETTO", desc: "Statistiche e Premi", color: "text-emerald-400", hex: "#34d399" },
    { href: "/regolamento", icon: Clock, title: "REGOLE", desc: "Tutto quello che ti serve", color: "text-indigo-400", hex: "#818cf8" }
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 p-4 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.03)_0%,transparent_70%)] pointer-events-none" />
      <Stardust />

      <div className="relative z-10 max-w-4xl mx-auto space-y-12 pb-20">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="flex justify-center">
          <Image src="/image/logo-fantalaghee.png" alt="Logo Fantalaghee" width={350} height={150} priority className="hover:scale-105 transition-transform duration-500 drop-shadow-2xl" />
        </motion.div>
        
        {latestArticle && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <MagicBorderCard href={`/gazzetta/${latestArticle.id}`} glowColor="#f43f5e">
              <div className="relative overflow-hidden rounded-[calc(2.5rem-1px)] group h-full">
                <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${latestArticle.imageUrl})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
                <div className="relative z-10 p-8 md:p-10 flex flex-col justify-end min-h-[300px]">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-rose-500 font-bold text-xs tracking-[0.3em] uppercase px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">La Gazzetta del Laghèe</span>
                    {latestArticle.highlight && <span className="text-amber-400 font-bold text-[10px] tracking-widest uppercase px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full">In Evidenza</span>}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black font-oswald text-white leading-tight transition-colors uppercase">{latestArticle.title}</h2>
                  <p className="mt-3 text-sm text-zinc-400 line-clamp-2 md:max-w-2xl font-serif italic">{latestArticle.description}</p>
                </div>
              </div>
            </MagicBorderCard>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navItems.map((item, index) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} whileInView={{ y: [0, -5, 0] }} viewport={{ once: true }} style={{ animation: `float ${4 + index}s ease-in-out infinite` }}>
              <MagicBorderCard href={item.href} glowColor={item.hex} className="h-full">
                <div className="p-6 h-full flex flex-col relative z-10 overflow-hidden group/inner">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-black tracking-[0.2em] text-white uppercase">{item.title}</span>
                    <item.icon className={`w-6 h-6 ${item.color} group-hover/inner:scale-110 group-hover/inner:rotate-3 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`}/>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium mt-auto leading-relaxed group-hover/inner:text-zinc-300 transition-colors">{item.desc}</p>
                </div>
              </MagicBorderCard>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
          <MagicBorderCard glowColor="#22d3ee">
            <div className="p-8 relative z-10">
              <h3 className="font-black italic mb-8 text-cyan-400 uppercase tracking-[0.3em] text-center text-sm drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">SERIE A • GIORNATA {round || '--'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {isLoadingResults ? (
                  Array.from({length: 5}).map((_, i) => (
                    <div key={i} className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 h-[88px] relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                  ))
                ) : results.length > 0 ? (
                  results.map((m, i) => (
                    <div key={i} className="bg-black/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2 hover:border-cyan-500/50 transition-all hover:bg-zinc-900/80 group/match relative overflow-hidden">
                      <div className="flex items-center justify-between w-full font-bold text-[11px] group-hover/match:scale-105 transition-transform italic">
                        <img src={getLogo(m.homeTeam.id)} className="w-6 h-6 object-contain drop-shadow-md" alt="" />
                        <span className="text-zinc-100">{m.homeScore?.current ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between w-full font-bold text-[11px] group-hover/match:scale-105 transition-transform italic">
                        <img src={getLogo(m.awayTeam.id)} className="w-6 h-6 object-contain drop-shadow-md" alt="" />
                        <span className="text-cyan-400">{m.awayScore?.current ?? 0}</span>
                      </div>
                      <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mt-1 opacity-70 group-hover/match:opacity-100 transition-opacity">{m.status.description}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-sm text-zinc-500 font-serif italic py-4">Nessun match disponibile</div>
                )}
              </div>
            </div>
          </MagicBorderCard>
        </motion.div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}} />
    </main>
  );
}
