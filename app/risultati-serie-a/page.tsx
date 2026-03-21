"use client";
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { fetchMatchDetails } from '@/lib/sofascore';

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
      console.log("🚀 AVVIO CARICAMENTO DATI...");
      try {
        const [mRes, sRes] = await Promise.all([
          fetch('/api/sofascore?endpoint=seasons/v1/get-events&tournamentId=23&seasonId=76457').then(r => r.json()),
          fetch('/api/sofascore?endpoint=tournaments/v1/get-standings&tournamentId=23&seasonId=76457').then(r => r.json())
        ]);
        
        console.log("📅 CALENDARIO RICEVUTO:", mRes);
        console.log("🏆 CLASSIFICA RICEVUTA:", sRes);

        const events = mRes?.events || [];
        if (events.length === 0) console.warn("⚠️ ATTENZIONE: Nessun evento trovato nell'array 'events'");

        const roundsMap: Record<number, any[]> = {};
        events.forEach((e: any) => {
          const r = e.roundInfo?.round || 1;
          if (!roundsMap[r]) roundsMap[r] = [];
          roundsMap[r].push(e);
        });

        const chunks = Object.keys(roundsMap).sort((a,b)=>Number(a)-Number(b)).map(k => roundsMap[Number(k)]);
        setRounds(chunks);
        setStandings(sRes?.standings?.[0]?.rows || []);
        
        const firstUnfinished = chunks.findIndex(c => c.some(m => m.status.type !== 'finished'));
        setSelectedRoundIndex(firstUnfinished !== -1 ? firstUnfinished : chunks.length - 1);
        
      } catch (e) { 
        console.error("❌ ERRORE FATALE CARICAMENTO:", e); 
      } finally { 
        setLoading(false); 
      }
    }
    load();
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-bold">STIAMO CARICANDO I DATI...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-32">
      <div className="max-w-4xl mx-auto flex gap-4 mb-8">
        <button onClick={() => setActiveTab('calendario')} className={`flex-1 py-2 rounded font-black ${activeTab==='calendario'?'bg-cyan-600':'bg-zinc-800'}`}>MATCH</button>
        <button onClick={() => setActiveTab('classifica')} className={`flex-1 py-2 rounded font-black ${activeTab==='classifica'?'bg-cyan-600':'bg-zinc-800'}`}>CLASSIFICA</button>
      </div>

      {activeTab === 'calendario' ? (
        <div className="space-y-6">
          <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar">
            {rounds.map((_, i) => (
              <button key={i} onClick={() => setSelectedRoundIndex(i)} className={`px-4 py-2 rounded shrink-0 font-bold ${selectedRoundIndex===i?'bg-cyan-500':'bg-zinc-900'}`}>G.{i+1}</button>
            ))}
          </div>
          {rounds.length === 0 && <div className="text-center py-20 text-zinc-500">Nessuna partita trovata. Controlla i log in console.</div>}
          <div className="grid gap-4">
            {rounds[selectedRoundIndex]?.map(m => (
              <div key={m.id} onClick={async () => { setModalFixture(m); const d = await fetchMatchDetails(m.id); setIncidentsData(d.incidents); }} className="bg-zinc-900 p-6 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-zinc-800 border border-white/5 transition-all">
                <div className="flex items-center gap-3 w-1/3"><img src={`https://api.sofascore.app/api/v1/team/${m.homeTeam.id}/image`} className="w-8 h-8"/> <span className="text-sm font-bold truncate">{m.homeTeam.name}</span></div>
                <div className="text-xl font-black italic">{m.homeScore?.current ?? 0} - {m.awayScore?.current ?? 0}</div>
                <div className="flex items-center gap-3 w-1/3 justify-end"><span className="text-sm font-bold truncate">{m.awayTeam.name}</span> <img src={`https://api.sofascore.app/api/v1/team/${m.awayTeam.id}/image`} className="w-8 h-8"/></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-3xl p-6 border border-white/5">
          {standings.length === 0 && <div className="text-center py-10">Dati classifica non pervenuti.</div>}
          {standings.map((t, i) => (
            <div key={t.team.id} className="flex justify-between py-3 border-b border-white/5 last:border-0 items-center">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-zinc-600 w-4">{i+1}</span>
                <img src={`https://api.sofascore.app/api/v1/team/${t.team.id}/image`} className="w-6 h-6" />
                <span className="font-bold">{t.team.name}</span>
              </div>
              <span className="font-black text-cyan-400">{t.points} PT</span>
            </div>
          ))}
        </div>
      )}

      <Dialog.Root open={!!modalFixture} onOpenChange={() => setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 p-8 rounded-[2.5rem] w-[95vw] max-w-md border border-white/10 z-[101]">
            <Dialog.Title className="text-center font-black uppercase tracking-tighter mb-6 text-zinc-400">{modalFixture?.homeTeam.name} VS {modalFixture?.awayTeam.name}</Dialog.Title>
            <div className="space-y-4">
              {incidentsData.length === 0 && <p className="text-center text-zinc-600 text-xs uppercase font-black">Caricamento eventi...</p>}
              {incidentsData.map((inc, i) => (
                <div key={i} className={`flex items-center gap-3 ${inc.isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                  <span className="text-lg">{inc.incidentType==='goal'?'⚽':'🟨'}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold uppercase">{inc.player.name}</span>
                    <span className="text-[10px] font-black text-zinc-500">{inc.time}'</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setModalFixture(null)} className="mt-8 w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all uppercase text-xs tracking-widest">Chiudi</button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
