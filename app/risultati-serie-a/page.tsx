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
  
  const teamName = team.name || team.shortName || team.officialName;
  const normalized = normalizeTeamName(teamName);
  
  // Prefer Transfermarkt stable logo if available to prevent API 404 spam.
  if (normalized && TEAM_LOGOS[normalized]) {
    return TEAM_LOGOS[normalized];
  }
  if (teamName && TEAM_LOGOS[teamName]) {
    return TEAM_LOGOS[teamName];
  }

  const raw1 = team.teamLogo;
  const raw2 = team.teamLogoLight;
  const raw3 = team.teamImage || team.imagery?.teamLogo || team.logo;

  const resolved = resolveImageUrl(raw1) || resolveImageUrl(raw2) || resolveImageUrl(raw3);

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
  const [modalTab, setModalTab]             = useState('eventi');
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
    setModalTab('eventi');
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
    const base = ev.time || ev.minute || ev.minuteRaw;
    if (base != null && base !== 0 && base !== '') {
      if (ev.additionalTime && ev.additionalTime > 0) {
        return `${base}+${ev.additionalTime}'`;
      }
      return `${base}'`;
    }
    return '';
  };

  const MatchTimeline = ({ detail }: any) => {
    let rawEvents: any[] = [];
    
    // 1. Extract from events API
    if (detail.events?.events?.length > 0) {
      detail.events.events.forEach((ev: any) => {
        rawEvents.push({
          minuteRaw:      ev.time || ev.minute || 0,
          additionalTime: ev.additionalTime || 0,
          type:           (ev.type || '').toLowerCase(),
          player:         getDisplayPlayerName(ev),
          playerId:       ev.playerId || ev.player?.playerId,
          team:           ev.teamId === detail.header?.homeTeam?.teamId ? 'home' : 'away',
          relatedId:      ev.relatedPlayerId || ev.subOff?.playerId || ev.subOn?.playerId,
          subOn:          ev.subOn ? getDisplayPlayerName(ev.subOn) : null,
          subOff:         ev.subOff ? getDisplayPlayerName(ev.subOff) : null,
          assist:         ev.assist ? getDisplayPlayerName(ev.assist) : (ev.relatedPlayerName && ev.type !== 'substitution' ? getDisplayPlayerName({shortName: ev.relatedPlayerName}) : null),
        });
      });
    } else {
      // 2. Fallback from lineups
      const parseLineup = (players: any[], side: 'home' | 'away') => {
        players.forEach(p => {
          (p.events || []).forEach((ev: any) => {
            const evType = (ev.type || '').toLowerCase();
            rawEvents.push({
              minuteRaw:      ev.time || ev.minute || 0,
              additionalTime: ev.additionalTime || 0,
              type:           evType,
              player:         getDisplayPlayerName(p),
              playerId:       p.playerId || p.id,
              team:           side,
              relatedId:      ev.relatedPlayerId || ev.subOffPlayer?.playerId || ev.subOnPlayer?.playerId,
              subOff:         ev.subOffPlayer ? getDisplayPlayerName(ev.subOffPlayer) : (evType.includes('sub') && ev.relatedPlayerName ? getDisplayPlayerName({shortName: ev.relatedPlayerName}) : null),
              assist:         (!evType.includes('sub') && ev.relatedPlayerName) ? getDisplayPlayerName({shortName: ev.relatedPlayerName}) : null,
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

    // Sort by minute ascending
    rawEvents.sort((a, b) => {
      if (a.minuteRaw !== b.minuteRaw) return a.minuteRaw - b.minuteRaw;
      return (a.additionalTime || 0) - (b.additionalTime || 0);
    });

    // Merge substitutions logic
    const mergedEvents: any[] = [];
    const consumed = new Set<number>();

    rawEvents.forEach((ev, idx) => {
      if (consumed.has(idx)) return;

      if (ev.type === 'substitution-in' || ev.type === 'substitution-out') {
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
      if (t.includes('sub')) return '🔄';
      if (t.includes('var')) return '🖥️';
      return '•';
    };

    return (
      <div className="relative py-4 md:py-8">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />
        <div className="space-y-6 md:space-y-10 relative">
          {mergedEvents.map((ev, i) => {
            const isHome = ev.team === 'home';
            const isSub = ev.type.includes('sub');
            const isGoal = ev.type.includes('goal');
            return (
              <div key={i} className={`flex items-start w-full gap-2 md:gap-6 ${isHome ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-1" />
                <div className="relative flex flex-col items-center justify-start shrink-0 z-10 w-10 md:w-16 pt-0.5">
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-[12px] font-black shadow-lg border border-white/10 ${ev.type.includes('red') ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : ev.type.includes('yellow') ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.4)]' : ev.type.includes('goal') ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-zinc-800 text-white'}`}>
                    {getTypeLabel(ev.type)}
                  </div>
                  <span className="text-[8px] md:text-[10px] font-black text-white mt-2 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full z-20 shadow-md">{ev.minuteStr}</span>
                </div>
                <div className={`flex-1 min-w-0 flex flex-col pt-1 md:pt-1.5 ${isHome ? 'items-end text-right' : 'items-start text-left'}`}>
                  <div className={`flex flex-wrap items-center gap-1.5 md:gap-2 ${isHome ? 'justify-end' : 'justify-start'}`}>
                    {isSub ? (
                      <div className={`flex flex-col gap-1 ${isHome ? 'items-end' : 'items-start'}`}>
                        <span className="font-black text-[11px] md:text-[13px] tracking-tight text-white flex items-center gap-1.5">
                          <span className="text-emerald-400 text-[10px]">↑</span> <span>{ev.player}</span>
                        </span>
                        {ev.subOff && (
                           <span className="font-bold text-[10px] md:text-[11px] tracking-tight text-zinc-400 flex items-center gap-1.5">
                             <span className="text-red-500 text-[10px]">↓</span> <span>{ev.subOff}</span>
                           </span>
                        )}
                      </div>
                    ) : (
                      <div className={`flex flex-col gap-1 ${isHome ? 'items-end' : 'items-start'}`}>
                         <span className="font-black text-[11px] md:text-sm tracking-tight text-white">{ev.player}</span>
                         {isGoal && ev.assist && (
                           <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                             Assist: <span className="text-zinc-300">{ev.assist}</span>
                           </span>
                         )}
                      </div>
                    )}
                  </div>
                  <div className={`text-[8px] md:text-[9px] text-zinc-500 uppercase tracking-[0.1em] md:tracking-[0.2em] mt-1 md:mt-1.5 font-black flex items-center gap-1.5 flex-wrap ${isHome ? 'justify-end' : 'justify-start'}`}>
                    {ev.type === 'penalty-goal' && <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm border border-emerald-500/20">RIG.</span>}
                    {ev.type === 'own-goal' && <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-sm border border-red-500/20">AUT.</span>}
                    {ev.type === 'penalty-missed' && <span className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-sm border border-orange-500/20">RIGORE SBAGLIATO</span>}
                    {ev.type.includes('var') && <span className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-sm border border-purple-500/20">VAR</span>}
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

    const attack = [
      find(['shots', 'total-shots', 'total_shots', 'shots_total', 'total_scoring_att'], 'Tiri Totali'),
      find(['shots-on-target', 'shots_on_target', 'ontarget_scoring_att', 'on_target', 'shots_on_goal'], 'Tiri in Porta'),
      find(['expected-goals', 'expected_goals', 'xg'], 'Expected Goals (xG)'),
      find(['big-chances', 'big_chances', 'clear_chances'], 'Grandi Occasioni'),
    ].filter(Boolean);

    const possession = [
      find(['possession', 'possession-percentage', 'ball_possession', 'possession_percentage'], 'Possesso Palla'),
      find(['passes', 'total_passes'], 'Passaggi Totali'),
      find(['accurate-pass-percentage', 'pass_accuracy', 'accurate_pass_percentage', 'passes_accuracy'], 'Precisione Passaggi'),
      find(['key-passes', 'key_passes'], 'Key Passes'),
      find(['crosses', 'total_cross'], 'Cross'),
    ].filter(Boolean);

    const defense = [
      find(['clearances', 'total_clearance'], 'Spazzate (Clearances)'),
      find(['blocked-shots', 'blocked_shots'], 'Tiri Rimpallati'),
      find(['offsides', 'offside'], 'Fuorigioco'),
    ].filter(Boolean);

    const duels = [
      find(['duels-won', 'duels_won', 'won_contest'], 'Duelli Vinti'),
      find(['tackles', 'total_tackle'], 'Tackle'),
    ].filter(Boolean);

    const discipline = [
      find(['fouls', 'fouls_committed', 'fouls_total'], 'Falli Commessi'),
      find(['yellow-cards', 'yellow_cards', 'total_yellow_card'], 'Ammonizioni'),
      find(['red-cards', 'red_cards', 'total_red_card'], 'Espulsioni'),
    ].filter(Boolean);

    const physical = [
      find(['corners', 'corner_taken', 'corners_total'], 'Calci d\'Angolo'),
    ].filter(Boolean);

    const goalkeeping = [
      find(['saves', 'total_saves', 'saves_total'], 'Parate / Salvataggi'),
    ].filter(Boolean);

    return { attack, possession, defense, duels, discipline, physical, goalkeeping };
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
                      <div className="flex justify-end pr-4 w-[42%]">
                        <TeamLogo team={home} className="w-10 h-10 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className={`text-center font-black italic text-base tracking-tighter min-w-[70px] ${played ? 'text-white' : 'text-cyan-400'}`}>
                        {played ? `${hs} - ${as_}` : 'VS'}
                      </div>
                      <div className="flex justify-start pl-4 w-[42%]">
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

            {/* TAB SELECTOR */}
            <div className="flex overflow-x-auto no-scrollbar border-b border-white/5 bg-[#080808] shrink-0 custom-scrollbar">
              {[
                { id: 'eventi', label: 'Eventi' },
                { id: 'formazioni', label: 'Formazioni' },
                { id: 'club-stats', label: 'Statistiche Club' },
                { id: 'player-stats', label: 'Statistiche Giocatori' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setModalTab(tab.id)}
                  className={`px-5 py-4 whitespace-nowrap text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all relative
                  ${modalTab === tab.id ? 'text-cyan-400' : 'text-zinc-500 hover:text-white'}`}>
                  {tab.label}
                  {modalTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#050505]">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                    <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
                  </div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-[0.3em] font-black">Sincronizzazione dati...</p>
                </div>
              ) : matchDetails ? (
                <div className="pb-12 h-full">


                  {/* ====== TAB: EVENTI ====== */}
                  {(modalTab === 'eventi') && (
                     <section className="relative px-4 md:px-0">
                        <div className="bg-zinc-900/20 rounded-[3rem] p-8 md:p-12 border border-white/5 shadow-2xl backdrop-blur-sm">
                          <MatchTimeline detail={matchDetails} />
                        </div>
                     </section>
                  )}

                  {/* ====== TAB: STATISTICHE CLUB ====== */}
                  {(modalTab === 'club-stats') && (() => {
                    const statsGroups = buildStatsGroups(matchDetails.stats);
                    if (!statsGroups) return <div className="py-24 text-center"><span className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">Nessuna statistica disponibile</span></div>;

                    const StatRow = ({ stat }: { stat: any }) => {
                      if (stat.home == null && stat.away == null) return null;
                      const hasHome = typeof stat.home === 'number' && !isNaN(stat.home);
                      const hasAway = typeof stat.away === 'number' && !isNaN(stat.away);
                      if (!hasHome && !hasAway) return null;

                      const isPerc = stat.isPercent;
                      return (
                        <div className="flex justify-between items-center py-4 border-b border-white/5 group hover:bg-white/5 px-4 transition-colors last:border-0 relative">
                          <div className="absolute inset-y-0 left-0 w-1 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className={`text-sm md:text-base font-black w-24 text-center ${stat.home > stat.away && stat.home > 0 ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-zinc-300'}`}>
                            {hasHome ? `${stat.home}${isPerc ? '%' : ''}` : '-'}
                          </span>
                          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-zinc-500 group-hover:text-white transition-colors text-center px-4 flex-1">
                             {stat.label}
                          </span>
                          <span className={`text-sm md:text-base font-black w-24 text-center ${stat.away > stat.home && stat.away > 0 ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-zinc-300'}`}>
                            {hasAway ? `${stat.away}${isPerc ? '%' : ''}` : '-'}
                          </span>
                        </div>
                      );
                    };

                    const StatGroup = ({ title, stats, iconColor }: { title: string, stats: any[], iconColor: string }) => {
                      if (!stats || stats.length === 0) return null;
                      const validStats = stats.filter(s => (typeof s.home === 'number' && !isNaN(s.home)) || (typeof s.away === 'number' && !isNaN(s.away)));
                      if (validStats.length === 0) return null;

                      return (
                        <div className="mb-10 last:mb-0 relative py-6">
                          <h4 className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 ${iconColor} mb-6 bg-[#050505] w-full py-4 px-6 rounded-[2rem] border border-white/5 shadow-inner`}>
                             <span className={`w-2 h-2 rounded-full shadow-lg bg-current drop-shadow-md`} />
                             {title}
                          </h4>
                          <div className="flex flex-col bg-[#080808]/80 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                            {validStats.map((stat: any, i: number) => <StatRow key={i} stat={stat} />)}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <section className="relative px-4 md:px-0 max-w-4xl mx-auto">
                        <div className="bg-zinc-900/40 rounded-[3rem] p-6 md:p-12 border border-white/10 shadow-3xl">
                          <div className="flex justify-between items-center mb-8 px-8 opacity-50">
                             <TeamLogo team={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa')} className="w-10 h-10 grayscale" />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Confronto Statistiche</span>
                             <TeamLogo team={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite')} className="w-10 h-10 grayscale" />
                          </div>
                          <StatGroup title="Attacco" stats={statsGroups.attack} iconColor="text-orange-400" />
                          <StatGroup title="Possesso e Passaggi" stats={statsGroups.possession} iconColor="text-cyan-400" />
                          <StatGroup title="Difesa" stats={statsGroups.defense} iconColor="text-blue-500" />
                          <StatGroup title="Duelli" stats={statsGroups.duels} iconColor="text-purple-400" />
                          <StatGroup title="Disciplina" stats={statsGroups.discipline} iconColor="text-yellow-400" />
                          <StatGroup title="Portiere" stats={statsGroups.goalkeeping} iconColor="text-emerald-400" />
                          <StatGroup title="Fisico / Avanzate" stats={statsGroups.physical} iconColor="text-red-500" />
                        </div>
                      </section>
                    );
                  })()}

                  {/* ====== TAB: FORMAZIONI ====== */}
                  {(modalTab === 'formazioni') && matchDetails.lineups && (() => {
                    const homeTeam = resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa');
                    const awayTeam = resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite');
                    const homeLineup = matchDetails.lineups.home;
                    const awayLineup = matchDetails.lineups.away;

                    const renderPlayer = (p: any, isSub: boolean = false) => {
                      const subInEvent = p.events?.find((e: any) => e.type === 'substitution-in');
                      const subOutEvent = p.events?.find((e: any) => e.type === 'substitution-out');
                      const goals = p.events?.filter((e: any) => e.type.match(/goal/)).length || 0;
                      const yellow = p.events?.some((e: any) => e.type === 'yellow-card');
                      const red = p.events?.some((e: any) => e.type === 'red-card');

                      return (
                        <div key={p.playerId || p.id} className="flex items-center gap-3 py-1.5 px-2 hover:bg-white/5 rounded-lg transition-colors group">
                           <div className="w-6 h-6 rounded bg-zinc-800 border border-white/10 flex items-center justify-center text-[9px] font-black text-zinc-400 shrink-0 shadow-inner">
                             {p.jerseyNumber || '-'}
                           </div>
                           <div className="flex flex-col flex-1 min-w-0">
                             <span className={`text-[11px] md:text-xs font-black uppercase tracking-widest truncate ${isSub && !subInEvent ? 'text-zinc-500' : 'text-zinc-100'} group-hover:text-cyan-400 transition-colors`}>
                               {p.displayName || p.shortName || p.shirtName || getDisplayPlayerName(p).split(' ').pop()}
                             </span>
                           </div>
                           <div className="flex items-center gap-1.5 shrink-0">
                             {subOutEvent && <span className="text-red-500 text-[10px] font-bold leading-none" title="Sub Out">↓</span>}
                             {subInEvent && <span className="text-emerald-500 text-[10px] font-bold leading-none" title="Sub In">↑</span>}
                             {goals > 0 && Array(goals).fill(0).map((_, i) => <span key={i} className="text-[10px] drop-shadow-md">⚽</span>)}
                             {yellow && <div className="w-2 h-3 bg-yellow-400 rounded-sm border border-yellow-600/50 shadow-sm" />}
                             {red && <div className="w-2 h-3 bg-red-500 rounded-sm border border-red-700/50 shadow-sm" />}
                           </div>
                        </div>
                      );
                    };

                    const renderColumn = (team: any, lineup: any) => {
                      if (!lineup) return <div className="flex-1 bg-zinc-900/10 rounded-[2.5rem] border border-white/5" />;
                      return (
                        <div className="flex-1 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-6 backdrop-blur-sm shadow-2xl">
                          <div className="flex flex-col items-center gap-3 border-b border-white/10 pb-6 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full pointer-events-none" />
                            <TeamLogo team={team} className="w-16 h-16 drop-shadow-md hover:scale-105 transition-transform" />
                            <h3 className="uppercase font-black tracking-widest text-[13px] md:text-sm text-center text-white/90">{team.name}</h3>
                            {lineup.formation && (
                              <span className="text-[10px] font-black tracking-[0.2em] bg-white/5 px-4 py-1.5 rounded-full text-cyan-400 uppercase border border-cyan-500/10 shadow-inner">
                                {lineup.formation}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-1 z-10">
                            <h4 className="text-[9px] uppercase tracking-[0.3em] font-black text-zinc-500 mb-3 pl-2 flex items-center gap-2">
                               <div className="w-1 h-1 rounded-full bg-cyan-500" /> Titolari
                            </h4>
                            {(lineup.fielded || []).map((p: any) => renderPlayer(p, false))}
                          </div>

                          <div className="flex flex-col gap-1 mt-6 z-10">
                            <h4 className="text-[9px] uppercase tracking-[0.3em] font-black text-zinc-500 mb-3 pl-2 flex items-center gap-2">
                               <div className="w-1 h-1 rounded-full bg-orange-400" /> Panchina
                            </h4>
                            {(lineup.benched || []).map((p: any) => renderPlayer(p, true))}
                          </div>

                          {lineup.coach && (
                            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between px-3 bg-white/[0.02] rounded-2xl p-4">
                               <span className="text-[9px] uppercase tracking-[0.3em] font-black text-zinc-500">All.</span>
                               <span className="text-[11px] font-black uppercase text-white tracking-widest">{getDisplayPlayerName({player: lineup.coach})}</span>
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <section className="relative px-4 md:px-0">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 max-w-4xl mx-auto">
                          {renderColumn(homeTeam, homeLineup)}
                          {renderColumn(awayTeam, awayLineup)}
                        </div>
                      </section>
                    );
                  })()}

                  {/* ====== TAB: STATISTICHE GIOCATORI ====== */}
                  {modalTab === 'player-stats' && (() => {
                     const PlayerStatsTable = ({ players, teamName }: { players: any[], teamName: string }) => {
                       if (!players || players.length === 0) return null;
                       
                       const getStat = (p: any, keys: string[], suffix = '') => {
                         if (!p.stats) return '-';
                         for (const k of keys) {
                           if (p.stats[k] !== undefined && p.stats[k] !== null) return `${p.stats[k]}${suffix}`;
                         }
                         return '-';
                       };

                       const activePlayers = players.filter(p => {
                         const played = p.stats?.mins_played || p.stats?.minutesPlayed || p.stats?.minutes_played;
                         const subIn = p.events?.some((e: any) => e.type === 'substitution-in');
                         const wasFielded = p.tacticalXPosition != null;
                         return played > 0 || subIn || wasFielded;
                       });

                       if (activePlayers.length === 0) return null;

                       return (
                         <div className="bg-zinc-900/20 rounded-[2.5rem] p-6 md:p-10 border border-white/5 shadow-2xl backdrop-blur-sm mb-8 overflow-hidden">
                           <h4 className="text-[12px] font-black uppercase text-cyan-400 tracking-widest mb-6 flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-lg" />
                             {teamName}
                           </h4>
                           <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                             <table className="w-full text-left border-collapse min-w-[1000px]">
                               <thead>
                                 <tr className="border-b border-white/10 text-[8.5px] uppercase tracking-[0.2em] text-zinc-500 font-black">
                                   <th className="py-3 px-3 sticky left-0 bg-[#0c1210] z-10 w-48 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">Giocatore</th>
                                   <th className="py-3 px-3 text-center">Minuti</th>
                                   <th className="py-3 px-2 text-center text-cyan-400">Gol</th>
                                   <th className="py-3 px-2 text-center text-emerald-400">Assist</th>
                                   <th className="py-3 px-3 text-center">Tiri (In P.)</th>
                                   <th className="py-3 px-3 text-center">Occasioni</th>
                                   <th className="py-3 px-3 text-center">Pass. (%)</th>
                                   <th className="py-3 px-3 text-center">Tocchi</th>
                                   <th className="py-3 px-3 text-center">Duelli V.</th>
                                   <th className="py-3 px-3 text-center">Tackle</th>
                                   <th className="py-3 px-3 text-center text-red-400">Falli</th>
                                   <th className="py-3 px-3 text-center text-orange-400">Parate</th>
                                 </tr>
                               </thead>
                               <tbody className="text-[11px] font-medium text-zinc-300">
                                 {activePlayers.map(p => {
                                   const goals = p.events?.filter((e: any) => e.type.match(/goal/) && e.type !== 'own-goal').length || 0;
                                   const assists = p.stats?.assists || p.stats?.goal_assist || 0;
                                   const yellow = p.events?.some((e: any) => e.type === 'yellow-card');
                                   const red = p.events?.some((e: any) => e.type === 'red-card');
                                   
                                   const tiri = getStat(p, ['shots', 'total_scoring_att', 'total_shots', 'shots_total']);
                                   const tiriPorta = getStat(p, ['shots-on-target', 'shots_on_target', 'ontarget_scoring_att', 'shots_on_goal']);
                                   
                                   const passaggi = getStat(p, ['passes', 'total_passes']);
                                   const passPerc = getStat(p, ['accurate-pass-percentage', 'pass_accuracy', 'accurate_pass_percentage', 'passes_accuracy'], '%');
                                   
                                   const chiavi = getStat(p, ['key_passes', 'big_chance_created', 'chances_created']);
                                   const tocchi = getStat(p, ['touches', 'ball_recovery']);
                                   const parate = getStat(p, ['saves', 'total_saves', 'saves_total']);
                                   
                                   return (
                                     <tr key={p.playerId || p.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group">
                                       <td className="py-3 px-3 sticky left-0 bg-[#0a0f0d] group-hover:bg-[#111815] transition-colors z-10 font-black uppercase tracking-wider text-white flex items-center gap-3 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                                         <div className="w-6 h-6 rounded bg-zinc-800 border border-white/10 flex items-center justify-center text-[9px] shrink-0 text-zinc-400">
                                           {p.jerseyNumber || '-'}
                                         </div>
                                         <div className="flex flex-col min-w-0">
                                           <span className="truncate" title={getDisplayPlayerName(p)}>
                                             {p.displayName || p.shortName || p.shirtName || getDisplayPlayerName(p)}
                                           </span>
                                           <div className="flex gap-1 mt-0.5 items-center">
                                             {yellow && <div className="w-1.5 h-2 bg-yellow-400 rounded-sm" />}
                                             {red && <div className="w-1.5 h-2 bg-red-500 rounded-sm" />}
                                           </div>
                                         </div>
                                       </td>
                                       <td className="py-3 px-3 text-center font-bold text-zinc-500">{getStat(p, ['mins_played', 'minutesPlayed', 'minutes_played'])}</td>
                                       <td className="py-3 px-2 text-center font-bold text-cyan-400">{goals > 0 ? goals : '-'}</td>
                                       <td className="py-3 px-2 text-center font-bold text-emerald-400">{assists > 0 ? assists : '-'}</td>
                                       <td className="py-3 px-3 text-center font-bold">{tiri !== '-' ? `${tiri} (${tiriPorta})` : '-'}</td>
                                       <td className="py-3 px-3 text-center font-bold text-yellow-400">{chiavi !== '-' && chiavi !== '0' ? chiavi : '-'}</td>
                                       <td className="py-3 px-3 text-center font-bold">{passaggi !== '-' ? `${passaggi} (${passPerc})` : '-'}</td>
                                       <td className="py-3 px-3 text-center font-bold text-zinc-400">{tocchi}</td>
                                       <td className="py-3 px-3 text-center font-bold">{getStat(p, ['won_contest', 'duels-won', 'duels_won'])}</td>
                                       <td className="py-3 px-3 text-center font-bold">{getStat(p, ['tackles', 'total_tackle'])}</td>
                                       <td className="py-3 px-3 text-center font-bold text-red-400/80">{getStat(p, ['fouls', 'fouls_committed', 'fouls_total'])}</td>
                                       <td className="py-3 px-3 text-center font-bold text-orange-400">{p.role === 1 ? parate : '-'}</td>
                                     </tr>
                                   );
                                 })}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       );
                     };

                     const homeRos = [...(matchDetails.lineups?.home?.fielded || []), ...(matchDetails.lineups?.home?.benched || [])];
                     const awayRos = [...(matchDetails.lineups?.away?.fielded || []), ...(matchDetails.lineups?.away?.benched || [])];

                     return (
                       <section className="relative px-0">
                         <PlayerStatsTable players={homeRos} teamName={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} />
                         <PlayerStatsTable players={awayRos} teamName={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} />
                       </section>
                     );
                  })()}



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
