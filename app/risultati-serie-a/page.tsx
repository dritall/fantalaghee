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
  statusId?: number;
  round: string;
  status: {
    finished: boolean;
    started: boolean;
    cancelled: boolean;
    scoreStr?: string | null;
    reason?: any;
    liveTime?: any;
    startTime?: string;
  };
  home: { name: string; id: string; score?: number; };
  away: { name: string; id: string; score?: number; };
  time?: string;
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

const SERIE_A_COLORS: Record<string, string> = {
  "Inter": "#0059A3",
  "Milan": "#FB090B",
  "Juventus": "#000000",
  "Napoli": "#00AEEF",
  "Roma": "#8E1F2F",
  "Lazio": "#87D8F7",
  "Atalanta": "#1E4B87",
  "Fiorentina": "#4A2583",
  "Bologna": "#A21C26",
  "Torino": "#8A1E31",
  "Sassuolo": "#00A752",
  "Genoa": "#A61A2A",
  "Verona": "#FFD100",
  "Lecce": "#FFD100",
  "Empoli": "#00579C",
  "Udinese": "#000000",
  "Cagliari": "#00285E",
  "Frosinone": "#FFCC00",
  "Salernitana": "#8A1E31",
  "Monza": "#E5002B",
  "Como": "#0059A3",
  "Parma": "#FFCB05",
  "Venezia": "#F59124",
};

const STATS_CATEGORIES: Record<string, string> = {
  "top_stats": "Principali",
  "shots": "Attacco",
  "expected_goals": "Attacco",
  "physical_metrics": "Attacco",
  "passes": "Attacco",
  "defence": "Difesa",
  "duels": "Difesa",
  "discipline": "Disciplina"
};

const STATS_TRANSLATIONS: Record<string, string> = {
  // Principali & Tiri
  "Ball possession": "Possesso Palla",
  "Expected goals (xG)": "Gol Attesi (xG)",
  "Total shots": "Tiri Totali",
  "Shots on target": "Tiri in Porta",
  "Big chances": "Grandi Occasioni",
  "Big chances missed": "Grandi Occasioni Fallite",
  "Shots off target": "Tiri Fuori",
  "Blocked shots": "Tiri Respinti",
  "Shots inside box": "Tiri in Area",
  "Shots outside box": "Tiri Fuori Area",
  
  // Passaggi
  "Accurate passes": "Passaggi Riusciti",
  "Passes": "Passaggi Totali",
  "Own half": "Propria Metà Campo",
  "Opponent half": "Metà Campo Avversaria",
  "Long balls": "Lanci Lunghi",
  "Crosses": "Cross",
  
  // Difesa & Contrasti
  "Tackles won": "Tackle Vinti",
  "Interceptions": "Intercetti",
  "Blocks": "Respinte",
  "Clearances": "Rinvii",
  "Keeper saves": "Parate",
  "Duels won": "Contrasti Vinti",
  "Ground duels won": "Contrasti a Terra Vinti",
  "Aerial duels won": "Contrasti Aerei Vinti",
  "Successful dribbles": "Dribbling Riusciti",
  
  // Disciplina
  "Fouls committed": "Falli Commessi",
  "Fouls conceded": "Falli Subiti",
  "Yellow cards": "Ammonizioni 🟨",
  "Red cards": "Espulsioni 🟥",
  "Offsides": "Fuorigioco",
  "Corner kicks": "Calci d'angolo"
};

// --- Bulletproof Parsers ---
const getStandings = (data: any) => {
  const res = data?.raw?.response || data?.response || {};
  return Array.isArray(res.standing) ? res.standing : [];
};

const getMatches = (data: any) => {
  const res = data?.raw?.response || data?.response || [];
  if (Array.isArray(res)) {
    // If it's an array of objects containing matches
    if (res[0]?.matches) return res.flatMap((r: any) => r.matches || []);
    // If it's the matches array directly
    return res;
  }
  if (res.matches) return res.matches;
  return [];
};

