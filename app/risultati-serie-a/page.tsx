"use client";
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { fetchMatchDetails } from '@/lib/sofascore';
import { X, Loader2 } from 'lucide-react';

export default function ScoutHub() {
  const [activeTab, setActiveTab] = useState('calendario');
  const [rounds, setRounds] = useState<any[][]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalFixture, setModalFixture] = useState<any>(null);
  const [incidentsData, setIncidentsData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        // Usiamo i path confermati dai dump
        const [lastRes, nextRes, sRes] = await Promise.all([
          fetch('/api/sofascore?endpoint=tournaments/get-last-matches&tournamentId=23&seasonId=76457').then(r => r.json()),
          fetch('/api/sofascore?endpoint=tournaments/get-next-matches&tournamentId=23&seasonId=76457').then(r => r.json()),
          fetch('/api/sofascore?endpoint=tournaments/get-standings&tournamentId=23&seasonId=76457').then(r => r.json())
        ]);

        const allMatches = [...(lastRes?.events || []), ...(nextRes?.events || [])];
        const roundsMap: Record<number, any[]> = {};
        allMatches.forEach((e: any) => {
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-bold tracking-widest uppercase">Sincronizzazione Dati...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 pt-32">
      <div className="max-w-4xl mx-auto">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-8 max-w-xs mx-auto">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>

        {activeTab === 'calendario' ? (
          <div className="space-y-6">
            <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar">
              {rounds.map((_, i) => (
                <button key={i} onClick={() => setSelectedRoundIndex(i)} className={`px-4 py-2 rounded-lg shrink-0 font-black text-xs border ${selectedRoundIndex===i?'border-cyan-400 bg-cyan-400/10 text-white':'border-white/5 text-zinc-500'}`}>G.{rounds[i][0]?.roundInfo?.round || i+1}</button>
              ))}
            </div>
            <div className="grid gap-3">
              {rounds[selectedRoundIndex]?.map(m => (
                <div key={m.id} onClick={async () => { setModalFixture(m); const d = await fetchMatchDetails(m.id); setIncidentsData(d.incidents); }} className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-all group">
                  <div className="flex items-center gap-3 w-[40%]"><img src={`https://api.sofascore.app/api/v1/team/${m.homeTeam.id}/image`} className="w-8 h-8"/> <span className="text-xs font-bold uppercase truncate">{m.homeTeam.name}</span></div>
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black italic">{m.status.type === 'notstarted' ? 'VS' : `${m.homeScore?.current ?? 0} - ${m.awayScore?.current ?? 0}`}</span>
                    <span className="text-[7px] text-zinc-500 uppercase tracking-tighter">{m.status.description}</span>
                  </div>
                  <div className="flex items-center gap-3 w-[40%] justify-end"><span className="text-xs font-bold uppercase truncate">{m.awayTeam.name}</span> <img src={`https://api.sofascore.app/api/v1/team/${m.awayTeam.id}/image`} className="w-8 h-8"/></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/10">
            {standings.map((t, i) => (
              <div key={t.team.id} className="grid grid-cols-12 items-center py-3 border-b border-white/5 last:border-0">
                <span className="col-span-1 text-[10px] font-black text-zinc-600">{i+1}</span>
                <div className="col-span-8 flex items-center gap-3">
                  <img src={`https://api.sofascore.app/api/v1/team/${t.team.id}/image`} className="w-6 h-6" />
                  <span className="text-sm font-bold">{t.team.name}</span>
                </div>
                <span className="col-span-3 text-right font-black text-cyan-400">{t.points} PT</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={!!modalFixture} onOpenChange={() => setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 p-6 rounded-[2rem] w-[95vw] max-w-md border border-white/10 z-[101]">
            <Dialog.Title className="text-center font-black uppercase text-[10px] mb-6 text-zinc-500 tracking-[0.2em]">{modalFixture?.homeTeam.name} VS {modalFixture?.awayTeam.name}</Dialog.Title>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {incidentsData.map((inc, i) => (
                <div key={i} className={`flex items-center gap-3 ${inc.isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                  <span className="text-lg">{inc.incidentType==='goal'?'⚽':(inc.incidentClass==='yellow'?'🟨':'🟥')}</span>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase leading-none">{inc.player.name}</span>
                    <span className="text-[9px] font-bold text-cyan-500">{inc.time}'</span>
                  </div>
                </div>
              ))}
              {incidentsData.length === 0 && <p className="text-center text-zinc-600 text-[10px] uppercase font-black">Nessun evento registrato</p>}
            </div>
            <button onClick={() => setModalFixture(null)} className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all uppercase text-[10px] tracking-widest border border-white/5">Chiudi</button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
