"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
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

const API_KEY = process.env.NEXT_PUBLIC_FOOTBALL_API_KEY || '';
const API_BASE = 'https://v3.football.api-sports.io';
const HEADERS = {
  'x-apisports-key': process.env.NEXT_PUBLIC_FOOTBALL_API_KEY || ''
};

interface FixtureData {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  league: { round: string };
  teams: {
    home: { name: string; logo: string; id: number };
    away: { name: string; logo: string; id: number };
  };
  goals: { home: number | null; away: number | null };
}

interface MatchEvent {
  team: { id: number; name: string };
  player: { name: string };
  assist: { name: string | null };
  type: string;
  detail: string;
}

interface PlayerStat {
  player: { id: number; name: string; photo: string };
  statistics: {
    goals: { total: number | null; assists: number | null };
  }[];
}

export default function ScoutSerieAHub() {
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'STATS'>('MATCHES');
  
  // Modal State
  const [modalFixture, setModalFixture] = useState<FixtureData | null>(null);
  const [modalEvents, setModalEvents] = useState<MatchEvent[]>([]);
  const [loadingModal, setLoadingModal] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Stats State
  const [topScorers, setTopScorers] = useState<PlayerStat[]>([]);
  const [topAssists, setTopAssists] = useState<PlayerStat[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [statsLoaded, setStatsLoaded] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 1. Fetch Iniziale (Calendario) ---
  useEffect(() => {
    const fetchCalendar = async () => {
      console.log("Stato Chiave API:", process.env.NEXT_PUBLIC_FOOTBALL_API_KEY ? "Presente e letta" : "UNDEFINED! Manca la variabile");
      try {
        setLoadingInitial(true);
        setErrorHeader(null);

        const cached = sessionStorage.getItem('serieA_calendar');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setupMatches(parsed);
            setLoadingInitial(false);
            return;
          }
        }

        const res = await axios.get(`${API_BASE}/fixtures?league=135&season=2025`, { headers: HEADERS });
        if (res.data.errors && Object.keys(res.data.errors).length > 0) {
          throw new Error('Errore API limit/key');
        }
        
        const data = res.data.response || [];
        sessionStorage.setItem('serieA_calendar', JSON.stringify(data));
        setupMatches(data);
      } catch (err: any) {
        setErrorHeader("Impossibile caricare il calendario. Riprova più tardi.");
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchCalendar();
  }, []);

  const setupMatches = (data: FixtureData[]) => {
    setFixtures(data);
    
    // Calculate current round
    if (data.length > 0) {
      const activeStatuses = ['NS', 'TBD', '1H', '2H', 'HT'];
      
      const rounds = Array.from(new Set(data.map(f => {
        const match = f.league.round.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      }))).filter(r => r > 0).sort((a,b) => a-b);
      
      let current = rounds[0] || 1;
      for (const r of rounds) {
        const roundMatches = data.filter(f => {
          const m = f.league.round.match(/\d+/);
          return m && parseInt(m[0], 10) === r;
        });
        const hasActive = roundMatches.some(f => activeStatuses.includes(f.fixture.status.short));
        if (hasActive) {
          current = r;
          break;
        }
        current = r;
      }
      setSelectedRound(current);
    }
  };

  // --- Derived Grouped Data ---
  const groupedFixtures = useMemo(() => {
    const groups: Record<number, FixtureData[]> = {};
    fixtures.forEach(f => {
      const match = f.league.round.match(/\d+/);
      if (match) {
        const r = parseInt(match[0], 10);
        if (!groups[r]) groups[r] = [];
        groups[r].push(f);
      }
    });
    return groups;
  }, [fixtures]);

  // --- 3. Dettagli Partita (Modal On-Demand) ---
  const openModal = async (fixture: FixtureData) => {
    setModalFixture(fixture);
    setModalError(null);
    setModalEvents([]);
    
    try {
      setLoadingModal(true);
      const cacheKey = `events_${fixture.fixture.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        setModalEvents(JSON.parse(cached));
        setLoadingModal(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/fixtures/events?fixture=${fixture.fixture.id}`, { headers: HEADERS });
      const data = res.data.response || [];
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      setModalEvents(data);
    } catch (err) {
      setModalError("Impossibile caricare i dettagli della partita.");
    } finally {
      setLoadingModal(false);
    }
  };

  // --- 4. Tab Statistiche Ufficiali (Nuovo Fetch) ---
  const loadStats = async () => {
    if (statsLoaded) return;
    try {
      setLoadingStats(true);
      setStatsError(null);

      const cachedScorers = sessionStorage.getItem('serieA_scorers');
      const cachedAssists = sessionStorage.getItem('serieA_assists');

      let scorersData = [];
      let assistsData = [];

      if (cachedScorers && cachedAssists) {
        scorersData = JSON.parse(cachedScorers);
        assistsData = JSON.parse(cachedAssists);
      } else {
        const [resS, resA] = await Promise.all([
          axios.get(`${API_BASE}/players/topscorers?league=135&season=2025`, { headers: HEADERS }),
          axios.get(`${API_BASE}/players/topassists?league=135&season=2025`, { headers: HEADERS })
        ]);

        scorersData = resS.data.response || [];
        assistsData = resA.data.response || [];
        
        sessionStorage.setItem('serieA_scorers', JSON.stringify(scorersData));
        sessionStorage.setItem('serieA_assists', JSON.stringify(assistsData));
      }

      setTopScorers(scorersData);
      setTopAssists(assistsData);
      setStatsLoaded(true);

    } catch (err) {
      setStatsError("Errore nel caricamento delle statistiche ufficiali.");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'STATS') {
      loadStats();
    }
  }, [activeTab]);

  // --- Rendering Helpers ---
  const renderEventsList = (eventsList: MatchEvent[], teamId: number) => {
    const teamEvents = eventsList.filter(e => e.team.id === teamId);
    if (teamEvents.length === 0) return <p className="text-slate-600 text-xs italic">Nessun evento registrato.</p>;
    
    return (
      <ul className="space-y-2">
        {teamEvents.map((e, idx) => {
          if (e.type === 'Goal') {
            return (
              <li key={idx} className="text-emerald-400 text-sm flex items-start gap-2 font-medium">
                <span>⚽</span>
                <div>
                  {e.player.name}
                  {e.assist.name && <span className="text-slate-400 text-xs ml-1">(🅰️ {e.assist.name})</span>}
                </div>
              </li>
            );
          }
          if (e.type === 'Card') {
            const isRed = e.detail.toLowerCase().includes('red');
            return (
              <li key={idx} className={`${isRed ? 'text-red-400' : 'text-yellow-400'} text-sm flex items-start gap-2 font-medium`}>
                <span>{isRed ? '🟥' : '🟨'}</span>
                <span>{e.player.name}</span>
              </li>
            );
          }
          return null;
        })}
      </ul>
    );
  };

  // --- Main Render ---
  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Inizializzazione API-Football v3...</p>
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
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Powered by API-Sports (Cache attive)</span>
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
                const finished = ['FT', 'PEN', 'AET'].includes(f.fixture.status.short);
                const active = ['1H', '2H', 'HT', 'ET'].includes(f.fixture.status.short);
                
                const dateObj = new Date(f.fixture.date);
                const timeStr = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

                return (
                  <div 
                    key={f.fixture.id}
                    onClick={() => openModal(f)}
                    className="group bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 hover:border-emerald-500/40 p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <img src={f.teams.home.logo} alt={f.teams.home.name} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                      <span className="text-sm font-bold text-slate-200 group-hover:text-white truncate">{f.teams.home.name}</span>
                    </div>

                    <div className="flex flex-col items-center min-w-[80px]">
                      {(finished || active) ? (
                        <div className="flex flex-col items-center">
                          {active && <span className="text-[8px] text-red-500 font-bold animate-pulse mb-1">LIVE</span>}
                          <div className="text-xl md:text-2xl font-black italic text-white tracking-widest leading-none">
                            {f.goals.home ?? 0} <span className="text-emerald-500/50">:</span> {f.goals.away ?? 0}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-black text-emerald-500 italic leading-none">{timeStr}</span>
                          <span className="text-[9px] font-bold text-slate-600 whitespace-nowrap">{dateStr}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-sm font-bold text-slate-200 group-hover:text-white truncate text-right">{f.teams.away.name}</span>
                      <img src={f.teams.away.logo} alt={f.teams.away.name} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* --- Tab: Statistiche Ufficiali --- */}
        {activeTab === 'STATS' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {loadingStats && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            )}
            
            {statsError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
                <ShieldAlert className="text-red-500 w-5 h-5 flex-shrink-0" />
                <p className="text-red-200 text-xs font-medium">{statsError}</p>
              </div>
            )}

            {!loadingStats && !statsError && statsLoaded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Top Scorers */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-black text-base text-white italic tracking-wide">TOP MARCATORI</h3>
                    <span>🎯</span>
                  </div>
                  <div className="divide-y divide-slate-800/40">
                    {topScorers.slice(0, 10).map((s, idx) => (
                      <div key={s.player.id} className="flex items-center justify-between p-3 px-6 hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-black ${idx < 3 ? 'text-emerald-500' : 'text-slate-700'}`}>{idx + 1}</span>
                          <img src={s.player.photo} alt={s.player.name} className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                          <span className="text-sm font-bold text-slate-200">{s.player.name}</span>
                        </div>
                        <div className="text-lg font-black text-emerald-500">{s.statistics[0].goals.total || 0}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Assists */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-black text-base text-white italic tracking-wide">TOP ASSIST</h3>
                    <span>👟</span>
                  </div>
                  <div className="divide-y divide-slate-800/40">
                    {topAssists.slice(0, 10).map((a, idx) => (
                      <div key={a.player.id} className="flex items-center justify-between p-3 px-6 hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-black ${idx < 3 ? 'text-emerald-500' : 'text-slate-700'}`}>{idx + 1}</span>
                          <img src={a.player.photo} alt={a.player.name} className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                          <span className="text-sm font-bold text-slate-200">{a.player.name}</span>
                        </div>
                        <div className="text-lg font-black text-emerald-500">{a.statistics[0].goals.assists || 0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Modal Partita --- */}
        {modalFixture && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setModalFixture(null)} />
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800/50 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in duration-200">
              
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">DETTAGLI (ID {modalFixture.fixture.id})</p>
                </div>
                <button onClick={() => setModalFixture(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 md:p-8">
                {/* Scoreboard Info */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col items-center flex-1 gap-3 text-center">
                    <img src={modalFixture.teams.home.logo} className="w-16 h-16 object-contain drop-shadow-md" />
                    <span className="text-xs font-black text-white">{modalFixture.teams.home.name}</span>
                  </div>
                  <div className="px-4 flex flex-col items-center">
                    <div className="text-4xl font-black text-white italic tracking-tighter">
                      {modalFixture.goals.home ?? '-'}<span className="text-emerald-500 mx-1">:</span>{modalFixture.goals.away ?? '-'}
                    </div>
                  </div>
                  <div className="flex flex-col items-center flex-1 gap-3 text-center">
                    <img src={modalFixture.teams.away.logo} className="w-16 h-16 object-contain drop-shadow-md" />
                    <span className="text-xs font-black text-white">{modalFixture.teams.away.name}</span>
                  </div>
                </div>

                {/* Events Loading/Error State */}
                {loadingModal ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  </div>
                ) : modalError ? (
                  <p className="text-center text-red-400 text-xs py-10">{modalError}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-8 border-t border-slate-800/50 pt-6">
                    {/* Home Team Events */}
                    <div>
                      {renderEventsList(modalEvents, modalFixture.teams.home.id)}
                    </div>
                    {/* Away Team Events */}
                    <div>
                      {renderEventsList(modalEvents, modalFixture.teams.away.id)}
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
