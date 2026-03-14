"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

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
}

interface Team {
  idTeam: string;
  strTeam: string;
  strTeamBadge: string;
}

type TabType = 'LATEST' | 'CALENDAR' | 'SCORERS';

export default function ScoutSerieAClient() {
  const [events, setEvents] = useState<TheSportsDBEvent[]>([]);
  const [teams, setTeams] = useState<Record<string, string>>({}); // Mapping id -> logo URL
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('LATEST');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Calendar (24/25) & Teams in parallel
        const [calendarRes, teamsRes] = await Promise.all([
          axios.get('https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4332&s=2024-2025'),
          axios.get('https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=Italian%20Serie%20A')
        ]);

        const fetchedEvents = calendarRes.data.events || [];
        setEvents(fetchedEvents);

        const fetchedTeams = teamsRes.data.teams || [];
        const teamMap: Record<string, string> = {};
        fetchedTeams.forEach((t: Team) => {
          teamMap[t.idTeam] = t.strTeamBadge;
        });
        setTeams(teamMap);

      } catch (err: any) {
        setError(err.message || "Errore nel caricamento dei dati da TheSportsDB");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Helpers ---
  const parseGoals = (details: string | null): string[] => {
    if (!details) return [];
    return details
      .split(';')
      .map(g => g.trim())
      .filter(Boolean)
      // Removes numbers, colons, and apostrophes (e.g., "45':Pulisic C." -> "Pulisic C.")
      .map(g => g.replace(/[0-9:']/g, '').trim())
      .filter(Boolean);
  };

  const getTeamLogo = (teamId: string) => {
    return teams[teamId] || null;
  };

  // --- Derived Data ---
  const filteredEvents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return events.filter(e => {
      if (!query) return true;
      const homeMatch = e.strHomeTeam.toLowerCase().includes(query);
      const awayMatch = e.strAwayTeam.toLowerCase().includes(query);
      const homeGoalsMatch = (e.strHomeGoalDetails || '').toLowerCase().includes(query);
      const awayGoalsMatch = (e.strAwayGoalDetails || '').toLowerCase().includes(query);
      return homeMatch || awayMatch || homeGoalsMatch || awayGoalsMatch;
    });
  }, [events, searchQuery]);

  const latestMatches = useMemo(() => {
    return filteredEvents
      .filter(e => e.intHomeScore !== null && e.intAwayScore !== null)
      .sort((a, b) => new Date(b.dateEvent).getTime() - new Date(a.dateEvent).getTime()); // reverse chrono
  }, [filteredEvents]);

  const calendarMatches = useMemo(() => {
    // Sort calendar ascending
    return [...filteredEvents].sort((a, b) => new Date(a.dateEvent).getTime() - new Date(b.dateEvent).getTime());
  }, [filteredEvents]);

  const topScorers = useMemo(() => {
    const scorerCounts: Record<string, number> = {};
    const finishedMatches = events.filter(e => e.intHomeScore !== null);

    finishedMatches.forEach(match => {
      const homeGoals = parseGoals(match.strHomeGoalDetails);
      const awayGoals = parseGoals(match.strAwayGoalDetails);

      [...homeGoals, ...awayGoals].forEach(scorer => {
        // Clean up empty or weird names
        if (scorer && scorer.length > 2) {
          scorerCounts[scorer] = (scorerCounts[scorer] || 0) + 1;
        }
      });
    });

    return Object.entries(scorerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [events]);

  // --- Renders ---
  const renderMatchCard = (match: TheSportsDBEvent) => {
    const homeLogo = getTeamLogo(match.idHomeTeam);
    const awayLogo = getTeamLogo(match.idAwayTeam);

    const homeGoals = parseGoals(match.strHomeGoalDetails);
    const awayGoals = parseGoals(match.strAwayGoalDetails);

    return (
      <div key={match.idEvent} className="bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-800 hover:border-slate-700 transition-colors">
        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Giornata {match.intRound}
          </div>
          <div className="text-slate-400 text-xs text-right">
            {new Date(match.dateEvent).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
            {match.strTime && ` - ${match.strTime.substring(0, 5)}`}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          {/* Home */}
          <div className="flex flex-col items-center w-1/3 text-center">
            {homeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={homeLogo} alt={match.strHomeTeam} className="w-12 h-12 md:w-16 md:h-16 object-contain mb-2" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-full mb-2 flex items-center justify-center text-xs text-slate-500">Logo</div>
            )}
            <span className="font-bold text-sm text-slate-200">{match.strHomeTeam}</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-2xl md:text-3xl font-black tracking-tighter text-white">
              {match.intHomeScore ?? '-'} <span className="text-slate-600 mx-1">-</span> {match.intAwayScore ?? '-'}
            </div>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center w-1/3 text-center">
            {awayLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={awayLogo} alt={match.strAwayTeam} className="w-12 h-12 md:w-16 md:h-16 object-contain mb-2" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-full mb-2 flex items-center justify-center text-xs text-slate-500">Logo</div>
            )}
            <span className="font-bold text-sm text-slate-200">{match.strAwayTeam}</span>
          </div>
        </div>

        {/* Goal Details */}
        {(homeGoals.length > 0 || awayGoals.length > 0) && (
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <div>
              {homeGoals.map((scorer, i) => (
                <div key={i} className="mb-1 flex items-center gap-1">⚽ <span className="text-slate-300">{scorer}</span></div>
              ))}
            </div>
            <div className="text-right flex flex-col items-end">
              {awayGoals.map((scorer, i) => (
                <div key={i} className="mb-1 flex items-center gap-1"><span className="text-slate-300">{scorer}</span> ⚽</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGroupedMatches = (matches: TheSportsDBEvent[], sortOrder: 'asc' | 'desc') => {
    if (matches.length === 0) {
      return <div className="text-center text-slate-500 py-12">Nessuna partita trovata.</div>;
    }

    // Group by intRound
    const groups: Record<string, TheSportsDBEvent[]> = {};
    matches.forEach(m => {
      const round = m.intRound || 'Sconosciuta';
      if (!groups[round]) groups[round] = [];
      groups[round].push(m);
    });

    // Sort rounds
    const sortedRounds = Object.keys(groups).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });

    return (
      <div className="space-y-8">
        {sortedRounds.map(round => (
          <div key={round} className="space-y-4">
            <h3 className="text-xl font-bold border-b border-slate-800 pb-2 text-emerald-400">
              Giornata {round}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups[round].map(renderMatchCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-500 font-semibold tracking-wide animate-pulse">Analisi Scout in corso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 pt-28 md:pt-32 font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto">
        {/* Header & Search */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Centrale Operativa Scout
          </h1>
          <p className="text-slate-500 mb-6 font-medium">Database: TheSportsDB (Serie A 2024/2025)</p>
          
          <input
            type="text"
            placeholder="Cerca squadra o giocatore (es. Pulisic, Milan...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600 shadow-inner"
          />
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-center">
            <span className="text-xl mr-3">⚠️</span> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 bg-slate-900 p-2 rounded-2xl mb-8 border border-slate-800 overflow-x-auto hide-scrollbar">
          {(['LATEST', 'CALENDAR', 'SCORERS'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab === 'LATEST' && 'Risultati'}
              {tab === 'CALENDAR' && 'Calendario'}
              {tab === 'SCORERS' && 'Marcatori'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[50vh]">
          {activeTab === 'LATEST' && (
            renderGroupedMatches(latestMatches, 'desc')
          )}

          {activeTab === 'CALENDAR' && (
            renderGroupedMatches(calendarMatches, 'asc')
          )}

          {activeTab === 'SCORERS' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🏆</span> Top 10 Marcatori
                </h3>
                <p className="text-slate-500 text-sm mt-1">Calcolata in tempo reale dai match reports (Stagione 24/25)</p>
              </div>
              <div className="divide-y divide-slate-800/50">
                {topScorers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">Dati marcatori non sufficienti.</div>
                ) : (
                  topScorers.map(([name, goals], index) => (
                    <div key={name} className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                          index === 1 ? 'bg-slate-300/20 text-slate-300' :
                          index === 2 ? 'bg-amber-700/20 text-amber-600' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-semibold text-slate-200 text-lg">{name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-emerald-400">{goals}</span>
                        <span className="text-slate-500 text-sm">gol</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
