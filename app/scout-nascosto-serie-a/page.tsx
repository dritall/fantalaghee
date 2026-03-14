"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Activity, 
  Target, 
  Info, 
  X, 
  ChevronRight, 
  Trophy, 
  ShieldAlert,
  Loader2
} from 'lucide-react';

// --- Types ---
interface TheSportsDBEvent {
  idEvent: string;
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
}

interface Team {
  idTeam: string;
  strTeam: string;
  strBadge?: string;
  strTeamBadge?: string;
}

interface League {
  strBadge: string;
  strLeague: string;
}

export default function SerieALiveHub() {
  const [events, setEvents] = useState<TheSportsDBEvent[]>([]);
  const [teams, setTeams] = useState<Record<string, string>>({});
  const [leagueLogo, setLeagueLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [modalMatch, setModalMatch] = useState<TheSportsDBEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'SCORERS'>('MATCHES');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        
        const [eventsRes, teamsRes, leagueRes] = await Promise.all([
          axios.get(`https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4332&s=2025-2026&t=${timestamp}`),
          axios.get(`https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=Italian%20Serie%20A`),
          axios.get(`https://www.thesportsdb.com/api/v1/json/3/lookupleague.php?id=4332`)
        ]);

        const fetchedEvents: TheSportsDBEvent[] = eventsRes.data?.events || [];
        setEvents(fetchedEvents);

        const fetchedTeams: Team[] = teamsRes.data?.teams || [];
        const teamMap: Record<string, string> = {};
        fetchedTeams.forEach(t => {
          teamMap[String(t.idTeam)] = t.strBadge || t.strTeamBadge || '';
        });
        setTeams(teamMap);

        const leagueData = leagueRes.data?.leagues?.[0];
        setLeagueLogo(leagueData?.strBadge || null);

        // Calculate Current Round
        if (fetchedEvents.length > 0) {
          const sortedRounds = Array.from(new Set(fetchedEvents.map(e => parseInt(e.intRound, 10)))).sort((a,b) => a-b);
          let current = sortedRounds[0] || 1;
          for (const r of sortedRounds) {
            const hasUnplayed = fetchedEvents.filter(e => parseInt(e.intRound, 10) === r).some(m => m.intHomeScore === null);
            if (hasUnplayed) {
              current = r;
              break;
            }
            current = r;
          }
          setSelectedRound(current);
        }

      } catch (err) {
        setError("Errore durante il caricamento dei dati live.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // --- Derived Data ---
  const groupedMatches = useMemo(() => {
    const groups: Record<number, TheSportsDBEvent[]> = {};
    events.forEach(e => {
      const r = parseInt(e.intRound, 10);
      if (!groups[r]) groups[r] = [];
      groups[r].push(e);
    });
    return groups;
  }, [events]);

  const topScorers = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      const homeGoals = (e.strHomeGoalDetails || '').split(';').filter(Boolean);
      const awayGoals = (e.strAwayGoalDetails || '').split(';').filter(Boolean);
      
      [...homeGoals, ...awayGoals].forEach(g => {
        const name = g.replace(/[0-9:']|(\(Pen\))/g, '').trim();
        if (name.length > 2) counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 10);
  }, [events]);

  // --- Helpers ---
  const getLogo = (id: string) => teams[String(id)] || null;

  const SafeList = ({ text }: { text: string | null }) => {
    const items = (text || '').split(';').filter(Boolean);
    if (items.length === 0) return <p className="text-slate-600 text-[10px] italic">Nessun evento registrato</p>;
    return (
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
            <span className="text-emerald-500 mt-1">•</span>
            {item.trim()}
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Accesso Hub Live...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 pt-28 md:pt-32 font-sans selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            {leagueLogo && <img src={leagueLogo} alt="Serie A" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />}
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic py-1">
                Serie A <span className="text-emerald-500">Live Hub</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Database Sincronizzato 25/26</span>
              </div>
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
              onClick={() => setActiveTab('SCORERS')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'SCORERS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              MARCATORI
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 mb-8">
            <ShieldAlert className="text-red-500 w-5 h-5 flex-shrink-0" />
            <p className="text-red-200 text-xs font-medium">{error}</p>
          </div>
        )}

        {activeTab === 'MATCHES' && (
          <>
            {/* Round Slider */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Scegli Giornata</span>
                <span className="text-xs font-black text-emerald-500">GIONATA {selectedRound}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
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
              {(groupedMatches[selectedRound] || []).map(m => {
                const finished = m.intHomeScore !== null;
                return (
                  <div 
                    key={m.idEvent}
                    onClick={() => setModalMatch(m)}
                    className="group bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 hover:border-emerald-500/40 p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <img src={getLogo(m.idHomeTeam) || ''} alt="" className="w-8 h-8 object-contain" />
                      <span className="text-sm font-bold text-slate-200 group-hover:text-white truncate">{m.strHomeTeam}</span>
                    </div>

                    <div className="flex flex-col items-center min-w-[70px]">
                      {finished ? (
                        <div className="text-xl font-black italic text-white tracking-widest leading-none">
                          {m.intHomeScore} <span className="text-emerald-500/50">:</span> {m.intAwayScore}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] font-black text-emerald-500 italic leading-none">{m.strTime?.substring(0, 5) || 'TBD'}</span>
                          <span className="text-[8px] font-bold text-slate-600 whitespace-nowrap">{m.dateEvent}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-sm font-bold text-slate-200 group-hover:text-white truncate text-right">{m.strAwayTeam}</span>
                      <img src={getLogo(m.idAwayTeam) || ''} alt="" className="w-8 h-8 object-contain" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'SCORERS' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-lg text-white italic">CLASSIFICA MARCATORI</h3>
              <Trophy className="text-emerald-500 w-5 h-5" />
            </div>
            <div className="divide-y divide-slate-800/40">
              {topScorers.map(([name, goals], idx) => (
                <div key={name} className="flex items-center justify-between p-4 px-8 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-6">
                    <span className={`text-xs font-black ${idx < 3 ? 'text-emerald-500' : 'text-slate-700'}`}>{idx + 1}</span>
                    <span className="text-sm font-bold text-slate-200 uppercase">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-emerald-500">{goals}</span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase">GOL</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {modalMatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setModalMatch(null)} />
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800/50 rounded-[2.5rem] shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
              
              <div className="p-8 border-b border-slate-800/50 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">GIORNATA {modalMatch.intRound}</p>
                  <p className="text-[10px] font-bold text-slate-500">{modalMatch.dateEvent}</p>
                </div>
                <button onClick={() => setModalMatch(null)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-8 pb-10">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex flex-col items-center flex-1 gap-4">
                    <img src={getLogo(modalMatch.idHomeTeam) || ''} className="w-16 h-16 object-contain" />
                    <span className="text-[10px] font-black text-white uppercase text-center">{modalMatch.strHomeTeam}</span>
                  </div>
                  <div className="px-6 flex flex-col items-center">
                    <div className="text-5xl font-black text-white italic tracking-tighter">
                      {modalMatch.intHomeScore ?? '-'}<span className="text-emerald-500 mx-1">:</span>{modalMatch.intAwayScore ?? '-'}
                    </div>
                  </div>
                  <div className="flex flex-col items-center flex-1 gap-4">
                    <img src={getLogo(modalMatch.idAwayTeam) || ''} className="w-16 h-16 object-contain" />
                    <span className="text-[10px] font-black text-white uppercase text-center">{modalMatch.strAwayTeam}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="group">
                      <h4 className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase mb-3">
                        <Target className="w-3 h-3" /> GOL
                      </h4>
                      <SafeList text={modalMatch.strHomeGoalDetails} />
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-[9px] font-black text-yellow-500 uppercase mb-3">
                        <Info className="w-3 h-3" /> YELLOW
                      </h4>
                      <SafeList text={modalMatch.strHomeYellowCards} />
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-[9px] font-black text-red-500 uppercase mb-3">
                        <ShieldAlert className="w-3 h-3" /> RED
                      </h4>
                      <SafeList text={modalMatch.strHomeRedCards} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase mb-3">
                        <Target className="w-3 h-3" /> GOL
                      </h4>
                      <SafeList text={modalMatch.strAwayGoalDetails} />
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-[9px] font-black text-yellow-500 uppercase mb-3">
                        <Info className="w-3 h-3" /> YELLOW
                      </h4>
                      <SafeList text={modalMatch.strAwayYellowCards} />
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-[9px] font-black text-red-500 uppercase mb-3">
                        <ShieldAlert className="w-3 h-3" /> RED
                      </h4>
                      <SafeList text={modalMatch.strAwayRedCards} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900 border-t border-slate-800/50 flex justify-center">
                <button 
                  onClick={() => setModalMatch(null)}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  Chiudi HUB
                </button>
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
