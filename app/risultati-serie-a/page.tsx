"use client";
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { fetchMatchDetails } from '@/lib/sofascore';
import { X, Loader2, Users, BarChart3, Clock, ArrowUpRight } from 'lucide-react';

export default function ScoutHub() {
  const [activeTab, setActiveTab] = useState('calendario');
  const [roundsMatches, setRoundsMatches] = useState<Record<number, any[]>>({});
  const [selectedRound, setSelectedRound] = useState(30);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalFixture, setModalFixture] = useState<any>(null);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [matchTab, setMatchTab] = useState<'cronaca' | 'stats' | 'formazioni'>('cronaca');

  const totalRounds = Array.from({ length: 38 }, (_, i) => i + 1);

  useEffect(() => {
    async function load() {
      try {
        const [last, next, std] = await Promise.all([
          fetch('/api/sofascore?endpoint=tournaments/get-last-matches&tournamentId=23&seasonId=76457').then(r => r.json()),
          fetch('/api/sofascore?endpoint=tournaments/get-next-matches&tournamentId=23&seasonId=76457').then(r => r.json()),
          fetch('/api/sofascore?endpoint=tournaments/get-standings&tournamentId=23&seasonId=76457').then(r => r.json())
        ]);

        const all = [...(last?.events || []), ...(next?.events || [])];
        const map: Record<number, any[]> = {};
        all.forEach(e => {
          const r = e.roundInfo?.round || 1;
          if (!map[r]) map[r] = [];
          if (!map[r].find(m => m.id === e.id)) map[r].push(e);
        });
        
        setRoundsMatches(map);
        setStandings(std?.standings?.[0]?.rows || []);
        
        // Trova la giornata corrente dai dati "last matches"
        if (last?.events?.length > 0) setSelectedRound(last.events[0].roundInfo.round);
      } catch (e) {
        console.error("🔥 [UI ERROR] Errore caricamento ScoutHub:", e);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const getLogo = (id: number) => "/api/sofascore?endpoint=teams/get-logo&teamId=" + id;

  const openMatch = async (m: any) => {
    setModalFixture(m); 
    setMatchTab('cronaca'); 
    setMatchDetails(null);
    const d = await fetchMatchDetails(m.id);
    setMatchDetails(d);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-bold uppercase tracking-widest italic animate-pulse">Sincronizzazione Dati...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 pt-24 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex bg-zinc-900 p-1 rounded-2xl mb-8 max-w-xs mx-auto border border-white/5 shadow-2xl">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-500'}`}>{t}</button>
          ))}
        </div>

        {activeTab === 'calendario' ? (
          <div className="space-y-6">
            <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar">
              {totalRounds.map((r) => (
                <button key={r} onClick={() => setSelectedRound(r)} className={`px-5 py-2 rounded-xl shrink-0 font-bold text-xs border transition-all ${selectedRound===r?'border-cyan-400 bg-cyan-400/10 text-white':'border-white/5 text-zinc-600'}`}>G.{r}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roundsMatches[selectedRound] ? roundsMatches[selectedRound].map(m => (
                <div key={m.id} onClick={() => openMatch(m)} className="bg-zinc-900/40 border border-white/5 p-5 rounded-3xl flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-all group">
                  <div className="flex items-center gap-3 w-[42%]"><img src={getLogo(m.homeTeam.id)} className="w-8 h-8 object-contain"/><span className="text-xs font-bold uppercase truncate group-hover:text-cyan-400 transition-colors">{m.homeTeam.name}</span></div>
                  <div className="text-center font-black text-cyan-400 italic text-sm">{m.status.type === 'notstarted' ? 'VS' : (m.homeScore?.current ?? 0) + "-" + (m.awayScore?.current ?? 0)}</div>
                  <div className="flex items-center gap-3 w-[42%] justify-end text-right"><span className="text-xs font-bold uppercase truncate group-hover:text-cyan-400 transition-colors">{m.awayTeam.name}</span><img src={getLogo(m.awayTeam.id)} className="w-8 h-8 object-contain"/></div>
                </div>
              )) : <div className="col-span-full py-20 text-center text-zinc-700 font-black uppercase text-xs tracking-[0.2em]">Nessun match caricato per questa giornata</div>}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-6 border border-white/5">
            {standings.map((t, i) => (
              <div key={t.team.id} className="grid grid-cols-12 items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-4 rounded-xl transition-all">
                <span className="col-span-1 text-[10px] font-black text-zinc-600">{(i+1).toString().padStart(2,'0')}</span>
                <div className="col-span-8 flex items-center gap-4">
                  <img src={getLogo(t.team.id)} className="w-7 h-7 object-contain" />
                  <span className="text-sm font-bold uppercase tracking-tight">{t.team.name}</span>
                </div>
                <span className="col-span-3 text-right font-black text-cyan-400 tracking-tighter">{t.points} PT</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={!!modalFixture} onOpenChange={() => setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0a] border border-white/10 rounded-[3rem] w-[95vw] max-w-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_100px_rgba(0,0,0,1)]">
            <Dialog.Title className="sr-only">Dettagli</Dialog.Title>
            <div className="p-8 bg-white/5 border-b border-white/5">
               <div className="flex justify-between items-center mb-8 px-4">
                  <div className="flex flex-col items-center gap-2 w-1/3 text-center"><img src={getLogo(modalFixture?.homeTeam.id)} className="w-14 h-14 object-contain" /><span className="text-[10px] uppercase text-zinc-500 font-black leading-tight">{modalFixture?.homeTeam.name}</span></div>
                  <div className="text-5xl font-black italic tracking-tighter shadow-cyan-500/20 drop-shadow-2xl">{modalFixture?.homeScore?.current ?? 0} - {modalFixture?.awayScore?.current ?? 0}</div>
                  <div className="flex flex-col items-center gap-2 w-1/3 text-center"><img src={getLogo(modalFixture?.awayTeam.id)} className="w-14 h-14 object-contain" /><span className="text-[10px] uppercase text-zinc-500 font-black leading-tight">{modalFixture?.awayTeam.name}</span></div>
               </div>
               <div className="flex bg-black p-1 rounded-xl w-full max-w-md mx-auto border border-white/5 shadow-inner">
                  {[ {id:'cronaca', i:Clock}, {id:'stats', i:BarChart3}, {id:'formazioni', i:Users} ].map(t => (
                    <button key={t.id} onClick={() => setMatchTab(t.id as any)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${matchTab === t.id ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-600 hover:text-white'}`}><t.i className="w-3 h-3"/>{t.id}</button>
                  ))}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               {!matchDetails ? <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /><span className="text-[10px] font-black uppercase tracking-widest">Recupero Dettagli...</span></div> : (
                 <>
                   {matchTab === 'cronaca' && (
                     <div className="space-y-4">
                       {matchDetails.incidents.map((inc: any, i: number) => {
                         const isGoal = inc.type === 'goal';
                         const isSub = inc.type === 'substitution';
                         return (
                          <div key={i} className={`flex items-center gap-4 ${inc.isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                             <div className={`w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-lg shadow-xl shrink-0 group hover:border-cyan-500/50 transition-colors`}>
                                {isGoal ? '⚽' : isSub ? '🔄' : inc.class === 'yellow' ? '🟨' : '🟥'}
                             </div>
                             <div className="flex flex-col">
                               <span className="text-xs font-bold uppercase text-white leading-tight">{isSub ? (inc.playerInName + " ↔ " + inc.playerOutName) : inc.playerName}</span>
                               <span className="text-[10px] font-bold text-zinc-500 mt-0.5">{inc.time}' {inc.assist ? ' (Assist: ' + inc.assist + ')' : (isSub ? 'CAMBIO' : '')}</span>
                             </div>
                          </div>
                         )
                       })}
                       {matchDetails.incidents.length === 0 && <div className="text-center py-10 text-zinc-600 font-black text-[10px] uppercase">Nessuna cronaca disponibile</div>}
                     </div>
                   )}

                   {matchTab === 'formazioni' && matchDetails.lineups && (
                     <div className="grid grid-cols-2 gap-8">
                        {['home', 'away'].map(side => (
                          <div key={side} className="space-y-6">
                             <div>
                                <h4 className="text-[10px] font-black text-cyan-500 uppercase italic mb-3 flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500 rounded-full"/>Titolari</h4>
                                {matchDetails.lineups[side].starters.map((p: any) => (
                                  <div key={p.id} className="flex items-center gap-2 text-xs border-b border-white/5 py-1.5 hover:bg-white/5 transition-colors"><span className="text-zinc-600 w-4 font-mono font-bold text-center">{p.number}</span><span className="uppercase font-bold tracking-tighter">{p.name}</span></div>
                                ))}
                             </div>
                             <div>
                                <h4 className="text-[10px] font-black text-zinc-600 uppercase italic mb-3 flex items-center gap-2"><div className="w-1 h-1 bg-zinc-600 rounded-full"/>Panchina</h4>
                                {matchDetails.lineups[side].subs.map((p: any) => (
                                  <div key={p.id} className="flex items-center gap-2 text-xs opacity-60 py-1.5">
                                    <span className="text-zinc-700 w-4 font-mono text-center">{p.number}</span><span className="uppercase">{p.name}</span>
                                    {p.enteredAt && <span className="text-[9px] text-emerald-400 ml-auto font-black flex items-center gap-1 bg-emerald-400/10 px-1.5 py-0.5 rounded-md"><ArrowUpRight className="w-3 h-3"/>{p.enteredAt}'</span>}
                                  </div>
                                ))}
                             </div>
                          </div>
                        ))}
                     </div>
                   )}

                   {matchTab === 'stats' && (
                     <div className="space-y-6">
                        {matchDetails.stats.map((g: any) => (
                          <div key={g.groupName} className="space-y-3">
                             <p className="text-[9px] font-black text-zinc-600 uppercase text-center border-b border-white/5 pb-1 tracking-widest">{g.groupName}</p>
                             {g.statisticsItems.map((s: any) => {
                               const v1 = parseFloat(s.homeValue); const v2 = parseFloat(s.awayValue); const p = (v1 / (v1 + v2)) * 100;
                               return (
                               <div key={s.name} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-black italic"><span>{s.home}</span><span className="text-zinc-500 font-normal uppercase text-[8px] tracking-tight">{s.name}</span><span>{s.away}</span></div>
                                  <div className="flex h-1.5 bg-zinc-900 rounded-full overflow-hidden shadow-inner"><div className="bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all duration-1000" style={{ width: p + "%" }} /></div>
                               </div>
                             )})}
                          </div>
                        ))}
                        {matchDetails.stats.length === 0 && <div className="text-center py-10 text-zinc-600 font-black text-[10px] uppercase">Statistiche non disponibili</div>}
                     </div>
                   )}
                 </>
               )}
            </div>
            <button onClick={() => setModalFixture(null)} className="absolute top-6 right-6 p-2 bg-zinc-900/50 rounded-full hover:bg-white text-zinc-400 hover:text-black transition-all border border-white/10 flex items-center justify-center"><X className="w-5 h-5"/></button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
