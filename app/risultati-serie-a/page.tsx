// @ts-nocheck
/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, AlertTriangle } from 'lucide-react';

const TOTAL_ROUNDS = 38;

const resolveImageUrl = (path: string | null | undefined): string | null => {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http')) return path;
  
  let cleanPath = path.trim();
  if (cleanPath.startsWith('clubLogos') && !cleanPath.startsWith('clubLogos/')) {
    cleanPath = cleanPath.replace(/^clubLogos/, 'clubLogos/');
  } else if (cleanPath.startsWith('teamImages') && !cleanPath.startsWith('teamImages/')) {
    cleanPath = cleanPath.replace(/^teamImages/, 'teamImages/');
  } else if (cleanPath.startsWith('teamLogoLight') && !cleanPath.startsWith('teamLogoLight/')) {
    cleanPath = cleanPath.replace(/^teamLogoLight/, 'teamLogoLight/');
  } else if (cleanPath.startsWith('stadiums') && !cleanPath.startsWith('stadiums/')) {
    cleanPath = cleanPath.replace(/^stadiums/, 'stadiums/');
  }

  if (
    cleanPath.startsWith('clubLogos') || 
    cleanPath.startsWith('teamImages') || 
    cleanPath.startsWith('teamLogoLight') || 
    cleanPath.startsWith('stadiums')
  ) {
    return `https://img.legaseriea.it/vimages/64x64/${cleanPath}`;
  }
  
  return null;
};

const getTeamLogoUrl = (team: any) => {
  if (!team || typeof team !== 'object') return null;
  
  const raw1 = team.teamLogo;
  const raw2 = team.teamLogoLight;
  const raw3 = team.teamImage || team.imagery?.teamLogo || team.logo;

  const resolved = resolveImageUrl(raw1) || resolveImageUrl(raw2) || resolveImageUrl(raw3);

  console.log('Resolving Logo for Team:', {
    teamName: team.name || team.shortName || 'Unknown',
    teamId: team.teamId || team.id,
    rawTeamLogo: raw1,
    rawTeamLogoLight: raw2,
    rawTeamImage: raw3,
    resolvedFinalUrl: resolved,
  });

  return resolved;
};

const getDisplayPlayerName = (p: any) => {
  if (!p) return 'Player';
  const player = p.player || p;
  
  // Ordine: 1. displayName 2. mediaLastName
  let name = player.displayName || player.mediaLastName;
  
  // 3. ultima parte utile di shirtName
  if (!name && player.shirtName) {
    const parts = player.shirtName.split(' ');
    name = parts[parts.length - 1]; // "ultima parte utile"
  }
  
  // 4. shortName fallback
  if (!name) {
    name = player.shortName || player.officialName || 'Player';
  }
  
  // Pulizia
  name = name.replace(/\.\.\./g, '').trim();
  name = name.replace(/^[A-Z]\.\s*/, '').trim(); // "V. Carboni" -> "Carboni"
  name = name.replace(/^[A-Z]\.\.\.\s*\.\s*/, '').trim(); // "V... . Carboni" -> "Carboni"
  
  if (name.length > 20 && name.includes(' ')) {
    const parts = name.split(' ');
    name = parts[parts.length - 1];
  }

  return name;
};

