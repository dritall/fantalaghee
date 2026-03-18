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
  const [debugData, setDebugData] = useState<any>(null);
  
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
        const res = await fetch('/api/football?endpoint=football-get-all-matches-by-league&leagueid=55');
        const data = await res.json();
        setDebugData(data);
        
        let matchesArray = [];
        const rawData = data?.raw?.data || data?.data;
        if (rawData) {
          matchesArray = rawData.map((e: any) => ({
            id: e.match_id || e.id,
            round: parseInt(e.league_round || e.round) || 1,
            status: {
              finished: e.status === 'Finished' || e.status_short === 'FT',
              started: e.status === 'In Progress' || e.status === 'Finished' || e.status_short === 'FT' || e.status_short === 'HT',
              cancelled: e.status === 'Cancelled',
              scoreStr: e.home_score !== undefined ? `${e.home_score} - ${e.away_score}` : undefined,
              reason: { short: e.status_short || 'FT', long: e.status },
              liveTime: { short: e.time_status }
            },
            home: { name: e.home_team_name, id: e.home_team_id },
            away: { name: e.away_team_name, id: e.away_team_id }
          }));
        }
        
        setFixtures(matchesArray);

        // Calculate currentRound logic
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
      const res = await fetch(`/api/football?endpoint=football-get-match-detail&matchid=${m.id}`);
      
      if (!res.ok) throw new Error("RapidAPI proxy bloccato");
      
      const resData = await res.json();
      const matchDetail = resData?.raw?.data || resData?.data;
      
      let events = [];
      if (matchDetail?.incidents) {
        events = matchDetail.incidents
          .filter((inc: any) => inc.type === 'goal' || inc.type === 'card')
          .map((inc: any) => ({
            type: inc.type === 'goal' ? 'Goal' : 'Card',
            time: inc.time,
            player: { name: inc.player_name, id: inc.player_id },
            assist: inc.assist_player_name ? { name: inc.assist_player_name, id: inc.assist_player_id } : undefined,
            card: inc.card_type,
            teamId: inc.team_id == m.home.id ? m.home.id : m.away.id
          }));
      }
      
      let stats: MatchStat[] = [];
      if (matchDetail?.statistics) {
        const targetStats = ["Possession", "Total Shots", "Expected Goals (xG)", "Shots on target"];
        stats = Object.entries(matchDetail.statistics).map(([title, s]: [string, any]) => ({
          title: title,
          stats: [s.home, s.away]
        })).filter(s => targetStats.includes(s.title));
      }
      
      setModalContent({ events: events ?? [], stats: stats ?? [] });
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
                <span className="text-[10px] font-black text-emerald-400 italic">HTTP {debugData?.status || 200}</span>
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
                     {JSON.stringify(debugData?.raw || debugData, null, 2)}
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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pt-28 md:p-8 md:pt-32 font-sans selection:bg-white/10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <img src="https://images.fotmob.com/image_resources/logo/leaguelogo/55.png" alt="Serie A" className="w-12 h-12 drop-shadow-lg" />
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">Control Room Serie A</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-slate-200 font-medium tracking-wide shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[pulse_3s_ease-in-out_infinite]"></span> LIVE
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
          <div className="flex overflow-x-auto snap-x scrollbar-hide py-4 gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-8 shadow-2xl relative z-20">
            {roundsList.map(round => (
              <button key={round} id={'round-' + round} onClick={() => setSelectedRound(round)} 
                className={`snap-center whitespace-nowrap px-8 py-3 rounded-xl font-bold transition-all duration-500 backdrop-blur-md border flex flex-col items-center ${
                  selectedRound === round 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-transparent border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-110 relative overflow-hidden' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                }`}>
                Giornata {round}
                {round === currentRound && <span className="mt-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></span>}
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
              className="relative overflow-hidden bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 cursor-pointer transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] hover:-translate-y-1 group"
            >
              {/* Reflection Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Mouse Aura (Gradient Glow) */}
              <div className="absolute -inset-2 opacity-0 group-hover:opacity-20 transition-opacity blur-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 pointer-events-none"></div>
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
                           <div className={`flex-1 p-3 rounded-xl border backdrop-blur-sm ${e.teamId === modalFixture?.home.id ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                              <div className={`flex items-center gap-2 mb-0.5 ${e.teamId !== modalFixture?.home.id && 'flex-row-reverse'}`}>
                                <span className="text-xs mb-0.5 drop-shadow">{e.type === 'Goal' ? '⚽' : e.card?.toLowerCase().includes('red') ? '🟥' : '🟨'}</span>
                                <span className="text-[10px] font-black text-white">{e.player?.name}</span>
                              </div>
                              {e.assist && (
                                <div className={`text-[8px] font-bold text-slate-400 flex items-center gap-1 ${e.teamId !== modalFixture?.home.id && 'flex-row-reverse'}`}>
                                   <span className="text-cyan-400/70">🅰️</span> {e.assist.name}
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                      {!(modalContent?.events || []).length && (
                        <div className="text-center py-10 opacity-40 flex flex-col items-center gap-2">
                          <Activity className="w-8 h-8 text-slate-400" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Cronaca non disponibile</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(modalContent?.stats || []).map((s, i) => {
                        const homeVal = parseFloat(String(s.stats[0])) || 0;
                        const awayVal = parseFloat(String(s.stats[1])) || 0;
                        const total = homeVal + awayVal;
                        const homeWidth = total === 0 ? 50 : (homeVal / total) * 100;
                        const awayWidth = total === 0 ? 50 : (awayVal / total) * 100;
                        
                        return (
                          <div key={i} className="mb-6">
                            <div className="flex justify-between items-center text-[11px] mb-2 px-1">
                              <span className="font-bold text-cyan-400">{s.stats[0]}</span> 
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{s.title}</span> 
                              <span className="font-bold text-emerald-400">{s.stats[1]}</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner border border-white/10">
                              <div className="h-full bg-cyan-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: `${homeWidth}%` }} />
                              <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out border-l border-black/40 shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${awayWidth}%` }} />
                            </div>
                          </div>
                        );
                      })}
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
