"use client";

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { X, Loader2, Trophy } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { fetchMatchDetails } from '@/lib/sofascore';

// --- Interfaces ---
interface Match {
  id: number;
  round: number;
  status: {
    finished: boolean;
    started: boolean;
    scoreStr?: string | null;
    liveTime?: string;
    startTime?: string;
  };
  home: { name: string; id: number; score?: number; };
  away: { name: string; id: number; score?: number; };
}

interface StandingTeam {
  rank: number;
  team: { id: number; name: string; logo: string; };
  points: number;
  goalsDiff: string;
  all: { played: number; win: number; draw: number; lose: number; };
}

const SERIE_A_COLORS: Record<string, string> = {
  "Inter": "#0059A3", "Milan": "#FB090B", "Juventus": "#000000", "Napoli": "#00AEEF",
  "Roma": "#8E1F2F", "Lazio": "#87D3F8", "Atalanta": "#1E71B8", "Fiorentina": "#4B2E83",
  "Bologna": "#1A2F48", "Torino": "#8A2432", "Genoa": "#8C1C1C", "Verona": "#005395",
  "Udinese": "#000000", "Parma": "#FFE800", "Como": "#1C3F94", "Lecce": "#FFED00",
  "Empoli": "#00579C", "Monza": "#E30613", "Venezia": "#000000", "Cagliari": "#B31B1E",
};

const STATS_CATEGORIES: Record<string, string> = {
  "Match overview": "Principali", "Shots": "Attacco", "Attack": "Attacco",
  "Passes": "Passaggi", "Defending": "Difesa", "Duels": "Contrasti", "Goalkeeping": "Portiere"
};

const STATS_TRANSLATIONS: Record<string, string> = {
  "Ball possession": "Possesso Palla", "Expected goals": "Gol Attesi (xG)",
  "Total shots": "Tiri Totali", "Shots on target": "Tiri in Porta", "Big chances": "Grandi Occasioni",
  "Goalkeeper saves": "Parate", "Corner kicks": "Calci d'angolo", "Fouls": "Falli Commessi",
  "Passes": "Passaggi", "Tackles": "Tackle", "Yellow cards": "Ammonizioni 🟨", "Red cards": "Espulsioni 🟥",
  "Accurate passes": "Passaggi Riusciti", "Interceptions": "Intercetti", "Clearances": "Spazzate"
};

