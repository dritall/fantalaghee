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
  const [modalLoading, setModalLoading] = useState(false);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [matchTab, setMatchTab] = useState<'cronaca' | 'stats' | 'formazioni'>('cronaca');

  useEffect(() => {
    async function load() {
      try {
        const [allRes, sRes] = await Promise.all([
          fetch('/api/sofascore?endpoint=tournaments/get-scheduled-events&tournamentId=23&seasonId=76457').then(r => r.json()),
          fetch('/api/sofascore?endpoint=tournaments/get-standings&tournamentId=23&seasonId=76457').then(r => r.json())
        ]);
        const events = allRes?.events || [];
        const roundsMap: Record<number, any[]> = {};
        events.forEach((e: any) => {
          const r = e.roundInfo?.round || 1;
          if (!roundsMap[r]) roundsMap[r] = [];
          roundsMap[r].push(e);
        });
        const chunks = Object.keys(roundsMap).sort((a,b)=>Number(a)-Number(b)).map(k => roundsMap[Number(k)]);
        setRounds(chunks);
        setStandings(sRes?.standings?.[0]?.rows || []);
        const currentIdx = chunks.findIndex(c => c.some(m => m.status.type !== 'finished'));
        setSelectedRoundIndex(currentIdx !== -1 ? currentIdx : chunks.length - 1);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, []);

  const openMatch = async (m: any) => {
    setModalFixture(m); setMatchTab('cronaca'); setModalLoading(true);
    const d = await fetchMatchDetails(m.id);
    setMatchDetails(d); setModalLoading(false);
  };

  const getLogo = (id: number) => `/api/sofascore?endpoint=teams/get-logo&teamId=${id}`;

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-black animate-pulse uppercase tracking-widest text-xs">Sincronizzazione Totale...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex bg-zinc-900/80 backdrop-blur-xl p-1 rounded-2xl border border-white/5 mb-8 max-w-xs mx-auto">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-500'}`}>{t}</button>
          ))}
        </div>

        {activeTab === 'calendario' ? (
          <div className="space-y-6">
            <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar snap-x">
              {rounds.map((_, i) => (
                <button key={i} onClick={() => setSelectedRoundIndex(i)} className={`px-5 py-2 rounded-xl shrink-0 font-black text-xs border transition-all snap-center ${selectedRoundIndex===i?'border-cyan-500 bg-cyan-500/20 text-white':'border-transparent text-zinc-600'}`}>G.{rounds[i][0]?.roundInfo?.round || i+1}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rounds[selectedRoundIndex]?.map(m => (
                <div key={m.id} onClick={() => openMatch(m)} className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-all group">
                  <div className="flex items-center gap-4 w-[42%]">
                    <img src={getLogo(m.homeTeam.id)} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase truncate tracking-tighter">{m.homeTeam.shortName || m.homeTeam.name}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
                    <span className="text-lg font-black text-cyan-400 tracking-tighter">
                      {m.status.type === 'notstarted' ? 'VS' : `${m.homeScore?.current ?? 0}-${m.awayScore?.current ?? 0}`}
                    </span>
                    <span className="text-[6px] text-zinc-600 uppercase tracking-widest">{m.status.description}</span>
                  </div>
                  <div className="flex items-center gap-4 w-[42%] justify-end text-right">
                    <span className="text-xs font-black uppercase truncate tracking-tighter">{m.awayTeam.shortName || m.awayTeam.name}</span>
                    <img src={getLogo(m.awayTeam.id)} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 rounded-[3rem] p-8 border border-white/5">
            {standings.map((t, i) => (
              <div key={t.team.id} className="grid grid-cols-12 items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-6 rounded-2xl transition-all">
                <span className="col-span-1 text-[10px] font-black text-zinc-600">{(i+1).toString().padStart(2,'0')}</span>
                <div className="col-span-8 flex items-center gap-4">
                  <img src={getLogo(t.team.id)} className="w-7 h-7 object-contain" />
                  <span className="text-sm font-black uppercase">{t.team.name}</span>
                </div>
                <span className="col-span-3 text-right font-black text-cyan-400">{t.points} PT</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={!!modalFixture} onOpenChange={() => setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080808] border border-white/10 rounded-[3rem] w-[95vw] max-w-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-8 bg-zinc-900/20 border-b border-white/5 flex flex-col items-center">
               <div className="flex justify-between items-center w-full mb-8">
                  <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                    <img src={getLogo(modalFixture?.homeTeam.id)} className="w-14 h-14 object-contain" />
                    <span className="text-[10px] font-black uppercase text-zinc-500 leading-tight">{modalFixture?.homeTeam.name}</span>
                  </div>
                  <div className="text-5xl font-black italic tracking-tighter italic text-white">{modalFixture?.homeScore?.current} - {modalFixture?.awayScore?.current}</div>
                  <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                    <img src={getLogo(modalFixture?.awayTeam.id)} className="w-14 h-14 object-contain" />
                    <span className="text-[10px] font-black uppercase text-zinc-500 leading-tight">{modalFixture?.awayTeam.name}</span>
                  </div>
               </div>
               <div className="flex bg-black p-1 rounded-2xl border border-white/5 w-full max-w-md shadow-2xl">
                  {[ {id:'cronaca', i:Clock}, {id:'stats', i:BarChart3}, {id:'formazioni', i:Users} ].map(tab => (
                    <button key={tab.id} onClick={() => setMatchTab(tab.id as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${matchTab === tab.id ? 'bg-zinc-800 text-cyan-400 shadow-xl' : 'text-zinc-600 hover:text-white'}`}><tab.i className="w-3 h-3"/>{tab.id}</button>
                  ))}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
               {modalLoading ? <div className="flex flex-col items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div> : (
                 <>
                   {matchTab === 'cronaca' && (
                     <div className="space-y-4">
                       {matchDetails.incidents.map((inc: any, i: number) => (
                         <div key={i} className={`flex items-center gap-4 ${inc.isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-lg shadow-xl shrink-0">
                                {inc.incidentType === 'goal' ? '⚽' : inc.incidentClass === 'yellow' ? '🟨' : '🟥'}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[11px] font-black uppercase text-white leading-tight">{inc.player || 'Sconosciuto'}</span>
                               <span className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tighter">{inc.time}' {inc.incidentType === 'substitution' ? `(Entra ${inc.playerIn})` : ''}</span>
                            </div>
                         </div>
                       ))}
                     </div>
                   )}

                   {matchTab === 'formazioni' && (
                     <div className="grid grid-cols-2 gap-8">
                        {['home', 'away'].map(side => (
                          <div key={side} className="space-y-8">
                             <div>
                                <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-3 italic">Titolari</h4>
                                {matchDetails.lineups[side].starters.map((p: any) => (
                                  <div key={p.id} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl mb-1 border border-white/5">
                                    <span className="text-[9px] font-black text-zinc-600 w-4 font-mono">{p.number}</span>
                                    <span className="text-xs font-black uppercase tracking-tighter text-zinc-300">{p.name}</span>
                                  </div>
                                ))}
                             </div>
                             <div>
                                <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 italic">Panchina</h4>
                                {matchDetails.lineups[side].subs.map((p: any) => (
                                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl opacity-60">
                                    <span className="text-[9px] font-black text-zinc-700 w-4">{p.number}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500">{p.name}</span>
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
                          <div key={g.groupName} className="space-y-4">
                             <p className="text-[10px] font-black text-zinc-500 uppercase text-center border-b border-white/5 pb-1">{g.groupName}</p>
                             {g.statisticsItems.map((s: any) => {
                               const v1 = parseFloat(s.homeValue); const v2 = parseFloat(s.awayValue); const p = (v1 / (v1 + v2)) * 100;
                               return (
                               <div key={s.name} className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-black uppercase italic tracking-tighter">
                                     <span className="text-white text-lg">{s.home}</span><span className="text-zinc-600 font-normal">{s.name}</span><span className="text-white text-lg">{s.away}</span>
                                  </div>
                                  <div className="flex h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                     <div className="bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${p}%` }} />
                                     <div className="bg-zinc-700" style={{ width: `${100-p}%` }} />
                                  </div>
                               </div>
                             )})}
                          </div>
                        ))}
                     </div>
                   )}
                 </>
               )}
            </div>
            <button onClick={() => setModalFixture(null)} className="absolute top-6 right-6 p-3 bg-zinc-900 text-white rounded-2xl border border-white/10 hover:bg-red-500 transition-colors"><X className="w-5 h-5"/></button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
}
