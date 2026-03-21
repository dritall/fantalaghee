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
        const chunks = Object.keys(map).sort((a,b)=>Number(a)-Number(b)).map(k => map[Number(k)]);
        setRounds(chunks);
        setStandings(std?.standings?.[0]?.rows || []);
        const cur = chunks.findIndex(c => c.some(m => m.status.type !== 'finished'));
        setSelectedRoundIndex(cur !== -1 ? cur : chunks.length - 1);
      } catch (e) {
         console.error("🔥 [UI ERROR] Errore caricamento calendario/classifica principale:", e);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const getLogo = (id: number) => `/api/sofascore?endpoint=teams/get-logo&teamId=${id}`;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex bg-zinc-900 p-1 rounded-2xl mb-8 max-w-xs mx-auto">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase ${activeTab === t ? 'bg-cyan-500 text-black' : 'text-zinc-500'}`}>{t}</button>
          ))}
        </div>

        {activeTab === 'calendario' ? (
          <div className="space-y-6">
            <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar">
              {rounds.map((_, i) => (
                <button key={i} onClick={() => setSelectedRoundIndex(i)} className={`px-4 py-2 rounded-lg shrink-0 font-bold text-xs border ${selectedRoundIndex===i?'border-cyan-400 bg-cyan-400/10':'border-white/5 text-zinc-600'}`}>G.{i+1}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rounds[selectedRoundIndex]?.map(m => (
                <div key={m.id} onClick={async () => { setModalFixture(m); setMatchDetails(null); const d = await fetchMatchDetails(m.id); setMatchDetails(d); }} className="bg-zinc-900/40 border border-white/5 p-5 rounded-3xl flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-all">
                  <div className="flex items-center gap-3 w-[40%]"><img src={getLogo(m.homeTeam.id)} className="w-8 h-8 object-contain"/><span className="text-xs font-bold uppercase truncate">{m.homeTeam.name}</span></div>
                  <div className="text-center"><span className="text-lg font-black">{m.status.type === 'notstarted' ? 'VS' : `${m.homeScore?.current ?? 0}-${m.awayScore?.current ?? 0}`}</span></div>
                  <div className="flex items-center gap-3 w-[40%] justify-end text-right"><span className="text-xs font-bold uppercase truncate">{m.awayTeam.name}</span><img src={getLogo(m.awayTeam.id)} className="w-8 h-8 object-contain"/></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 rounded-3xl p-6">
            {standings.map((t, i) => (
              <div key={t.team.id} className="flex justify-between py-4 border-b border-white/5 last:border-0 items-center px-4">
                <div className="flex items-center gap-4">
                  <span className="text-zinc-600 font-bold">{i+1}</span>
                  <img src={getLogo(t.team.id)} className="w-6 h-6 object-contain" />
                  <span className="text-sm font-bold">{t.team.name}</span>
                </div>
                <span className="font-black text-cyan-400">{t.points} PT</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={!!modalFixture} onOpenChange={() => setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080808] border border-white/10 rounded-[2.5rem] w-[95vw] max-w-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 bg-white/5 border-b border-white/5 flex flex-col items-center">
               <div className="flex justify-between items-center w-full mb-6">
                  <div className="flex flex-col items-center gap-2 w-1/3 text-center"><img src={getLogo(modalFixture?.homeTeam.id)} className="w-12 h-12" /><span className="text-[10px] uppercase text-zinc-500">{modalFixture?.homeTeam.name}</span></div>
                  <div className="text-4xl font-black italic">{modalFixture?.homeScore?.current} - {modalFixture?.awayScore?.current}</div>
                  <div className="flex flex-col items-center gap-2 w-1/3 text-center"><img src={getLogo(modalFixture?.awayTeam.id)} className="w-12 h-12" /><span className="text-[10px] uppercase text-zinc-500">{modalFixture?.awayTeam.name}</span></div>
               </div>
               <div className="flex bg-black p-1 rounded-xl w-full">
                  {[ {id:'cronaca', i:Clock}, {id:'stats', i:BarChart3}, {id:'formazioni', i:Users} ].map(t => (
                    <button key={t.id} onClick={() => setMatchTab(t.id as any)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 ${matchTab === t.id ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500'}`}><t.i className="w-3 h-3"/>{t.id}</button>
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
                            <span className="text-lg">{inc.incidentType==='goal'?'⚽':inc.incidentClass==='yellow'?'🟨':'🟥'}</span>
                            <div className="flex flex-col"><span className="text-xs font-bold uppercase">{inc.player}</span><span className="text-[9px] text-zinc-500">{inc.time}' {inc.incidentType==='substitution'?`(🔄 ${inc.playerIn})`:''}</span></div>
                         </div>
                       ))}
                     </div>
                   )}
                   {matchTab === 'formazioni' && matchDetails.lineups && (
                     <div className="grid grid-cols-2 gap-6">
                        {['home', 'away'].map(side => (
                          <div key={side} className="space-y-4">
                             <h4 className="text-[10px] font-black text-cyan-500 uppercase">Titolari</h4>
                             {matchDetails.lineups[side].starters.map((p: any) => (
                               <div key={p.id} className="flex items-center gap-2 text-xs opacity-90"><span className="text-zinc-600 w-4">{p.number}</span><span>{p.name}</span></div>
                             ))}
                             <h4 className="text-[10px] font-black text-zinc-500 uppercase mt-4">Panchina</h4>
                             {matchDetails.lineups[side].subs.map((p: any) => (
                               <div key={p.id} className="flex items-center gap-2 text-xs opacity-60">
                                 <span className="text-zinc-700 w-4">{p.number}</span><span>{p.name}</span>
                                 {p.enteredAt && <span className="text-[8px] text-emerald-400 ml-auto flex items-center"><ArrowUpRight className="w-2 h-2"/>{p.enteredAt}'</span>}
                               </div>
                             ))}
                          </div>
                        ))}
                     </div>
                   )}
                   {matchTab === 'stats' && (
                     <div className="space-y-4">
                        {matchDetails.stats.map((g: any) => (
                          <div key={g.groupName} className="space-y-2">
                             <p className="text-[9px] font-black text-zinc-600 uppercase text-center border-b border-white/5">{g.groupName}</p>
                             {g.statisticsItems.map((s: any) => (
                               <div key={s.name} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-black italic"><span>{s.home}</span><span className="text-zinc-500">{s.name}</span><span>{s.away}</span></div>
                                  <div className="flex h-1 bg-zinc-800 rounded-full overflow-hidden">
                                     <div className="bg-cyan-500" style={{ width: `${(parseFloat(s.homeValue)/(parseFloat(s.homeValue)+parseFloat(s.awayValue)))*100}%` }} />
                                  </div>
                               </div>
                             ))}
                          </div>
                        ))}
                     </div>
                   )}
                 </>
               )}
            </div>
            <button onClick={() => setModalFixture(null)} className="absolute top-6 right-6 p-2 bg-zinc-900 rounded-full"><X className="w-4 h-4"/></button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
