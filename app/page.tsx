"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, Trophy, ShieldCheck, Clock } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [round, setRound] = useState(0);

  useEffect(() => {
    fetch('/api/sofascore?endpoint=tournaments/get-last-matches&tournamentId=23&seasonId=76457')
      .then(res => res.json())
      .then(data => {
        const events = data?.events || [];
        if (events.length > 0) {
          // Determina il round più recente (l'ultimo match giocato)
          const latestRound = events[0].roundInfo?.round || 0;
          setRound(latestRound);
          // Mostra solo i match di quel round
          const roundMatches = events.filter((m: any) => m.roundInfo?.round === latestRound);
          setResults(roundMatches.slice(0, 10));
        }
      })
      .catch(e => console.error("🔥 [HOME ERROR] Fallimento caricamento risultati:", e));
  }, []);

  const getLogo = (id: number) => "/api/sofascore?endpoint=teams/get-logo&teamId=" + id;

  const navItems = [
    { href: "/risultati-serie-a", icon: Activity, text: "RISULTATI", color: "text-cyan-400" },
    { href: "/classifica", icon: Trophy, text: "CLASSIFICA", color: "text-amber-400" },
    { href: "/verdetto", icon: ShieldCheck, text: "VERDETTO", color: "text-emerald-400" },
    { href: "/regolamento", icon: Clock, text: "REGOLE", color: "text-indigo-400" },
  ];

  return (
    <main className="min-h-screen bg-black text-white pt-24 p-4 font-sans selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-center animate-in fade-in zoom-in duration-700">
          <Image src="/image/logo-fantalaghee.png" alt="Logo Fantalaghee" width={350} height={150} priority className="hover:scale-105 transition-transform duration-500" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {navItems.map((item) => (
            <Link key={item.text} href={item.href} className="bg-zinc-900 p-6 rounded-2xl text-center border border-white/5 hover:bg-zinc-800 hover:border-white/20 transition-all group">
              <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color} group-hover:scale-110 transition-transform`}/> 
              <span className="text-[10px] font-black tracking-[0.2em] group-hover:text-white transition-colors uppercase">{item.text}</span>
            </Link>
          ))}
        </div>

        <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-sm shadow-2xl">
          <h3 className="font-black italic mb-8 text-cyan-400 uppercase tracking-[0.3em] text-center text-sm">SERIE A • GIORNATA {round}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {results.length > 0 ? results.map((m, i) => (
              <div key={i} className="bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col items-center gap-3 hover:border-cyan-500/30 transition-all hover:bg-zinc-900/40 group">
                <div className="flex items-center justify-between w-full font-bold text-[12px] group-hover:scale-105 transition-transform italic">
                  <img src={getLogo(m.homeTeam.id)} className="w-5 h-5 object-contain" alt="" />
                  <span className="text-zinc-100">{m.homeScore?.current ?? 0}</span>
                </div>
                <div className="flex items-center justify-between w-full font-bold text-[12px] group-hover:scale-105 transition-transform italic">
                  <img src={getLogo(m.awayTeam.id)} className="w-5 h-5 object-contain" alt="" />
                  <span className="text-cyan-500">{m.awayScore?.current ?? 0}</span>
                </div>
              </div>
            )) : Array.from({length: 5}).map((_, i) => (
              <div key={i} className="bg-zinc-900/20 p-5 rounded-2xl border border-white/5 animate-pulse h-20" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
