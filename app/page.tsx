"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, Trophy, ShieldCheck, Clock } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [round, setRound] = useState(0);

  useEffect(() => {
    // Carica tutti i match per determinare la giornata corretta
    fetch('/api/sofascore?endpoint=tournaments/get-scheduled-events&tournamentId=23&seasonId=76457')
      .then(res => res.json())
      .then(data => {
        const events = data?.events || [];
        if (events.length === 0) return;

        const roundsMap: Record<number, any[]> = {};
        events.forEach((e: any) => {
          const r = e.roundInfo?.round || 1;
          if (!roundsMap[r]) roundsMap[r] = [];
          roundsMap[r].push(e);
        });

        const sortedRounds = Object.keys(roundsMap).map(Number).sort((a,b) => a-b);
        // Trova la giornata attiva: la prima che ha partite "non finite"
        let currentRound = sortedRounds.find(r => roundsMap[r].some(m => m.status.type !== 'finished')) || sortedRounds[sortedRounds.length - 1];
        
        setRound(currentRound);
        setResults(roundsMap[currentRound] || []);
      })
      .catch(e => {
        console.error("🔥 [HOME ERROR] Fallito il fetch dei match programmati:", e);
      });
  }, []);

  const getLogo = (id: number) => "/api/sofascore?endpoint=teams/get-logo&teamId=" + id;

  return (
    <main className="min-h-screen bg-black text-white pt-24 p-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-center"><Image src="/image/logo-fantalaghee.png" alt="Logo" width={350} height={150} priority /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{h:"/risultati-serie-a", i:Activity, t:"RISULTATI", c:"text-cyan-400"}, {h:"/classifica", i:Trophy, t:"CLASSIFICA", c:"text-amber-400"}, {h:"/verdetto", i:ShieldCheck, t:"VERDETTO", c:"text-emerald-400"}, {h:"/regolamento", i:Clock, t:"REGOLE", c:"text-indigo-400"}].map(item => (
            <Link key={item.t} href={item.h} className="bg-zinc-900 p-6 rounded-2xl text-center border border-white/5 hover:bg-zinc-800 transition-all">
              <item.i className={`w-6 h-6 mx-auto mb-2 ${item.c}`}/> <span className="text-[10px] font-black tracking-widest">{item.t}</span>
            </Link>
          ))}
        </div>
        <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="font-black italic mb-6 text-cyan-400 uppercase tracking-widest text-center">SERIE A • GIORNATA {round}</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {results.map((m, i) => (
              <div key={i} className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                <div className="flex items-center justify-between w-full font-bold"><img src={getLogo(m.homeTeam.id)} className="w-6 h-6 object-contain" /><span>{m.homeScore?.current ?? 0}</span></div>
                <div className="flex items-center justify-between w-full font-bold"><img src={getLogo(m.awayTeam.id)} className="w-6 h-6 object-contain" /><span>{m.awayScore?.current ?? 0}</span></div>
                <span className="text-[7px] text-zinc-500 uppercase">{m.status.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
