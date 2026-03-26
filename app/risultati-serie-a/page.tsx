"use client";
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Users, BarChart3, Clock, Construction } from 'lucide-react';

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

  useEffect(() => {
    async function load() {
      try {
        const [matchesRes, standingsRes] = await Promise.all([
          fetch('/api/football?endpoint=matches').then(r => r.json()),
          fetch('/api/football?endpoint=standings').then(r => r.json())
        ]);

        // --- 1. ESTRAZIONE CLASSIFICA E LOGHI (METODO REGEX) ---
        let teamsList: any[] = [];
        const findTeams = (obj: any) => {
          if (!obj) return false;
          if (Array.isArray(obj) && obj.length > 0 && (obj[0].teamId || obj[0].points)) { teamsList = obj; return true; }
          if (typeof obj === 'object') {
            if (obj.teams && Array.isArray(obj.teams)) { teamsList = obj.teams; return true; }
            for (let key in obj) if (findTeams(obj[key])) return true;
          }
          return false;
        };
        findTeams(standingsRes);

        const tMap: Record<string, any> = {};
        const parsedStandings = teamsList.map((t: any) => {
           const ptsObj = t.stats?.find((s: any) => s.statsId === 'points');
           const pts = ptsObj ? parseInt(ptsObj.statsValue) : (t.points || 0);

           // Cerchiamo il logo ovunque nell'oggetto stringificato
           const tStr = JSON.stringify(t);
           const logoMatch = tStr.match(/"(?:teamLogo|logo|url)"\s*:\s*"([^"]+\.(?:png|webp|jpg))"/i) || tStr.match(/"teamLogo"\s*:\s*"([^"]+)"/i);
           const logo = logoMatch ? logoMatch[1] : null;

           const nameMatch = tStr.match(/"(?:shortName|officialName|name)"\s*:\s*"([^"]+)"/i);
           const name = nameMatch ? nameMatch[1] : (t.shortName || "TBD");
           const tId = t.teamId || t.id || name;

           // Mappiamo per ID e per Nome (tutto minuscolo) per fare un cross-reference infallibile col calendario
           tMap[tId] = { name, logo };
           tMap[name.toLowerCase()] = { name, logo };

           return { id: tId, name, logo, points: pts };
        });

        parsedStandings.sort((a: any, b: any) => b.points - a.points);
        setStandings(parsedStandings);
        setTeamMap(tMap);

        // --- 2. ESTRAZIONE CALENDARIO E GIORNATE (1-38) ---
        let allMatches: any[] = [];
        const findMatches = (obj: any) => {
          if (!obj) return false;
          if (Array.isArray(obj) && obj.length > 0 && (obj[0].matchId || obj[0].homeTeam)) { allMatches = obj; return true; }
          if (typeof obj === 'object') {
            for (let key in obj) if (findMatches(obj[key])) return true;
          }
          return false;
        };
        findMatches(matchesRes);

        const map: Record<number, any[]> = {};
        let maxPlayedRound = 1;

        allMatches.forEach((m: any) => {
          let r = 1;
          const mStr = JSON.stringify(m);

          // Strappiamo il numero di giornata direttamente dalla dicitura "Matchday 30" o "Giornata 30"
          const roundMatch = mStr.match(/(?:Matchday|Giornata|Round)\s*(\d+)/i);
          if (roundMatch) {
              r = parseInt(roundMatch[1]);
          }

          if (!map[r]) map[r] = [];
          map[r].push(m);

          if (mStr.includes('"matchdayStatus":"Played"') || mStr.includes('"scheduleStatus":"Played"') || m.providerHomeScore !== null) {
            if (r > maxPlayedRound) maxPlayedRound = r;
          }
        });

        // Ordina cronologicamente se i match in una giornata sono sparsi
        Object.keys(map).forEach((key) => {
            const kNum = parseInt(key);
            map[kNum].sort((a, b) => new Date(a.dateUtc || a.startDateUtc || 0).getTime() - new Date(b.dateUtc || b.startDateUtc || 0).getTime());
        });

        setRoundsMatches(map);
        setSelectedRound(maxPlayedRound > 0 ? maxPlayedRound : 1);

      } catch (e) {
        console.error("🔥 Errore sincronizzazione Hub Serie A:", e);
      } finally { 
        setLoading(false); 
      }
    }
    load();
  }, []);

  const openMatch = async (m: any) => {
    setModalFixture(m); 
    setMatchTab('cronaca'); 
    setMatchDetails(null);
    setTimeout(() => setMatchDetails({ wip: true }), 1000);
  };

  const getLogo = (logoCode?: string) => {
      if (!logoCode) return "/globe.svg"; // Fallback se non trovato
      if (logoCode.startsWith('http')) return logoCode;
      return `https://img.legaseriea.it/vimages/${logoCode}`;
  };

  const resolveTeamInfo = (teamObj: any, fallbackName: string) => {
      const name = teamObj?.shortName || teamObj?.name || fallbackName;
      let logo = teamObj?.imagery?.teamLogo || teamObj?.logo;
      const id = teamObj?.teamId || teamObj?.id;

      // Recupero dal DB incrociato
      if (!logo && id && teamMap[id]) logo = teamMap[id].logo;
      if (!logo && teamMap[name.toLowerCase()]) logo = teamMap[name.toLowerCase()].logo;

      return { name, logo };
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
            <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar scroll-smooth">
              {/* Mostriamo solo i bottoni delle giornate che hanno effettivamente match */}
              {Object.keys(roundsMatches).map(Number).sort((a,b)=>a-b).map((r) => (
                <button key={r} onClick={() => setSelectedRound(r)} className={`px-5 py-2 rounded-xl shrink-0 font-bold text-xs border transition-all duration-300 ${selectedRound===r?'border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]':'border-white/5 text-zinc-600 hover:border-white/20'}`}>G.{r}</button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundsMatches[selectedRound] ? roundsMatches[selectedRound].map((m, idx) => {
                const homeScore = m.providerHomeScore ?? m.homeScore;
                const awayScore = m.providerAwayScore ?? m.awayScore;
                const isPlayed = m.matchdayStatus === 'Played' || m.scheduleStatus === 'Played' || homeScore !== null && homeScore !== undefined;

                const home = resolveTeamInfo(m.homeTeam, "TBD");
                const away = resolveTeamInfo(m.awayTeam, "TBD");

                return (
                  <div key={m.matchId || idx} onClick={() => openMatch(m)} className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-zinc-800 hover:border-white/20 transition-all group shadow-lg">
                    <div className="flex items-center gap-4 w-[42%]">
                        <img src={getLogo(home.logo)} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt=""/>
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{home.name}</span>
                    </div>
                    
                    <div className="text-center font-black text-cyan-400 italic text-sm tracking-tighter shadow-cyan-500/10 drop-shadow-md">
                        {!isPlayed ? 'VS' : `${homeScore} - ${awayScore}`}
                    </div>
                    
                    <div className="flex items-center gap-4 w-[42%] justify-end text-right">
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{away.name}</span>
                        <img src={getLogo(away.logo)} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt=""/>
                    </div>
                  </div>
                )
              }) : <div className="col-span-full py-20 text-center text-zinc-700 font-black uppercase text-xs tracking-[0.4em] opacity-50">Giornata non disponibile</div>}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-sm shadow-2xl">
            {standings.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 uppercase font-black tracking-widest text-xs animate-pulse">Analisi JSON Classifica in corso...</div>
            ) : standings.map((t, i) => (
              <div key={t.id} className="grid grid-cols-12 items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-6 rounded-2xl transition-all group">
                <span className="col-span-1 text-[10px] font-black text-zinc-600 group-hover:text-cyan-500 transition-colors">{(i+1).toString().padStart(2,'0')}</span>
                <div className="col-span-8 flex items-center gap-4">
                    <img src={getLogo(t.logo)} className="w-8 h-8 object-contain" alt="" />
                    <span className="text-sm font-bold uppercase tracking-tight group-hover:translate-x-1 transition-transform">{t.name}</span>
                </div>
                <span className="col-span-3 text-right font-black text-cyan-400 tracking-tighter group-hover:scale-110 transition-transform">{t.points} PT</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={!!modalFixture} onOpenChange={() => setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080808] border border-white/10 rounded-[3.5rem] w-[95vw] max-w-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_100px_rgba(0,0,0,1)]">
            <Dialog.Title className="sr-only">Dettagli Partita</Dialog.Title>
            <Dialog.Description className="sr-only">Resoconto eventi e formazioni.</Dialog.Description>
            
            <div className="p-8 bg-white/5 border-b border-white/5 flex flex-col items-center">
               <div className="flex justify-between items-center mb-8 px-4 w-full">
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                      <img src={getLogo(resolveTeamInfo(modalFixture?.homeTeam, "TBD").logo)} className="w-16 h-16 object-contain" alt="" />
                      <span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{resolveTeamInfo(modalFixture?.homeTeam, "TBD").name}</span>
                  </div>
                  <div className="text-6xl font-black italic tracking-tighter text-white shadow-cyan-500/20 drop-shadow-2xl">
                      {modalFixture?.providerHomeScore ?? modalFixture?.homeScore ?? 0} - {modalFixture?.providerAwayScore ?? modalFixture?.awayScore ?? 0}
                  </div>
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                      <img src={getLogo(resolveTeamInfo(modalFixture?.awayTeam, "TBD").logo)} className="w-16 h-16 object-contain" alt="" />
                      <span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{resolveTeamInfo(modalFixture?.awayTeam, "TBD").name}</span>
                  </div>
               </div>
               
               <div className="flex bg-black p-1 rounded-2xl border border-white/5 w-full max-w-md mx-auto shadow-inner">
                  {[ {id:'cronaca', i:Clock}, {id:'stats', i:BarChart3}, {id:'formazioni', i:Users} ].map(t => (
                    <button key={t.id} onClick={() => setMatchTab(t.id as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all duration-300 ${matchTab === t.id ? 'bg-zinc-800 text-cyan-400 shadow-md' : 'text-zinc-600 hover:text-white'}`}><t.i className="w-3 h-3"/>{t.id}</button>
                  ))}
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               {!matchDetails ? (
                   <div className="flex flex-col items-center justify-center h-full gap-4 py-20 text-zinc-500">
                       <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest italic">Sincronizzazione Dati...</span>
                   </div>
               ) : (
                   <div className="flex flex-col items-center justify-center h-full gap-4 py-20 text-zinc-500">
                       <Construction className="w-12 h-12 text-zinc-700" />
                       <span className="text-xs font-black uppercase tracking-[0.2em]">Integrazione API Feed in corso...</span>
                       <span className="text-[10px] w-2/3 text-center opacity-60">I dettagli dei singoli match verranno aggiunti nel prossimo step con i nuovi endpoint di Matchday.</span>
                   </div>
               )}
            </div>
            <button onClick={() => setModalFixture(null)} className="absolute top-8 right-8 p-3 bg-zinc-900/50 rounded-full border border-white/10 hover:bg-red-500 hover:text-white text-zinc-500 transition-all duration-300 shadow-2xl backdrop-blur-md flex items-center justify-center active:scale-95"><X className="w-5 h-5"/></button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
