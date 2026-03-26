// @ts-nocheck
/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Users, BarChart3, Clock, Construction, AlertTriangle } from 'lucide-react';

const TeamLogo = ({ logo, name, className }: { logo?: string, name: string, className: string }) => {
    const [imgError, setImgError] = useState(false);
    let src = null;
    if (logo) {
        const fullUrl = logo.startsWith('http') ? logo : `https://img.legaseriea.it/vimages/${logo.replace(/^\//, '')}`;
        src = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}`;
    }
    
    if (!src || imgError) {
        return (
            <div className={`flex items-center justify-center bg-zinc-800 border border-white/10 rounded-full font-black text-zinc-400 text-[9px] tracking-tighter ${className}`}>
                {name && name !== "TBD" ? name.substring(0, 3).toUpperCase() : '?'}
            </div>
        );
    }
    return <img src={src} onError={() => setImgError(true)} className={`${className} object-contain`} alt={name} crossOrigin="anonymous" />;
};

export default function ScoutHub() {
  const [activeTab, setActiveTab] = useState('calendario');
  const [roundsMatches, setRoundsMatches] = useState<Record<number, any[]>>({});
  const [selectedRound, setSelectedRound] = useState(1);
  const [standings, setStandings] = useState<any[]>([]);
  const [teamMap, setTeamMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [modalFixture, setModalFixture] = useState<any>(null);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [matchTab, setMatchTab] = useState<'cronaca' | 'stats' | 'formazioni'>('cronaca');
  const [debugRaw, setDebugRaw] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [matchesRes, standingsRes] = await Promise.all([
          fetch('/api/football?endpoint=matches').then(r => r.json()).catch(e => ({ error: String(e) })),
          fetch('/api/football?endpoint=standings').then(r => r.json()).catch(e => ({ error: String(e) }))
        ]);

        // Salviamo i dati grezzi per il debug a schermo
        setDebugRaw({ matches: matchesRes, standings: standingsRes });

        // --- 1. ESTRAZIONE CLASSIFICA ---
        let teamsList: any[] = [];
        if (Array.isArray(standingsRes?.data?.teams)) teamsList = standingsRes.data.teams;
        else if (Array.isArray(standingsRes?.teams)) teamsList = standingsRes.teams;
        else if (Array.isArray(standingsRes?.data)) teamsList = standingsRes.data;
        else if (Array.isArray(standingsRes?.data?.rows)) teamsList = standingsRes.data.rows;

        if (teamsList.length === 0) {
            const findTeams = (obj: any) => {
              if (!obj) return false;
              if (Array.isArray(obj) && obj.length > 0 && (obj[0].teamId || obj[0].points || obj[0].team)) { teamsList = obj; return true; }
              if (typeof obj === 'object') {
                if (obj.teams && Array.isArray(obj.teams)) { teamsList = obj.teams; return true; }
                for (let key in obj) if (findTeams(obj[key])) return true;
              }
              return false;
            };
            findTeams(standingsRes);
        }

        const tMap: Record<string, any> = {};
        const parsedStandings = teamsList.map((row: any) => {
           const t = row.team || row;
           const statsArr = t.stats || row.stats || [];
           const getStat = (id: string) => {
               const s = statsArr.find((x: any) => x.statsId === id);
               return s ? parseInt(s.statsValue) : 0;
           };

           const pts = getStat('points') || t.points || row.points || 0;
           let logo = t.imagery?.teamLogo || row.logo;
           if (!logo) {
               const str = JSON.stringify(t);
               const match = str.match(/"(?:teamLogo|logo|url)"\s*:\s*"([^"]+\.(?:png|webp|jpg))"/i) || str.match(/"teamLogo"\s*:\s*"([^"]+)"/i);
               if (match) logo = match[1];
           }

           const name = t.shortName || t.officialName || t.name || row.name || "TBD";
           const tId = t.teamId || t.id || name;

           tMap[tId] = { name, logo };
           if (name !== "TBD") tMap[name.toLowerCase()] = { name, logo };

           return { 
               id: tId, name, logo, points: pts,
               played: getStat('matches-played') || row.played || 0,
               win: getStat('win') || row.win || 0,
               draw: getStat('draw') || row.draw || 0,
               lose: getStat('lose') || row.lose || 0,
               gd: getStat('goal-difference') || row.gd || 0
           };
        });

        const uniqueStandings = Array.from(new Map(parsedStandings.map(item => [item.id, item])).values());
        uniqueStandings.sort((a: any, b: any) => b.points - a.points);
        setStandings(uniqueStandings);
        setTeamMap(tMap);

        // --- 2. ESTRAZIONE CALENDARIO ---
        let allMatches = matchesRes?.data?.matches || matchesRes?.data || matchesRes?.matches || (Array.isArray(matchesRes) ? matchesRes : []);
        allMatches = Array.isArray(allMatches) ? allMatches.filter((m: any) => m.homeTeam && m.awayTeam) : [];
        
        const map: Record<number, any[]> = {};
        const uniqueMatchDays = Array.from(new Set(allMatches.map((m: any) => m.matchDayId || m.roundId).filter(Boolean)));
        let currentR = 1;

        allMatches.forEach((m: any) => {
          const mId = m.matchDayId || m.roundId;
          let r = uniqueMatchDays.indexOf(mId) + 1 || 1; 

          const mStr = JSON.stringify(m);
          const roundMatch = mStr.match(/(?:Matchday|Giornata|Round)\s*(\d+)/i);
          if (roundMatch) r = parseInt(roundMatch[1]);

          if (!map[r]) map[r] = [];
          if (!map[r].find(x => x.matchId === m.matchId)) map[r].push(m);
        });

        Object.keys(map).forEach(rKey => {
            const rNum = parseInt(rKey);
            map[rNum].sort((a, b) => new Date(a.dateUtc || a.startDateUtc || 0).getTime() - new Date(b.dateUtc || b.startDateUtc || 0).getTime());
            const hasScore = map[rNum].some(m => m.providerHomeScore !== undefined && m.providerHomeScore !== null);
            if (hasScore && rNum >= currentR) currentR = rNum;
        });

        setRoundsMatches(map);
        setSelectedRound(currentR > 0 ? currentR : 1);

      } catch (e) {
        console.error("🔥 Errore API:", e);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
      if (scrollRef.current && activeTab === 'calendario') {
          const activeBtn = scrollRef.current.querySelector('.active-round-btn');
          if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
  }, [selectedRound, roundsMatches, activeTab]);

  const openMatch = async (m: any) => {
    setModalFixture(m); setMatchTab('cronaca'); setMatchDetails(null);
    setTimeout(() => setMatchDetails({ wip: true }), 1000);
  };

  const resolveTeam = (teamObj: any, fallbackName: string) => {
      let name = teamObj?.shortName || teamObj?.officialName || teamObj?.name;
      let logo = teamObj?.imagery?.teamLogo || teamObj?.logo;
      const id = teamObj?.teamId || teamObj?.id;

      if (!logo && id && teamMap[id]) logo = teamMap[id].logo;
      if (!name && id && teamMap[id]) name = teamMap[id].name;
      if (!logo && name && teamMap[name.toLowerCase()]) logo = teamMap[name.toLowerCase()].logo;
      
      return { name: name || fallbackName, logo };
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-bold uppercase tracking-[0.3em] animate-pulse italic text-sm">Sincronizzazione Serie A...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 pt-24 font-sans selection:bg-cyan-500/30">
      <div className="max-w-5xl mx-auto">
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl mb-8 max-w-xs mx-auto border border-white/5 shadow-2xl">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${activeTab === t ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-zinc-500 hover:text-white'}`}>{t}</button>
          ))}
        </div>

        {activeTab === 'calendario' ? (
          <div className="space-y-6">
            <div ref={scrollRef} className="flex overflow-x-auto gap-2 pb-4 no-scrollbar scroll-smooth">
              {Object.keys(roundsMatches).length > 0 ? Object.keys(roundsMatches).map(Number).sort((a,b)=>a-b).map((r) => (
                <button key={r} onClick={() => setSelectedRound(r)} className={`px-5 py-2 rounded-xl shrink-0 font-bold text-xs border transition-all duration-300 ${selectedRound===r?'active-round-btn border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]':'border-white/5 text-zinc-600 hover:border-white/20'}`}>G.{r}</button>
              )) : null}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundsMatches[selectedRound] ? roundsMatches[selectedRound].map((m, idx) => {
                const homeScore = m.providerHomeScore ?? m.homeScore;
                const awayScore = m.providerAwayScore ?? m.awayScore;
                const isPlayed = homeScore !== null && homeScore !== undefined;
                const home = resolveTeam(m.homeTeam, "Casa");
                const away = resolveTeam(m.awayTeam, "Ospite");

                return (
                  <div key={m.matchId || idx} onClick={() => openMatch(m)} className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-zinc-800 hover:border-white/20 transition-all group shadow-lg">
                    <div className="flex items-center gap-4 w-[42%]">
                        <TeamLogo logo={home.logo} name={home.name} className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{home.name}</span>
                    </div>
                    <div className="text-center font-black text-cyan-400 italic text-sm tracking-tighter shadow-cyan-500/10 drop-shadow-md">
                        {!isPlayed ? 'VS' : `${homeScore} - ${awayScore}`}
                    </div>
                    <div className="flex items-center gap-4 w-[42%] justify-end text-right">
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{away.name}</span>
                        <TeamLogo logo={away.logo} name={away.name} className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                )
              }) : (
                <div className="col-span-full py-10 bg-red-900/20 border border-red-500/30 rounded-3xl p-6">
                    <div className="flex items-center gap-2 text-red-400 font-bold mb-4 uppercase text-xs tracking-widest"><AlertTriangle className="w-4 h-4"/> Debug Calendario Vuoto</div>
                    <pre className="text-left text-[10px] text-zinc-400 whitespace-pre-wrap overflow-auto max-h-64 custom-scrollbar">
                        {JSON.stringify(debugRaw?.matches, null, 2)?.slice(0, 1500) || "Nessun dato ricevuto dall'API per i Matches."}
                    </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-4 md:p-8 border border-white/5 backdrop-blur-sm shadow-2xl overflow-x-auto">
            <div className="min-w-[600px]">
                <div className="grid grid-cols-12 items-center py-2 px-6 text-[10px] font-black uppercase text-zinc-500 border-b border-white/10 mb-2">
                    <span className="col-span-1">#</span>
                    <span className="col-span-4 md:col-span-5">Squadra</span>
                    <span className="col-span-1 text-center">G</span>
                    <span className="col-span-1 text-center text-emerald-500">V</span>
                    <span className="col-span-1 text-center text-zinc-400">N</span>
                    <span className="col-span-1 text-center text-red-500">P</span>
                    <span className="col-span-1 text-center">DR</span>
                    <span className="col-span-2 md:col-span-1 text-right text-cyan-400">PTS</span>
                </div>

                {standings.length === 0 ? (
                    <div className="col-span-full py-10 bg-red-900/20 border border-red-500/30 rounded-3xl p-6 mt-4">
                        <div className="flex items-center gap-2 text-red-400 font-bold mb-4 uppercase text-xs tracking-widest"><AlertTriangle className="w-4 h-4"/> Debug Classifica Vuota</div>
                        <pre className="text-left text-[10px] text-zinc-400 whitespace-pre-wrap overflow-auto max-h-64 custom-scrollbar">
                            {JSON.stringify(debugRaw?.standings, null, 2)?.slice(0, 1500) || "Nessun dato ricevuto dall'API per la Classifica."}
                        </pre>
                    </div>
                ) : standings.map((t, i) => (
                  <div key={t.id} className="grid grid-cols-12 items-center py-3.5 border-b border-white/5 last:border-0 hover:bg-white/5 px-6 rounded-2xl transition-all group">
                    <span className="col-span-1 text-[11px] font-black text-zinc-600 group-hover:text-cyan-500 transition-colors">{(i+1).toString().padStart(2,'0')}</span>
                    <div className="col-span-4 md:col-span-5 flex items-center gap-4">
                        <TeamLogo logo={t.logo} name={t.name} className="w-8 h-8" />
                        <span className="text-sm font-bold uppercase tracking-tight group-hover:translate-x-1 transition-transform truncate">{t.name}</span>
                    </div>
                    <span className="col-span-1 text-center text-xs font-mono text-white/80">{t.played}</span>
                    <span className="col-span-1 text-center text-xs font-mono text-emerald-400/80">{t.win}</span>
                    <span className="col-span-1 text-center text-xs font-mono text-zinc-400">{t.draw}</span>
                    <span className="col-span-1 text-center text-xs font-mono text-red-400/80">{t.lose}</span>
                    <span className="col-span-1 text-center text-xs font-mono font-bold text-white/50">{t.gd > 0 ? `+${t.gd}` : t.gd}</span>
                    <span className="col-span-2 md:col-span-1 text-right font-black text-cyan-400 tracking-tighter group-hover:scale-110 transition-transform">{t.points}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALE WIP */}
      <Dialog.Root open={!!modalFixture} onOpenChange={() => setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080808] border border-white/10 rounded-[3.5rem] w-[95vw] max-w-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_100px_rgba(0,0,0,1)]">
            <Dialog.Title className="sr-only">Dettagli Partita</Dialog.Title>
            <div className="p-8 bg-white/5 border-b border-white/5 flex flex-col items-center">
               <div className="flex justify-between items-center mb-8 px-4 w-full">
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                      <TeamLogo logo={resolveTeam(modalFixture?.homeTeam, "Casa").logo} name={resolveTeam(modalFixture?.homeTeam, "Casa").name} className="w-16 h-16" />
                      <span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{resolveTeam(modalFixture?.homeTeam, "Casa").name}</span>
                  </div>
                  <div className="text-6xl font-black italic tracking-tighter text-white shadow-cyan-500/20 drop-shadow-2xl">
                      {modalFixture?.providerHomeScore ?? modalFixture?.homeScore ?? 0} - {modalFixture?.providerAwayScore ?? modalFixture?.awayScore ?? 0}
                  </div>
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                      <TeamLogo logo={resolveTeam(modalFixture?.awayTeam, "Ospite").logo} name={resolveTeam(modalFixture?.awayTeam, "Ospite").name} className="w-16 h-16" />
                      <span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{resolveTeam(modalFixture?.awayTeam, "Ospite").name}</span>
                  </div>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 flex flex-col items-center justify-center py-20 text-zinc-500">
                <Construction className="w-12 h-12 text-zinc-700 mb-4" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Integrazione Feed API in corso...</span>
            </div>
            <button onClick={() => setModalFixture(null)} className="absolute top-8 right-8 p-3 bg-zinc-900/50 rounded-full border border-white/10 hover:bg-red-500 hover:text-white transition-all"><X className="w-5 h-5"/></button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
