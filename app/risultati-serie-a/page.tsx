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
  logo,
  name,
  className,
  teamId,
}: {
  logo?: string;
  name: string;
  className: string;
  teamId?: string | number;
}) => {
  const [imgError, setImgError] = useState(false);

  // 1. Try the logo provided directly from the API object
  // Cremonese teamId is typically 1511 in some contexts, but let's be generic
  let src = !imgError ? logo : null;

  // 2. Fallback to local mapping if API logo fails or is missing
  if (!src) {
    const normalized = normalizeTeamName(name);
    src = !imgError ? TEAM_LOGOS[normalized] || TEAM_LOGOS[name] || null : null;
  }

  if (!src) {
    const short = (normalizeTeamName(name) || name || '?').substring(0, 3).toUpperCase();
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
      onError={() => {
        console.warn(`Logo load failed for ${name} (${teamId}), fallback triggered.`);
        setImgError(true);
      }}
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

  const resolveTeam = (teamObj: any, fallback: string) => {
    const team = {
      id:   teamObj?.teamId || teamObj?.id,
      name: teamObj?.shortName || teamObj?.officialName || teamObj?.name || fallback,
      logo: teamObj?.imagery?.teamLogo || teamObj?.logo || teamObj?.teamLogo || teamObj?.teamImage,
    };
    return team;
  };

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
    let rawEvents: any[] = [];
    
    // 1. Extract from events API
    if (detail.events?.events?.length > 0) {
      detail.events.events.forEach((ev: any) => {
        rawEvents.push({
          minuteRaw:      ev.time || ev.minute || 0,
          additionalTime: ev.additionalTime || 0,
          type:           ev.type,
          player:         ev.player?.shortName || ev.player?.officialName || 'Player',
          playerId:       ev.playerId || ev.player?.playerId,
          team:           ev.teamId === detail.header?.homeTeam?.teamId ? 'home' : 'away',
          relatedId:      ev.relatedPlayerId || ev.subOff?.playerId || ev.subOn?.playerId,
          subOn:          ev.subOn?.shortName,
          subOff:         ev.subOff?.shortName,
        });
      });
    } else {
      // 2. Fallback from lineups
      const parseLineup = (players: any[], side: 'home' | 'away') => {
        players.forEach(p => {
          (p.events || []).forEach((ev: any) => {
            rawEvents.push({
              minuteRaw:      ev.time || ev.minute || 0,
              additionalTime: ev.additionalTime || 0,
              type:           ev.type,
              player:         p.player?.shortName || p.officialName || p.shortName || 'Player',
              playerId:       p.playerId || p.id,
              team:           side,
              relatedId:      ev.relatedPlayerId || ev.subOffPlayer?.playerId,
              subOff:         ev.subOffPlayer?.shortName || ev.relatedPlayerName
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

    // Sort by minute
    rawEvents.sort((a, b) => {
      if (a.minuteRaw !== b.minuteRaw) return a.minuteRaw - b.minuteRaw;
      return (a.additionalTime || 0) - (b.additionalTime || 0);
    });

    // 3. Merge substitutions logic
    const mergedEvents: any[] = [];
    const consumed = new Set<number>();

    rawEvents.forEach((ev, idx) => {
      if (consumed.has(idx)) return;

      if (ev.type === 'substitution-in' || ev.type === 'substitution-out') {
        // Try to find the counterpart (in/out at same minute for same team)
        const counterpartIdx = rawEvents.findIndex((other, oIdx) => 
          oIdx > idx &&
          !consumed.has(oIdx) &&
          (other.type === 'substitution-in' || other.type === 'substitution-out') &&
          other.type !== ev.type &&
          other.minuteRaw === ev.minuteRaw &&
          other.team === ev.team &&
          (other.playerId === ev.relatedId || ev.playerId === other.relatedId || other.relatedId === ev.relatedId)
        );

        if (counterpartIdx !== -1) {
          const other = rawEvents[counterpartIdx];
          const subIn = ev.type === 'substitution-in' ? ev : other;
          const subOut = ev.type === 'substitution-out' ? ev : other;
          
          mergedEvents.push({
            ...subIn,
            type: 'substitution',
            player: subIn.player,
            subOff: subOut.player,
            minuteStr: formatEventMinute(subIn)
          });
          consumed.add(idx);
          consumed.add(counterpartIdx);
        } else {
          // Single event if no counterpart found
          mergedEvents.push({ ...ev, minuteStr: formatEventMinute(ev) });
          consumed.add(idx);
        }
      } else {
        mergedEvents.push({ ...ev, minuteStr: formatEventMinute(ev) });
        consumed.add(idx);
      }
    });

    if (mergedEvents.length === 0) {
      return (
        <div className="py-10 text-center">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Nessun evento registrato</p>
        </div>
      );
    }

    const getTypeLabel = (t: string) => {
      if (t.includes('goal')) return '⚽';
      if (t.includes('yellow')) return '🟨';
      if (t.includes('red')) return '🟥';
      if (t.includes('substitution')) return '🔄';
      return '•';
    };

    return (
      <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
        {mergedEvents.map((ev, i) => (
          <div key={i} className="flex items-start gap-5 text-xs relative" style={{ paddingLeft: '8px' }}>
            <span className="w-10 text-[10px] font-black text-cyan-400 mt-0.5 text-right shrink-0">{ev.minuteStr}</span>
            <div className="mt-0.5 w-5 h-5 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] z-10 shrink-0">
              {getTypeLabel(ev.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`font-black text-sm ${ev.team === 'home' ? 'text-white' : 'text-zinc-400'}`}>{ev.player}</span>
                {ev.subOff && (
                  <span className="text-zinc-500 text-[11px] italic">per {ev.subOff}</span>
                )}
              </div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1 font-bold">
                {ev.team === 'home' ? homeName : awayName}
                {ev.type === 'penalty-goal' && ' • RIGORE'}
                {ev.type === 'own-goal' && ' • AUTOGOL'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getPlayerPosition = (p: any, roleIndex: number, totalInRole: number) => {
    // 1. Precise coordinates from API
    if (typeof p.tacticalXPosition === 'number' && typeof p.tacticalYPosition === 'number') {
       return {
         left: `${p.tacticalXPosition * 100}%`,
         top:  `${(1 - p.tacticalYPosition) * 100}%`
       };
    }

    // 2. Role-based fallback (Goal, Def, Mid, Fwd)
    const roleMap: Record<number, number> = { 1: 90, 2: 70, 3: 42, 4: 18 };
    const yPos = roleMap[p.role] || 50;
    
    // Spread horizontally across 80% of width
    const xPos = totalInRole > 1 
      ? 12 + ((76 / (totalInRole - 1)) * roleIndex)
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
    // Debug logging to help identify statsId names
    if (statsPayload) {
      const ids = [...(statsPayload.homeTeamStats || []), ...(statsPayload.awayTeamStats || [])].map(s => s.statsId || s.id);
      if (ids.length > 0) console.log('MATCH STATS IDS:', [...new Set(ids)]);
    }

    if (!statsPayload || (!statsPayload.homeTeamStats && !statsPayload.awayTeamStats)) return null;
    
    const map: Record<string, any> = {};
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

    // Expected keys mapping with aliases
    const findStat = (aliases: string[], label: string) => {
       for (const a of aliases) {
         if (map[a]) {
           const isPercent = map[a].home > 100 || map[a].away > 100 ? false : (a.toLowerCase().includes('percentage') || a.toLowerCase().includes('perc') || String(map[a].label).includes('%'));
           return { ...map[a], label, isPercent };
         }
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

    // If no mapped stats found, try to use ALL available stats as fallback if any exist
    if (result.length < 3 && Object.keys(map).length > 0) {
      return Object.values(map).slice(0, 10).map(s => ({ ...s, isPercent: false }));
    }

    return result.length >= 3 ? result : null;
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
                      <div className="flex items-center gap-4 w-[42%]">
                        <TeamLogo logo={home.logo} name={home.name} teamId={m.homeTeam?.teamId || m.home?.id} className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{home.name}</span>
                      </div>
                      <div className={`text-center font-black italic text-base tracking-tighter min-w-[70px] ${played ? 'text-white' : 'text-cyan-400'}`}>
                        {played ? `${hs} - ${as_}` : 'VS'}
                      </div>
                      <div className="flex items-center gap-4 w-[42%] justify-end text-right">
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{away.name}</span>
                        <TeamLogo logo={away.logo} name={away.name} teamId={m.awayTeam?.teamId || m.away?.id} className="w-10 h-10 group-hover:scale-110 transition-transform" />
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

                    <div className="col-span-4 flex items-center gap-4 min-w-0">
                      <TeamLogo name={t.name} teamId={t.id} className="w-8 h-8 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-tight truncate group-hover:text-cyan-400">
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
                    <div className="flex flex-col items-center gap-3 w-1/3">
                      <TeamLogo logo={home.logo} name={home.name} teamId={home.id} className="w-16 h-16 shadow-2xl" />
                      <span className="text-[11px] uppercase text-zinc-400 font-black tracking-widest text-center">{home.name}</span>
                    </div>
                    <div className="text-6xl font-black italic tracking-tighter text-white drop-shadow-2xl">{hs} – {as_}</div>
                    <div className="flex flex-col items-center gap-3 w-1/3">
                      <TeamLogo logo={away.logo} name={away.name} teamId={away.id} className="w-16 h-16 shadow-2xl" />
                      <span className="text-[11px] uppercase text-zinc-400 font-black tracking-widest text-center">{away.name}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 md:space-y-12 custom-scrollbar bg-black/60">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Caricamento dettagli...</p>
                </div>
              ) : matchDetails ? (
                <>
                  {/* ====== EVENTI ====== */}
                  <section className="bg-zinc-900/40 rounded-[2.5rem] p-6 md:p-10 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-8 flex items-center gap-3">
                       <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                       Timeline Match
                    </h3>
                    <MatchTimeline detail={matchDetails} homeName={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} awayName={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} />
                  </section>

                  {/* ====== STATISTICHE ====== */}
                  {(() => {
                    const statsMap = extractStatMap(matchDetails.stats);
                    if (!statsMap) return null;
                    return (
                      <section className="bg-zinc-900/40 rounded-[2.5rem] p-6 md:p-10 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-8 flex items-center gap-3">
                           <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                           Statistiche Partita
                        </h3>
                        <div className="space-y-7">
                          {statsMap.map((stat: any, i: number) => {
                            const total = stat.home + stat.away || 1;
                            const hPerc = stat.isPercent ? stat.home : (stat.home / total) * 100;
                            const aPerc = stat.isPercent ? stat.away : (stat.away / total) * 100;
                            return (
                              <div key={i} className="space-y-2.5">
                                <div className="flex justify-between items-end text-[10px] font-black text-zinc-400 px-1">
                                  <span className={`w-12 text-base ${stat.home > stat.away ? 'text-cyan-400' : 'text-white'}`}>{stat.home}{stat.isPercent ? '%' : ''}</span>
                                  <span className="uppercase tracking-[0.2em] opacity-60 flex-1 text-center text-[9px]">{stat.label}</span>
                                  <span className={`w-12 text-right text-base ${stat.away > stat.home ? 'text-cyan-400' : 'text-white'}`}>{stat.away}{stat.isPercent ? '%' : ''}</span>
                                </div>
                                <div className="flex gap-1.5 h-2 rounded-full overflow-hidden bg-white/5 border border-white/5">
                                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full transition-all duration-1000 rounded-full" style={{ width: `${hPerc}%` }} />
                                  <div className="bg-gradient-to-l from-zinc-500 to-zinc-700 h-full transition-all duration-1000 rounded-full" style={{ width: `${aPerc}%` }} />
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
                    <section className="bg-zinc-900/40 rounded-[2.5rem] p-6 md:p-10 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-white/20" />
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8 flex items-center gap-3">
                         <span className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                         Formazioni Titolari
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 justify-center bg-white/5 py-2 rounded-2xl border border-white/5">
                             <TeamLogo logo={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').logo} name={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} teamId={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').id} className="w-6 h-6" />
                             <p className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">{resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name}</p>
                          </div>
                          <TacticalPitch lineup={matchDetails.lineups.home} side="home" />
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 justify-center bg-white/5 py-2 rounded-2xl border border-white/5">
                             <TeamLogo logo={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').logo} name={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} teamId={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').id} className="w-6 h-6" />
                             <p className="text-[11px] font-black text-white uppercase tracking-widest">{resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name}</p>
                          </div>
                          <TacticalPitch lineup={matchDetails.lineups.away} side="away" />
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ====== PANCHINE E CAMBI ====== */}
                  {matchDetails.lineups && (
                    <section className="bg-zinc-900/40 rounded-[2.5rem] p-6 md:p-10 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50" />
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400 mb-10 text-center flex items-center justify-center gap-3">
                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                        Panchina e Sostituzioni
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 divide-y md:divide-y-0 md:divide-x divide-white/10">
                         <div className="space-y-5 pr-0 md:pr-6 pb-8 md:pb-0">
                           <div className="flex items-center gap-2 mb-4">
                             <TeamLogo logo={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').logo} name={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} teamId={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').id} className="w-5 h-5" />
                             <p className="text-[10px] font-black text-cyan-400/80 uppercase tracking-widest">Casa</p>
                           </div>
                           {(matchDetails.lineups?.home?.benched || [])
                             .sort((a: any, b: any) => {
                               const aIn = a.events?.some((e: any) => e.type === 'substitution-in');
                               const bIn = b.events?.some((e: any) => e.type === 'substitution-in');
                               return aIn === bIn ? 0 : aIn ? -1 : 1;
                             })
                             .map((p: any) => {
                             const subInEvent = p.events?.find((e: any) => e.type === 'substitution-in');
                             return (
                               <div key={p.playerId || p.id} className="flex items-start justify-between text-[11px] pb-3 border-b border-white/5 last:border-0 last:pb-0 group">
                                 <div className="min-w-0 flex-1">
                                   <span className={`block truncate transition-colors ${subInEvent ? 'text-white font-black' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{p.player?.shortName || p.shortName}</span>
                                   {subInEvent && <span className="text-[9px] text-zinc-500 italic block mt-1 font-bold">Entra {formatEventMinute(subInEvent)}</span>}
                                 </div>
                                 <div className="flex items-center gap-2 shrink-0 ml-4">
                                   {p.events?.some((e: any) => e.type === 'red-card') && <span className="text-[10px]">🟥</span>}
                                   {p.events?.some((e: any) => e.type === 'yellow-card') && <span className="text-[10px]">🟨</span>}
                                   {p.events?.some((e: any) => e.type.includes('goal')) && <span className="text-[10px]">⚽</span>}
                                   {subInEvent && <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/20 shadow-sm">IN</span>}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                         <div className="space-y-5 pl-0 md:pl-6 pt-8 md:pt-0">
                           <div className="flex items-center gap-2 mb-4 justify-end">
                             <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">Trasferta</p>
                             <TeamLogo logo={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').logo} name={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} teamId={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').id} className="w-5 h-5" />
                           </div>
                           {(matchDetails.lineups?.away?.benched || [])
                             .sort((a: any, b: any) => {
                               const aIn = a.events?.some((e: any) => e.type === 'substitution-in');
                               const bIn = b.events?.some((e: any) => e.type === 'substitution-in');
                               return aIn === bIn ? 0 : aIn ? -1 : 1;
                             })
                             .map((p: any) => {
                             const subInEvent = p.events?.find((e: any) => e.type === 'substitution-in');
                             return (
                               <div key={p.playerId || p.id} className="flex items-start justify-between flex-row-reverse text-[11px] pb-3 border-b border-white/5 last:border-0 last:pb-0 group">
                                 <div className="min-w-0 flex-1 text-right">
                                   <span className={`block truncate transition-colors ${subInEvent ? 'text-white font-black' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{p.player?.shortName || p.shortName}</span>
                                   {subInEvent && <span className="text-[9px] text-zinc-500 italic block mt-1 font-bold">Entra {formatEventMinute(subInEvent)}</span>}
                                 </div>
                                 <div className="flex items-center gap-2 shrink-0 mr-4 flex-row-reverse">
                                   {p.events?.some((e: any) => e.type === 'red-card') && <span className="text-[10px]">🟥</span>}
                                   {p.events?.some((e: any) => e.type === 'yellow-card') && <span className="text-[10px]">🟨</span>}
                                   {p.events?.some((e: any) => e.type.includes('goal')) && <span className="text-[10px]">⚽</span>}
                                   {subInEvent && <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/20 shadow-sm">IN</span>}
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
                <div className="bg-zinc-900/40 rounded-[2.5rem] p-16 border border-white/10 flex flex-col items-center justify-center backdrop-blur-xl shadow-2xl">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                     <AlertTriangle className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-center text-zinc-500 text-[11px] uppercase tracking-[0.3em] font-black">
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
