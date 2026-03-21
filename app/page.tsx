"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trophy, BookOpen, Newspaper, ShieldCheck, Activity } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [round, setRound] = useState(1);

  useEffect(() => {
    fetch('/api/sofascore?endpoint=seasons/v1/get-events&tournamentId=23&seasonId=76457')
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

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 pt-24">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex justify-center"><Image src="/image/logo-fantalaghee.png" alt="Logo" width={500} height={250} priority /></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{t:"Risultati", h:"/risultati-serie-a", i:Activity}, {t:"Classifica", h:"/classifica", i:Trophy}, {t:"Verdetto", h:"/verdetto", i:ShieldCheck}, {t:"Gazzetta", h:"/gazzetta", i:Newspaper}, {t:"Regolamento", h:"/regolamento", i:BookOpen}].map(s => (
            <Link key={s.t} href={s.h} className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center hover:bg-white/10 transition-all flex flex-col items-center gap-2">
              <s.i className="w-8 h-8 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-tighter">{s.t}</span>
            </Link>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 relative overflow-hidden">
          <h3 className="text-2xl font-black italic uppercase mb-6 text-center">Serie A - Giornata {round}</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {results.map((m, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                  <img src={`https://api.sofascore.app/api/v1/team/${m.homeTeam.id}/image`} className="w-6 h-6" />
                  <span className="text-[10px] font-bold">{m.homeScore.current ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src={`https://api.sofascore.app/api/v1/team/${m.awayTeam.id}/image`} className="w-6 h-6" />
                  <span className="text-[10px] font-bold">{m.awayScore.current ?? 0}</span>
                </div>
                <span className="text-[8px] text-slate-500 uppercase">{m.status.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