const TeamLogo = ({
  team,
  className,
}: {
  team: any;
  className: string;
}) => {
  const [imgError, setImgError] = useState(false);
  const src = !imgError ? getTeamLogoUrl(team) : null;
  const teamName = team?.name || team?.shortName || team?.officialName || '?';

  if (!src) {
    const short = teamName.substring(0, 3).toUpperCase();
    return (
      <div className={`${className} bg-zinc-800 rounded-full flex flex-col items-center justify-center border border-white/10 shrink-0 shadow-inner overflow-hidden`}>
        <span className="text-[10px] font-black tracking-widest text-cyan-500/80 leading-none">{short}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={teamName}
      className={`${className} object-contain shrink-0 drop-shadow-md`}
      onError={() => {
        console.warn(`Logo load failed for ${teamName} (${team?.teamId || team?.id}), fallback triggered. URL: ${src}`);
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
  const [matchDetailsError, setMatchDetailsError] = useState<string | null>(null);
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
    setMatchDetailsError(null);
    setLoadingModal(true);
    try {
      const matchId = m.matchId || m.id;
      const res = await fetch(`/api/football?endpoint=match&id=${encodeURIComponent(matchId)}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'API Match: risposta non OK');
      setMatchDetails(json.data);
    } catch (err: any) {
      console.error('Match Details fetch err:', err);
      setMatchDetailsError(err.message || 'Errore fetch dettagli partita');
      setMatchDetails(null);
    } finally {
      setLoadingModal(false);
    }
  };

  const resolveTeam = (teamObj: any, fallback: string) => {
    return {
      ...teamObj,
      id:   teamObj?.teamId || teamObj?.id,
      name: teamObj?.shortName || teamObj?.officialName || teamObj?.name || fallback,
      logo: getTeamLogoUrl(teamObj),
    };
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
    
    // Spread horizontally across a bit more space to prevent overlap
    const xPos = totalInRole > 1 
      ? 15 + ((70 / (totalInRole - 1)) * roleIndex)
      : 50;

    return { left: `${xPos}%`, top: `${yPos}%` };
  };

  const TacticalPitch = ({ lineup, side, label }: any) => {
    if (!lineup?.fielded || lineup.fielded.length === 0) {
       return (
         <div className="bg-zinc-900/40 rounded-[2.5rem] p-12 border border-white/5 flex flex-col items-center justify-center gap-4 w-full aspect-[2/3] md:aspect-[3/4]">
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
      <div className="w-full flex-1 border border-white/5 rounded-[2.5rem] p-4 md:p-8 bg-[#060606] shadow-2xl relative overflow-hidden">
        {lineup.coach && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 w-full justify-center">
            <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">All.</span>
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-500/10 shadow-sm">{getDisplayPlayerName({player: lineup.coach})}</span>
          </div>
        )}
        <div className="relative w-full aspect-[2/3] bg-gradient-to-b from-[#112a17] to-[#0a180d] rounded-[2rem] border-[6px] border-[#0c1a10] overflow-hidden mt-8 shadow-[0_15px_60px_-15px_rgba(34,197,94,0.1)]">
          <div className="absolute inset-x-6 inset-y-6 border-2 border-white/10 rounded-xl" />
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2" />
          <div className="absolute left-1/2 top-1/2 w-24 h-24 md:w-32 md:h-32 border-2 border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 w-36 h-20 md:w-48 md:h-28 border-2 border-white/10 border-t-0 -translate-x-1/2" />
          <div className="absolute left-1/2 bottom-0 w-36 h-20 md:w-48 md:h-28 border-2 border-white/10 border-b-0 -translate-x-1/2" />
          
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/60" />
          
          {lineup.fielded.map((p: any) => {
            const roleArray = roles[p.role] || roles[3];
            const roleIndex = roleArray.findIndex(x => x.playerId === p.playerId);
            const pos = getPlayerPosition(p, roleIndex, roleArray.length);

            const goals = p.events?.filter((e: any) => e.type.match(/goal/)).length || 0;
            const yellow = p.events?.some((e: any) => e.type === 'yellow-card');
            const red = p.events?.some((e: any) => e.type === 'red-card');

            return (
              <div key={p.playerId || p.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-20 group transition-transform duration-500 hover:scale-110 hover:z-30" style={{ left: pos.left, top: pos.top }}>
                <div className="relative">
                  <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-[11px] md:text-sm font-black shadow-2xl border-2 md:border-[3px] transition-colors
                    ${side === 'home' ? 'bg-cyan-500 border-white text-black drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]' : 'bg-white border-zinc-200 text-black drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]'}`}>
                    {p.jerseyNumber}
                  </div>
                  <div className="absolute -top-1 -right-2 md:-right-3 flex flex-col gap-0.5">
                    {goals > 0 && Array(goals).fill(0).map((_, i) => <span key={i} className="text-[10px] md:text-[14px] drop-shadow-md">⚽</span>)}
                    {red ? <div className="w-2.5 h-3.5 bg-red-500 rounded-sm border border-red-700 shadow-sm" /> : yellow ? <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm border border-yellow-600 shadow-sm" /> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const normalizeStatsInput = (rawStats: any) => {
    console.log('rawStats before normalization:', rawStats);
    const result = { home: [] as any[], away: [] as any[] };
    
    if (!rawStats || typeof rawStats !== 'object') {
      console.log('normalizedStats (empty/invalid input):', result);
      return result;
    }

    const extractArray = (value: any): any[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'object') {
        const vals = Object.values(value).filter(v => v !== null && typeof v === 'object');
        return vals;
      }
      return [];
    };

    if (rawStats.homeTeamStats || rawStats.awayTeamStats) {
      result.home = extractArray(rawStats.homeTeamStats);
      result.away = extractArray(rawStats.awayTeamStats);
    } else if (rawStats.home || rawStats.away) {
      result.home = extractArray(rawStats.home);
      result.away = extractArray(rawStats.away);
    } else if (rawStats.teamstats?.home || rawStats.teamstats?.away) {
      result.home = extractArray(rawStats.teamstats.home);
      result.away = extractArray(rawStats.teamstats.away);
    } else if (Array.isArray(rawStats)) {
      console.warn('rawStats is a flat array, unable to map to home/away directly.');
    }

    if (!Array.isArray(result.home)) result.home = [];
    if (!Array.isArray(result.away)) result.away = [];

    console.log('normalizedStats final:', result);
    return result;
  };

  const buildStatsGroups = (rawStatsPayload: any) => {
    const normalizedStats = normalizeStatsInput(rawStatsPayload);
    const homeRaw = normalizedStats.home;
    const awayRaw = normalizedStats.away;
    
    if (homeRaw.length === 0 && awayRaw.length === 0) return null;

    const map: Record<string, any> = {};
    const processArray = (arr: any[], side: 'home' | 'away') => {
      if (!Array.isArray(arr)) return;
      
      arr.forEach(s => {
        if (!s || typeof s !== 'object') return;
        const id = (s.statsId || s.id || s.type || s.name || '').toLowerCase();
        if (!id) return;
        if (!map[id]) map[id] = { label: s.label || s.title || s.name || id, home: 0, away: 0 };
        map[id][side] = parseFloat(s.value || s.statsValue || s.total || 0);
      });
    };

    processArray(homeRaw, 'home');
    processArray(awayRaw, 'away');

    const findKey = (aliases: string[]) => {
      for (const a of aliases) {
        const key = a.toLowerCase();
        for (const mapKey of Object.keys(map)) {
          if (mapKey === key || mapKey.includes(key) || key.includes(mapKey)) {
            return mapKey;
          }
        }
      }
      return null;
    };

    const find = (aliases: string[], label: string) => {
      const foundKey = findKey(aliases);
      if (foundKey) {
        const stat = map[foundKey];
        const isPercent = foundKey.includes('percentage') || foundKey.includes('perc') || String(stat.label).includes('%') || foundKey.includes('possession') || (stat.home <= 100 && stat.away <= 100 && (Math.abs(stat.home + stat.away - 100) < 0.1));
        return { ...stat, label, isPercent };
      }
      return null;
    };

    const overview = [
      find(['points'], 'Punti'),
      find(['rank', 'position'], 'Posizione'),
      find(['matches-played', 'matches_played', 'played'], 'Partite Giocate'),
      find(['goal-difference', 'goal_difference', 'gd'], 'Differenza Reti'),
    ].filter(Boolean);

    const performance = [
      find(['win', 'wins'], 'Vittorie'),
      find(['draw', 'draws'], 'Pareggi'),
      find(['lose', 'loss', 'losses'], 'Sconfitte'),
    ].filter(Boolean);

    const attackDef = [
      find(['goals-for', 'goals_for', 'gf', 'goals'], 'Gol Fatti'),
      find(['goals-against', 'goals_against', 'ga'], 'Gol Subiti'),
      find(['average-goals-for', 'average_goals_for'], 'Media Gol Fatti'),
      find(['average-goals-against', 'average_goals_against'], 'Media Gol Subiti'),
      find(['clean-sheet', 'clean_sheet'], 'Clean Sheets'),
    ].filter(Boolean);

    const matchStats = [
      find(['possession', 'possession-percentage', 'ball_possession', 'possession_percentage'], 'Possesso Palla'),
      find(['shots', 'total-shots', 'total_shots', 'shots_total', 'total_scoring_att'], 'Tiri Totali'),
      find(['shots-on-target', 'shots_on_target', 'ontarget_scoring_att', 'on_target'], 'Tiri in Porta'),
      find(['expected-goals', 'expected_goals', 'xg'], 'Expected Goals (xG)'),
      find(['passes', 'accurate-pass-percentage', 'pass_accuracy', 'accurate_pass_percentage', 'passes_accuracy'], 'Precisione Passaggi'),
      find(['corners', 'corner_taken', 'corners_total'], 'Calci d\'Angolo'),
      find(['fouls', 'fouls_committed', 'fouls_total'], 'Falli Commessi'),
      find(['yellow-cards', 'yellow_cards', 'total_yellow_card'], 'Ammonizioni'),
      find(['red-cards', 'red_cards', 'total_red_card'], 'Espulsioni'),
      find(['saves', 'total_saves', 'saves_total'], 'Parate'),
    ].filter(Boolean);

    if (overview.length === 0 && performance.length === 0 && attackDef.length === 0 && matchStats.length === 0 && Object.keys(map).length > 0) {
      matchStats.push(...Object.entries(map).filter(([k]) => !k.includes('id') && !k.includes('name')).slice(0, 15).map(([, v]) => ({ ...v, isPercent: false })));
    }

    return { overview, performance, attackDef, matchStats };
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
                        <TeamLogo team={home} className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{home.name}</span>
                      </div>
                      <div className={`text-center font-black italic text-base tracking-tighter min-w-[70px] ${played ? 'text-white' : 'text-cyan-400'}`}>
                        {played ? `${hs} - ${as_}` : 'VS'}
                      </div>
                      <div className="flex items-center gap-4 w-[42%] justify-end text-right">
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{away.name}</span>
                        <TeamLogo team={away} className="w-10 h-10 group-hover:scale-110 transition-transform" />
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
                      <TeamLogo team={t} className="w-8 h-8 shrink-0" />
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
              const statusText = modalFixture.matchStatus === 'Played' ? 'Terminata' : (modalFixture.matchStatus || 'Terminata');
              return (
                <div className="p-6 md:p-10 bg-gradient-to-b from-white/10 to-transparent border-b border-white/5 flex flex-col items-center gap-2">
                  <span className="text-[9px] uppercase tracking-[0.3em] font-black text-cyan-400/80 bg-cyan-400/10 px-3 py-1 rounded-full mb-2">{statusText}</span>
                  <div className="flex justify-between items-center w-full max-w-lg mx-auto">
                    <div className="flex flex-col items-center gap-4 w-[35%]">
                      <TeamLogo team={home} className="w-16 h-16 md:w-20 md:h-20 shadow-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105 transition-transform" />
                      <span className="text-[10px] md:text-sm uppercase text-white/90 font-black tracking-widest text-center leading-tight break-words h-10 flex items-start justify-center">{home.name}</span>
                    </div>
                    <div className="text-5xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.2)] shrink-0 tabular-nums">
                      {hs} – {as_}
                    </div>
                    <div className="flex flex-col items-center gap-4 w-[35%]">
                      <TeamLogo team={away} className="w-16 h-16 md:w-20 md:h-20 shadow-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105 transition-transform" />
                      <span className="text-[10px] md:text-sm uppercase text-white/90 font-black tracking-widest text-center leading-tight break-words h-10 flex items-start justify-center">{away.name}</span>
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
                    const statsGroups = buildStatsGroups(matchDetails.stats);
                    if (!statsGroups || (statsGroups.overview.length === 0 && statsGroups.performance.length === 0 && statsGroups.attackDef.length === 0 && statsGroups.matchStats.length === 0)) return null;
                    
                    const StatBar = ({ stat }: { stat: any }) => {
                      const total = stat.home + stat.away || 1;
                      const hPerc = stat.isPercent ? stat.home : (stat.home / total) * 100;
                      const aPerc = stat.isPercent ? stat.away : (stat.away / total) * 100;
                      return (
                        <div className="space-y-4">
                          <div className="flex justify-between items-end px-2 gap-2">
                            <span className={`text-lg md:text-xl font-black shrink-0 ${stat.home >= stat.away && stat.home > 0 ? 'text-cyan-400' : 'text-zinc-500'}`}>{stat.home}{stat.isPercent ? '%' : ''}</span>
                            <span className="uppercase tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-[10px] font-black text-zinc-500 pb-1 text-center truncate px-2 min-w-0 flex-1">{stat.label}</span>
                            <span className={`text-lg md:text-xl font-black shrink-0 ${stat.away >= stat.home && stat.away > 0 ? 'text-zinc-100' : 'text-zinc-500'}`}>{stat.away}{stat.isPercent ? '%' : ''}</span>
                          </div>
                          <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5 relative">
                            <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full transition-all duration-1000 ease-out" style={{ width: `${hPerc}%` }} />
                            <div className="w-px h-full bg-black/40 z-10" />
                            <div className="bg-zinc-600 h-full transition-all duration-1000 ease-out" style={{ width: `${aPerc}%` }} />
                          </div>
                        </div>
                      );
                    };

                    const StatCard = ({ title, stats, iconColor }: { title: string, stats: any[], iconColor: string }) => {
                      if (!stats || stats.length === 0) return null;
                      return (
                        <div className="bg-zinc-900/40 rounded-[2.5rem] p-6 md:p-10 border border-white/5 shadow-2xl backdrop-blur-sm flex flex-col gap-6 h-full transition-all hover:bg-zinc-900/60 hover:border-white/10">
                          <h4 className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 ${iconColor} mb-2`}>
                             <span className={`w-2 h-2 rounded-full shadow-lg bg-current`} />
                             {title}
                          </h4>
                          <div className="space-y-6 flex-1">
                            {stats.map((stat: any, i: number) => <StatBar key={i} stat={stat} />)}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <section className="relative px-4 md:px-0 mt-8">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-400 flex items-center gap-3">
                             <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                             Statistiche
                          </h3>
                          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          {statsGroups.overview.length > 0 && <StatCard title="Overview" stats={statsGroups.overview} iconColor="text-blue-400" />}
                          {statsGroups.performance.length > 0 && <StatCard title="Rendimento" stats={statsGroups.performance} iconColor="text-purple-400" />}
                          {statsGroups.attackDef.length > 0 && <StatCard title="Attacco & Difesa" stats={statsGroups.attackDef} iconColor="text-orange-400" />}
                          {statsGroups.matchStats.length > 0 && (
                            <div className={(statsGroups.overview.length === 0 && statsGroups.performance.length === 0 && statsGroups.attackDef.length === 0) ? "col-span-1 md:col-span-2" : ""}>
                              <StatCard title="Match Stats" stats={statsGroups.matchStats} iconColor="text-emerald-400" />
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })()}

                  {/* ====== FORMAZIONI ====== */}
                  {matchDetails.lineups && (
                    <section className="relative px-4 md:px-0 mt-20">
                      <div className="flex items-center gap-4 mb-16">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                        <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-zinc-400 flex items-center gap-3">
                           <span className="w-2 h-2 bg-zinc-500 rounded-full" />
                           Formazioni
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                      </div>
                      
                      <div className="space-y-16">
                        <div className="flex flex-col lg:flex-row gap-8">
                          <div className="flex-1 flex flex-col gap-8">
                            <div className="flex items-center gap-4 justify-center bg-white/5 py-4 rounded-3xl border border-white/5 shadow-inner">
                              <TeamLogo team={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa')} className="w-8 h-8" />
                              <span className="text-[12px] font-black uppercase text-cyan-400 tracking-widest">{resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name}</span>
                            </div>
                            <TacticalPitch lineup={matchDetails.lineups.home} side="home" />
                          </div>
                          
                          <div className="hidden lg:flex flex-col items-center justify-center -mx-4 z-10">
                            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest rotate-90 whitespace-nowrap bg-[#050505] px-4">Campo di Gioco</span>
                          </div>

                          <div className="flex-1 flex flex-col gap-8">
                            <div className="flex items-center gap-4 justify-center bg-white/5 py-4 rounded-3xl border border-white/5 shadow-inner">
                              <span className="text-[12px] font-black uppercase text-white tracking-widest">{resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name}</span>
                              <TeamLogo team={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite')} className="w-8 h-8" />
                            </div>
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
                                 <TeamLogo team={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa')} className="w-5 h-5" />
                                 <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em]">Casa</p>
                               </div>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 {(matchDetails.lineups?.home?.benched || [])
                                   .sort((a: any, b: any) => {
                                      const aIn = a.events?.some((e: any) => e.type === 'substitution-in');
                                      const bIn = b.events?.some((e: any) => e.type === 'substitution-in');
                                      return aIn === bIn ? 0 : aIn ? -1 : 1;
                                   })
                                   .map((p: any) => {
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
                                 <TeamLogo team={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite')} className="w-5 h-5" />
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
                     <AlertTriangle className={`w-10 h-10 ${matchDetailsError ? 'text-red-500' : 'text-zinc-700'}`} />
                     <div className="absolute inset-0 bg-red-500/5 blur-2xl rounded-full" />
                  </div>
                  <h5 className="text-zinc-400 font-black text-[12px] uppercase tracking-[0.4em] mb-4">
                    {matchDetailsError ? "Errore di Rete / API" : "Dati Non Pervenuti"}
                  </h5>
                  <p className="text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold max-w-xs leading-relaxed">
                    {matchDetailsError ? `Dettaglio Errore: ${matchDetailsError}` : "Le informazioni per questo incontro non sono ancora state caricate nel database ufficiale."}
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
