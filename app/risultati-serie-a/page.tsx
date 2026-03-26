// @ts-nocheck
/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, AlertTriangle } from 'lucide-react';

const TOTAL_ROUNDS = 38;

const TEAM_LOGOS: Record<string, string> = {
  Inter: 'https://tmssl.akamaized.net/images/wappen/head/46.png',
  Milan: 'https://tmssl.akamaized.net/images/wappen/head/5.png',
  Napoli: 'https://tmssl.akamaized.net/images/wappen/head/6195.png',
  Juventus: 'https://tmssl.akamaized.net/images/wappen/head/506.png',
  Roma: 'https://tmssl.akamaized.net/images/wappen/head/12.png',
  Lazio: 'https://tmssl.akamaized.net/images/wappen/head/398.png',
  Atalanta: 'https://tmssl.akamaized.net/images/wappen/head/800.png',
  Bologna: 'https://tmssl.akamaized.net/images/wappen/head/1025.png',
  Fiorentina: 'https://tmssl.akamaized.net/images/wappen/head/430.png',
  Torino: 'https://tmssl.akamaized.net/images/wappen/head/416.png',
  Genoa: 'https://tmssl.akamaized.net/images/wappen/head/252.png',
  'Genoa CFC': 'https://tmssl.akamaized.net/images/wappen/head/252.png',
  Udinese: 'https://tmssl.akamaized.net/images/wappen/head/410.png',
  Lecce: 'https://tmssl.akamaized.net/images/wappen/head/1005.png',
  Verona: 'https://tmssl.akamaized.net/images/wappen/head/276.png',
  'Hellas Verona': 'https://tmssl.akamaized.net/images/wappen/head/276.png',
  Cagliari: 'https://tmssl.akamaized.net/images/wappen/head/1390.png',
  Parma: 'https://tmssl.akamaized.net/images/wappen/head/130.png',
  Sassuolo: 'https://tmssl.akamaized.net/images/wappen/head/6574.png',
  Como: 'https://tmssl.akamaized.net/images/wappen/head/1047.png',
  'Como 1907': 'https://tmssl.akamaized.net/images/wappen/head/1047.png',
  Pisa: 'https://tmssl.akamaized.net/images/wappen/head/4172.png',
  'Pisa Sporting Club': 'https://tmssl.akamaized.net/images/wappen/head/4172.png',
  Cremonese: 'https://tmssl.akamaized.net/images/wappen/head/1511.png',
  Monza: 'https://tmssl.akamaized.net/images/wappen/head/2919.png',
  Empoli: 'https://tmssl.akamaized.net/images/wappen/head/749.png',
  Venezia: 'https://tmssl.akamaized.net/images/wappen/head/607.png',
};

const normalizeTeamName = (name?: string) => {
  if (!name) return '';

  const cleaned = name
    .replace(/\s+FC$/i, '')
    .replace(/\s+AC$/i, '')
    .replace(/\s+1907$/i, '')
    .replace(/\s+1908$/i, '')
    .trim();

  const aliases: Record<string, string> = {
    'Como 1907': 'Como',
    'Genoa CFC': 'Genoa',
    'Pisa Sporting Club': 'Pisa',
    'Hellas Verona': 'Verona',
  };

  return aliases[name] || aliases[cleaned] || cleaned;
};

const TeamLogo = ({
  name,
  className,
}: {
  logo?: string;
  name: string;
  className: string;
}) => {
  const [imgError, setImgError] = useState(false);

  const normalized = normalizeTeamName(name);
  const src = !imgError ? TEAM_LOGOS[normalized] || TEAM_LOGOS[name] || null : null;

  if (!src) {
    const short = (normalized || name || '?').substring(0, 3).toUpperCase();
    return (
      <img
        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(short)}&background=27272a&color=22d3ee&rounded=true&bold=true&font-size=0.4`}
        className={`${className} object-contain rounded-full`}
        alt={name}
      />
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${className} object-contain`}
      onError={() => setImgError(true)}
    />
  );
};



