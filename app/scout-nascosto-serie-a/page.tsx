"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, 
  X, 
  Loader2,
  ShieldAlert,
  ChevronRight,
  Activity,
  Target,
  Info
} from 'lucide-react';

// --- Interfaces FotMob ---
interface FotMobMatch {
  id: string;
  round: number;
  roundName: string;
  status: {
    finished: boolean;
    started: boolean;
    cancelled: boolean;
    scoreStr?: string;
    reason?: { short: string; long: string };
    liveTime?: { short: string };
  };
  home: {
    name: string;
    id: string;
  };
  away: {
    name: string;
    id: string;
  };
}

interface FotMobEvent {
  type: string;
  time: number;
  text?: string;
  player?: { name: string; id: string };
  assist?: { name: string; id: string };
  card?: string;
  teamId: string;
}

export default function ScoutSerieAHub() {
  const [fixtures, setFixtures] = useState<FotMobMatch[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'STATS'>('MATCHES');
  
  // Modal State
  const [modalFixture, setModalFixture] = useState<FotMobMatch | null>(null);
  const [modalEvents, setModalEvents] = useState<FotMobEvent[]>([]);
  const [loadingModal, setLoadingModal] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 1. Fetch Iniziale (Calendario FotMob) ---
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoadingInitial(true);
        setErrorHeader(null);

        const cached = sessionStorage.getItem('fotmob_serieA_calendar');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setupMatches(parsed);
            setLoadingInitial(false);
            return;
          }
        }

        const res = await fetch('/api/fotmob?type=league&id=55');
        const data = await res.json();
        
        console.log("🟢 Dati Ricevuti dal Proxy:", data);
        console.log("🔍 FOTMOB RAW RESPONSE:", data);

        const matchesArray = data?.matches?.allMatches || data?.matches || [];
        
        if (matchesArray.length === 0) {
          console.log("🔍 DEBUG: matchesArray vuoto. data.matches:", data?.matches);
        }

        sessionStorage.setItem('fotmob_serieA_calendar', JSON.stringify(matchesArray));
        setupMatches(matchesArray);
      } catch (err: any) {
        console.error("💥 FOTMOB FETCH ERROR:", err);
        setErrorHeader("Impossibile caricare il calendario FotMob.");
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchCalendar();
  }, []);

  const setupMatches = (data: FotMobMatch[]) => {
    setFixtures(data);
    
    // Calcola giornata corrente (primo round con match non finiti)
    const rounds = Array.from(new Set(data.map(m => m.round))).sort((a, b) => a - b);
    let current = rounds[0] || 1;

    for (const r of rounds) {
      const roundMatches = data.filter(m => m.round === r);
      const hasPending = roundMatches.some(m => !m.status.finished);
      if (hasPending) {
        current = r;
        break;
      }
      current = r; // Se tutti finiti, resta all'ultimo
    }
    setSelectedRound(current);
  };

  // --- Derived Grouped Data ---
  const groupedFixtures = useMemo(() => {
    const groups: Record<number, FotMobMatch[]> = {};
    fixtures.forEach(f => {
      if (!groups[f.round]) groups[f.round] = [];
      groups[f.round].push(f);
    });
    return groups;
  }, [fixtures]);

  // --- 3. Dettagli Partita (Modal On-Demand FotMob) ---
  const openModal = async (fixture: FotMobMatch) => {
    setModalFixture(fixture);
    setModalError(null);
    setModalEvents([]);
    
    try {
      setLoadingModal(true);
      const cacheKey = `fotmob_events_${fixture.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        setModalEvents(JSON.parse(cached));
        setLoadingModal(false);
        return;
      }

      const res = await fetch(`/api/fotmob?type=match&id=${fixture.id}`);
      const data = await res.json();
      
      console.log("🟢 Dati Ricevuti dal Proxy:", data);
      console.log("🔍 FOTMOB MATCH DETAILS:", data);
      
      const eventsRaw = data.content?.matchFacts?.events?.events || [];
      sessionStorage.setItem(cacheKey, JSON.stringify(eventsRaw));
      setModalEvents(eventsRaw);
    } catch (err) {
      setModalError("Impossibile caricare i dettagli della partita.");
    } finally {
      setLoadingModal(false);
    }
  };

  // --- Rendering Helpers ---
  const renderEventsList = (eventsList: FotMobEvent[], teamId: string) => {
    const teamEvents = eventsList.filter(e => e.teamId === teamId);
    
    if (teamEvents.length === 0) return <p className="text-slate-600 text-[10px] italic py-2">Nessun evento registrato.</p>;
    
    return (
      <ul className="space-y-3">
        {teamEvents.map((e, idx) => {
          if (e.type === 'Goal') {
            return (
              <li key={idx} className="text-emerald-400 text-xs flex items-start gap-2 font-bold animate-in slide-in-from-left-2 duration-300">
                <span className="mt-0.5">⚽</span>
                <div>
                  <span className="text-white">{e.player?.name || 'Gol'}</span>
                  {e.assist?.name && (
                    <div className="text-[9px] text-slate-400 font-medium">🅰️ {e.assist.name}</div>
                  )}
                  <span className="text-[8px] text-slate-500 ml-1">{e.time}'</span>
                </div>
              </li>
            );
          }
          if (e.type === 'Card') {
            const isRed = e.card?.toLowerCase().includes('red');
            return (
              <li key={idx} className="text-xs flex items-start gap-2 font-bold animate-in slide-in-from-left-2 duration-300">
                <span className="mt-0.5">{isRed ? '🟥' : '🟨'}</span>
                <div>
                  <span className="text-slate-300">{e.player?.name}</span>
                  <span className="text-[8px] text-slate-500 ml-1">{e.time}'</span>
                </div>
              </li>
            );
          }
          return null;
        })}
      </ul>
    );
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">PIRATING FOTMOB API...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 pt-28 md:pt-32 font-sans selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic py-1">
              Serie A <span className="text-emerald-500">Live Hub</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">FotMob Proxy Alpha</span>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('MATCHES')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'MATCHES' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              CALENDARIO
            </button>
            <button 
              onClick={() => setActiveTab('STATS')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'STATS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              STATISTICHE
            </button>
          </div>
        </div>

        {errorHeader && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 mb-8">
            <ShieldAlert className="text-red-500 w-5 h-5 flex-shrink-0" />
            <p className="text-red-200 text-xs font-medium">{errorHeader}</p>
          </div>
        )}

        {/* --- Tab: Calendario --- */}
        {activeTab === 'MATCHES' && (
          <>
            {/* Round Slider */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Scegli Giornata</span>
                <span className="text-xs font-black text-emerald-500">GIORNATA {selectedRound}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar" ref={scrollRef}>
                {Array.from({ length: 38 }, (_, i) => i + 1).map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRound(r)}
                    className={`flex-shrink-0 w-11 h-11 rounded-xl border text-xs font-black transition-all
                      ${selectedRound === r 
                        ? 'bg-emerald-600 border-emerald-400 text-white scale-110 shadow-xl' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Matches List */}
            <div className="space-y-3">
              {(groupedFixtures[selectedRound] || []).map(f => {
                const finished = f.status.finished;
                const active = f.status.started && !f.status.finished;
                
                return (
                  <div 
                    key={f.id}
                    onClick={() => openModal(f)}
                    className="group bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 hover:border-emerald-500/40 p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <img 
                        src={`https://images.fotmob.com/image_resources/logo/teamlogo/${f.home.id}.png`} 
                        alt={f.home.name} 
                        className="w-8 h-8 md:w-10 md:h-10 object-contain" 
                      />
                      <span className="text-sm font-bold text-slate-200 group-hover:text-white truncate">{f.home.name}</span>
                    </div>

                    <div className="flex flex-col items-center min-w-[80px]">
                      {(finished || active) ? (
                        <div className="flex flex-col items-center">
                          {active && <span className="text-[8px] text-red-500 font-bold animate-pulse mb-1">{f.status.liveTime?.short || 'LIVE'}</span>}
                          <div className="text-xl md:text-2xl font-black italic text-white tracking-widest leading-none">
                            {f.status.scoreStr || '0 - 0'}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-black text-emerald-500 italic leading-none">{f.status.reason?.short || 'TBD'}</span>
                          <span className="text-[8px] font-bold text-slate-600 whitespace-nowrap uppercase tracking-tighter">DA GIOCARE</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-sm font-bold text-slate-200 group-hover:text-white truncate text-right">{f.away.name}</span>
                      <img 
                        src={`https://images.fotmob.com/image_resources/logo/teamlogo/${f.away.id}.png`} 
                        alt={f.away.name} 
                        className="w-8 h-8 md:w-10 md:h-10 object-contain" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* --- Tab: Statistiche (Placeholder) --- */}
        {activeTab === 'STATS' && (
          <div className="py-20 text-center">
             <Trophy className="w-12 h-12 text-slate-800 mx-auto mb-4" />
             <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Statistiche ufficiali in arrivo...</p>
          </div>
        )}

        {/* --- Modal Partita FotMob --- */}
        {modalFixture && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setModalFixture(null)} />
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800/50 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              <div className="p-6 border-b border-slate-800/50 flex flex-col gap-2 relative">
                <button onClick={() => setModalFixture(null)} className="absolute right-6 top-6 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
                <div className="flex flex-col gap-1">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">DETTAGLI PREMIUM • ID {modalFixture.id}</p>
                  <h2 className="text-lg font-black text-white italic truncate pr-12">
                    {modalFixture.home.name} <span className="text-emerald-500">vs</span> {modalFixture.away.name}
                  </h2>
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* Scoreboard Info */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex flex-col items-center flex-1 gap-3 text-center">
                    <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${modalFixture.home.id}.png`} className="w-16 h-16 object-contain drop-shadow-md" />
                    <span className="text-[11px] font-black text-white uppercase tracking-tighter">{modalFixture.home.name}</span>
                  </div>
                  <div className="px-4 flex flex-col items-center">
                    <div className="text-4xl font-black text-white italic tracking-tighter">
                      {modalFixture.status.scoreStr || '-'}
                    </div>
                  </div>
                  <div className="flex flex-col items-center flex-1 gap-3 text-center">
                    <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${modalFixture.away.id}.png`} className="w-16 h-16 object-contain drop-shadow-md" />
                    <span className="text-[11px] font-black text-white uppercase tracking-tighter">{modalFixture.away.name}</span>
                  </div>
                </div>

                {/* Events Loading/Error State */}
                {loadingModal ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Intercettando cronaca live...</span>
                  </div>
                ) : modalError ? (
                  <p className="text-center text-red-400 text-xs py-10 font-bold uppercase">{modalError}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-8 border-t border-slate-800/50 pt-8">
                    {/* Home Team Events */}
                    <div>
                      <div className="text-[8px] font-black text-slate-600 mb-4 uppercase tracking-widest ml-1">EVENTI CASA</div>
                      {renderEventsList(modalEvents, modalFixture.home.id)}
                    </div>
                    {/* Away Team Events */}
                    <div className="text-right">
                      <div className="text-[8px] font-black text-slate-600 mb-4 uppercase tracking-widest mr-1">EVENTI TRASFERTA</div>
                      {renderEventsList(modalEvents, modalFixture.away.id)}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
