"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, Trophy, ShieldCheck, Clock } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [round, setRound] = useState(1);

  useEffect(() => {
    fetch('/api/sofascore?endpoint=tournaments/get-last-matches&tournamentId=23&seasonId=76457')
      .then(res => res.json())
      .then(data => {
        const events = data?.events || [];
        if (events.length > 0) {
          setRound(events[0].roundInfo?.round || 1);
          setResults(events.slice(0, 10));
        }
      });
  }, []);

  const getLogo = (id: number) => "/api/sofascore?endpoint=teams/get-logo&teamId=" + id;

  return (
    <main className="min-h-screen bg-black text-white pt-24 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-center"><Image src="/image/logo-fantalaghee.png" alt="Logo" width={350} height={150} priority /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/risultati-serie-a" className="bg-zinc-900 p-6 rounded-2xl text-center border border-white/5 hover:bg-zinc-800"><Activity className="w-6 h-6 mx-auto mb-2 text-cyan-400"/> RISULTATI</Link>
          <Link href="/classifica" className="bg-zinc-900 p-6 rounded-2xl text-center border border-white/5 hover:bg-zinc-800"><Trophy className="w-6 h-6 mx-auto mb-2 text-amber-400"/> CLASSIFICA</Link>
          <Link href="/verdetto" className="bg-zinc-900 p-6 rounded-2xl text-center border border-white/5 hover:bg-zinc-800"><ShieldCheck className="w-6 h-6 mx-auto mb-2 text-emerald-400"/> VERDETTO</Link>
          <Link href="/regolamento" className="bg-zinc-900 p-6 rounded-2xl text-center border border-white/5 hover:bg-zinc-800"><Clock className="w-6 h-6 mx-auto mb-2 text-indigo-400"/> REGOLE</Link>
        </div>
        <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5">
          <h3 className="font-black italic mb-4 text-cyan-400 uppercase tracking-widest">SERIE A • GIORNATA {round}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {results.map((m, i) => (
              <div key={i} className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col items-center gap-1">
                <div className="flex items-center justify-between w-full text-[10px] font-bold">
                  <img src={getLogo(m.homeTeam.id)} className="w-5 h-5" alt=""/> <span>{m.homeScore.current}</span>
                </div>
                <div className="flex items-center justify-between w-full text-[10px] font-bold">
                  <img src={getLogo(m.awayTeam.id)} className="w-5 h-5" alt=""/> <span>{m.awayScore.current}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