const getStats = (data: any) => {
  const res = data?.raw?.response || data?.response || {};
  return res.stats || [];
};

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
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [matchesRes, standingsRes] = await Promise.all([
          fetch('/api/football?endpoint=football-get-all-matches-by-league&leagueid=55').then(res => res.json()).catch(() => null),
          fetch('/api/football?endpoint=football-get-standing-all&leagueid=55').then(res => res.json()).catch(() => null)
        ]);
        
        // Process Standings
        const standingsData = getStandings(standingsRes);
        setStandings(standingsData);

        // Process Matches
        const allMatchesRaw = getMatches(matchesRes);
        const matchesArray: Match[] = allMatchesRaw.map((e: any) => {
          const isFinished = e.status?.finished || e.status?.reason?.short === 'FT' || e.status_short === 'FT';
          const isStarted = e.status?.started === true || e.statusId === 6 || isFinished;
          
          return {
            id: e.id,
            statusId: e.statusId,
            round: "",
            status: {
              finished: isFinished,
              started: isStarted,
              cancelled: e.status === 'Cancelled' || e.statusId === 4,
              scoreStr: e.status?.scoreStr || (e.home?.score !== undefined ? `${e.home?.score} - ${e.away?.score}` : null),
              startTime: e.status?.utcTime || e.status?.startTime || e.fixture?.date || e.date || new Date().toISOString(),
              reason: e.status?.reason,
              liveTime: e.status?.liveTime
            },
            home: { 
              name: e.home?.name || e.home?.nameStr, 
              id: e.home?.id,
              score: e.home?.score
            },
            away: { 
              name: e.away?.name || e.away?.nameStr, 
              id: e.away?.id,
              score: e.away?.score
            },
            time: e.status?.time || e.time_status || e.time
          };
        });
        
        // Sort matches by timestamp
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
    setStatsData(null);
    setModalLoading(true);
    
    try {
      const res = await fetch(`/api/football?endpoint=football-get-match-all-stats&eventid=${m.id}`).then(res => res.json());
      setStatsData(getStats(res));
    } catch (err) {
      console.error("Errore recupero dettagli match:", err);
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
              <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Risultati Serie A</h1>
              <div className="flex items-center gap-2 mt-1">
                {rounds[selectedRoundIndex]?.every(m => m.status.finished || m.statusId === 6) && (
                   <span className="text-[9px] font-black bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 uppercase tracking-widest">Giornata Finita</span>
                )}
              </div>
            </div>
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
                  const isFinished = m.status.finished || m.statusId === 6;
                  const isStarted = m.status.started || m.statusId === 6 || isFinished;
                  const homeColor = SERIE_A_COLORS[m.home.name] || '#ffffff';
                  const awayColor = SERIE_A_COLORS[m.away.name] || '#ffffff';
                  
                  return (
                    <div 
                      key={m.id}
                      onClick={() => openMatch(m)}
                      style={{ 
                        ['--glow-color' as any]: `${homeColor}40`,
                        ['--glow-color-final' as any]: `${awayColor}40`
                      }}
                      className="group relative bg-[#0f172a]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-7 cursor-pointer transition-all duration-500 hover:border-cyan-500/40 hover:shadow-[0_0_50px_var(--glow-color)] hover:-translate-y-2 overflow-hidden"
                    >
                      {/* LED Indicator */}
                      <div className="absolute top-8 right-8 z-20">
                        {isStarted && (
                          <div className={`w-3 h-3 rounded-full border-2 border-slate-900 shadow-lg ${
                            isLive ? 'bg-emerald-500 animate-[breathing_1.5s_infinite]' : 
                            'bg-red-500/60'
                          }`} />
                        )}
                      </div>

                      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col items-center gap-3 w-[40%] text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center p-3 shadow-inner group-hover:scale-110 transition-transform duration-500">
                              <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}.png`} className="w-full h-full object-contain" alt={m.home.name} />
                            </div>
                            <span className="text-[11px] font-black text-slate-300 group-hover:text-white uppercase tracking-tight truncate w-full">{m.home.name}</span>
                          </div>

                          <div className="flex-1 flex flex-col items-center justify-center">
                            {(m.status?.started === true || m.statusId === 6) ? (
                              <div className="font-bold text-white text-xl">
                                {m.status.scoreStr || (m.home.score !== undefined ? `${m.home.score} - ${m.away.score}` : '0 - 0')}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-slate-400">TBD</span>
                                <span className="text-xs text-slate-500">{m.time}</span>
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
                   {standings.length > 0 ? standings.map((t: any, idx: number) => {
                     const teamObj = t.team || t; 
                     const rank = t.rank || t.idx || idx + 1;
                     const name = teamObj.name || teamObj.nameStr || t.name || t.nameStr || "Unknown";
                     const logo = teamObj.logo || `https://images.fotmob.com/image_resources/logo/teamlogo/${teamObj.id || t.id}.png`;
                     const played = t.all?.played ?? t.played ?? 0;
                     const win = t.all?.win ?? t.wins ?? 0;
                     const draw = t.all?.draw ?? t.draws ?? 0;
                     const lose = t.all?.lose ?? t.losses ?? 0;
                     const goalsDiff = t.goalsDiff ?? t.scoresStr ?? 0;
                     const pts = t.points ?? t.pts ?? 0;
                     const qualColor = t.qualColor || null;
                     
                     return (
                       <div 
                        key={teamObj.id || name} 
                        className={`grid grid-cols-12 items-center px-5 py-4 rounded-2xl transition-all border bg-transparent border-transparent hover:bg-white/5`}
                       >
                         <div className={`col-span-1 text-sm font-black italic text-slate-400`}>{rank}</div>
                         <div className="col-span-5 flex items-center gap-4 relative">
                           {qualColor && <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ backgroundColor: qualColor, boxShadow: `0 0 8px ${qualColor}80` }}></div>}
                           <img src={logo} className="w-8 h-8 object-contain" alt="" />
                           <span className="text-sm font-bold text-slate-200 truncate">{name}</span>
                         </div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{played}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{win}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{draw}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{lose}</div>
                         <div className="col-span-1 text-center text-xs font-medium text-slate-400">{goalsDiff}</div>
                         <div className={`col-span-1 text-right text-sm font-black text-white`}>{pts}</div>
                       </div>
                     );
                   }) : (
                     <div className="text-center py-10">
                        <p className="text-slate-400 text-sm font-bold">Nessun dato classifica</p>
                     </div>
                   )}
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
            
            <Dialog.Title className="sr-only">Dettagli Partita</Dialog.Title>
            <Dialog.Description className="sr-only">Statistiche del match</Dialog.Description>

            <div className="p-8 border-b border-white/5 relative bg-white/5">
                <div className="flex items-center gap-4 mb-2">
                   <Trophy className="w-5 h-5 text-cyan-400" />
                   <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Dettagli Partita</h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[#080d17]/50 space-y-6">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Analisi in corso...</span>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                  {(() => {
                    const dColorHome = SERIE_A_COLORS[modalFixture?.home.name || ""] || "#22d3ee";
                    const dColorAway = SERIE_A_COLORS[modalFixture?.away.name || ""] || "#34d399";
                    
                    if (!statsData || statsData.length === 0) {
                      return (
                        <div className="text-center py-10">
                           <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Dati non disponibili</p>
                        </div>
                      );
                    }

                    const buckets: Record<string, any[]> = {
                      "Principali": [],
                      "Attacco": [],
                      "Difesa": [],
                      "Disciplina": []
                    };
                    
                    statsData.forEach((group: any) => {
                      const bucketName = STATS_CATEGORIES[group.key] || "Principali";
                      buckets[bucketName].push(...(group.stats || []));
                    });

                    return Object.entries(buckets).map(([title, stats], bIdx) => {
                      if (stats.length === 0) return null;
                      
                      return (
                        <div key={bIdx} className="space-y-6">
                          <h4 className="text-sm font-black text-cyan-400 uppercase tracking-[0.2em] border-l-4 border-cyan-500 pl-4 mb-6">{title}</h4>
                          {stats.map((stat: any, i: number) => {
                            const val0 = parseFloat(String(stat.stats[0]).replace('%', '')) || 0;
                            const val1 = parseFloat(String(stat.stats[1]).replace('%', '')) || 0;
                            const total = val0 + val1 || 1;
                            const w0 = (val0 / total) * 100;
                            const w1 = (val1 / total) * 100;
                            const trTitle = STATS_TRANSLATIONS[stat.title] || stat.title;

                            return (
                              <div key={i} className="mb-6">
                                <div className="flex justify-between text-xs text-white mb-2 items-end">
                                  <span className="font-black text-lg italic" style={{ color: dColorHome }}>{stat.stats[0]}</span>
                                  <span className="text-slate-500 uppercase tracking-widest text-[10px] font-black pb-1">{trTitle}</span>
                                  <span className="font-black text-lg italic" style={{ color: dColorAway }}>{stat.stats[1]}</span>
                                </div>
                                <div className="flex w-full h-5 bg-white/5 rounded-lg overflow-hidden border border-white/5">
                                  <div className="h-full transition-all duration-1000 ease-out bg-gradient-to-r from-cyan-600 to-cyan-400 relative" style={{ width: `${w0}%`, backgroundColor: dColorHome }}>
                                     <div className="absolute inset-0 bg-white/20 mix-blend-overlay" />
                                  </div>
                                  <div className="h-full transition-all duration-1000 ease-out bg-gradient-to-l from-emerald-600 to-emerald-400 relative" style={{ width: `${w1}%`, backgroundColor: dColorAway }}>
                                     <div className="absolute inset-0 bg-white/20 mix-blend-overlay" />
                                  </div>
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
        @keyframes breathing {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 5px rgba(16,185,129,0.5); }
          50% { opacity: 0.7; transform: scale(1.1); box-shadow: 0 0 15px rgba(16,185,129,0.8); }
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
