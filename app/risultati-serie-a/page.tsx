"use client";
import React, { useState, useEffect } from 'react';
import { X, Loader2, Trophy } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { fetchMatchDetails } from '@/lib/sofascore';

export default function ScoutHub() {
  const [activeTab, setActiveTab] = useState<'calendario' | 'classifica'>('calendario');
  const [rounds, setRounds] = useState<any[][]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalFixture, setModalFixture] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [incidentsData, setIncidentsData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, sRes] = await Promise.all([
          fetch('/api/sofascore?endpoint=seasons/v1/get-events&tournamentId=23&seasonId=76457').then(r => r.json()),
          fetch('/api/sofascore?endpoint=tournaments/v1/get-standings&tournamentId=23&seasonId=76457').then(r => r.json())
        ]);
        setStandings(sRes?.standings?.[0]?.rows || []);
        const events = mRes?.events || [];
        const roundsMap: Record<number, any[]> = {};
        events.forEach((e: any) => {
          const r = e.roundInfo?.round || 1;
          if (!roundsMap[r]) roundsMap[r] = [];
          roundsMap[r].push(e);
        });
        const chunks = Object.keys(roundsMap).sort((a,b)=>Number(a)-Number(b)).map(k => roundsMap[Number(k)]);
        setRounds(chunks);
        setSelectedRoundIndex(Math.max(0, chunks.findIndex(c => c.some(m => m.status.type !== 'finished'))));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const openMatch = async (m: any) => {
    setModalFixture(m); setModalLoading(true);
    const d = await fetchMatchDetails(m.id);
    setIncidentsData(d.incidents); setModalLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-black animate-pulse">SINCRONIZZAZIONE...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 pt-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-10 max-w-xs mx-auto">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>

        {activeTab === 'calendario' ? (
          <div className="space-y-8">
            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
              {rounds.map((_, i) => (
                <button key={i} onClick={() => setSelectedRoundIndex(i)} className={`min-w-[70px] py-2 rounded-lg font-black text-xs border ${selectedRoundIndex === i ? 'border-cyan-400 bg-cyan-400/10 text-white' : 'border-white/10 text-slate-500'}`}>G.{i+1}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rounds[selectedRoundIndex]?.map(m => (
                <div key={m.id} onClick={() => openMatch(m)} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-cyan-500/30 transition-all cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                      <img src={`https://api.sofascore.app/api/v1/team/${m.homeTeam.id}/image`} className="w-10 h-10" />
                      <span className="text-[9px] font-black uppercase truncate w-full">{m.homeTeam.name}</span>
                    </div>
                    <div className="text-xl font-black italic">{m.homeScore.current ?? 0} - {m.awayScore.current ?? 0}</div>
                    <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                      <img src={`https://api.sofascore.app/api/v1/team/${m.awayTeam.id}/image`} className="w-10 h-10" />
                      <span className="text-[9px] font-black uppercase truncate w-full">{m.awayTeam.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-6">
            {standings.map((t, i) => (
              <div key={t.team.id} className="grid grid-cols-12 items-center py-3 border-b border-white/5 last:border-0">
                <span className="col-span-1 text-xs font-black text-slate-500">{i+1}</span>
                <div className="col-span-7 flex items-center gap-3">
                  <img src={`https://api.sofascore.app/api/v1/team/${t.team.id}/image`} className="w-6 h-6" />
                  <span className="text-sm font-bold">{t.team.name}</span>
                </div>
                <span className="col-span-2 text-center text-xs">{t.matches}</span>
                <span className="col-span-2 text-right font-black text-cyan-400">{t.points}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={!!modalFixture} onOpenChange={(o) => !o && setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[2rem] z-[101] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-sm font-black uppercase text-cyan-400">{modalFixture?.homeTeam.name} vs {modalFixture?.awayTeam.name}</h3>
              <button onClick={() => setModalFixture(null)}><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" /> : (
                incidentsData.map((inc, i) => (
                  <div key={i} className={`flex items-center gap-4 ${inc.isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">{inc.incidentType === 'goal' ? '⚽' : '🟨'}</div>
                    <div>
                      <p className="text-xs font-black uppercase">{inc.player?.name}</p>
                      <p className="text-[10px] text-slate-500">{inc.time}'</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
