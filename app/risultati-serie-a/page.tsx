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

  useEffect(() => {
    async function load() {
      try {
        const [matchesRes, stdRes] = await Promise.all([
          fetch('/api/football?endpoint=matches').then(r => r.json()),
          fetch('/api/football?endpoint=standings').then(r => r.json())
        ]);
        
        const all = matchesRes.data || (Array.isArray(matchesRes) ? matchesRes : []);
        const map: Record<number, any[]> = {};
        all.forEach((e: any) => {
          const r = e.matchday || 1;
          if (!map[r]) map[r] = [];
          if (!map[r].find((m: any) => (m.matchId || m.id) === (e.matchId || e.id))) map[r].push(e);
        });
        setRoundsMatches(map);
        
        let stdRows = stdRes.data || [];
        if (stdRows[0]?.rows) stdRows = stdRows[0].rows;
        setStandings(stdRows);
        
        const playedRounds = all.filter((m: any) => ['Played', 'Completed', 'finished'].includes(m.matchStatus) || ['Played', 'Completed'].includes(m.matchdayStatus)).map((m: any) => m.matchday || 0);
        if (playedRounds.length > 0) setSelectedRound(Math.max(...playedRounds));
      } catch (e) {
        console.error("🔥 [UI ERROR] Errore sincronizzazione Hub Serie A:", e);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const openMatch = async (m: any) => {
    setModalFixture(m); setMatchTab('cronaca'); setMatchDetails(null);
    const d = await fetchMatchDetails(m.id);
    setMatchDetails(d);
  };

  const getLogo = (val: string | number) => `https://img.legaseriea.it/vimages/${val}`;

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
              {Array.from({length: 38}, (_, i) => i + 1).map((r) => (
                <button key={r} onClick={() => setSelectedRound(r)} className={`px-5 py-2 rounded-xl shrink-0 font-bold text-xs border transition-all duration-300 ${selectedRound===r?'border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]':'border-white/5 text-zinc-600 hover:border-white/20'}`}>G.{r}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundsMatches[selectedRound] ? roundsMatches[selectedRound].map((m, idx) => {
                const homeLogo = m.homeTeam?.imagery?.teamLogo || m.homeTeam?.id;
                const awayLogo = m.awayTeam?.imagery?.teamLogo || m.awayTeam?.id;
                const isNotStarted = ['To Be Played', 'notstarted', 'Fixture'].includes(m.matchStatus) || ['To Be Played'].includes(m.matchdayStatus) || m.status?.type === 'notstarted';
                const isLive = ['Live', 'Playing', 'inprogress'].includes(m.matchStatus);
                return (
                <div key={m.matchId || m.id || idx} onClick={() => openMatch(m)} className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-zinc-800 hover:border-white/20 transition-all group shadow-lg">
                  <div className="flex items-center gap-4 w-[42%]"><img src={getLogo(homeLogo)} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt=""/><span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{m.homeTeam?.shortName || m.homeTeam?.name}</span></div>
                  <div className="text-center font-black text-cyan-400 italic text-sm tracking-tighter shadow-cyan-500/10 drop-shadow-md">
                    {isNotStarted ? 'VS' : (
                      <div className="flex flex-col items-center">
                        <span>{(m.providerHomeScore ?? m.homeScore?.current ?? 0)} - {(m.providerAwayScore ?? m.awayScore?.current ?? 0)}</span>
                        {isLive && <span className="text-[9px] text-red-500 animate-pulse mt-1">LIVE</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 w-[42%] justify-end text-right"><span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{m.awayTeam?.shortName || m.awayTeam?.name}</span><img src={getLogo(awayLogo)} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt=""/></div>
                </div>
                )
              }) : <div className="col-span-full py-20 text-center text-zinc-700 font-black uppercase text-xs tracking-[0.4em] opacity-50">Giornata non ancora disponibile</div>}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-sm shadow-2xl">
            {standings.map((t, i) => (
              <div key={t.team?.id || t.teamId || i} className="grid grid-cols-12 items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-6 rounded-2xl transition-all group">
                <span className="col-span-1 text-[10px] font-black text-zinc-600 group-hover:text-cyan-500 transition-colors">{(i+1).toString().padStart(2,'0')}</span>
                <div className="col-span-8 flex items-center gap-4"><img src={getLogo(t.team?.imagery?.teamLogo || t.team?.id)} className="w-8 h-8 object-contain" alt="" /><span className="text-sm font-bold uppercase tracking-tight group-hover:translate-x-1 transition-transform">{t.team?.shortName || t.team?.name || t.name}</span></div>
                <span className="col-span-3 text-right font-black text-cyan-400 tracking-tighter group-hover:scale-110 transition-transform">{t.points ?? t.totalPoints ?? t.pts ?? 0} PT</span>
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
            <Dialog.Description className="sr-only">Resoconto eventi, statistiche e formazioni ufficiali.</Dialog.Description>
            <div className="p-8 bg-white/5 border-b border-white/5 flex flex-col items-center">
               <div className="flex justify-between items-center mb-8 px-4 w-full">
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center"><img src={getLogo(modalFixture?.homeTeam?.imagery?.teamLogo || modalFixture?.homeTeam?.id)} className="w-16 h-16 object-contain" alt="" /><span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{modalFixture?.homeTeam?.shortName || modalFixture?.homeTeam?.name}</span></div>
                  <div className="text-6xl font-black italic tracking-tighter italic text-white shadow-cyan-500/20 drop-shadow-2xl">{modalFixture?.providerHomeScore ?? modalFixture?.homeScore?.current ?? 0} - {modalFixture?.providerAwayScore ?? modalFixture?.awayScore?.current ?? 0}</div>
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center"><img src={getLogo(modalFixture?.awayTeam?.imagery?.teamLogo || modalFixture?.awayTeam?.id)} className="w-16 h-16 object-contain" alt="" /><span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{modalFixture?.awayTeam?.shortName || modalFixture?.awayTeam?.name}</span></div>
               </div>
               <div className="flex bg-black p-1 rounded-2xl border border-white/5 w-full max-w-md mx-auto shadow-inner">
                  {[ {id:'cronaca', i:Clock}, {id:'stats', i:BarChart3}, {id:'formazioni', i:Users} ].map(t => (
                    <button key={t.id} onClick={() => setMatchTab(t.id as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all duration-300 ${matchTab === t.id ? 'bg-zinc-800 text-cyan-400 shadow-md' : 'text-zinc-600 hover:text-white'}`}><t.i className="w-3 h-3"/>{t.id}</button>
                  ))}
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               {!matchDetails ? <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500"><Loader2 className="w-10 h-10 animate-spin text-cyan-400" /><span className="text-[10px] font-black uppercase tracking-widest italic">Sincronizzazione Eventi...</span></div> : (
                 <>
                   {matchTab === 'cronaca' && (
                     <div className="space-y-6">
                       {matchDetails.incidents.map((inc: any, i: number) => {
                         const isSub = inc.type === 'substitution';
                         return (
                          <div key={i} className={`flex items-center gap-5 animate-in slide-in-from-bottom-2 duration-500 delay-[${i*50}ms] ${inc.isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                             <div className={`w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-xl shrink-0 shadow-2xl hover:border-cyan-500/50 transition-colors`}>
                                {inc.type === 'goal' ? '⚽' : isSub ? '🔄' : (inc.class === 'yellow' ? '🟨' : '🟥')}
                             </div>
                             <div className="flex flex-col gap-0.5">
                               <span className="text-[12px] font-black uppercase text-white leading-tight tracking-tight">{isSub ? inc.playerInName + " ↔ " + inc.playerOutName : inc.playerName}</span>
                               <span className="text-[10px] font-black text-zinc-500 italic flex items-center gap-2">{inc.time}' {inc.assist ? <span className="text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded-full lowercase not-italic">(assist: {inc.assist})</span> : ''}</span>
                             </div>
                          </div>
                         )
                       })}
                       {matchDetails.incidents.length === 0 && <div className="text-center py-20 text-zinc-700 font-black text-[10px] uppercase tracking-[0.4em] opacity-50">Dettagli non ancora disponibili</div>}
                     </div>
                   )}
                   {matchTab === 'formazioni' && (
                     <div className="grid grid-cols-2 gap-10">
                        {['home', 'away'].map(side => (
                          <div key={side} className="space-y-8">
                             <div>
                                <h4 className="text-[11px] font-black text-cyan-500 uppercase italic mb-5 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"/>Titolari</h4>
                                {matchDetails.lineups[side]?.starters.map((p: any) => (
                                  <div key={p.id} className="flex items-center gap-3 text-[11px] border-b border-white/5 py-2 hover:bg-white/5 transition-colors cursor-default"><span className="text-zinc-600 w-5 font-mono font-black text-center text-[10px]">{p.number}</span><span className="uppercase font-bold tracking-tight text-zinc-100">{p.name}</span></div>
                                ))}
                             </div>
                             <div>
                                <h4 className="text-[11px] font-black text-zinc-600 uppercase italic mb-5 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"/>Panchina</h4>
                                {matchDetails.lineups[side]?.subs.map((p: any) => (
                                  <div key={p.id} className="flex items-center gap-3 text-[11px] opacity-60 hover:opacity-100 py-1.5 transition-opacity cursor-default">
                                    <span className="text-zinc-700 w-5 font-mono text-center text-[10px]">{p.number}</span><span className="uppercase font-bold tracking-tight">{p.name}</span>
                                    {p.enteredAt && <span className="text-[9px] text-emerald-400 ml-auto font-black flex items-center gap-1 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20"><ArrowUpRight className="w-3 h-3"/>{p.enteredAt}'</span>}
                                  </div>
                                ))}
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                   {matchTab === 'stats' && (
                     <div className="space-y-8 py-4">
                        {matchDetails.stats.map((g: any) => (
                          <div key={g.groupName} className="space-y-4">
                             <p className="text-[10px] font-black text-zinc-600 uppercase text-center border-b border-white/5 pb-2 ml-4 mr-4 tracking-[0.3em]">{g.groupName}</p>
                             {g.statisticsItems.map((s: any) => {
                               const v1 = parseFloat(s.homeValue); const v2 = parseFloat(s.awayValue); const p = (v1 / (v1 + v2)) * 100;
                               return (
                               <div key={s.name} className="space-y-2">
                                  <div className="flex justify-between text-[11px] font-black italic tracking-tighter"><span>{s.home}</span><span className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest">{s.name}</span><span>{s.away}</span></div>
                                  <div className="flex h-1.5 bg-zinc-900 rounded-full overflow-hidden shadow-inner border border-white/5"><div className="bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all duration-1000 ease-out" style={{ width: p + "%" }} /></div>
                               </div>
                             )})}
                          </div>
                        ))}
                        {matchDetails.stats.length === 0 && <div className="text-center py-20 text-zinc-700 font-black text-[10px] uppercase tracking-[0.4em] opacity-50">Statistiche non ancora generate</div>}
                     </div>
                   )}
                 </>
               )}
            </div>
            <button onClick={() => setModalFixture(null)} className="absolute top-8 right-8 p-3 bg-zinc-900/50 rounded-full border border-white/10 hover:bg-red-500 hover:text-white text-zinc-500 transition-all duration-300 shadow-2xl backdrop-blur-md flex items-center justify-center active:scale-95"><X className="w-5 h-5"/></button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
