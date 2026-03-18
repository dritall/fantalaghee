"use client";

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { 
  X, 
  Loader2,
  ShieldAlert,
  Calendar,
  Activity,
  BarChart3,
  History,
  Trophy,
  ChevronRight
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

// --- Interfaces ---
interface Match {
  id: string;
  round: string;
  status: {
    finished: boolean;
    started: boolean;
    cancelled: boolean;
    scoreStr?: string;
    reason?: { short: string; long: any };
    liveTime?: { short: string };
    startTime?: string;
  };
  home: { name: string; id: string; };
  away: { name: string; id: string; };
  scorers?: { name: string; time: number; }[];
}

interface StandingTeam {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
}

export default function ScoutHub() {
  const [activeTab, setActiveTab] = useState<'calendario' | 'classifica'>('calendario');
  const [rounds, setRounds] = useState<Match[][]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Modal State
  const [modalFixture, setModalFixture] = useState<Match | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [eventsData, setEventsData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Using leagueid=42 per instructions (or 55 fallback if 42 is wrong, but 42 requested)
        const [matchesRes, standingsRes] = await Promise.all([
          fetch('/api/football?endpoint=football-get-all-matches-by-league&leagueid=42').then(res => res.json()).catch(() => null),
          fetch('/api/football?endpoint=football-get-standing-all&leagueid=47').then(res => res.json()).catch(() => null)
        ]);
        
        let validMatchesData = matchesRes;
        
        // Se la 42 non funziona, fallback alla 55
        if (!validMatchesData?.raw?.response?.matches && !validMatchesData?.response?.matches) {
           const fallbackRes = await fetch('/api/football?endpoint=football-get-all-matches-by-league&leagueid=55');
           validMatchesData = await fallbackRes.json();
        }

        // Process Standings
        const rawStandings = standingsRes?.raw?.response?.[0]?.league?.standings?.[0] || [];
        setStandings(rawStandings);

        // Process Matches
        let matchesArray: Match[] = [];
        const rawMatches = validMatchesData?.raw?.response?.matches || validMatchesData?.response?.matches;
        if (rawMatches) {
          matchesArray = rawMatches.map((e: any) => {
            const realStatus = e.status?.reason?.long || e.status?.reason || e.status;
            const isFinished = realStatus?.finished === true || realStatus?.reason?.short === 'FT' || e.status_short === 'FT';
            const startTime = e.fixture?.date || e.date || e.status?.startTime || new Date().toISOString();

            return {
              id: e.id,
              round: "",
              status: {
                finished: isFinished,
                started: (e.status_started || isFinished) && e.status_short !== 'NS',
                cancelled: e.status === 'Cancelled',
                scoreStr: realStatus?.scoreStr || (e.home?.score !== null ? `${e.home?.score} - ${e.away?.score}` : '- - -'),
                reason: { short: e.status_short || (isFinished ? 'FT' : 'NS'), long: realStatus },
                liveTime: { short: e.time_status },
                startTime: startTime
              },
              home: { name: e.home?.name, id: e.home?.id },
              away: { name: e.away?.name, id: e.away?.id },
              scorers: (e.goals || e.incidents || []).filter((inc: any) => inc.type === 'goal').map((inc: any) => ({
                name: inc.player_name || inc.player?.name,
                time: inc.minute || inc.time
              }))
            };
          });
        }
        
        // Sort matches by date
        matchesArray.sort((a, b) => new Date(a.status.startTime || 0).getTime() - new Date(b.status.startTime || 0).getTime());

        // Chunk into 38 matchdays (10 matches each)
        const matchChunks: Match[][] = [];
        for (let i = 0; i < matchesArray.length; i += 10) {
           matchChunks.push(matchesArray.slice(i, i + 10));
        }

        setRounds(matchChunks);

        // Auto-focus on first unfinished chunk
        let currentIdx = 0;
        for (let i = 0; i < matchChunks.length; i++) {
           if (matchChunks[i].some(m => !m.status.finished)) {
              currentIdx = i;
              break;
           }
        }
        
        setSelectedRoundIndex(currentIdx);

      } catch (err) {
        setError("Sincronizzazione fallita.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!loading && rounds.length > 0 && activeTab === 'calendario') {
      document.getElementById('giornata-' + selectedRoundIndex)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedRoundIndex, loading, activeTab, rounds.length]);

  const displayedMatches = useMemo(() => {
    return rounds[selectedRoundIndex] || [];
  }, [rounds, selectedRoundIndex]);

  const openMatch = async (m: Match) => {
    setModalFixture(m);
    setEventsData(null);
    setStatsData(null);
    setModalLoading(true);
    
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch(`/api/football?endpoint=football-get-match-all-stats&eventid=${m.id}`).then(res => res.json()),
        fetch(`/api/football?endpoint=football-get-match-event-all-stats&eventid=${m.id}`).then(res => res.json())
      ]);
      
      setStatsData(statsRes);
      setEventsData(eventsRes);
    } catch (err) {
      console.error("Match detail fetch error:", err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-widest text-sm uppercase">Sincronizzazione Hub Serie A...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pt-28 md:p-8 md:pt-32 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-cyan-500/20 rounded-full blur group-hover:opacity-100 transition duration-500 opacity-50"></div>
              <img src="https://images.fotmob.com/image_resources/logo/leaguelogo/55.png" alt="Serie A" className="w-16 h-16 relative z-10 drop-shadow-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white italic tracking-tighter">Calendario Serie A 25/26</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Operational Unit • Serie A Live Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl group">
             <div className="relative">
               <span className="absolute animate-ping inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></span>
             </div>
             <span className="text-sm font-black text-white italic tracking-widest group-hover:text-red-400 transition-colors uppercase">Network Active</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-10">
           <div className="flex bg-white/5 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 shadow-2xl max-w-sm w-full">
              <button 
                onClick={() => setActiveTab('calendario')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'calendario' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
              >
                Match
              </button>
              <button 
                onClick={() => setActiveTab('classifica')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'classifica' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
              >
                Classifica
              </button>
           </div>
        </div>

        {activeTab === 'calendario' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Round Navigation */}
            <div className="relative">
              <div className="flex overflow-x-auto snap-x scrollbar-hide py-4 gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-inner">
                {rounds.map((_, idx) => (
                  <button 
                    key={idx} 
                    id={'giornata-' + idx} 
                    onClick={() => startTransition(() => setSelectedRoundIndex(idx))} 
                    className={`snap-center min-w-[120px] py-4 rounded-2xl font-black transition-all duration-700 border-2 flex flex-col items-center group relative overflow-hidden ${
                      selectedRoundIndex === idx 
                        ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-[0_0_30px_rgba(34,211,238,0.4)] scale-110' 
                        : 'bg-transparent border-transparent text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {selectedRoundIndex === idx && <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/20 to-transparent opacity-50"></div>}
                    <span className="text-lg italic tracking-tighter">Giornata {idx + 1}</span>
                  </button>
                ))}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none rounded-r-3xl"></div>
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none rounded-l-3xl"></div>
            </div>

            {/* Match Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isPending ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-44 bg-white/5 rounded-3xl animate-pulse border border-white/10"></div>
                ))
              ) : (
                displayedMatches.map(m => {
                  const isLive = m.status.started && !m.status.finished;
                  return (
                    <div 
                      key={m.id}
                      onClick={() => openMatch(m)}
                      className="group relative bg-[#0f172a]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-7 cursor-pointer transition-all duration-500 hover:border-cyan-500/40 hover:shadow-[0_0_50px_rgba(34,211,238,0.1)] hover:-translate-y-2 overflow-hidden"
                    >
                      {isLive && (
                        <div className="absolute top-5 right-5 z-20">
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full text-[10px] font-black text-red-500 tracking-[0.2em] shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-[flash_1.5s_infinite]"></span> LIVE
                          </span>
                        </div>
                      )}

                      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col items-center gap-3 w-[40%] text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center p-3 shadow-inner group-hover:scale-110 transition-transform duration-500">
                              <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}.png`} className="w-full h-full object-contain" alt={m.home.name} />
                            </div>
                            <span className="text-[11px] font-black text-slate-300 group-hover:text-white uppercase tracking-tight truncate w-full">{m.home.name}</span>
                          </div>

                          <div className="flex-1 flex flex-col items-center justify-center">
                            {m.status.scoreStr !== '- - -' ? (
                              <div className={`text-4xl font-black italic tracking-tighter ${isLive ? 'text-white animate-[flash_2s_infinite]' : 'text-white'}`}>
                                {m.status.scoreStr}
                              </div>
                            ) : (
                              <div className="text-xl font-black text-slate-600 italic">
                                {new Date(m.status.startTime || Date.now()).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-3 w-[40%] text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center p-3 shadow-inner group-hover:scale-110 transition-transform duration-500">
                              <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${m.away.id}.png`} className="w-full h-full object-contain" alt={m.away.name} />
                            </div>
                            <span className="text-[11px] font-black text-slate-300 group-hover:text-white uppercase tracking-tight truncate w-full">{m.away.name}</span>
                          </div>
                        </div>

                        <div className="flex justify-center border-t border-white/5 pt-4">
                           <span className={`text-[10px] font-black tracking-[0.2em] uppercase px-5 py-2 rounded-full border transition-all ${
                             isLive ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                             m.status.finished ? 'bg-white/5 text-slate-400 border-white/10' : 
                             'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                           }`}>
                             {isLive ? (m.status.reason?.short === 'HT' ? 'Intervallo' : (m.status.liveTime?.short || 'IN CORSO')) : 
                              m.status.finished ? 'Finale' : 'Prossimamente'}
                           </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full"></div>
               
               <div className="space-y-2">
                 {/* Table Header */}
                 <div className="grid grid-cols-12 px-5 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 mb-2">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Squadra</div>
                    <div className="col-span-1 text-center">PG</div>
                    <div className="col-span-1 text-center">V</div>
                    <div className="col-span-1 text-center">N</div>
                    <div className="col-span-1 text-center">P</div>
                    <div className="col-span-1 text-center">+/-</div>
                    <div className="col-span-1 text-right">PT</div>
                 </div>

                 <div className="overflow-y-auto no-scrollbar space-y-1">
                   {standings.map((team: any, idx: number) => {
                     const isChampions = idx < 4;
                     const isRelegation = idx >= standings.length - 3;
                     
                     return (
                       <div 
                        key={team.team.id} 
                        className={`grid grid-cols-12 items-center px-5 py-4 rounded-2xl transition-all border ${
                          isChampions ? 'bg-cyan-500/5 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' :
                          isRelegation ? 'bg-red-500/5 border-red-500/20' :
                          'bg-transparent border-transparent hover:bg-white/5'
                        }`}
                       >
                         <div className={`col-span-1 text-sm font-black italic ${isChampions ? 'text-cyan-400' : isRelegation ? 'text-red-400' : 'text-slate-400'}`}>{team.rank}</div>
                         <div className="col-span-5 flex items-center gap-4">
                           <img src={team.team.logo} className="w-8 h-8 object-contain" alt="" />
                           <span className="text-sm font-bold text-slate-200 truncate">{team.team.name}</span>
                         </div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{team.all.played}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{team.all.win}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{team.all.draw}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{team.all.lose}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}</div>
                         <div className={`col-span-1 text-right text-sm font-black ${isChampions ? 'text-cyan-400' : 'text-white'}`}>{team.points}</div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Modal: Minimalist Debug Version per evitare InvalidNodeTypeError */}
      <Dialog.Root open={!!modalFixture} onOpenChange={(open) => !open && setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] animate-in fade-in duration-500" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl bg-[#0a0f1a] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[101] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            <Dialog.Title className="sr-only">Match Operations Debug</Dialog.Title>

            <div className="p-8 border-b border-white/5 relative bg-white/5">
                <h3 className="text-xl font-black text-white italic">Raw Data Inspector</h3>
                <p className="text-xs text-slate-500 uppercase font-bold mt-1 tracking-widest">{modalFixture?.home.name} vs {modalFixture?.away.name}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[#080d17]/50 space-y-6">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Payloads...</span>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                  <div className="bg-slate-900/80 p-6 rounded-2xl border border-white/10 text-[10px] text-cyan-400 overflow-auto max-h-[40vh] custom-scrollbar">
                    <p className="font-black text-white uppercase tracking-widest mb-4">⚽ EVENTS <span className="text-slate-500 ml-2">football-get-match-event-all-stats</span></p>
                    <pre>{eventsData ? JSON.stringify(eventsData, null, 2) : 'No data'}</pre>
                  </div>
                  <div className="bg-slate-900/80 p-6 rounded-2xl border border-white/10 text-[10px] text-emerald-400 overflow-auto max-h-[40vh] custom-scrollbar">
                    <p className="font-black text-white uppercase tracking-widest mb-4">📊 STATS <span className="text-slate-500 ml-2">football-get-match-all-stats</span></p>
                    <pre>{statsData ? JSON.stringify(statsData, null, 2) : 'No data'}</pre>
                  </div>
                </div>
              )}
            </div>

            <Dialog.Close className="absolute top-8 right-8 p-3 bg-black/40 hover:bg-red-500 text-slate-300 hover:text-white rounded-2xl transition-all border border-white/10 backdrop-blur-md z-[110]">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style jsx global>{`
        @keyframes flash {
          0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(255,0,0,0.5); }
          50% { opacity: 0.5; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { width: 0; display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
