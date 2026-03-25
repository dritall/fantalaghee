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
          let r = 1;
          if (e.shortName) {
            const match = e.shortName.match(/\d+/);
            if (match) r = parseInt(match[0], 10);
          } else if (e.roundId || e.matchDayId) {
            const match = String(e.roundId || e.matchDayId).match(/\d+$/);
            if (match) r = parseInt(match[0], 10);
          } else if (e.matchday) {
            r = e.matchday;
          }
          if (!map[r]) map[r] = [];
          if (!map[r].find((m: any) => (m.matchId || m.id) === (e.matchId || e.id))) map[r].push(e);
        });
        setRoundsMatches(map);
        
        const stdRows = stdRes.data?.teams || stdRes.data?.data?.teams || [];
        setStandings(stdRows);
        
        const playedRounds = all.filter((m: any) => ['Played', 'Completed', 'finished'].includes(m.matchStatus) || ['Played', 'Completed'].includes(m.matchdayStatus) || ['Played', 'Completed'].includes(m.scheduleStatus)).map((m: any) => {
          let r = 0;
          if (m.shortName) {
            const match = m.shortName.match(/\d+/);
            if (match) r = parseInt(match[0], 10);
          } else if (m.matchday) {
            r = m.matchday;
          }
          return r;
        });
        if (playedRounds.length > 0) setSelectedRound(Math.max(...playedRounds));
      } catch (e) {
        console.error("🔥 [UI ERROR] Errore sincronizzazione Hub Serie A:", e);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const openMatch = async (m: any) => {
    setModalFixture(m); setMatchTab('cronaca'); setMatchDetails(null);
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
              {Array.from({length: 38}, (_, i) => i + 1).map((r) => (
                <button key={r} onClick={() => setSelectedRound(r)} className={`px-5 py-2 rounded-xl shrink-0 font-bold text-xs border transition-all duration-300 ${selectedRound===r?'border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]':'border-white/5 text-zinc-600 hover:border-white/20'}`}>G.{r}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundsMatches[selectedRound] ? roundsMatches[selectedRound].map((m, idx) => {
                const homeLogo = `https://img.legaseriea.it/vimages/${m.homeTeam?.imagery?.teamLogo}`;
                const awayLogo = `https://img.legaseriea.it/vimages/${m.awayTeam?.imagery?.teamLogo}`;
                const isNotStarted = ['To Be Played', 'notstarted', 'Fixture'].includes(m.matchStatus) || ['To Be Played'].includes(m.matchdayStatus) || ['To Be Played'].includes(m.scheduleStatus) || m.status?.type === 'notstarted';
                const isLive = ['Live', 'Playing', 'inprogress'].includes(m.matchStatus);
                return (
                <div key={m.matchId || m.id || idx} onClick={() => openMatch(m)} className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-zinc-800 hover:border-white/20 transition-all group shadow-lg">
                  <div className="flex items-center gap-4 w-[42%]"><img src={homeLogo} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt=""/><span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{m.homeTeam?.shortName}</span></div>
                  <div className="text-center font-black text-cyan-400 italic text-sm tracking-tighter shadow-cyan-500/10 drop-shadow-md">
                    {isNotStarted ? 'VS' : (
                      <div className="flex flex-col items-center">
                        <span>{(m.providerHomeScore ?? m.homeScore?.current ?? 0)} - {(m.providerAwayScore ?? m.awayScore?.current ?? 0)}</span>
                        {isLive && <span className="text-[9px] text-red-500 animate-pulse mt-1">LIVE</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 w-[42%] justify-end text-right"><span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{m.awayTeam?.shortName}</span><img src={awayLogo} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt=""/></div>
                </div>
                )
              }) : <div className="col-span-full py-20 text-center text-zinc-700 font-black uppercase text-xs tracking-[0.4em] opacity-50">Giornata non ancora disponibile</div>}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-sm shadow-2xl">
            {standings.map((t, i) => {
              const ptsStat = t.stats?.find((s:any) => s.statsId === 'points');
              const pts = ptsStat ? ptsStat.statsValue : 0;
              return (
              <div key={t.shortName || i} className="grid grid-cols-12 items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-6 rounded-2xl transition-all group">
                <span className="col-span-1 text-[10px] font-black text-zinc-600 group-hover:text-cyan-500 transition-colors">{(i+1).toString().padStart(2,'0')}</span>
                <div className="col-span-8 flex items-center gap-4"><img src={`https://img.legaseriea.it/vimages/${t.imagery?.teamLogo}`} className="w-8 h-8 object-contain" alt="" /><span className="text-sm font-bold uppercase tracking-tight group-hover:translate-x-1 transition-transform">{t.shortName}</span></div>
                <span className="col-span-3 text-right font-black text-cyan-400 tracking-tighter group-hover:scale-110 transition-transform">{pts} PT</span>
              </div>
            )})}
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
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center"><img src={`https://img.legaseriea.it/vimages/${modalFixture?.homeTeam?.imagery?.teamLogo}`} className="w-16 h-16 object-contain" alt="" /><span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{modalFixture?.homeTeam?.shortName}</span></div>
                  <div className="text-6xl font-black italic tracking-tighter italic text-white shadow-cyan-500/20 drop-shadow-2xl">{modalFixture?.providerHomeScore ?? 0} - {modalFixture?.providerAwayScore ?? 0}</div>
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center"><img src={`https://img.legaseriea.it/vimages/${modalFixture?.awayTeam?.imagery?.teamLogo}`} className="w-16 h-16 object-contain" alt="" /><span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{modalFixture?.awayTeam?.shortName}</span></div>
               </div>
               <div className="flex bg-black p-1 rounded-2xl border border-white/5 w-full max-w-md mx-auto shadow-inner">
                  {[ {id:'cronaca', i:Clock}, {id:'stats', i:BarChart3}, {id:'formazioni', i:Users} ].map(t => (
                    <button key={t.id} onClick={() => setMatchTab(t.id as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all duration-300 ${matchTab === t.id ? 'bg-zinc-800 text-cyan-400 shadow-md' : 'text-zinc-600 hover:text-white'}`}><t.i className="w-3 h-3"/>{t.id}</button>
                  ))}
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
                   <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest italic">Dettagli in arrivo dalle API ufficiali</span>
               </div>
            </div>
            <button onClick={() => setModalFixture(null)} className="absolute top-8 right-8 p-3 bg-zinc-900/50 rounded-full border border-white/10 hover:bg-red-500 hover:text-white text-zinc-500 transition-all duration-300 shadow-2xl backdrop-blur-md flex items-center justify-center active:scale-95"><X className="w-5 h-5"/></button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
