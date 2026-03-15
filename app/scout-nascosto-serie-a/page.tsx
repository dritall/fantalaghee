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
  Info,
  Calendar,
  Clock,
  BarChart3,
  History
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

// --- Interfaces ---
interface Match {
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
  home: { name: string; id: string; };
  away: { name: string; id: string; };
}

interface MatchEvent {
  type: string;
  time: number;
  timeStr: string;
  player?: { name: string; id: string };
  assist?: { name: string; id: string };
  card?: string;
  teamId: string;
}

interface MatchStat {
  title: string;
  stats: (string | number)[];
  type: string;
}

interface StatCategory {
  title: string;
  stats: MatchStat[];
}

export default function ScoutSerieAHub() {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  
  // Modal State
  const [modalFixture, setModalFixture] = useState<Match | null>(null);
  const [modalData, setModalData] = useState<{
    events: MatchEvent[];
    stats: StatCategory[];
  } | null>(null);
  const [modalTab, setModalTab] = useState<'EVENTS' | 'STATS'>('EVENTS');
  const [loadingModal, setLoadingModal] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingInitial(true);
        const cached = sessionStorage.getItem('app_cache_calendar');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            processMatches(parsed);
            setLoadingInitial(false);
            return;
          }
        }

        const res = await fetch('/api/fotmob?type=league&id=55');
        const data = await res.json();
        const matches = data?.fixtures?.allMatches || [];
        sessionStorage.setItem('app_cache_calendar', JSON.stringify(matches));
        processMatches(matches);
      } catch (err) {
        setErrorHeader("Service temporarily unavailable.");
      } finally {
        setLoadingInitial(false);
      }
    };
    init();
  }, []);

  const processMatches = (data: Match[]) => {
    setFixtures(data);
    const rounds = Array.from(new Set(data.map(m => m.round))).sort((a, b) => a - b);
    let current = rounds[0] || 1;

    for (const r of rounds) {
      const roundMatches = data.filter(m => m.round === r);
      if (roundMatches.some(m => !m.status.finished)) {
        current = r;
        break;
      }
      current = r;
    }
    setSelectedRound(current);
  };

  const currentFixtures = useMemo(() => {
    return fixtures.filter(f => f.round === selectedRound);
  }, [fixtures, selectedRound]);

  const fetchDetails = async (fixture: Match) => {
    setModalFixture(fixture);
    setModalData(null);
    setModalError(null);
    setModalTab('EVENTS');
    
    try {
      setLoadingModal(true);
      const res = await fetch(`/api/fotmob?type=match&id=${fixture.id}`);
      const data = await res.json();
      
      const events = data.content?.matchFacts?.events?.events || [];
      const stats = data.content?.stats?.Periods?.All?.stats || [];
      
      setModalData({ events, stats });
    } catch (err) {
      setModalError("Could not load match details.");
    } finally {
      setLoadingModal(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Updating Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 pt-24 md:pt-32 font-sans overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-widest">Analytics</span>
              <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Series A</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
              Match <span className="text-blue-600">Center</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </div>
        </div>

        {errorHeader && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 mb-8">
            <ShieldAlert className="text-red-500 w-5 h-5 flex-shrink-0" />
            <p className="text-red-200 text-[11px] font-bold uppercase tracking-wider">{errorHeader}</p>
          </div>
        )}

        {/* Round Navigation */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Select Matchday
            </span>
            <span className="text-xs font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              ROUND {selectedRound}
            </span>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-6 no-scrollbar snap-x scroll-smooth">
            {Array.from({ length: 38 }, (_, i) => i + 1).map(r => (
              <button
                key={r}
                onClick={() => setSelectedRound(r)}
                className={`flex-shrink-0 min-w-[3.5rem] h-11 rounded-full text-xs font-black transition-all snap-start flex items-center justify-center border
                  ${selectedRound === r 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105' 
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 mb-20">
          {(currentFixtures || []).map(f => {
            const finished = f.status.finished;
            const active = f.status.started && !f.status.finished;
            
            return (
              <div 
                key={f.id}
                onClick={() => fetchDetails(f)}
                className="group relative bg-[#0f172a]/60 hover:bg-[#1e293b]/80 border border-slate-800/60 hover:border-blue-500/50 p-6 rounded-[2rem] transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex items-center justify-between gap-4 relative z-10">
                  <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img 
                        src={`https://images.fotmob.com/image_resources/logo/teamlogo/${f.home.id}.png`} 
                        alt="" 
                        className="w-12 h-12 object-contain relative" 
                      />
                    </div>
                    <span className="text-[11px] font-black text-slate-300 group-hover:text-white uppercase tracking-tighter truncate w-full">{f.home.name}</span>
                  </div>

                  <div className="flex flex-col items-center justify-center min-w-[100px]">
                    {active && <span className="text-[8px] text-red-500 font-black animate-pulse mb-2 tracking-[0.2em]">{f.status.liveTime?.short || 'LIVE'}</span>}
                    <div className={`text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-2 ${active ? 'text-white' : finished ? 'text-slate-400' : 'text-blue-500'}`}>
                      {finished || active ? (
                        <>
                          <span>{f.status.scoreStr?.split('-')[0]}</span>
                          <span className="text-slate-800">-</span>
                          <span>{f.status.scoreStr?.split('-')[1]}</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-lg text-blue-500">{f.status.reason?.short || '--'}</span>
                          <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1 italic">Upcoming</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img 
                        src={`https://images.fotmob.com/image_resources/logo/teamlogo/${f.away.id}.png`} 
                        alt="" 
                        className="w-12 h-12 object-contain relative" 
                      />
                    </div>
                    <span className="text-[11px] font-black text-slate-300 group-hover:text-white uppercase tracking-tighter truncate w-full">{f.away.name}</span>
                  </div>
                </div>
                
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5 text-blue-500/50" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Modal */}
      <Dialog.Root open={!!modalFixture} onOpenChange={(open: boolean) => !open && setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] transition-all animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] z-[101] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <Dialog.Title className="sr-only">Match Analytics</Dialog.Title>
            <Dialog.Description className="sr-only">Detailed match events and performance statistics</Dialog.Description>

            {/* Modal Header */}
            <div className="p-8 border-b border-slate-800/50 relative">
              <Dialog.Close asChild>
                <button className="absolute right-8 top-8 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all group">
                  <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </button>
              </Dialog.Close>

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-8">
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${modalFixture?.home.id}.png`} className="w-16 h-16 object-contain" />
                    <span className="text-xs font-black text-white uppercase tracking-tight">{modalFixture?.home.name}</span>
                  </div>
                  <div className="px-8 text-center flex flex-col items-center">
                    <div className="text-5xl font-black text-white italic tracking-tighter mb-2">
                       {modalFixture?.status.scoreStr || '0-0'}
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${modalFixture?.status.finished ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'}`}>
                      {modalFixture?.status.finished ? 'Full Time' : modalFixture?.status.liveTime?.short || 'Upcoming'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${modalFixture?.away.id}.png`} className="w-16 h-16 object-contain" />
                    <span className="text-xs font-black text-white uppercase tracking-tight">{modalFixture?.away.name}</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
                  <button 
                    onClick={() => setModalTab('EVENTS')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${modalTab === 'EVENTS' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <History className="w-3 h-3" /> CHRONOLOGY
                  </button>
                  <button 
                    onClick={() => setModalTab('STATS')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${modalTab === 'STATS' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <BarChart3 className="w-3 h-3" /> ANALYTICS
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <Activity className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Parsing Performance Data...</span>
                </div>
              ) : modalError ? (
                <div className="text-center py-20">
                  <ShieldAlert className="w-10 h-10 text-red-500/50 mx-auto mb-4" />
                  <p className="text-red-400 text-xs font-black uppercase">{modalError}</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {modalTab === 'EVENTS' ? (
                    <div className="space-y-6">
                      {modalData?.events.filter(e => ['Goal', 'Card'].includes(e.type)).map((e, idx) => {
                        const isHome = e.teamId === modalFixture?.home.id;
                        return (
                          <div key={idx} className={`flex items-center gap-4 ${isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                            <div className="w-12 text-[10px] font-black text-slate-600 italic">{e.time}'</div>
                            <div className={`flex-1 p-4 rounded-2xl border ${isHome ? 'bg-blue-500/5 border-blue-500/10' : 'bg-slate-800/30 border-slate-700/30'}`}>
                              <div className={`flex items-center gap-2 mb-1 ${!isHome && 'flex-row-reverse'}`}>
                                <span className="text-sm">
                                  {e.type === 'Goal' ? '⚽' : e.card?.toLowerCase().includes('red') ? '🟥' : '🟨'}
                                </span>
                                <span className="text-xs font-black text-white">{e.player?.name}</span>
                              </div>
                              {e.assist && (
                                <div className={`text-[10px] text-slate-500 font-bold flex items-center gap-1 ${!isHome && 'flex-row-reverse'}`}>
                                  <span className="text-blue-500/50">🅰️</span>
                                  {e.assist.name}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {modalData?.events.length === 0 && (
                        <div className="text-center py-10">
                          <Clock className="w-8 h-8 text-slate-800 mx-auto mb-3" />
                          <p className="text-slate-600 text-[10px] font-black uppercase">No significant events triggered.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-8">
                       {modalData?.stats.map((cat, i) => (
                         <div key={i} className="space-y-4">
                           <div className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em] px-2">{cat.title}</div>
                           <div className="grid gap-4">
                             {cat.stats.map((stat, j) => (
                               <div key={j} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50">
                                 <div className="flex justify-between items-center mb-2">
                                   <span className="text-xs font-black text-white">{stat.stats[0]}</span>
                                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.title}</span>
                                   <span className="text-xs font-black text-white">{stat.stats[1]}</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
                                   <div 
                                      className="h-full bg-blue-600 transition-all duration-1000" 
                                      style={{ width: `${(Number(stat.stats[0]) / (Number(stat.stats[0]) + Number(stat.stats[1]))) * 100 || 50}%` }} 
                                   />
                                   <div 
                                      className="h-full bg-slate-700 transition-all duration-1000" 
                                      style={{ width: `${(Number(stat.stats[1]) / (Number(stat.stats[0]) + Number(stat.stats[1]))) * 100 || 50}%` }} 
                                   />
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       ))}
                       {!modalData?.stats.length && (
                        <div className="text-center py-10">
                          <Activity className="w-8 h-8 text-slate-800 mx-auto mb-3" />
                          <p className="text-slate-600 text-[10px] font-black uppercase">Technical statistics unavailable.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-900/30 border-t border-slate-800/50 flex justify-center">
               <div className="flex items-center gap-2 text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">
                 Encrpyted Channel • System ID: {modalFixture?.id}
               </div>
            </div>

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
