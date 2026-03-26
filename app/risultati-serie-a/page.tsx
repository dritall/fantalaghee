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

const getDisplayPlayerName = (p: any) => {
  if (!p) return 'Player';
  const player = p.player || p;
  
  // User wants short names. Prioritize last names / shirt names.
  let name = player.mediaLastName || player.shirtName || player.displayName;
  
  // Fallback to shortName if primary ones are missing or too long
  if (!name || (name.length > 15 && (player.shortName || player.officialName))) {
    name = player.shortName || player.officialName || 'Player';
  }

  // Cleanup: Common string artifacts
  name = name.replace(/\.\.\./g, '').trim();
  
  // If we have an initial like "V. Carboni", keep only the last part if it seems more "short"
  if (/^[A-Z]\.\s+/.test(name)) {
    name = name.replace(/^[A-Z]\.\s+/, '');
  }
  
  // If name is still very long and has spaces, take the last part
  if (name.length > 18 && name.includes(' ')) {
    const parts = name.split(' ');
    name = parts[parts.length - 1];
  }

  return name;
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

  // Normalize name for local mapping lookup
  const norm = normalizeTeamName(name);

  // Robust source selection
  let src = !imgError ? (logo || TEAM_LOGOS[norm] || TEAM_LOGOS[name]) : null;

  if (!src || imgError) {
    const short = (norm || name || '?').substring(0, 3).toUpperCase();
    return (
      <div className={`${className} bg-zinc-800 rounded-full flex items-center justify-center border border-white/10 shrink-0 shadow-inner overflow-hidden`}>
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(short)}&background=27272a&color=22d3ee&rounded=true&bold=true&font-size=0.4`}
          className="w-full h-full object-cover"
          alt={name}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${className} object-contain shrink-0 drop-shadow-md`}
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
          player:         getDisplayPlayerName(ev),
          playerId:       ev.playerId || ev.player?.playerId,
          team:           ev.teamId === detail.header?.homeTeam?.teamId ? 'home' : 'away',
          relatedId:      ev.relatedPlayerId || ev.subOff?.playerId || ev.subOn?.playerId,
          subOn:          getDisplayPlayerName(ev.subOn),
          subOff:         getDisplayPlayerName(ev.subOff),
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
              player:         getDisplayPlayerName(p),
              playerId:       p.playerId || p.id,
              team:           side,
              relatedId:      ev.relatedPlayerId || ev.subOffPlayer?.playerId || ev.subOnPlayer?.playerId,
              subOff:         ev.subOffPlayer ? getDisplayPlayerName(ev.subOffPlayer) : (ev.relatedPlayerName ? getDisplayPlayerName({shortName: ev.relatedPlayerName}) : null)
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
      const type = t.toLowerCase();
      if (type.includes('goal')) return '⚽';
      if (type.includes('yellow')) return '🟨';
      if (type.includes('red')) return '🟥';
      if (type.includes('substitution') || type === 'substitution') return '🔄';
      return '•';
    };

    return (
      <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-white/5 mx-2">
        {mergedEvents.map((ev, i) => (
          <div key={i} className="flex items-start gap-5 text-xs relative" style={{ paddingLeft: '8px' }}>
            <span className="w-10 text-[10px] font-black text-cyan-400 mt-0.5 text-right shrink-0 font-mono">{ev.minuteStr}</span>
            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] z-10 shrink-0 border border-white/10 ${ev.type.includes('red') ? 'bg-red-500/20' : ev.type.includes('yellow') ? 'bg-yellow-500/20' : 'bg-zinc-900'}`}>
              {getTypeLabel(ev.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`font-black text-sm tracking-tight ${ev.team === 'home' ? 'text-white' : 'text-zinc-300'}`}>{ev.player}</span>
                {ev.subOff && (
                  <span className="text-zinc-500 text-[11px] font-medium flex items-center gap-1.5">
                    <span className="opacity-40">←</span> {ev.subOff}
                  </span>
                )}
              </div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] mt-1 font-black flex items-center gap-2">
                {ev.team === 'home' ? homeName : awayName}
                {ev.type === 'penalty-goal' && <span className="text-emerald-500 bg-emerald-500/10 px-1 rounded">RIGORE</span>}
                {ev.type === 'own-goal' && <span className="text-red-500 bg-red-500/10 px-1 rounded">AUTOGOL</span>}
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
       return (
         <div className="bg-zinc-900/40 rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center gap-4">
           <AlertTriangle className="w-8 h-8 text-zinc-700" />
           <p className="text-center text-zinc-500 text-[10px] uppercase tracking-widest font-black">Formazione non disponibile</p>
         </div>
       );
    }

    const roles: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
    lineup.fielded.forEach((p: any) => {
      if (roles[p.role]) roles[p.role].push(p);
      else roles[3].push(p);
    });

    return (
      <div className="w-full">
        {lineup.coach?.shortName && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">In panchina:</span>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{lineup.coach.shortName}</span>
          </div>
        )}
        <div className="relative w-full aspect-[3/4] md:aspect-[4/3] bg-[#0c1a10] rounded-[2rem] border-4 border-white/10 overflow-hidden shadow-2xl">
          {/* Pitch Markings */}
          <div className="absolute inset-x-8 inset-y-8 border-2 border-white/20 rounded-lg pointer-events-none">
            {/* Half line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2" />
            {/* Center circle */}
            <div className="absolute left-1/2 top-1/2 w-32 h-32 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute left-1/2 top-1/2 w-1 h-1 bg-white/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
            {/* Penalty areas */}
            <div className="absolute left-0 top-1/2 w-24 h-48 border-2 border-white/20 -translate-y-1/2 border-l-0" />
            <div className="absolute right-0 top-1/2 w-24 h-48 border-2 border-white/20 -translate-y-1/2 border-r-0" />
            {/* Small areas */}
            <div className="absolute left-0 top-1/2 w-10 h-24 border-2 border-white/20 -translate-y-1/2 border-l-0" />
            <div className="absolute right-0 top-1/2 w-10 h-24 border-2 border-white/20 -translate-y-1/2 border-r-0" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
          
          {lineup.fielded.map((p: any) => {
            const roleArray = roles[p.role] || roles[3];
            const roleIndex = roleArray.findIndex(x => x.playerId === p.playerId);
            const pos = getPlayerPosition(p, roleIndex, roleArray.length);

            let left = pos.left;
            if (side === 'away') {
              left = `${100 - parseFloat(pos.left)}%`;
            }

            const goals = p.events?.filter((e: any) => e.type.match(/goal/)).length || 0;
            const yellow = p.events?.some((e: any) => e.type === 'yellow-card');
            const red = p.events?.some((e: any) => e.type === 'red-card');

            return (
              <div key={p.playerId || p.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-20 transition-all duration-700 hover:scale-110" style={{ left, top: pos.top }}>
                <div className="relative group/player">
                  <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black shadow-2xl transition-all duration-300 border-2
                    ${side === 'home' ? 'bg-cyan-500 border-white text-black' : 'bg-zinc-100 border-zinc-400 text-black'}`}>
                    {p.jerseyNumber}
                  </div>
                  
                  {/* Event markers */}
                  <div className="absolute -top-1 -right-4 flex flex-col gap-0.5">
                    {goals > 0 && Array(goals).fill(0).map((_, i) => <span key={i} className="text-[10px] drop-shadow-md">⚽</span>)}
                    {red ? <div className="w-2.5 h-3.5 bg-red-500 rounded-sm border border-red-700 shadow-sm" /> : yellow ? <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm border border-yellow-600 shadow-sm" /> : null}
                  </div>
                </div>
                <div className="bg-black/80 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-lg shadow-xl">
                  <span className="text-[9px] md:text-[11px] font-black text-white whitespace-nowrap uppercase tracking-tight">
                    {getDisplayPlayerName(p)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const extractStatMap = (statsPayload: any) => {
    // 1. Precise check for payload structure
    const statsData = statsPayload?.homeTeamStats ? statsPayload : (statsPayload?.teamstats || statsPayload?.statistics);
    
    if (!statsData) {
      console.warn("No stats data found in payload:", statsPayload);
      return null;
    }

    const homeRaw = statsData.homeTeamStats || statsData.home || [];
    const awayRaw = statsData.awayTeamStats || statsData.away || [];

    if (homeRaw.length === 0 && awayRaw.length === 0) return null;

    const map: Record<string, any> = {};
    const process = (arr: any[], side: 'home' | 'away') => {
      arr.forEach(s => {
        const id = (s.statsId || s.id || s.type || '').toLowerCase();
        if (!id) return;
        if (!map[id]) map[id] = { label: s.label || s.title || id, home: 0, away: 0 };
        map[id][side] = parseFloat(s.value || s.statsValue || 0);
      });
    };

    process(homeRaw, 'home');
    process(awayRaw, 'away');

    const find = (aliases: string[], label: string) => {
      for (const a of aliases) {
        const key = a.toLowerCase();
        if (map[key]) {
          const isPercent = (key.includes('percentage') || key.includes('perc') || String(map[key].label).includes('%') || map[key].home === 0 && map[key].away === 0 ? false : (map[key].home <= 100 && map[key].away <= 100 && (map[key].home + map[key].away === 100)));
          return { ...map[key], label, isPercent: isPercent || key.includes('possession') };
        }
      }
      return null;
    };

    const result = [
      find(['possession', 'possession-percentage', 'ball_possession', 'possession_percentage'], 'Possesso Palla'),
      find(['expected-goals', 'expected_goals', 'xg'], 'Expected Goals (xG)'),
      find(['total-shots', 'shots', 'total_shots', 'shots_total'], 'Tiri Totali'),
      find(['shots-on-target', 'shots_on_target', 'ontarget_scoring_att'], 'Tiri in Porta'),
      find(['big-chances', 'big_chances_created', 'big_chance_created'], 'Grandi Occasioni'),
      find(['passes', 'total_pass', 'total-passes'], 'Passaggi'),
      find(['accurate-pass-percentage', 'pass_accuracy', 'accurate_pass_percentage', 'passes_accuracy'], 'Precisione Passaggi'),
      find(['corners', 'corner_taken', 'corners_total'], 'Calci d\'Angolo'),
      find(['fouls', 'fouls_committed', 'fouls_total'], 'Falli Commessi'),
      find(['yellow-cards', 'yellow_cards', 'total_yellow_card'], 'Ammonizioni'),
      find(['red-cards', 'red_cards', 'total_red_card'], 'Espulsioni'),
    ].filter(Boolean);

    // Dynamic Fallback: if we find nothing with aliases, show everything we have
    if (result.length < 3) {
      return Object.entries(map)
        .filter(([k]) => !k.includes('id') && !k.includes('name'))
        .slice(0, 15)
        .map(([k, v]) => ({ ...v, isPercent: false }));
    }

    return result;
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

            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-12 md:space-y-20 custom-scrollbar bg-[#050505]">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                    <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
                  </div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-[0.3em] font-black">Sincronizzazione dati...</p>
                </div>
              ) : matchDetails ? (
                <div className="space-y-16 pb-12">
                  
                  {/* ====== EVENTI ====== */}
                  <section className="relative px-4 md:px-0">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                      <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-cyan-400 flex items-center gap-3">
                         <span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                         Timeline
                      </h3>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                    </div>
                    <div className="bg-zinc-900/20 rounded-[3rem] p-8 md:p-12 border border-white/5 shadow-2xl backdrop-blur-sm">
                      <MatchTimeline detail={matchDetails} homeName={getDisplayPlayerName(resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa'))} awayName={getDisplayPlayerName(resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite'))} />
                    </div>
                  </section>

                  {/* ====== STATISTICHE ====== */}
                  {(() => {
                    const statsMap = extractStatMap(matchDetails.stats);
                    if (!statsMap || statsMap.length === 0) return null;
                    return (
                      <section className="relative px-4 md:px-0">
                        <div className="flex items-center gap-4 mb-10">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-400 flex items-center gap-3">
                             <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             Statistiche
                          </h3>
                          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                        </div>
                        <div className="bg-zinc-900/20 rounded-[3rem] p-10 md:p-14 border border-white/5 shadow-2xl backdrop-blur-sm">
                          <div className="space-y-10">
                            {statsMap.map((stat: any, i: number) => {
                              const total = stat.home + stat.away || 1;
                              const hPerc = stat.isPercent ? stat.home : (stat.home / total) * 100;
                              const aPerc = stat.isPercent ? stat.away : (stat.away / total) * 100;
                              return (
                                <div key={i} className="space-y-4">
                                  <div className="flex justify-between items-end px-2">
                                    <span className={`text-xl font-black ${stat.home >= stat.away ? 'text-cyan-400' : 'text-zinc-500'}`}>{stat.home}{stat.isPercent ? '%' : ''}</span>
                                    <span className="uppercase tracking-[0.25em] text-[10px] font-black text-zinc-500 pb-1">{stat.label}</span>
                                    <span className={`text-xl font-black ${stat.away >= stat.home ? 'text-zinc-100' : 'text-zinc-500'}`}>{stat.away}{stat.isPercent ? '%' : ''}</span>
                                  </div>
                                  <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5 relative">
                                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full transition-all duration-1000 ease-out" style={{ width: `${hPerc}%` }} />
                                    <div className="w-px h-full bg-black/40 z-10" />
                                    <div className="bg-zinc-600 h-full transition-all duration-1000 ease-out" style={{ width: `${aPerc}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </section>
                    );
                  })()}

                  {/* ====== FORMAZIONI ====== */}
                  {matchDetails.lineups && (
                    <section className="relative px-4 md:px-0">
                      <div className="flex items-center gap-4 mb-12">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                        <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-zinc-400 flex items-center gap-3">
                           <span className="w-2 h-2 bg-zinc-500 rounded-full" />
                           Campo Di Gioco
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                      </div>
                      
                      <div className="space-y-12">
                        <div className="bg-zinc-900/20 rounded-[3rem] p-6 md:p-10 border border-white/5 shadow-2xl">
                          <div className="flex items-center justify-between mb-8 px-4">
                            <div className="flex items-center gap-3">
                              <TeamLogo logo={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').logo} name={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} className="w-8 h-8" />
                              <span className="text-[11px] font-black uppercase text-cyan-400 tracking-widest">{resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name}</span>
                            </div>
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">VS</span>
                            <div className="flex items-center gap-3 text-right">
                              <span className="text-[11px] font-black uppercase text-white tracking-widest">{resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name}</span>
                              <TeamLogo logo={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').logo} name={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} className="w-8 h-8" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <TacticalPitch lineup={matchDetails.lineups.home} side="home" />
                            <TacticalPitch lineup={matchDetails.lineups.away} side="away" />
                          </div>
                        </div>

                        {/* ====== PANCHINE E CAMBI ====== */}
                        <div className="bg-zinc-900/40 rounded-[3rem] p-10 md:p-16 border border-white/10 shadow-3xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                          <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-400 mb-16 text-center">Panchine Strategiche</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 divide-y md:divide-y-0 md:divide-x divide-white/5">
                            {/* Casa Bench */}
                            <div className="space-y-6 pr-0 md:pr-10 pb-12 md:pb-0">
                               <div className="flex items-center gap-3 mb-6 bg-white/5 py-2 px-4 rounded-full w-fit">
                                 <TeamLogo logo={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').logo} name={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} className="w-5 h-5" />
                                 <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em]">Casa</p>
                               </div>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 {(matchDetails.lineups?.home?.benched || []).map((p: any) => {
                                   const subInEvent = p.events?.find((e: any) => e.type === 'substitution-in');
                                   return (
                                     <div key={p.playerId || p.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                                       <div className="flex flex-col min-w-0">
                                         <span className={`text-[11px] font-black truncate ${subInEvent ? 'text-white' : 'text-zinc-500'}`}>{getDisplayPlayerName(p)}</span>
                                         {subInEvent && <span className="text-[9px] text-emerald-500 font-bold mt-0.5">Entrato {formatEventMinute(subInEvent)}</span>}
                                       </div>
                                       {subInEvent && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                     </div>
                                   );
                                 })}
                               </div>
                            </div>
                            {/* Trasferta Bench */}
                            <div className="space-y-6 pl-0 md:pl-10 pt-12 md:pt-0">
                               <div className="flex items-center gap-3 mb-6 bg-white/5 py-2 px-4 rounded-full w-fit ml-auto">
                                 <p className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Ospite</p>
                                 <TeamLogo logo={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').logo} name={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} className="w-5 h-5" />
                               </div>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 {(matchDetails.lineups?.away?.benched || []).map((p: any) => {
                                   const subInEvent = p.events?.find((e: any) => e.type === 'substitution-in');
                                   return (
                                     <div key={p.playerId || p.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group flex-row-reverse text-right">
                                       <div className="flex flex-col min-w-0">
                                         <span className={`text-[11px] font-black truncate ${subInEvent ? 'text-white' : 'text-zinc-500'}`}>{getDisplayPlayerName(p)}</span>
                                         {subInEvent && <span className="text-[9px] text-emerald-500 font-bold mt-0.5">Entrato {formatEventMinute(subInEvent)}</span>}
                                       </div>
                                       {subInEvent && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                     </div>
                                   );
                                 })}
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <div className="bg-zinc-900/20 rounded-[3rem] p-24 border border-white/5 flex flex-col items-center justify-center backdrop-blur-xl shadow-2xl mx-4">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 relative">
                     <AlertTriangle className="w-10 h-10 text-zinc-700" />
                     <div className="absolute inset-0 bg-red-500/5 blur-2xl rounded-full" />
                  </div>
                  <h5 className="text-zinc-400 font-black text-[12px] uppercase tracking-[0.4em] mb-4">Dati Non Pervenuti</h5>
                  <p className="text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold max-w-xs leading-relaxed">
                    Le informazioni per questo incontro non sono ancora state caricate nel database ufficiale.
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