export default function ScoutHub() {
  const [activeTab, setActiveTab] = useState<'calendario' | 'classifica'>('calendario');
  const [rounds, setRounds] = useState<Match[][]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();
  
  // Modal State
  const [modalFixture, setModalFixture] = useState<Match | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [statsData, setStatsData] = useState<any[]>([]);
  const [incidentsData, setIncidentsData] = useState<any[]>([]);
  const [modalTab, setModalTab] = useState<'timeline' | 'stats'>('timeline');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Utilizziamo l'API Dojo Sofascore usando gli ID corretti della stagione 25/26
        const [matchesRes, standingsRes] = await Promise.all([
          fetch('/api/sofascore?endpoint=seasons/v1/get-events&tournamentId=23&seasonId=76457').then(res => res.json()).catch(() => null),
          fetch('/api/sofascore?endpoint=tournaments/v1/get-standings&tournamentId=23&seasonId=76457').then(res => res.json()).catch(() => null)
        ]);
        
        // 1. Process Standings
        const rawStandings = standingsRes?.standings?.[0]?.rows || [];
        setStandings(rawStandings.map((r: any) => ({
          rank: r.position,
          team: { id: r.team.id, name: r.team.name, logo: `https://api.sofascore.app/api/v1/team/${r.team.id}/image` },
          points: r.points,
          goalsDiff: r.scoreDiffFormatted,
          all: { played: r.matches, win: r.wins, draw: r.draws, lose: r.losses }
        })));

        // 2. Process Matches
        const events = matchesRes?.events || [];
        const matchesArray: Match[] = events.map((e: any) => {
          const isFinished = e.status?.type === 'finished';
          const isStarted = e.status?.type !== 'notstarted';
          
          return {
            id: e.id,
            round: e.roundInfo?.round || 0,
            status: {
              finished: isFinished,
              started: isStarted,
              scoreStr: isStarted ? `${e.homeScore?.current ?? 0} - ${e.awayScore?.current ?? 0}` : null,
              startTime: e.startTimestamp ? new Date(e.startTimestamp * 1000).toISOString() : undefined,
              liveTime: e.status?.description
            },
            home: { name: e.homeTeam.name, id: e.homeTeam.id, score: e.homeScore?.current },
            away: { name: e.awayTeam.name, id: e.awayTeam.id, score: e.awayScore?.current }
          };
        });
        
        // Ordina e raggruppa per giornata
        matchesArray.sort((a, b) => new Date(a.status.startTime || 0).getTime() - new Date(b.status.startTime || 0).getTime());
        
        const roundsMap: Record<number, Match[]> = {};
        matchesArray.forEach(m => {
           if (m.round) {
              if (!roundsMap[m.round]) roundsMap[m.round] = [];
              roundsMap[m.round].push(m);
           }
        });
        
        const matchChunks = Object.keys(roundsMap)
           .sort((a, b) => Number(a) - Number(b))
           .map(k => roundsMap[Number(k)]);

        setRounds(matchChunks);

        // Focus sulla prima giornata non finita
        const currentIdx = Math.max(0, matchChunks.findIndex(chunk => chunk.some(m => !m.status.finished)));
        setSelectedRoundIndex(currentIdx);

      } catch (err) {
        console.error("Errore Sincronizzazione:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayedMatches = useMemo(() => rounds[selectedRoundIndex] || [], [rounds, selectedRoundIndex]);

  const openMatch = async (m: Match) => {
    setModalFixture(m);
    setModalTab('timeline');
    setModalLoading(true);
    
    try {
      const details = await fetchMatchDetails(m.id);
      setStatsData(details.stats || []);
      setIncidentsData(details.incidents || []);
    } catch (err) {
      console.error(err);
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
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-cyan-500/20 rounded-full blur group-hover:opacity-100 transition duration-500 opacity-50"></div>
              <img src="https://images.fotmob.com/image_resources/logo/leaguelogo/55.png" alt="Serie A" className="w-16 h-16 relative z-10 drop-shadow-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Risultati Serie A</h1>
              <div className="flex items-center gap-2 mt-1">
                {displayedMatches.every(m => m.status.finished) && (
                   <span className="text-[9px] font-black bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 uppercase tracking-widest">Giornata Finita</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-10">
           <div className="flex bg-white/5 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 shadow-2xl max-w-sm w-full">
              <button 
                onClick={() => setActiveTab('calendario')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'calendario' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
              > Match </button>
              <button 
                onClick={() => setActiveTab('classifica')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'classifica' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
              > Classifica </button>
           </div>
        </div>

        {activeTab === 'calendario' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative">
              <div className="flex overflow-x-auto snap-x scrollbar-hide py-4 gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-inner">
                {rounds.map((chunk, idx) => (
                  <button 
                    key={idx} id={'giornata-' + idx} 
                    onClick={() => startTransition(() => setSelectedRoundIndex(idx))} 
                    className={`snap-center min-w-[120px] py-4 rounded-2xl font-black transition-all duration-700 border-2 flex flex-col items-center overflow-hidden ${
                      selectedRoundIndex === idx ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-[0_0_30px_rgba(34,211,238,0.4)] scale-110' : 'bg-transparent border-transparent text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-lg italic tracking-tighter">G. {chunk[0]?.round || idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isPending ? (
                Array.from({ length: 9 }).map((_, i) => (<div key={i} className="h-44 bg-white/5 rounded-3xl animate-pulse border border-white/10"></div>))
              ) : (
                displayedMatches.map(m => {
                  const isLive = m.status.started && !m.status.finished;
                  const homeColor = SERIE_A_COLORS[m.home.name] || '#ffffff';
                  const awayColor = SERIE_A_COLORS[m.away.name] || '#ffffff';
                  const matchTime = m.status.startTime ? new Date(m.status.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : 'TBD';
                  
                  return (
                    <div 
                      key={m.id} onClick={() => openMatch(m)}
                      style={{ ['--glow-color' as any]: `${homeColor}40`, ['--glow-color-final' as any]: `${awayColor}40` }}
                      className="group relative bg-[#0f172a]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-7 cursor-pointer transition-all duration-500 hover:border-cyan-500/40 hover:shadow-[0_0_50px_var(--glow-color)] hover:-translate-y-2 overflow-hidden"
                    >
                      <div className="absolute top-8 right-8 z-20">
                          <div className={`w-3 h-3 rounded-full border-2 border-slate-900 shadow-lg ${isLive ? 'bg-emerald-500 animate-[breathing_1.5s_infinite]' : m.status.finished ? 'bg-red-500/60' : 'bg-slate-600'}`} />
                      </div>
                      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col items-center gap-3 w-[40%] text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center p-3 shadow-inner group-hover:scale-110 transition-transform duration-500">
                              <img src={`https://api.sofascore.app/api/v1/team/${m.home.id}/image`} className="w-full h-full object-contain" alt={m.home.name} />
                            </div>
                            <span className="text-[11px] font-black text-slate-300 group-hover:text-white uppercase tracking-tight truncate w-full">{m.home.name}</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center">
                            {m.status.started ? (
                              <div className="font-bold text-white text-xl">{m.status.scoreStr}</div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-slate-400 font-mono tracking-tighter">DA GIOCARE</span>
                                <span className="text-xs text-slate-500">{matchTime}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-center gap-3 w-[40%] text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center p-3 shadow-inner group-hover:scale-110 transition-transform duration-500">
                              <img src={`https://api.sofascore.app/api/v1/team/${m.away.id}/image`} className="w-full h-full object-contain" alt={m.away.name} />
                            </div>
                            <span className="text-[11px] font-black text-slate-300 group-hover:text-white uppercase tracking-tight truncate w-full">{m.away.name}</span>
                          </div>
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
               <div className="space-y-2 relative z-10">
                 <div className="grid grid-cols-12 px-5 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 mb-2">
                    <div className="col-span-1">#</div><div className="col-span-5">Squadra</div><div className="col-span-1 text-center">PG</div><div className="col-span-1 text-center">V</div><div className="col-span-1 text-center">N</div><div className="col-span-1 text-center">P</div><div className="col-span-1 text-center">+/-</div><div className="col-span-1 text-right">PT</div>
                 </div>
                 <div className="overflow-y-auto no-scrollbar space-y-1">
                   {standings.map((t) => (
                       <div key={t.team.id} className={`grid grid-cols-12 items-center px-5 py-4 rounded-2xl transition-all border bg-transparent border-transparent hover:bg-white/5`}>
                         <div className={`col-span-1 text-sm font-black italic text-slate-400`}>{t.rank}</div>
                         <div className="col-span-5 flex items-center gap-4 relative">
                           <img src={t.team.logo} className="w-8 h-8 object-contain" alt="" />
                           <span className="text-sm font-bold text-slate-200 truncate">{t.team.name}</span>
                         </div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{t.all.played}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{t.all.win}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{t.all.draw}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{t.all.lose}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{t.goalsDiff}</div>
                         <div className={`col-span-1 text-right text-sm font-black text-white`}>{t.points}</div>
                       </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <Dialog.Root open={!!modalFixture} onOpenChange={(open) => !open && setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] animate-in fade-in duration-500" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl bg-[#0a0f1a] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[101] overflow-hidden flex flex-col max-h-[90vh]">
            <Dialog.Title className="sr-only">Dettagli Partita</Dialog.Title>
            
            <div className="p-8 border-b border-white/5 relative bg-white/5">
                <div className="flex items-center gap-4 mb-6">
                   <Trophy className="w-5 h-5 text-cyan-400" />
                   <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
                      {modalFixture?.home.name} vs {modalFixture?.away.name}
                   </h3>
                </div>
                {!modalLoading && (
                <div className="flex border border-white/10 rounded-xl p-1 bg-black/20 w-full max-w-xs relative z-10">
                   <button onClick={() => setModalTab('timeline')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${modalTab === 'timeline' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>Timeline</button>
                   <button onClick={() => setModalTab('stats')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${modalTab === 'stats' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>Statistiche</button>
                </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[#080d17]/50 space-y-6 custom-scrollbar">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Analisi in corso...</span>
                </div>
              ) : modalTab === 'timeline' ? (
                <div className="space-y-6 relative py-4">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2 rounded-full" />
                  {incidentsData.length === 0 && (
                    <div className="text-center py-10 relative z-10"><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest bg-[#080d17] px-4 py-2 inline-block rounded-full border border-white/5">Nessun evento registrato</p></div>
                  )}
                  {incidentsData.map((inc, i) => {
                    if (inc.incidentType !== 'goal' && inc.incidentType !== 'card') return null;
                    return (
                      <div key={i} className={`flex items-center w-full relative z-10 ${inc.isHome ? 'justify-start' : 'justify-end'}`}>
                        <div className={`w-1/2 flex items-center gap-4 relative ${inc.isHome ? 'justify-end pr-6 md:pr-10' : 'justify-start pl-6 md:pl-10 flex-row-reverse'}`}>
                           <div className={`text-right ${inc.isHome ? '' : 'text-left'}`}>
                             <p className="text-sm font-bold text-white uppercase tracking-tight">{inc.player?.name || 'Sconosciuto'}</p>
                             {inc.incidentType === 'goal' && inc.assist1 && (<p className="text-[10px] text-slate-500 uppercase">Assist: {inc.assist1.name}</p>)}
                           </div>
                           <div className={`w-8 h-8 rounded-full bg-[#080d17] border border-white/10 flex items-center justify-center shrink-0 shadow-2xl relative ${inc.isHome ? '-right-[17px] md:-right-[21px]' : '-left-[17px] md:-left-[21px]'}`}>
                             {inc.incidentType === 'goal' ? '⚽' : (inc.incidentClass === 'yellow' ? '🟨' : '🟥')}
                           </div>
                        </div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center z-20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                          <span className="text-[9px] font-black text-cyan-400">{inc.time}'</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-8">
                  {(() => {
                    if (!statsData || statsData.length === 0) return (<div className="text-center py-10"><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Dati non disponibili</p></div>);
                    
                    const buckets: Record<string, any[]> = { "Principali": [], "Attacco": [], "Difesa": [], "Disciplina": [], "Passaggi": [], "Portiere": [] };
                    statsData.forEach((group: any) => {
                      const bucketName = STATS_CATEGORIES[group.groupName] || "Principali";
                      if(buckets[bucketName]) buckets[bucketName].push(...(group.statisticsItems || []));
                    });

                    return Object.entries(buckets).map(([title, stats], bIdx) => {
                      if (stats.length === 0) return null;
                      return (
                        <div key={bIdx} className="space-y-6">
                          <h4 className="text-sm font-black text-cyan-400 uppercase tracking-[0.2em] border-l-4 border-cyan-500 pl-4 mb-6">{title}</h4>
                          {stats.map((stat: any, i: number) => {
                            const hVal = parseFloat(String(stat.homeValue)) || 0;
                            const aVal = parseFloat(String(stat.awayValue)) || 0;
                            const total = hVal + aVal || 1;
                            const isPercent = String(stat.home).includes('%') || String(stat.name).includes('%');
                            const w0 = isPercent ? hVal : (hVal / total) * 100;
                            const w1 = isPercent ? aVal : (aVal / total) * 100;
                            const trTitle = STATS_TRANSLATIONS[stat.name] || stat.name;

                            return (
                              <div key={i} className="mb-6">
                                <div className="flex justify-between text-xs mb-2 items-end">
                                  <span className="text-white font-black drop-shadow-[0_1px_3px_rgba(0,0,0,1)] text-lg italic">{stat.home}</span>
                                  <span className="text-slate-500 uppercase tracking-widest text-[10px] font-black pb-1">{trTitle}</span>
                                  <span className="text-white font-black drop-shadow-[0_1px_3px_rgba(0,0,0,1)] text-lg italic">{stat.away}</span>
                                </div>
                                <div className="flex w-full h-6 bg-white/5 rounded-lg overflow-hidden border border-white/5 relative">
                                  <div className="h-full transition-all" style={{ width: `${w0}%`, backgroundColor: SERIE_A_COLORS[modalFixture?.home.name || ""] || '#22d3ee' }}></div>
                                  <div className="h-full transition-all" style={{ width: `${w1}%`, backgroundColor: SERIE_A_COLORS[modalFixture?.away.name || ""] || '#34d399' }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  })()}
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
        @keyframes breathing { 0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 5px rgba(16,185,129,0.5); } 50% { opacity: 0.7; transform: scale(1.1); box-shadow: 0 0 15px rgba(16,185,129,0.8); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { width: 0; display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
