"use client";
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { fetchMatchDetails } from '@/lib/sofascore';
import { X, Loader2, Users, BarChart3, Clock } from 'lucide-react';

export default function ScoutHub() {
  const [activeTab, setActiveTab] = useState('calendario');
  const [rounds, setRounds] = useState<any[][]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalFixture, setModalFixture] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [matchDetails, setMatchDetails] = useState<any>({ stats: [], incidents: [], lineups: null });
  const [matchTab, setMatchTab] = useState<'cronaca' | 'formazioni' | 'stats'>('cronaca');

  useEffect(() => {
    async function load() {
      try {
        const [lastRes, nextRes, sRes] = await Promise.all([
          fetch('/api/sofascore?endpoint=tournaments/get-last-matches&tournamentId=23&seasonId=76457').then(r => r.json()),
          fetch('/api/sofascore?endpoint=tournaments/get-next-matches&tournamentId=23&seasonId=76457').then(r => r.json()),
          fetch('/api/sofascore?endpoint=tournaments/get-standings&tournamentId=23&seasonId=76457').then(r => r.json())
        ]);
        const all = [...(lastRes?.events || []), ...(nextRes?.events || [])];
        const roundsMap: Record<number, any[]> = {};
        all.forEach((e: any) => {
          const r = e.roundInfo?.round || 1;
          if (!roundsMap[r]) roundsMap[r] = [];
          if (!roundsMap[r].find(m => m.id === e.id)) roundsMap[r].push(e);
        });
        const chunks = Object.keys(roundsMap).sort((a,b)=>Number(a)-Number(b)).map(k => roundsMap[Number(k)]);
        setRounds(chunks);
        setStandings(sRes?.standings?.[0]?.rows || []);
        const firstUnfinished = chunks.findIndex(c => c.some(m => m.status.type !== 'finished'));
        setSelectedRoundIndex(firstUnfinished !== -1 ? firstUnfinished : chunks.length - 1);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, []);

  const openMatch = async (m: any) => {
    setModalFixture(m); setMatchTab('cronaca'); setModalLoading(true);
    const d = await fetchMatchDetails(m.id);
    setMatchDetails(d); setModalLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-black animate-pulse uppercase tracking-widest">Sincronizzazione in corso...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32">
      <div className="max-w-5xl mx-auto">
        {/* Selettore Tab Principale */}
        <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 mb-8 max-w-xs mx-auto backdrop-blur-xl">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'text-zinc-500 hover:text-white'}`}>{t}</button>
          ))}
        </div>

        {activeTab === 'calendario' ? (
          <div className="space-y-6">
            {/* Selettore Giornate FIGO */}
            <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide snap-x">
              {rounds.map((_, i) => (
                <button key={i} onClick={() => setSelectedRoundIndex(i)} className={`px-5 py-3 rounded-2xl shrink-0 font-black text-xs border transition-all snap-center ${selectedRoundIndex===i?'border-cyan-500 bg-cyan-500/10 text-white shadow-[0_0_20px_rgba(6,182,212,0.2)]':'border-white/5 bg-zinc-900/30 text-zinc-600'}`}>G.{i+1}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rounds[selectedRoundIndex]?.map(m => (
                <div key={m.id} onClick={() => openMatch(m)} className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-all active:scale-95 group">
                  <div className="flex items-center gap-3 w-[42%]">
                    <img src={`https://api.sofascore.app/api/v1/team/${m.homeTeam.id}/image`} className="w-9 h-9 object-contain" />
                    <span className="text-xs font-black uppercase truncate">{m.homeTeam.shortName || m.homeTeam.name}</span>
                  </div>
                  <div className="flex flex-col items-center bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <span className="text-sm font-black italic tracking-tighter text-cyan-400">
                      {m.status.type === 'notstarted' ? 'VS' : `${m.homeScore?.current ?? 0}-${m.awayScore?.current ?? 0}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 w-[42%] justify-end">
                    <span className="text-xs font-black uppercase truncate">{m.awayTeam.shortName || m.awayTeam.name}</span>
                    <img src={`https://api.sofascore.app/api/v1/team/${m.awayTeam.id}/image`} className="w-9 h-9 object-contain" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-6 border border-white/5 backdrop-blur-xl">
            {standings.map((t, i) => (
              <div key={t.team.id} className="grid grid-cols-12 items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-4 rounded-xl transition-all">
                <span className="col-span-1 text-[10px] font-black text-zinc-600 tracking-tighter">{(i+1).toString().padStart(2,'0')}</span>
                <div className="col-span-8 flex items-center gap-4">
                  <img src={`https://api.sofascore.app/api/v1/team/${t.team.id}/image`} className="w-7 h-7 object-contain" />
                  <span className="text-sm font-black uppercase tracking-tight">{t.team.name}</span>
                </div>
                <span className="col-span-3 text-right font-black text-cyan-400 tracking-tighter">{t.points} PT</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dettagli Stile Forza Football */}
      <Dialog.Root open={!!modalFixture} onOpenChange={() => setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0a] border border-white/10 rounded-[3rem] w-[95vw] max-w-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            
            <div className="p-8 border-b border-white/5 bg-white/5 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-8">
                 <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                    <img src={`https://api.sofascore.app/api/v1/team/${modalFixture?.homeTeam.id}/image`} className="w-16 h-16 object-contain" />
                    <span className="text-[10px] font-black uppercase text-zinc-400">{modalFixture?.homeTeam.name}</span>
                 </div>
                 <div className="text-4xl font-black italic text-white tracking-tighter">
                    {modalFixture?.homeScore?.current} - {modalFixture?.awayScore?.current}
                 </div>
                 <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                    <img src={`https://api.sofascore.app/api/v1/team/${modalFixture?.awayTeam.id}/image`} className="w-16 h-16 object-contain" />
                    <span className="text-[10px] font-black uppercase text-zinc-400">{modalFixture?.awayTeam.name}</span>
                 </div>
              </div>

              {/* Selettore Tab Interno */}
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-full">
                {[
                  { id: 'cronaca', icon: Clock },
                  { id: 'stats', icon: BarChart3 },
                  { id: 'formazioni', icon: Users }
                ].map(t => (
                  <button key={t.id} onClick={() => setMatchTab(t.id as any)} className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${matchTab === t.id ? 'bg-white/10 text-cyan-400' : 'text-zinc-500'}`}>
                    <t.icon className="w-3 h-3" /> {t.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Analisi dati...</span>
                </div>
              ) : (
                <>
                  {matchTab === 'cronaca' && (
                    <div className="space-y-6 relative">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2" />
                      {matchDetails.incidents.map((inc: any, i: number) => (
                        <div key={i} className={`flex items-center gap-4 relative z-10 ${inc.isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                          <div className={`w-1/2 ${inc.isHome ? 'pr-4' : 'pl-4'}`}>
                            <div className={`p-3 bg-zinc-900/50 rounded-2xl border border-white/5 ${inc.isHome ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                              <p className="text-xs font-black uppercase">
                                {inc.type === 'substitution' ? `${inc.playerIn} ↔ ${inc.playerOut}` : inc.player}
                              </p>
                              <p className="text-[9px] text-zinc-500 font-bold mt-1 uppercase">
                                {inc.type === 'goal' ? '⚽ GOL' : inc.type === 'card' ? `${inc.class === 'yellow' ? '🟨 GIALLO' : '🟥 ROSSO'}` : '🔄 CAMBIO'}
                              </p>
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-black border-2 border-zinc-800 flex items-center justify-center shrink-0 shadow-xl">
                            <span className="text-[10px] font-black text-cyan-400">{inc.time}'</span>
                          </div>
                          <div className="w-1/2" />
                        </div>
                      ))}
                    </div>
                  )}

                  {matchTab === 'stats' && (
                    <div className="space-y-8">
                      {matchDetails.stats.map((group: any) => (
                        <div key={group.groupName} className="space-y-4">
                          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">{group.groupName}</h4>
                          {group.statisticsItems.map((s: any) => {
                            const total = (parseFloat(s.homeValue) || 0) + (parseFloat(s.awayValue) || 0) || 1;
                            const hPerc = (parseFloat(s.homeValue) / total) * 100;
                            return (
                              <div key={s.name} className="space-y-2">
                                <div className="flex justify-between text-[11px] font-black uppercase italic">
                                  <span>{s.home}</span>
                                  <span className="text-zinc-500 font-normal">{s.name}</span>
                                  <span>{s.away}</span>
                                </div>
                                <div className="flex h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-500" style={{ width: `${hPerc}%` }} />
                                  <div className="h-full bg-zinc-700" style={{ width: `${100-hPerc}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {matchTab === 'formazioni' && (
                    <div className="grid grid-cols-2 gap-8">
                      {['home', 'away'].map(side => (
                        <div key={side} className="space-y-4">
                          <h4 className="text-[10px] font-black text-cyan-500 uppercase">{side === 'home' ? 'Titolari Casa' : 'Titolari Ospiti'}</h4>
                          {matchDetails.lineups[side].players.map((p: any) => (
                            <div key={p.player.id} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                              <span className="text-[10px] font-black text-zinc-500 w-4">{p.shirtNumber}</span>
                              <span className="text-xs font-bold truncate">{p.player.shortName}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <button onClick={() => setModalFixture(null)} className="absolute top-8 right-8 p-3 bg-black/40 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 backdrop-blur-md">
              <X className="w-5 h-5" />
            </button>
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