export default function ScoutHub() {
  const [activeTab, setActiveTab]           = useState('calendario');
  const [selectedRound, setSelectedRound]   = useState<number>(30);
  const [matches, setMatches]               = useState<any[]>([]);
  const [standings, setStandings]           = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingStandings, setLoadingStandings] = useState(true);
  const [matchError, setMatchError]         = useState<string | null>(null);
  const [modalFixture, setModalFixture]     = useState<any>(null);
  const [matchDetails, setMatchDetails]     = useState<any>(null);
  const [loadingModal, setLoadingModal]     = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/football?endpoint=standings')
      .then(r => r.json())
      .then(res => {
        const teams = res?.data?.teams || [];
        const parsed = teams.map((t: any) => {
          const getStat = (id: string) => {
            const s = t.stats?.find((x: any) => x.statsId === id);
            return s ? (parseInt(s.statsValue) || 0) : 0;
          };
          return {
            id:     t.teamId,
            name:   t.shortName || t.officialName || 'N/A',
            logo:   t.imagery?.teamLogo,
            points: getStat('points'),
            played: getStat('matches-played'),
            win:    getStat('win'),
            draw:   getStat('draw'),
            lose:   getStat('lose'),
            gd:     getStat('goal-difference'),
            gf:     getStat('goals-for'),
            ga:     getStat('goals-against'),
            form:   (t.stats?.find((x: any) => x.statsId === 'form')?.statsValue || []).map((f: any) => f.formType),
          };
        }).sort((a: any, b: any) => b.points - a.points || b.gd - a.gd);
        setStandings(parsed);
      })
      .catch(e => console.error('Standings error:', e))
      .finally(() => setLoadingStandings(false));
  }, []);

  const loadRound = useCallback(async (round: number) => {
    setLoadingMatches(true);
    setMatchError(null);
    setMatches([]);
    try {
      const res = await fetch(`/api/football?endpoint=matches&round=${round}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Errore sconosciuto');
      
      const rawMatches = json.data?.matches || [];
      const sortedMatches = [...rawMatches].sort((a: any, b: any) => {
        const da = new Date(a.matchDateUtc || a.matchDateLocal || 0).getTime();
        const db = new Date(b.matchDateUtc || b.matchDateLocal || 0).getTime();
        return da - db;
      });
      setMatches(sortedMatches);
    } catch (e: any) {
      setMatchError(e.message);
    } finally {
      setLoadingMatches(false);
    }
  }, []);


  useEffect(() => { loadRound(30); }, [loadRound]);

  const handleRoundChange = (r: number) => {
    setSelectedRound(r);
    loadRound(r);
  };

  useEffect(() => {
    if (scrollRef.current && activeTab === 'calendario') {
      setTimeout(() => {
        const btn = scrollRef.current?.querySelector('.active-round-btn');
        btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 150);
    }
  }, [selectedRound, activeTab]);

  const openMatch = async (m: any) => {
    setModalFixture(m);
    setMatchDetails(null);
    setLoadingModal(true);
    try {
      const matchId = m.matchId || m.id;
      const res = await fetch(`/api/football?endpoint=match&id=${encodeURIComponent(matchId)}`);
      const json = await res.json();
      setMatchDetails(json.ok ? json.data : null);
    } catch {
      setMatchDetails(null);
    } finally {
      setLoadingModal(false);
    }
  };

  const resolveTeam = (teamObj: any, fallback: string) => ({
    name: teamObj?.shortName || teamObj?.officialName || teamObj?.name || fallback,
    logo: teamObj?.imagery?.teamLogo || teamObj?.logo,
  });

  const FormDot = ({ type }: { type: string }) => {
    const colors: Record<string, string> = { W: 'bg-emerald-500', D: 'bg-zinc-400', L: 'bg-red-500' };
    return <span className={`w-2 h-2 rounded-full inline-block ${colors[type] || 'bg-zinc-600'}`} />;
  };

  const formatEventMinute = (ev: any) => {
    if (ev.additionalTime && ev.additionalTime > 0) {
      return `${ev.minute || ev.time}+${ev.additionalTime}'`;
    }
    return ev.minute || ev.time ? `${ev.minute || ev.time}'` : '';
  };

  const MatchTimeline = ({ detail, homeName, awayName }: any) => {
    let events: any[] = [];
    
    // Extract from events API
    if (detail.events?.events?.length > 0) {
      detail.events.events.forEach((ev: any) => {
        events.push({
          minuteRaw: ev.time || ev.minute || 0,
          additionalTime: ev.additionalTime || 0,
          minuteStr: formatEventMinute(ev),
          type: ev.type,
          player: ev.player?.shortName || ev.player?.officialName || 'Player',
          team: ev.teamId === detail.header?.homeTeam?.teamId ? 'home' : 'away',
          relatedId: ev.relatedPlayerId,
          subOn: ev.subOn?.shortName,
          subOff: ev.subOff?.shortName,
        });
      });
    } else {
      // Fallback from lineups
      const parseLineup = (players: any[], side: 'home' | 'away') => {
        players.forEach(p => {
          (p.events || []).forEach((ev: any) => {
            events.push({
              minuteRaw: ev.time || ev.minute || 0,
              additionalTime: ev.additionalTime || 0,
              minuteStr: formatEventMinute(ev),
              type: ev.type,
              player: p.player?.shortName || p.officialName || p.shortName || 'Player',
              playerId: p.playerId || p.id,
              team: side,
              subOff: ev.subOffPlayer?.shortName,
              relatedId: ev.relatedPlayerId
            });
          });
        });
      };
      if (detail.lineups?.home) {
        parseLineup(detail.lineups.home.fielded || [], 'home');
        parseLineup(detail.lineups.home.benched || [], 'home');
      }
      if (detail.lineups?.away) {
        parseLineup(detail.lineups.away.fielded || [], 'away');
        parseLineup(detail.lineups.away.benched || [], 'away');
      }
    }

    // Sort events
    events.sort((a, b) => {
      if (a.minuteRaw !== b.minuteRaw) return a.minuteRaw - b.minuteRaw;
      if (a.additionalTime !== b.additionalTime) return a.additionalTime - b.additionalTime;
      return 0;
    });

    // Merge substitutions
    const mergedEvents: any[] = [];
    const processedSubs = new Set();

    events.forEach(ev => {
      if (ev.type === 'substitution-in' || ev.type === 'substitution-out') {
        const relatedId = ev.relatedId;
        const key = `${ev.minuteRaw}-${ev.team}-${relatedId || ev.playerId}`;
        
        if (processedSubs.has(key)) return;

        const subIn = events.find(e => e.type === 'substitution-in' && e.minuteRaw === ev.minuteRaw && e.team === ev.team && (e.relatedId === relatedId || e.playerId === relatedId));
        const subOut = events.find(e => e.type === 'substitution-out' && e.minuteRaw === ev.minuteRaw && e.team === ev.team && (e.relatedId === relatedId || e.playerId === relatedId));

        if (subIn && subOut) {
          mergedEvents.push({
            minuteStr: ev.minuteStr,
            minuteRaw: ev.minuteRaw,
            additionalTime: ev.additionalTime,
            type: 'substitution',
            player: subIn.player,
            subOff: subOut.player,
            team: ev.team
          });
          processedSubs.add(key);
        } else {
           mergedEvents.push(ev);
        }
      } else {
        mergedEvents.push(ev);
      }
    });


    if (mergedEvents.length === 0) return <p className="text-center text-zinc-600 text-[10px] py-4 uppercase tracking-widest">Nessun evento registrato</p>;

    const getTypeLabel = (t: string) => {
      if (t.includes('goal')) return '⚽';
      if (t.includes('yellow')) return '🟨';
      if (t.includes('red')) return '🟥';
      if (t.includes('substitution')) return '🔄';
      return '•';
    };

    return (
      <div className="space-y-3 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
        {mergedEvents.map((ev, i) => (
          <div key={i} className="flex items-start gap-4 text-xs relative" style={{ paddingLeft: '8px' }}>
            <span className="w-8 text-[9px] font-black text-cyan-400 mt-0.5 text-right">{ev.minuteStr}</span>
            <div className={`mt-0.5 w-4 h-4 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[8px] z-10 shrink-0`}>
              {getTypeLabel(ev.type)}
            </div>
            <div className="flex-1">
              <span className={`font-bold ${ev.team === 'home' ? 'text-white' : 'text-zinc-400'}`}>{ev.player}</span>
              {(ev.type.includes('substitution') || ev.subOff) && ev.subOff && (
                <span className="text-zinc-500 text-[10px] ml-2 italic">per {ev.subOff}</span>
              )}
              <div className="text-[9px] text-zinc-600 uppercase tracking-tighter mt-0.5">
                {ev.team === 'home' ? homeName : awayName}
                {ev.type === 'penalty-goal' && ' (Rigore)'}
                {ev.type === 'own-goal' && ' (Autogol)'}
                {ev.type === 'missed-penalty' && ' (Rigore fallito)'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getPlayerPosition = (p: any, roleIndex: number, totalInRole: number) => {
    // Valid coordinates check
    if (typeof p.tacticalXPosition === 'number' && typeof p.tacticalYPosition === 'number') {
       return {
         left: `${p.tacticalXPosition * 100}%`,
         top: `${(1 - p.tacticalYPosition) * 100}%` // Inverse Y to match logical pitch top-down
       };
    }

    // Role-based fallback
    const roleMap: any = { 1: 85, 2: 70, 3: 40, 4: 15 }; // Y percentages
    const yPos = roleMap[p.role] || 50;
    
    // Spread horizontally
    const xPos = totalInRole > 1 
      ? 10 + ((80 / (totalInRole - 1)) * roleIndex)
      : 50;

    return { left: `${xPos}%`, top: `${yPos}%` };
  };

  const TacticalPitch = ({ lineup, side }: any) => {
    if (!lineup?.fielded || lineup.fielded.length === 0) {
       return <p className="text-center text-zinc-500 text-[10px] py-4 uppercase">Formazione non comunicata</p>;
    }

    // Group by role for fallback positioning
    const roles: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
    lineup.fielded.forEach((p: any) => {
      if (roles[p.role]) roles[p.role].push(p);
      else roles[3].push(p); // default to mid
    });

    return (
      <div className="mt-4">
        {lineup.coach?.shortName && (
          <p className="text-[9px] text-zinc-500 uppercase text-center mb-3">All: <span className="text-zinc-300">{lineup.coach.shortName}</span></p>
        )}
        <div className="relative w-full h-[320px] md:h-[420px] bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-4 border border-white rounded-lg" />
            <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white -translate-x-1/2" />
            <div className="absolute left-1/2 top-1/2 w-20 h-20 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute left-1/2 top-4 w-32 h-16 border border-white -translate-x-1/2" />
            <div className="absolute left-1/2 bottom-4 w-32 h-16 border border-white -translate-x-1/2" />
          </div>
          
          {lineup.fielded.map((p: any) => {
            const roleArray = roles[p.role] || roles[3];
            const roleIndex = roleArray.findIndex(x => x.playerId === p.playerId);
            const pos = getPlayerPosition(p, roleIndex, roleArray.length);

            // Invert Y for away team so they face each other visually
            const topStr = side === 'away' ? `${100 - parseFloat(pos.top)}%` : pos.top;

            // Find key events
            const goals = p.events?.filter((e: any) => e.type.includes('goal')).length || 0;
            const yellow = p.events?.some((e: any) => e.type === 'yellow-card' || e.type === 'second-yellow');
            const red = p.events?.some((e: any) => e.type === 'red-card');

            return (
              <div key={p.playerId || p.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 w-16" style={{ left: pos.left, top: topStr }}>
                <div className="relative">
                  <div className={`w-7 h-7 rounded-full bg-zinc-800 border-2 ${side === 'home' ? 'border-cyan-400' : 'border-white'} flex items-center justify-center text-[10px] font-black shadow-lg`}>
                    {p.jerseyNumber}
                  </div>
                  {/* Event Badges */}
                  <div className="absolute -top-1 -right-4 flex gap-0.5">
                    {goals > 0 && Array(goals).fill(0).map((_, i) => <span key={i} className="text-[8px]">⚽</span>)}
                    {red ? <div className="w-2 h-3 bg-red-500 rounded-sm border border-red-700" /> : yellow ? <div className="w-2 h-3 bg-yellow-400 rounded-sm border border-yellow-600" /> : null}
                  </div>
                </div>
                <span className="text-[8px] font-bold text-white whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded truncate max-w-full text-center">
                  {p.player?.shortName || p.shortName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const extractStatMap = (statsPayload: any) => {
    if (!statsPayload || (!statsPayload.homeTeamStats && !statsPayload.awayTeamStats)) return null;
    
    const map: any = {};
    const processTeam = (teamStats: any[], side: 'home' | 'away') => {
       if (!teamStats) return;
       teamStats.forEach(s => {
         const id = s.statsId || s.id;
         if (!id) return;
         if (!map[id]) map[id] = { label: s.label || id, home: 0, away: 0 };
         map[id][side] = parseFloat(s.value) || 0;
       });
    };

    processTeam(statsPayload.homeTeamStats, 'home');
    processTeam(statsPayload.awayTeamStats, 'away');

    // Expected keys mapping
    const findStat = (aliases: string[], label: string) => {
       for (const a of aliases) {
         if (map[a]) return { ...map[a], label, isPercent: map[a].home > 100 || map[a].away > 100 ? false : a.toLowerCase().includes('percentage') || a.toLowerCase().includes('perc') };
       }
       return null;
    };

    const result = [
      findStat(['possession', 'possession-percentage', 'possessionPercentage'], 'Possesso Palla'),
      findStat(['expected-goals', 'expectedGoals'], 'Expected Goals (xG)'),
      findStat(['shots', 'total-shots', 'totalScoringAtt'], 'Tiri Totali'),
      findStat(['shots-on-target', 'ontargetScoringAtt'], 'Tiri in Porta'),
      findStat(['big-chances', 'bigChanceCreated'], 'Grandi Occasioni'),
      findStat(['passes', 'totalPass'], 'Passaggi'),
      findStat(['accurate-pass-percentage', 'accuratePassPercentage'], 'Precisione Passaggi'),
      findStat(['corners', 'cornerTaken'], 'Calci d\'Angolo'),
      findStat(['offsides', 'offside'], 'Fuorigioco'),
      findStat(['saves', 'totalSaves'], 'Parate'),
      findStat(['fouls', 'foulsCommitted'], 'Falli'),
      findStat(['yellow-cards', 'totalYellowCard'], 'Ammonizioni'),
      findStat(['red-cards', 'totalRedCard'], 'Espulsioni'),
    ].filter(Boolean);

    return result.length >= 4 ? result : null;
  };




  return (
    <div className="min-h-screen bg-black text-white p-4 pt-24 font-sans selection:bg-cyan-500/30">
      <div className="max-w-5xl mx-auto">

        {/* TAB switcher */}
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl mb-8 max-w-xs mx-auto border border-white/5 shadow-2xl">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
                ${activeTab === t ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="text-center mb-10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 bg-cyan-400/5 px-4 py-1.5 rounded-full border border-cyan-400/10">
            Stagione 2025/2026
          </span>
        </div>


        {/* ===== CALENDARIO ===== */}
        {activeTab === 'calendario' && (
          <div className="space-y-6">
            <div ref={scrollRef} className="flex overflow-x-auto gap-2 pb-4 no-scrollbar scroll-smooth">
              {Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1).map(r => (
                <button key={r} onClick={() => handleRoundChange(r)}
                  className={`px-5 py-2 rounded-xl shrink-0 font-bold text-xs border transition-all duration-300
                    ${selectedRound === r
                      ? 'active-round-btn border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                      : 'border-white/5 text-zinc-600 hover:border-white/20 hover:text-zinc-300'}`}>
                  G.{r}
                </button>
              ))}
            </div>

            {loadingMatches ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : matchError ? (
              <div className="bg-red-900/20 border border-red-500/30 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-2 text-xs uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4" /> Errore caricamento
                </div>
                <p className="text-zinc-400 text-xs font-mono">{matchError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((m: any, idx: number) => {
                  const home = resolveTeam(m.homeTeam || m.home, 'Casa');
                  const away = resolveTeam(m.awayTeam || m.away, 'Ospite');
                  const hs = m.providerHomeScore ?? m.homeScore;
                  const as_ = m.providerAwayScore ?? m.awayScore;
                  const played = hs !== null && hs !== undefined;
                  return (
                    <div key={m.matchId || m.id || idx} onClick={() => openMatch(m)}
                      className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-zinc-800/60 hover:border-cyan-500/20 transition-all group shadow-lg">
                      <div className="flex items-center gap-3 w-[42%]">
                        <TeamLogo logo={home.logo} name={home.name} className="w-9 h-9 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{home.name}</span>
                      </div>
                      <div className={`text-center font-black italic text-sm tracking-tighter min-w-[60px] ${played ? 'text-white' : 'text-cyan-400'}`}>
                        {played ? `${hs} - ${as_}` : 'VS'}
                      </div>
                      <div className="flex items-center gap-3 w-[42%] justify-end text-right">
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{away.name}</span>
                        <TeamLogo logo={away.logo} name={away.name} className="w-9 h-9 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== CLASSIFICA ===== */}
        {activeTab === 'classifica' && (
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-4 md:p-8 border border-white/5 backdrop-blur-sm shadow-2xl overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-12 items-center py-2 px-4 text-[9px] font-black uppercase text-zinc-500 border-b border-white/10 mb-1 tracking-widest">
                <span className="col-span-1 text-center">#</span>
                <span className="col-span-4">Squadra</span>
                <span className="col-span-1 text-center text-cyan-400">PTS</span>
                <span className="col-span-1 text-center">G</span>
                <span className="col-span-1 text-center text-emerald-500">V</span>
                <span className="col-span-1 text-center">N</span>
                <span className="col-span-1 text-center text-red-500">P</span>
                <span className="col-span-1 text-center">DR</span>
                <span className="col-span-1 text-center">Forma</span>
              </div>


              {loadingStandings ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
              ) : standings.map((t: any, i: number) => {
                const isZone = i < 4 ? 'border-l-2 border-cyan-500' : i < 6 ? 'border-l-2 border-orange-400' : i >= 17 ? 'border-l-2 border-red-500' : '';
                return (
                  <div
                    key={t.id}
                    className={`grid grid-cols-12 items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-4 rounded-xl transition-all group ${isZone}`}
                  >
                    <span className="col-span-1 text-center text-[11px] font-black text-zinc-600 group-hover:text-cyan-500">
                      {i + 1}
                    </span>

                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <TeamLogo name={t.name} className="w-7 h-7 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-tight truncate">
                        {t.name}
                      </span>
                    </div>

                    <span className="col-span-1 text-center font-black text-cyan-400 text-sm">
                      {t.points}
                    </span>

                    <span className="col-span-1 text-center text-xs font-mono text-white/70">
                      {t.played}
                    </span>
                    <span className="col-span-1 text-center text-xs font-mono text-emerald-400">
                      {t.win}
                    </span>
                    <span className="col-span-1 text-center text-xs font-mono text-zinc-400">
                      {t.draw}
                    </span>
                    <span className="col-span-1 text-center text-xs font-mono text-red-400">
                      {t.lose}
                    </span>
                    <span className="col-span-1 text-center text-xs font-mono font-bold text-white/60">
                      {t.gd > 0 ? `+${t.gd}` : t.gd}
                    </span>

                    <div className="col-span-1 flex justify-center gap-0.5">
                      {(t.form || []).slice(-3).map((f: string, fi: number) => (
                        <FormDot key={fi} type={f} />
                      ))}
                    </div>
                  </div>
                );


              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL PARTITA ===== */}
      <Dialog.Root open={!!modalFixture} onOpenChange={() => { setModalFixture(null); setMatchDetails(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080808] border border-white/10 rounded-[3rem] w-[95vw] max-w-xl z-[101] overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            <Dialog.Title className="sr-only">Dettagli Partita</Dialog.Title>
            <Dialog.Description className="sr-only">
              Dettagli e statistiche della partita selezionata
            </Dialog.Description>


            {modalFixture && (() => {
              const home = resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa');
              const away = resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite');
              const hs = modalFixture.providerHomeScore ?? modalFixture.homeScore ?? '-';
              const as_ = modalFixture.providerAwayScore ?? modalFixture.awayScore ?? '-';
              return (
                <div className="p-8 bg-white/5 border-b border-white/5 flex flex-col items-center gap-4">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col items-center gap-2 w-1/3">
                      <TeamLogo logo={home.logo} name={home.name} className="w-14 h-14" />
                      <span className="text-[10px] uppercase text-zinc-400 font-black tracking-widest text-center">{home.name}</span>
                    </div>
                    <div className="text-5xl font-black italic tracking-tighter text-white">{hs} – {as_}</div>
                    <div className="flex flex-col items-center gap-2 w-1/3">
                      <TeamLogo logo={away.logo} name={away.name} className="w-14 h-14" />
                      <span className="text-[10px] uppercase text-zinc-400 font-black tracking-widest text-center">{away.name}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-5 custom-scrollbar bg-black/40">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Caricamento dettagli...</p>
                </div>
              ) : matchDetails ? (
                <>
                  {/* ====== EVENTI ====== */}
                  <section className="bg-zinc-900/60 rounded-3xl p-5 md:p-6 border border-white/5 shadow-lg backdrop-blur-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                       Timeline Match
                    </h3>
                    <MatchTimeline detail={matchDetails} homeName={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} awayName={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} />
                  </section>

                  {/* ====== STATISTICHE ====== */}
                  {(() => {
                    const statsMap = extractStatMap(matchDetails.stats);
                    if (!statsMap) return null;
                    return (
                      <section className="bg-zinc-900/60 rounded-3xl p-5 md:p-6 border border-white/5 shadow-lg backdrop-blur-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">Statistiche Partita</h3>
                        <div className="space-y-5">
                          {statsMap.map((stat: any, i: number) => {
                            const total = stat.home + stat.away || 1;
                            const hPerc = stat.isPercent ? stat.home : (stat.home / total) * 100;
                            const aPerc = stat.isPercent ? stat.away : (stat.away / total) * 100;
                            return (
                              <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-end text-[10px] font-bold text-zinc-400 px-1">
                                  <span className={`w-8 ${stat.home > stat.away ? 'text-cyan-400' : 'text-white'}`}>{stat.home}{stat.isPercent ? '%' : ''}</span>
                                  <span className="uppercase tracking-[0.1em] opacity-40 flex-1 text-center">{stat.label}</span>
                                  <span className={`w-8 text-right ${stat.away > stat.home ? 'text-cyan-400' : 'text-white'}`}>{stat.away}{stat.isPercent ? '%' : ''}</span>
                                </div>
                                <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-white/5">
                                  <div className="bg-cyan-400 h-full transition-all duration-700 rounded-r-full" style={{ width: `${hPerc}%` }} />
                                  <div className="bg-zinc-600 h-full transition-all duration-700 rounded-l-full" style={{ width: `${aPerc}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })()}

                  {/* ====== FORMAZIONI ====== */}
                  {matchDetails.lineups && (
                    <section className="bg-zinc-900/60 rounded-3xl p-5 md:p-6 border border-white/5 shadow-lg backdrop-blur-sm">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">Formazioni Titolari</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center gap-2 justify-center mb-1">
                             <TeamLogo logo={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').logo} name={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} className="w-5 h-5" />
                             <p className="text-[10px] font-black text-cyan-400 uppercase">{resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name}</p>
                          </div>
                          <TacticalPitch lineup={matchDetails.lineups.home} side="home" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 justify-center mb-1">
                             <TeamLogo logo={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').logo} name={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} className="w-5 h-5" />
                             <p className="text-[10px] font-black text-white uppercase">{resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name}</p>
                          </div>
                          <TacticalPitch lineup={matchDetails.lineups.away} side="away" />
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ====== PANCHINE E CAMBI ====== */}
                  {matchDetails.lineups && (
                    <section className="bg-zinc-900/60 rounded-3xl p-5 md:p-6 border border-white/5 shadow-lg backdrop-blur-sm">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 text-center">Panchina e Sostituzioni</h3>
                      <div className="grid grid-cols-2 gap-8 divide-x divide-white/10">
                         <div className="space-y-3 pr-4">
                           <p className="text-[9px] font-black text-cyan-400/50 uppercase mb-4 text-center">Casa</p>
                           {(matchDetails.lineups?.home?.benched || [])
                             .sort((a: any, b: any) => {
                               const aIn = a.events?.some((e: any) => e.type === 'substitution-in');
                               const bIn = b.events?.some((e: any) => e.type === 'substitution-in');
                               return aIn === bIn ? 0 : aIn ? -1 : 1;
                             })
                             .map((p: any) => {
                             const subInEvent = p.events?.find((e: any) => e.type === 'substitution-in');
                             return (
                               <div key={p.playerId || p.id} className="flex items-start justify-between text-[10px] pb-2 border-b border-white/5 last:border-0 last:pb-0">
                                 <div>
                                   <span className={`block w-[80px] md:w-auto truncate ${subInEvent ? 'text-white font-bold' : 'text-zinc-500'}`}>{p.player?.shortName || p.shortName}</span>
                                   {subInEvent && <span className="text-[8px] text-zinc-500 italic block mt-0.5">Entra {formatEventMinute(subInEvent)}</span>}
                                 </div>
                                 <div className="flex items-center gap-1 shrink-0">
                                   {p.events?.some((e: any) => e.type === 'red-card') && <span className="text-[8px]">🟥</span>}
                                   {p.events?.some((e: any) => e.type === 'yellow-card') && <span className="text-[8px]">🟨</span>}
                                   {p.events?.some((e: any) => e.type.includes('goal')) && <span className="text-[8px]">⚽</span>}
                                   {subInEvent && <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold ml-1">IN</span>}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                         <div className="space-y-3 pl-4">
                           <p className="text-[9px] font-black text-white/50 uppercase mb-4 text-center">Trasferta</p>
                           {(matchDetails.lineups?.away?.benched || [])
                             .sort((a: any, b: any) => {
                               const aIn = a.events?.some((e: any) => e.type === 'substitution-in');
                               const bIn = b.events?.some((e: any) => e.type === 'substitution-in');
                               return aIn === bIn ? 0 : aIn ? -1 : 1;
                             })
                             .map((p: any) => {
                             const subInEvent = p.events?.find((e: any) => e.type === 'substitution-in');
                             return (
                               <div key={p.playerId || p.id} className="flex items-start justify-between text-[10px] flex-row-reverse pb-2 border-b border-white/5 last:border-0 last:pb-0">
                                 <div className="text-right">
                                   <span className={`block w-[80px] md:w-auto truncate ${subInEvent ? 'text-white font-bold' : 'text-zinc-500'}`}>{p.player?.shortName || p.shortName}</span>
                                   {subInEvent && <span className="text-[8px] text-zinc-500 italic block mt-0.5">Entra {formatEventMinute(subInEvent)}</span>}
                                 </div>
                                 <div className="flex items-center gap-1 shrink-0 flex-row-reverse">
                                   {p.events?.some((e: any) => e.type === 'red-card') && <span className="text-[8px]">🟥</span>}
                                   {p.events?.some((e: any) => e.type === 'yellow-card') && <span className="text-[8px]">🟨</span>}
                                   {p.events?.some((e: any) => e.type.includes('goal')) && <span className="text-[8px]">⚽</span>}
                                   {subInEvent && <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold mr-1">IN</span>}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <div className="bg-zinc-900/60 rounded-3xl p-10 border border-white/5 flex flex-col items-center justify-center">
                  <p className="text-center text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                    Dati non ancora disponibili per questo match
                  </p>
                </div>
              )}
            </div>



            <button onClick={() => { setModalFixture(null); setMatchDetails(null); }}
              className="absolute top-6 right-6 p-2.5 bg-zinc-900/80 rounded-full border border-white/10 hover:bg-red-500 hover:border-red-500 transition-all">
              <X className="w-4 h-4" />
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
