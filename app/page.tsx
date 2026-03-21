"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, ShieldCheck, Activity, Clock } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [round, setRound] = useState(1);

  useEffect(() => {
    fetch('/api/sofascore?endpoint=tournaments/get-scheduled-events&tournamentId=23&seasonId=76457')
      .then(res => res.json())
      .then(data => {
        const events = data?.events || [];
        const rounds: Record<number, any[]> = {};
        events.forEach((e: any) => {
          const r = e.roundInfo?.round || 1;
          if (!rounds[r]) rounds[r] = [];
          rounds[r].push(e);
        });
        const currentRound = Math.max(...Object.keys(rounds).filter(r => rounds[Number(r)].some(m => m.status.type !== 'notstarted')).map(Number), 1);
        setRound(currentRound);
        setResults(rounds[currentRound] || []);
      }).catch(console.error);
  }, []);

  const getLogo = (id: number) => `/api/sofascore?endpoint=teams/get-logo&teamId=${id}`;

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 pt-24">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex justify-center"><Image src="/image/logo-fantalaghee.png" alt="Logo" width={400} height={200} priority /></div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/risultati-serie-a" className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center hover:bg-cyan-500/10 transition-all flex flex-col items-center gap-2">
            <Activity className="w-8 h-8 text-cyan-400" />
            <span className="text-xs font-black uppercase">Risultati</span>
          </Link>
          <Link href="/classifica" className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center hover:bg-amber-500/10 transition-all flex flex-col items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span className="text-xs font-black uppercase">Classifica</span>
          </Link>
          <Link href="/verdetto" className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center hover:bg-emerald-500/10 transition-all flex flex-col items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <span className="text-xs font-black uppercase">Il Verdetto</span>
          </Link>
          <Link href="/regolamento" className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center hover:bg-indigo-500/10 transition-all flex flex-col items-center gap-2">
            <Clock className="w-8 h-8 text-indigo-400" />
            <span className="text-xs font-black uppercase">Regole</span>
          </Link>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-black italic uppercase mb-6 text-cyan-400">Serie A • Giornata {round}</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {results.map((m, i) => (
              <div key={i} className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                <div className="flex items-center justify-between w-full">
                  <img src={getLogo(m.homeTeam.id)} className="w-6 h-6 object-contain" />
                  <span className="text-xs font-black">{m.homeScore.current ?? 0}</span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <img src={getLogo(m.awayTeam.id)} className="w-6 h-6 object-contain" />
                  <span className="text-xs font-black">{m.awayScore.current ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
