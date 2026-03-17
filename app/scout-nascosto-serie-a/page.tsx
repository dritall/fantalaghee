"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Loader2,
  ShieldAlert,
  Calendar,
  Activity,
  BarChart3,
  History
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

// --- Interfaces ---
interface Match {
  id: string;
  round: number;
  status: {
    finished: boolean;
    started: boolean;
    cancelled: boolean;
    scoreStr?: string;
    reason?: { short: string; long: string };
    liveTime?: { short: string };
  };
  home: { name: string; id: string; };
  away: { name: string; id: string; };
}

interface MatchEvent {
  type: string;
  time: number;
  player?: { name: string; id: string };
  assist?: { name: string; id: string };
  card?: string;
  teamId: string;
}

interface MatchStat {
  title: string;
  stats: (string | number)[];
}

export default function ScoutHub() {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [currentRound, setCurrentRound] = useState<number>(1);
  
  // Modal State
  const [modalFixture, setModalFixture] = useState<Match | null>(null);
  const [modalContent, setModalContent] = useState<{
    events: MatchEvent[];
    stats: MatchStat[];
  } | null>(null);
  const [modalTab, setModalTab] = useState<'E' | 'S'>('E');
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/fotmob?mode=l&target=55');
        const data = await res.json();
        const matchesArray = data?.fixtures?.allMatches || [];
        
        setFixtures(matchesArray);

        // Trova partite in corso o finite
        const ongoing = matchesArray.filter((m: Match) => m.status?.started && !m.status?.finished);
        const finished = matchesArray.filter((m: Match) => m.status?.finished || m.status?.reason?.short === 'FT');

        let targetRound = 1;
        if (ongoing.length > 0) {
          targetRound = Number(ongoing[0].round);
        } else if (finished.length > 0) {
          targetRound = Math.max(...finished.map((m: Match) => Number(m.round)));
        }

        setCurrentRound(targetRound);
        setSelectedRound(targetRound);
      } catch (err) {
        setError("Sincronizzazione fallita.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Auto-scroll logic via ID
  useEffect(() => {
    if (!loading) {
      document.getElementById('round-' + selectedRound)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedRound, loading]);

  const displayedMatches = useMemo(() => {
    return fixtures.filter((m: Match) => Number(m.round) === Number(selectedRound));
  }, [fixtures, selectedRound]);

  const roundsList = useMemo(() => {
    return Array.from(new Set(fixtures.map((m: Match) => m.round))).filter(Boolean).sort((a: number, b: number) => a - b);
  }, [fixtures]);

  const openMatch = async (m: Match) => {
    setModalFixture(m);
    setModalContent(null);
    setModalTab('E');
    setModalError(false);
    
    try {
      const targetUrl = 'https://www.fotmob.com/api/matchDetails?matchId=' + m.id;
      let res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(targetUrl));
      
      if (!res.ok) {
        // Fallback su CodeTabs se corsproxy fallisce
        res = await fetch('https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(targetUrl));
      }
      
      if (!res.ok) throw new Error("Entrambi i proxy bloccati");
      
      const data = await res.json();
      
      const events = data?.content?.matchFacts?.events?.events || [];
      const allStats = data?.content?.stats?.Periods?.All?.stats?.[0]?.stats || [];
      
      const keyStatsTitles = ['Ball possession', 'Expected goals (xG)', 'Total shots'];
      const filteredStats = allStats.filter((s: any) => keyStatsTitles.includes(s.title));
      
      setModalContent({ events, stats: filteredStats });
    } catch (err) {
      setModalError(true);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-widest text-sm">Sincronizzazione Hub Operativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pt-28 md:p-8 md:pt-32 font-sans selection:bg-white/10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <img src="https://images.fotmob.com/image_resources/logo/leaguelogo/55.png" alt="Serie A" className="w-12 h-12 drop-shadow-lg" />
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">Calendario Serie A 2025/2026</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-slate-200 font-medium tracking-wide shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"></span> Risultati Live
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 mb-8">
            <ShieldAlert className="text-red-500 w-5 h-5 flex-shrink-0" />
            <p className="text-red-200 text-sm font-bold tracking-wide">{error}</p>
          </div>
        )}

        {/* Round Navigation (Glass Snap-Scroll) */}
        <div className="mb-10">
          <div className="flex overflow-x-auto snap-x scrollbar-hide py-4 gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-8 shadow-2xl">
            {roundsList.map(round => (
              <button 
                key={round} 
                id={'round-' + round} 
                onClick={() => setSelectedRound(round)} 
                className={`snap-center whitespace-nowrap px-6 py-2 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm border flex flex-col items-center ${selectedRound === round ? 'bg-white/20 border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)] scale-105' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                Giornata {round}
                {round === currentRound && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
              </button>
            ))}
          </div>
        </div>

        {/* Matches Grid (Glass Cards & Iridescent Glow) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedMatches.map(m => (
            <div 
              key={m.id}
              onClick={() => openMatch(m)}
              className="relative overflow-hidden bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 cursor-pointer transition-all duration-500 hover:border-white/30 hover:-translate-y-1 hover:shadow-2xl group"
            >
              {/* Effetto Riflesso Loghi */}
              <div className="absolute top-0 left-0 w-1/2 h-full opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-[40px] pointer-events-none" style={{ backgroundImage: `url(https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-[40px] pointer-events-none" style={{ backgroundImage: `url(https://images.fotmob.com/image_resources/logo/teamlogo/${m.away.id}.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
              
              {/* Contenuto Card in primo piano */}
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center p-2 shadow-inner group-hover:bg-white/10 transition-colors">
                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}.png`} className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform" alt={m.home.name} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white uppercase truncate w-full text-center">{m.home.name}</span>
                  </div>

                  <div className="flex flex-col items-center w-1/3">
                    {m.status.started || m.status.finished ? (
                      <div className="flex flex-col items-center">
                        <div className="text-3xl font-black text-white drop-shadow-md">
                          {m.status.scoreStr || '0 - 0'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-slate-600 drop-shadow-sm">
                        - : -
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center p-2 shadow-inner group-hover:bg-white/10 transition-colors">
                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${m.away.id}.png`} className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform" alt={m.away.name} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white uppercase truncate w-full text-center">{m.away.name}</span>
                  </div>
                </div>

                <div className="flex justify-center border-t border-white/5 pt-4">
                   {m.status.started || m.status.finished ? (
                      !m.status.finished ? (
                         <span className="text-xs font-bold text-emerald-400 animate-pulse bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">IN CORSO</span>
                      ) : (
                         <span className="text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1 rounded-full">{m.status.reason?.short || 'Terminata'}</span>
                      )
                   ) : (
                      <span className="text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">{m.status.liveTime?.short || m.status.reason?.short || 'In Programma'}</span>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Modal */}
      <Dialog.Root open={!!modalFixture} onOpenChange={(open) => !open && setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-xl bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[101] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            <Dialog.Title className="sr-only">Dettagli Partita</Dialog.Title>
            <Dialog.Description className="sr-only">Visualizza eventi e statistiche del match.</Dialog.Description>

            {/* Header Modal */}
            <div className="p-8 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex flex-col items-center gap-2 flex-1 text-center">
                   <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${modalFixture?.home.id}.png`} className="w-14 h-14 object-contain drop-shadow-lg" alt="" />
                   <span className="text-[10px] font-black text-white uppercase truncate w-full">{modalFixture?.home.name}</span>
                 </div>
                 <div className="px-6 flex flex-col items-center">
                    <div className="text-4xl font-black text-white italic tracking-tighter mb-1 drop-shadow-md">{modalFixture?.status.scoreStr || '0-0'}</div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{modalFixture?.status.finished ? 'Finale' : modalFixture?.status.liveTime?.short || 'In Programma'}</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 flex-1 text-center">
                   <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${modalFixture?.away.id}.png`} className="w-14 h-14 object-contain drop-shadow-lg" alt="" />
                   <span className="text-[10px] font-black text-white uppercase truncate w-full">{modalFixture?.away.name}</span>
                 </div>
              </div>

              <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 max-w-xs mx-auto shadow-inner">
                 <button 
                  onClick={() => setModalTab('E')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${modalTab === 'E' ? 'bg-white/20 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                 >
                   <History className="w-3 h-3" /> EVENTI
                 </button>
                 <button 
                  onClick={() => setModalTab('S')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${modalTab === 'S' ? 'bg-white/20 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                 >
                   <BarChart3 className="w-3 h-3" /> STATS
                 </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Decodifica Dati...</span>
                </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  {modalTab === 'E' ? (
                    <div className="space-y-6">
                      {(modalContent?.events || []).filter(e => ['Goal', 'Card'].includes(e.type)).map((e, idx) => (
                        <div key={idx} className={`flex items-center gap-4 ${e.teamId === modalFixture?.home.id ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                           <div className="w-10 text-[9px] font-black text-slate-500 italic">{e.time}'</div>
                           <div className={`flex-1 p-3 rounded-xl border backdrop-blur-sm ${e.teamId === modalFixture?.home.id ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-white/5 border-white/10'}`}>
                              <div className={`flex items-center gap-2 mb-0.5 ${e.teamId !== modalFixture?.home.id && 'flex-row-reverse'}`}>
                                <span className="text-xs mb-0.5 drop-shadow">{e.type === 'Goal' ? '⚽' : e.card?.toLowerCase().includes('red') ? '🟥' : '🟨'}</span>
                                <span className="text-[10px] font-black text-white">{e.player?.name}</span>
                              </div>
                              {e.assist && (
                                <div className={`text-[8px] font-bold text-slate-400 flex items-center gap-1 ${e.teamId !== modalFixture?.home.id && 'flex-row-reverse'}`}>
                                   <span className="text-indigo-400/70">🅰️</span> {e.assist.name}
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                      {!(modalContent?.events || []).length && (
                        <div className="text-center py-10 opacity-40 flex flex-col items-center gap-2">
                          <Activity className="w-8 h-8 text-slate-400" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Nessun evento registrato</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(modalContent?.stats || []).map((s, i) => (
                        <div key={i} className="bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                             <span className="text-[10px] font-black text-white">{s.stats[0]}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.title}</span>
                             <span className="text-[10px] font-black text-white">{s.stats[1]}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden shadow-inner">
                             <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700" style={{ width: `${(Number(s.stats[0]) / (Number(s.stats[0]) + Number(s.stats[1]))) * 100 || 50}%` }} />
                             <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700" style={{ width: `${(Number(s.stats[1]) / (Number(s.stats[0]) + Number(s.stats[1]))) * 100 || 50}%` }} />
                          </div>
                        </div>
                      ))}
                      {!(modalContent?.stats || []).length && (
                        <div className="text-center py-10 opacity-40 flex flex-col items-center gap-2">
                          <BarChart3 className="w-8 h-8 text-slate-400" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Statistiche non disponibili</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Dialog.Close className="absolute top-6 right-6 p-2 bg-black/40 hover:bg-black/60 text-slate-400 hover:text-white rounded-full transition-all border border-white/10 backdrop-blur-md">
              <X className="w-4 h-4" />
            </Dialog.Close>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
