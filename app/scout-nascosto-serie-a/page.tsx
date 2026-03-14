"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  Calendar, 
  ChevronRight, 
  X, 
  Info, 
  Clock, 
  Target, 
  Activity,
  AlertCircle
} from 'lucide-react';

// --- Types ---
interface TheSportsDBEvent {
  idEvent: string;
  strEvent: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intRound: string;
  dateEvent: string;
  strTime: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strHomeGoalDetails: string | null;
  strAwayGoalDetails: string | null;
  strHomeYellowCards: string | null;
  strAwayYellowCards: string | null;
  strHomeRedCards: string | null;
  strAwayRedCards: string | null;
  strStatus: string;
}

interface Team {
  idTeam: string;
  strTeam: string;
  strBadge?: string;
  strTeamBadge?: string;
}

type TabType = 'RESULTS' | 'SCORERS';

export default function ScoutSerieAClient() {
  const [events, setEvents] = useState<TheSportsDBEvent[]>([]);
  const [teams, setTeams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('RESULTS');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [modalMatch, setModalMatch] = useState<TheSportsDBEvent | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Live Fetch from TheSportsDB (season 25/26)
        // Adding a timestamp to prevent browser/proxy caching
        const timestamp = new Date().getTime();
        const [calendarRes, teamsRes] = await Promise.all([
          axios.get(`https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4332&s=2025-2026&t=${timestamp}`),
          axios.get(`https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=Italian%20Serie%20A`)
        ]);

        const fetchedEvents: TheSportsDBEvent[] = calendarRes.data?.events || [];
        setEvents(fetchedEvents);

        const fetchedTeams = teamsRes.data?.teams || [];
        const teamMap: Record<string, string> = {};
        fetchedTeams.forEach((t: Team) => {
          teamMap[String(t.idTeam)] = t.strBadge || t.strTeamBadge || '';
        });
        setTeams(teamMap);

        // Determine Current Matchday
        if (fetchedEvents.length > 0) {
          const sortedRounds = [...new Set(fetchedEvents.map(e => parseInt(e.intRound, 10)))]
            .sort((a, b) => a - b);
            
          let current = sortedRounds[0] || 1;
          for (const round of sortedRounds) {
            const roundMatches = fetchedEvents.filter(e => parseInt(e.intRound, 10) === round);
            const hasUnplayed = roundMatches.some(m => m.intHomeScore === null);
            if (hasUnplayed) {
              current = round;
              break;
            }
            current = round; // If all played, stay on last
          }
          setSelectedRound(current);
        }

      } catch (err: any) {
        setError("Impossibile caricare i dati live. Verifica la connessione.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Derived Data ---
  const groupedByRound = useMemo(() => {
    return events.reduce((acc: Record<number, TheSportsDBEvent[]>, event) => {
      const r = parseInt(event.intRound, 10);
      if (!acc[r]) acc[r] = [];
      acc[r].push(event);
      return acc;
    }, {});
  }, [events]);

  const topScorers = useMemo(() => {
    const counts: Record<string, number> = {};
    const regexClean = /[0-9:']|(\(Pen\))/g;

    events.forEach(e => {
      const parse = (details: string | null) => {
        if (!details) return [];
        return details.split(';')
          .map(d => d.replace(regexClean, '').trim())
          .filter(name => name.length > 2);
      };

      [...parse(e.strHomeGoalDetails), ...parse(e.strAwayGoalDetails)].forEach(name => {
        counts[name] = (counts[name] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [events]);

  // --- Helpers ---
  const getLogo = (id: string) => teams[String(id)] || null;

  const formatList = (text: string | null) => {
    if (!text || text.trim() === "") return <span className="text-slate-600 italic">Nessun dato</span>;
    return (
      <ul className="space-y-1">
        {text.split(';').filter(Boolean).map((item, i) => (
          <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
            <span className="text-emerald-500 mt-1">•</span>
            {item.trim()}
          </li>
        ))}
      </ul>
    );
  };

  // --- Renders ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
          <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6 animate-pulse" />
        </div>
        <p className="mt-6 text-slate-400 font-medium tracking-widest uppercase text-xs">Sincronizzazione Live...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 pt-28 md:pt-32 font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-tighter">
                Live Data
              </span>
              <span className="text-slate-600 text-[10px] font-bold uppercase tracking-tighter">Serie A 2025/26</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter flex items-center gap-3">
              SCOUT <span className="text-emerald-500">CENTRAL</span>
            </h1>
          </div>
          
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800/50">
            <button 
              onClick={() => setActiveTab('RESULTS')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'RESULTS' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Giornate
            </button>
            <button 
              onClick={() => setActiveTab('SCORERS')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'SCORERS' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Marcatori
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {activeTab === 'RESULTS' && (
          <>
            {/* Round Selector */}
            <div className="mb-8 group">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Seleziona Giornata</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">G{selectedRound}</span>
              </div>
              <div 
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar snap-x no-scrollbar"
              >
                {Array.from({ length: 38 }, (_, i) => i + 1).map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRound(r)}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl border font-black text-sm transition-all snap-start flex items-center justify-center
                      ${selectedRound === r 
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Match Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(groupedByRound[selectedRound] || []).map(match => {
                const isFinished = match.intHomeScore !== null;
                return (
                  <div 
                    key={match.idEvent}
                    onClick={() => setModalMatch(match)}
                    className="bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-emerald-500" />
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      {/* Home */}
                      <div className="flex flex-col items-center flex-1 text-center gap-2">
                        <img 
                          src={getLogo(match.idHomeTeam) || ''} 
                          alt={match.strHomeTeam} 
                          className="w-12 h-12 object-contain"
                        />
                        <span className="text-xs font-bold text-slate-300 line-clamp-1 leading-tight">{match.strHomeTeam}</span>
                      </div>

                      {/* Info Center */}
                      <div className="flex flex-col items-center gap-1 min-w-[80px]">
                        {isFinished ? (
                          <div className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                            <span>{match.intHomeScore}</span>
                            <span className="text-slate-700">-</span>
                            <span>{match.intAwayScore}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-emerald-500/80 bg-emerald-500/5 px-2 py-0.5 rounded-full mb-1">LIVE PREVIEW</span>
                            <span className="text-xs font-black text-slate-100">{match.strTime?.substring(0, 5) || 'TBD'}</span>
                            <span className="text-[10px] text-slate-500 font-bold">{match.dateEvent}</span>
                          </div>
                        )}
                        {isFinished && <div className="text-[9px] font-bold text-slate-600 uppercase">Finito</div>}
                      </div>

                      {/* Away */}
                      <div className="flex flex-col items-center flex-1 text-center gap-2">
                        <img 
                          src={getLogo(match.idAwayTeam) || ''} 
                          alt={match.strAwayTeam} 
                          className="w-12 h-12 object-contain"
                        />
                        <span className="text-xs font-bold text-slate-300 line-clamp-1 leading-tight">{match.strAwayTeam}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'SCORERS' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <Trophy className="text-yellow-500 w-6 h-6" />
                GOLDEN BOOT
              </h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stagione 25/26</span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {topScorers.map(([name, goals], idx) => (
                <div key={name} className="flex items-center justify-between p-4 px-6 hover:bg-slate-800/20 transition-colors group">
                  <div className="flex items-center gap-5">
                    <span className={`text-sm font-black w-6 ${idx < 3 ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white">{goals}</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Gol</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Overlay */}
        {modalMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setModalMatch(null)}
            ></div>
            
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="bg-slate-800/50 p-6 flex items-center justify-between border-b border-slate-700/50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Giornata {modalMatch.intRound}</span>
                  <span className="text-xs text-slate-400 font-medium">{modalMatch.dateEvent}</span>
                </div>
                <button 
                  onClick={() => setModalMatch(null)}
                  className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                {/* Scoreboard */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex flex-col items-center flex-1 gap-3">
                    <img src={getLogo(modalMatch.idHomeTeam) || ''} alt="" className="w-16 h-16 object-contain" />
                    <span className="text-sm font-black text-white text-center">{modalMatch.strHomeTeam}</span>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <div className="text-4xl font-black text-white tracking-widest">
                      {modalMatch.intHomeScore ?? '-'} <span className="text-slate-700">:</span> {modalMatch.intAwayScore ?? '-'}
                    </div>
                  </div>
                  <div className="flex flex-col items-center flex-1 gap-3">
                    <img src={getLogo(modalMatch.idAwayTeam) || ''} alt="" className="w-16 h-16 object-contain" />
                    <span className="text-sm font-black text-white text-center">{modalMatch.strAwayTeam}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-800/50">
                  {/* Home Team Column */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase mb-3 px-1">
                        <Target className="w-3 h-3" /> GOL {modalMatch.strHomeTeam}
                      </h4>
                      {formatList(modalMatch.strHomeGoalDetails)}
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-3 px-1">
                        <Info className="w-3 h-3" /> CARTELLINI GIALLI
                      </h4>
                      {formatList(modalMatch.strHomeYellowCards)}
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase mb-3 px-1">
                        <Info className="w-3 h-3" /> CARTELLINI ROSSI
                      </h4>
                      {formatList(modalMatch.strHomeRedCards)}
                    </div>
                  </div>

                  {/* Away Team Column */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase mb-3 px-1">
                        <Target className="w-3 h-3" /> GOL {modalMatch.strAwayTeam}
                      </h4>
                      {formatList(modalMatch.strAwayGoalDetails)}
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-3 px-1">
                        <Info className="w-3 h-3" /> CARTELLINI GIALLI
                      </h4>
                      {formatList(modalMatch.strAwayYellowCards)}
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase mb-3 px-1">
                        <Info className="w-3 h-3" /> CARTELLINI ROSSI
                      </h4>
                      {formatList(modalMatch.strAwayRedCards)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-800/50 flex justify-end">
                <button 
                  onClick={() => setModalMatch(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
