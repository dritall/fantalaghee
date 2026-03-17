"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  
  // Refs for auto-scroll
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRoundRef = useRef<HTMLButtonElement>(null);

  // Modal State
  const [modalFixture, setModalFixture] = useState<Match | null>(null);
  const [modalContent, setModalContent] = useState<{
    events: MatchEvent[];
    stats: MatchStat[];
  } | null>(null);
  const [modalTab, setModalTab] = useState<'E' | 'S'>('E');
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Utilizziamo il nostro server mascherato da iPhone
        const res = await fetch('/api/fotmob?mode=l&target=55');
        const data = await res.json();
        const matchesArray = data?.fixtures?.allMatches || [];
        
        setFixtures(matchesArray);

        // Logic for currentRound: find lowest non-finished match
        let detected = 1;
        const sorted = [...matchesArray].sort((a,b) => Number(a.round) - Number(b.round));
        for (const m of sorted) {
          if (!m.status?.finished || m.status?.started === false) {
            detected = Number(m.round);
            break;
          }
          detected = Number(m.round);
        }
        
        setCurrentRound(detected);
        setSelectedRound(detected);
      } catch (err) {
        setError("Synchronization failed.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (activeRoundRef.current) {
      activeRoundRef.current.scrollIntoView({
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
    setModalLoading(true);
    
    try {
      // Secure JSONP bypass via AllOrigins
      const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.fotmob.com/api/matchDetails?matchId=' + m.id);
      const res = await fetch(url);
      
      if (!res.ok) throw new Error("Network response was not ok");
      const jsonWrapper = await res.json();
      
      // Decodifica il payload interno
      const data = JSON.parse(jsonWrapper.contents);

      // Estrai ed imposta events e stats con fallback
      const events = data?.content?.matchFacts?.events?.events || [];
      const allStats = data?.content?.stats?.Periods?.All?.stats?.[0]?.stats || [];
      
      const keyStatsTitles = ['Ball possession', 'Expected goals (xG)', 'Total shots'];
      const filteredStats = allStats.filter((s: any) => keyStatsTitles.includes(s.title));
      
      setModalContent({ events, stats: filteredStats });
    } catch (err) {
      // Fail silently
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-widest text-sm">Sincronizzazione Hub Operativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pt-28 md:p-8 md:pt-32 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <img src="https://images.fotmob.com/image_resources/logo/leaguelogo/55.png" alt="Serie A" className="w-12 h-12 md:w-16 md:h-16 drop-shadow-lg" />
            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Calendario Serie A 2025/2026
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">Connessione stabilita</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 mb-8">
            <ShieldAlert className="text-red-500 w-5 h-5 flex-shrink-0" />
            <p className="text-red-200 text-[10px] font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        {/* Round Navigation (Glassmorphism Snap-Scroller) */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 px-2">
             <span className="text-sm font-bold text-slate-400 flex items-center gap-2">
               <Calendar className="w-4 h-4" /> Seleziona Giornata
             </span>
             <span className="text-xs font-bold text-slate-500">#{selectedRound} DI 38</span>
          </div>
          
          <div 
            ref={scrollerRef}
            className="flex overflow-x-auto snap-x scrollbar-hide py-4 gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl no-scrollbar"
          >
            {roundsList.map(round => {
              const isActive = round === selectedRound;
              const isCurrent = round === currentRound;
              return (
                <button
                  key={round}
                  ref={isActive ? activeRoundRef : null}
                  onClick={() => setSelectedRound(round)}
                  className={`
                    snap-center whitespace-nowrap px-6 py-2 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm border flex items-center gap-2
                    ${isActive 
                      ? 'bg-white/20 border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105' 
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  Giornata {round}
                  {isCurrent && <span className="w-2 h-2 inline-block rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedMatches.map(m => (
            <div 
              key={m.id}
              onClick={() => openMatch(m)}
              className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 rounded-2xl p-6 cursor-pointer shadow-xl flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-6">
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

              <div className="flex justify-center mt-2 border-t border-white/5 pt-4">
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
          ))}
        </div>
      </div>

      {/* Analytics Modal */}
      <Dialog.Root open={!!modalFixture} onOpenChange={(open) => !open && setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,1)] z-[101] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            <Dialog.Title className="sr-only">Performance Analytics</Dialog.Title>
            <Dialog.Description className="sr-only">Granular match events and technical statistics integration.</Dialog.Description>

            {/* Header */}
            <div className="p-8 border-b border-slate-800/30">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex flex-col items-center gap-2 flex-1 text-center">
                   <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${modalFixture?.home.id}.png`} className="w-14 h-14 object-contain" alt="" />
                   <span className="text-[10px] font-black text-white uppercase truncate w-full">{modalFixture?.home.name}</span>
                 </div>
                 <div className="px-6 flex flex-col items-center">
                    <div className="text-4xl font-black text-white italic tracking-tighter mb-1">{modalFixture?.status.scoreStr || '0-0'}</div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{modalFixture?.status.finished ? 'Final' : modalFixture?.status.liveTime?.short || 'Upcoming'}</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 flex-1 text-center">
                   <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${modalFixture?.away.id}.png`} className="w-14 h-14 object-contain" alt="" />
                   <span className="text-[10px] font-black text-white uppercase truncate w-full">{modalFixture?.away.name}</span>
                 </div>
              </div>

              <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800/50 max-w-xs mx-auto">
                 <button 
                  onClick={() => setModalTab('E')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black transition-all ${modalTab === 'E' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   <History className="w-3 h-3" /> EVENTS
                 </button>
                 <button 
                  onClick={() => setModalTab('S')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black transition-all ${modalTab === 'S' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   <BarChart3 className="w-3 h-3" /> STATS
                 </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">Deciphering Content...</span>
                </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  {modalTab === 'E' ? (
                    <div className="space-y-6">
                      {(modalContent?.events || []).filter(e => ['Goal', 'Card'].includes(e.type)).map((e, idx) => (
                        <div key={idx} className={`flex items-center gap-4 ${e.teamId === modalFixture?.home.id ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                           <div className="w-10 text-[9px] font-black text-slate-700 italic">{e.time}'</div>
                           <div className={`flex-1 p-3 rounded-xl border ${e.teamId === modalFixture?.home.id ? 'bg-blue-500/5 border-blue-500/10' : 'bg-slate-800/20 border-slate-700/20'}`}>
                              <div className={`flex items-center gap-2 mb-0.5 ${e.teamId !== modalFixture?.home.id && 'flex-row-reverse'}`}>
                                <span className="text-xs mb-0.5">{e.type === 'Goal' ? '⚽' : e.card?.toLowerCase().includes('red') ? '🟥' : '🟨'}</span>
                                <span className="text-[10px] font-black text-white">{e.player?.name}</span>
                              </div>
                              {e.assist && (
                                <div className={`text-[8px] font-bold text-slate-500 flex items-center gap-1 ${e.teamId !== modalFixture?.home.id && 'flex-row-reverse'}`}>
                                   <span className="text-blue-500/50">🅰️</span> {e.assist.name}
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                      {!(modalContent?.events || []).length && (
                        <div className="text-center py-10 opacity-20 flex flex-col items-center gap-2">
                          <Activity className="w-8 h-8" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">No events logged</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(modalContent?.stats || []).map((s, i) => (
                        <div key={i} className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/30">
                          <div className="flex justify-between items-center mb-3">
                             <span className="text-[10px] font-black text-white">{s.stats[0]}</span>
                             <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{s.title}</span>
                             <span className="text-[10px] font-black text-white">{s.stats[1]}</span>
                          </div>
                          <div className="h-1 w-full bg-slate-800 rounded-full flex overflow-hidden">
                             <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${(Number(s.stats[0]) / (Number(s.stats[0]) + Number(s.stats[1]))) * 100 || 50}%` }} />
                             <div className="h-full bg-blue-900 transition-all duration-700" style={{ width: `${(Number(s.stats[1]) / (Number(s.stats[0]) + Number(s.stats[1]))) * 100 || 50}%` }} />
                          </div>
                        </div>
                      ))}
                      {!(modalContent?.stats || []).length && (
                        <div className="text-center py-10 opacity-20 flex flex-col items-center gap-2">
                          <BarChart3 className="w-8 h-8" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Stats unavailable</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Dialog.Close className="absolute top-6 right-6 p-2 bg-slate-950/50 hover:bg-slate-950 text-slate-500 hover:text-white rounded-full transition-all border border-slate-800/50">
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}
