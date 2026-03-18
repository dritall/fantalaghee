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

interface MatchEvent {
  type: string;
  time: { elapsed: number; extra?: number };
  team: { id: number; name: string };
  player: { id: number; name: string };
  assist?: { id: number; name: string };
  detail: string;
}

interface MatchStat {
  type: string;
  home: string | number;
  away: string | number;
}

// --- Components ---

const StatBar = ({ homeVal, awayVal, label }: { homeVal: number | string, awayVal: number | string, label: string }) => {
  const h = typeof homeVal === 'string' ? parseInt(homeVal) || 0 : homeVal;
  const a = typeof awayVal === 'string' ? parseInt(awayVal) || 0 : awayVal;
  const total = h + a || 1;
  const hPerc = (h / total) * 100;
  const aPerc = (a / total) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-sm font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{homeVal}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{awayVal}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden flex border border-white/5 p-[1px]">
        <div 
          className="h-full bg-cyan-500 rounded-l-full shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000 ease-out" 
          style={{ width: `${hPerc}%` }}
        />
        <div 
          className="h-full bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000 ease-out" 
          style={{ width: `${aPerc}%` }}
        />
      </div>
    </div>
  );
};

export default function ScoutHub() {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  
  // Modal State
  const [modalFixture, setModalFixture] = useState<Match | null>(null);
  const [modalTab, setModalTab] = useState<'E' | 'S'>('E');
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [matchesRes, standingsRes] = await Promise.all([
          fetch('/api/football?endpoint=football-get-all-matches-by-league&leagueid=55'),
          fetch('/api/football?endpoint=football-get-standing-all&leagueid=47')
        ]);
        
        const matchesData = await matchesRes.json();
        const standingsData = await standingsRes.json();
        
        // Process Standings
        const rawStandings = standingsData?.raw?.response?.[0]?.league?.standings?.[0] || [];
        setStandings(rawStandings);

        // Process Matches
        let matchesArray = [];
        const rawMatches = matchesData?.raw?.response?.matches || matchesData?.response?.matches;
        if (rawMatches) {
          matchesArray = rawMatches.map((e: any) => {
            const realStatus = e.status?.reason?.long || e.status?.reason || e.status;
            const isFinished = realStatus?.finished === true || realStatus?.reason?.short === 'FT' || e.status_short === 'FT';
            const startTime = e.fixture?.date || e.date || e.status?.startTime || new Date().toISOString();
            const dateStr = new Date(realStatus?.utcTime || startTime).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });

            return {
              id: e.id,
              round: dateStr,
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
        
        setFixtures(matchesArray);

        const uniqueDates = Array.from(new Set(matchesArray.map((m: Match) => m.round))) as string[];
        const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
        
        let targetDate: string = uniqueDates[0] || "";
        if (uniqueDates.includes(today)) {
          targetDate = today;
        } else {
          const ongoing = matchesArray.find((m: Match) => m.status?.started && !m.status?.finished);
          if (ongoing) targetDate = ongoing.round;
        }

        setCurrentDate(targetDate);
        setSelectedDate(targetDate);
      } catch (err) {
        setError("Sincronizzazione fallita.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!loading && selectedDate) {
      document.getElementById('date-' + selectedDate)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedDate, loading]);

  const displayedMatches = useMemo(() => {
    return fixtures.filter((m: Match) => m.round === selectedDate);
  }, [fixtures, selectedDate]);

  const datesList = useMemo(() => {
    return Array.from(new Set(fixtures.map((m: Match) => m.round)));
  }, [fixtures]);

  const openMatch = async (m: Match) => {
    setModalFixture(m);
    setEvents([]);
    setStats([]);
    setModalTab('E');
    setModalLoading(true);
    
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch(`/api/football?endpoint=football-get-match-all-stats&eventid=${m.id}`).then(res => res.json()),
        fetch(`/api/football?endpoint=football-get-match-event-all-stats&eventid=${m.id}`).then(res => res.json())
      ]);
      
      setStats(statsRes?.raw?.response || []);
      setEvents(eventsRes?.raw?.response || []);
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
  
  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full"></div>
          <div className="flex flex-col items-center gap-6 relative z-10">
            <div className="bg-red-500/20 p-4 rounded-full border border-red-500/30">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-white italic mb-2 tracking-tight">ERRORE MAPPATURA DATI</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Provider: Free API Live Football Data</p>
            </div>
            
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase">Status Code</span>
                <span className="text-[10px] font-black text-emerald-400 italic">HTTP 200</span>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-black/40 border border-white/10 rounded-2xl p-4 overflow-hidden">
                   <div className="flex items-center justify-between mb-3">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Raw JSON Payload</span>
                     <div className="flex gap-1">
                       <div className="w-2 h-2 rounded-full bg-red-400"></div>
                       <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                       <div className="w-2 h-2 rounded-full bg-green-400"></div>
                     </div>
                   </div>
                   <pre className="text-[10px] text-green-400 font-mono overflow-auto max-h-[40vh] custom-scrollbar selection:bg-green-400/20">
                     {JSON.stringify(error, null, 2)}
                   </pre>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-black text-white uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              Riprova Sincronizzazione
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pt-28 md:p-8 md:pt-32 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-cyan-500/20 rounded-full blur group-hover:opacity-100 transition duration-500 opacity-50"></div>
              <img src="https://images.fotmob.com/image_resources/logo/leaguelogo/55.png" alt="Serie A" className="w-16 h-16 relative z-10 drop-shadow-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white italic tracking-tighter">FORZA DASHBOARD</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Colonna Sx: Calendario & Match */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Round Navigation */}
            <div className="relative">
              <div className="flex overflow-x-auto snap-x scrollbar-hide py-4 gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-inner">
                {datesList.map(date => (
                  <button 
                    key={date} 
                    id={'date-' + date} 
                    onClick={() => startTransition(() => setSelectedDate(date))} 
                    className={`snap-center min-w-[110px] py-4 rounded-2xl font-black transition-all duration-700 border-2 flex flex-col items-center group relative overflow-hidden ${
                      selectedDate === date 
                        ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-[0_0_30px_rgba(34,211,238,0.4)] scale-110' 
                        : 'bg-transparent border-transparent text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {selectedDate === date && <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/20 to-transparent opacity-50"></div>}
                    <span className="text-[10px] uppercase tracking-widest mb-1 opacity-60">Giornata</span>
                    <span className="text-lg italic tracking-tighter">{date}</span>
                    {date === currentDate && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>}
                  </button>
                ))}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none rounded-r-3xl"></div>
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none rounded-l-3xl"></div>
            </div>

            {/* Match Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isPending ? (
                Array.from({ length: 4 }).map((_, i) => (
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

          {/* Colonna Dx: Classifica Live */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full"></div>
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                    <Trophy className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Live Standings</h2>
               </div>

               <div className="space-y-2">
                 {/* Table Header */}
                 <div className="grid grid-cols-12 px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 mb-2">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Team</div>
                    <div className="col-span-1 text-center">G</div>
                    <div className="col-span-2 text-center">+/-</div>
                    <div className="col-span-2 text-right">PT</div>
                 </div>

                 <div className="max-h-[800px] overflow-y-auto no-scrollbar space-y-1">
                   {standings.map((team: any, idx: number) => {
                     const isChampions = idx < 4;
                     const isRelegation = idx >= standings.length - 3;
                     
                     return (
                       <div 
                        key={team.team.id} 
                        className={`grid grid-cols-12 items-center px-4 py-3 rounded-2xl transition-all border ${
                          isChampions ? 'bg-cyan-500/5 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' :
                          isRelegation ? 'bg-red-500/5 border-red-500/20' :
                          'bg-transparent border-transparent hover:bg-white/5'
                        }`}
                       >
                         <div className={`col-span-1 text-xs font-black italic ${isChampions ? 'text-cyan-400' : isRelegation ? 'text-red-400' : 'text-slate-400'}`}>{team.rank}</div>
                         <div className="col-span-6 flex items-center gap-3">
                           <img src={team.team.logo} className="w-6 h-6 object-contain" alt="" />
                           <span className="text-[11px] font-bold text-slate-200 truncate">{team.team.name}</span>
                         </div>
                         <div className="col-span-1 text-center text-[10px] font-medium text-slate-400">{team.all.played}</div>
                         <div className="col-span-2 text-center text-[10px] font-medium text-slate-400">{team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}</div>
                         <div className={`col-span-2 text-right text-xs font-black ${isChampions ? 'text-cyan-400' : 'text-white'}`}>{team.points}</div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Modal: "Forza Football" Style */}
      <Dialog.Root open={!!modalFixture} onOpenChange={(open) => !open && setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] animate-in fade-in duration-500" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl bg-[#0a0f1a] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[101] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            <Dialog.Title className="sr-only">Match Operations</Dialog.Title>
            <Dialog.Description className="sr-only">Deep analytics and events timeline.</Dialog.Description>

            {/* Modal Header */}
            <div className="p-10 border-b border-white/5 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
               <div className="relative z-10 flex items-center justify-between gap-4">
                  <div className="flex flex-col items-center gap-3 w-1/3">
                    <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${modalFixture?.home.id}.png`} className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" alt="" />
                    <span className="text-xs font-black text-white italic uppercase tracking-tighter text-center">{modalFixture?.home.name}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-2">
                      {modalFixture?.status.scoreStr || '0-0'}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                      {modalFixture?.status.finished ? 'Full Time' : modalFixture?.status.liveTime?.short || 'Intelligence'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3 w-1/3">
                    <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${modalFixture?.away.id}.png`} className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" alt="" />
                    <span className="text-xs font-black text-white italic uppercase tracking-tighter text-center">{modalFixture?.away.name}</span>
                  </div>
               </div>

               <div className="mt-10 flex bg-white/5 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/10 max-w-[280px] mx-auto shadow-2xl relative z-10">
                  <button 
                   onClick={() => setModalTab('E')}
                   className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all ${modalTab === 'E' ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <History className="w-3.5 h-3.5" /> CRONACA
                  </button>
                  <button 
                   onClick={() => setModalTab('S')}
                   className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all ${modalTab === 'S' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> STATS
                  </button>
               </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#080d17]/50">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Match Matrix...</span>
                </div>
              ) : modalTab === 'E' ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                  {events.length > 0 ? (
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-white/5"></div>
                      
                      {events.map((ev, idx) => {
                        const isHome = ev.team.id === Number(modalFixture?.home.id);
                        const isGoal = ev.type === 'Goal';
                        const isCard = ev.type === 'Card';
                        
                        return (
                          <div key={idx} className="relative flex items-center mb-8">
                            <div className={`w-1/2 ${isHome ? 'pr-8 text-right' : 'opacity-0 pointer-events-none'}`}>
                               <div className="flex flex-col">
                                 <span className="text-xs font-black text-white">{ev.player?.name}</span>
                                 <span className="text-[9px] font-bold text-slate-500 uppercase">{ev.detail}</span>
                               </div>
                            </div>

                            <div className="absolute left-1/2 -translate-x-1/2 z-10">
                               <div className={`w-10 h-10 rounded-full border-2 bg-[#0a0f1a] flex items-center justify-center shadow-2xl ${isGoal ? 'border-emerald-500' : isCard ? 'border-yellow-500' : 'border-white/10'}`}>
                                 <span className="text-[10px] font-black text-white">{ev.time.elapsed}'</span>
                               </div>
                            </div>

                            <div className={`w-1/2 ${!isHome ? 'pl-8' : 'opacity-0 pointer-events-none'}`}>
                               <div className="flex flex-col">
                                 <span className="text-xs font-black text-white">{ev.player?.name}</span>
                                 <span className="text-[9px] font-bold text-slate-500 uppercase">{ev.detail}</span>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Nessun evento registrato</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500">
                  {stats.length > 0 ? (
                    (() => {
                      // Definiamo un set di keyword per le statistiche richieste
                      const targetStats = ['Possession', 'Shots on Goal', 'Total Shots', 'Fouls', 'Corner Kicks', 'Offsides'];
                      return stats.map((group: any) => (
                        <div key={group.group} className="space-y-4">
                          {group.statistics.map((s: any) => (
                            <StatBar 
                              key={s.type} 
                              label={s.type} 
                              homeVal={s.home} 
                              awayVal={s.away} 
                            />
                          ))}
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Dati statistici non ancora disponibili</p>
                    </div>
                  )}
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
