"use client";
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { fetchMatchDetails } from '@/lib/sofascore';
import { X, Loader2, Users, BarChart3, Clock, ArrowUpRight } from 'lucide-react';

export default function ScoutHub() {
  const [activeTab, setActiveTab] = useState('calendario');
  const [rounds, setRounds] = useState<any[][]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalFixture, setModalFixture] = useState<any>(null);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [matchTab, setMatchTab] = useState<'cronaca' | 'stats' | 'formazioni'>('cronaca');

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
        const chunks = Array.from({length: 38}, (_, i) => map[i + 1] || []);
        setRounds(chunks);
        setStandings(std?.standings?.[0]?.rows || []);
        const cur = chunks.findIndex(c => c.some(m => m.status.type !== 'finished'));
        setSelectedRoundIndex(cur !== -1 ? cur : 29); // Fallback giornata 30
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

  const getLogo = (id: number) => "/api/sofascore?endpoint=teams/get-logo&teamId=" + id;

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-bold uppercase tracking-widest italic">Sincronizzazione...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 pt-24 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex bg-zinc-900 p-1 rounded-2xl mb-8 max-w-xs mx-auto border border-white/5">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-cyan-500 text-black' : 'text-zinc-500'}`}>{t}</button>
          ))}
        </div>
        {activeTab === 'calendario' ? (
          <div className="space-y-6">
            <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar">
              {rounds.map((_, i) => (
                <button key={i} onClick={() => setSelectedRoundIndex(i)} className={`px-4 py-2 rounded-lg shrink-0 font-bold text-xs border ${selectedRoundIndex===i?'border-cyan-400 bg-cyan-400/10 text-white':'border-white/5 text-zinc-600'}`}>G.{i+1}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rounds[selectedRoundIndex]?.map(m => (
                <div key={m.id} onClick={() => openMatch(m)} className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-all">
                  <div className="flex items-center gap-3 w-[40%]"><img src={getLogo(m.homeTeam.id)} className="w-8 h-8 object-contain"/><span className="text-xs font-bold uppercase truncate">{m.homeTeam.name}</span></div>
                  <div className="font-black italic text-cyan-400">{m.status.type === 'notstarted' ? 'VS' : (m.homeScore?.current ?? 0) + "-" + (m.awayScore?.current ?? 0)}</div>
                  <div className="flex items-center gap-3 w-[40%] justify-end text-right"><span className="text-xs font-bold uppercase truncate">{m.awayTeam.name}</span><img src={getLogo(m.awayTeam.id)} className="w-8 h-8 object-contain"/></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 rounded-3xl p-6 border border-white/5">
            {standings.map((t, i) => (
              <div key={t.team.id} className="flex justify-between py-4 border-b border-white/5 last:border-0 items-center px-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4"><span className="text-zinc-600 font-bold w-4">{i+1}</span><img src={getLogo(t.team.id)} className="w-6 h-6 object-contain" /><span className="text-sm font-bold uppercase">{t.team.name}</span></div>
                <span className="font-black text-cyan-400">{t.points} PT</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog.Root open={!!modalFixture} onOpenChange={() => setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0a] border border-white/10 rounded-[3rem] w-[95vw] max-w-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <Dialog.Title className="sr-only">Dettagli Match</Dialog.Title>
            <div className="p-6 bg-white/5 border-b border-white/5">
               <div className="flex justify-between items-center mb-6 px-4">
                  <div className="flex flex-col items-center gap-2 w-1/3 text-center"><img src={getLogo(modalFixture?.homeTeam.id)} className="w-12 h-12" /><span className="text-[10px] uppercase text-zinc-500 font-black">{modalFixture?.homeTeam.name}</span></div>
                  <div className="text-4xl font-black italic tracking-tighter">{modalFixture?.homeScore?.current ?? 0} - {modalFixture?.awayScore?.current ?? 0}</div>
                  <div className="flex flex-col items-center gap-2 w-1/3 text-center"><img src={getLogo(modalFixture?.awayTeam.id)} className="w-12 h-12" /><span className="text-[10px] uppercase text-zinc-500 font-black">{modalFixture?.awayTeam.name}</span></div>
               </div>
               <div className="flex bg-black p-1 rounded-xl w-full border border-white/5 max-w-md mx-auto">
                  {[ {id:'cronaca', i:Clock}, {id:'stats', i:BarChart3}, {id:'formazioni', i:Users} ].map(t => (
                    <button key={t.id} onClick={() => setMatchTab(t.id as any)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 ${matchTab === t.id ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-600'}`}><t.i className="w-3 h-3"/>{t.id}</button>
                  ))}
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
               {!matchDetails ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400" /> : (
                 <>
                   {matchTab === 'cronaca' && (
                     <div className="space-y-4">
                       {matchDetails.incidents.map((inc: any, i: number) => (
                         <div key={i} className={`flex items-center gap-3 ${inc.isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                            <span className="text-lg">{inc.type==='goal'?'⚽':inc.class==='yellow'?'🟨':'🟥'}</span>
                            <div className="flex flex-col">
                               <span className="text-xs font-black uppercase text-white">{inc.type === 'substitution' ? inc.playerInName + " ↔ " + inc.playerOutName : inc.playerName}</span>
                               <span className="text-[9px] text-zinc-500 font-bold italic">{inc.time}' {inc.assist ? ' — Assist: ' + inc.assist : ''}</span>
                            </div>
                         </div>
                       ))}
                     </div>
                   )}
                   {matchTab === 'formazioni' && (
                     <div className="grid grid-cols-2 gap-8">
                        {['home', 'away'].map(side => (
                          <div key={side} className="space-y-6">
                             <div>
                                <h4 className="text-[10px] font-black text-cyan-500 uppercase italic mb-3">Titolari</h4>
                                {matchDetails.lineups[side]?.starters.map((p: any) => (
                                  <div key={p.id} className="flex items-center gap-2 text-xs border-b border-white/5 py-1.5"><span className="text-zinc-600 w-4 font-mono font-bold">{p.number}</span><span className="uppercase font-bold tracking-tighter">{p.name}</span></div>
                                ))}
                             </div>
                             <div>
                                <h4 className="text-[10px] font-black text-zinc-600 uppercase italic mb-3">Panchina</h4>
                                {matchDetails.lineups[side]?.subs.map((p: any) => (
                                  <div key={p.id} className="flex items-center gap-2 text-xs opacity-60 py-1.5">
                                    <span className="text-zinc-700 w-4 font-mono">{p.number}</span><span className="uppercase">{p.name}</span>
                                    {p.enteredAt && <span className="text-[9px] text-emerald-400 ml-auto font-black flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/>{p.enteredAt}'</span>}
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
                                  <div className="flex justify-between text-[10px] font-black italic"><span>{s.home}</span><span className="text-zinc-500 font-normal uppercase text-[8px] tracking-wider">{s.name}</span><span>{s.away}</span></div>
                                  <div className="flex h-1 bg-zinc-900 rounded-full overflow-hidden"><div className="bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]" style={{ width: p + "%" }} /></div>
                               </div>
                             )})}
                          </div>
                        ))}
                     </div>
                   )}
                 </>
               )}
            </div>
            <button onClick={() => setModalFixture(null)} className="absolute top-6 right-6 p-2 bg-zinc-900 rounded-full border border-white/5 hover:bg-zinc-800 transition-all"><X className="w-4 h-4"/></button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
