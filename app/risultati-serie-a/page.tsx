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
  Udinese: 'https://tmssl.akamaized.net/images/wappen/head/410.png',
  Lecce: 'https://tmssl.akamaized.net/images/wappen/head/1005.png',
  Verona: 'https://tmssl.akamaized.net/images/wappen/head/276.png',
  Cagliari: 'https://tmssl.akamaized.net/images/wappen/head/1390.png',
  Parma: 'https://tmssl.akamaized.net/images/wappen/head/130.png',
  Sassuolo: 'https://tmssl.akamaized.net/images/wappen/head/6574.png',
  Como: 'https://tmssl.akamaized.net/images/wappen/head/1047.png',
  Pisa: 'https://tmssl.akamaized.net/images/wappen/head/4172.png',
  Monza: 'https://tmssl.akamaized.net/images/wappen/head/2919.png',
  Empoli: 'https://tmssl.akamaized.net/images/wappen/head/749.png',
  Venezia: 'https://tmssl.akamaized.net/images/wappen/head/607.png',
  Cremonese: 'https://tmssl.akamaized.net/images/wappen/head/2239.png',
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
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  if (
    cleanPath.startsWith('clubLogos') || 
    cleanPath.startsWith('teamImages') || 
    cleanPath.startsWith('teamLogoLight') || 
    cleanPath.startsWith('stadiums')
  ) {
    return `https://img.legaseriea.it/vimages/${cleanPath}`;
  }
  
  return null;
};

const getTeamLogoUrls = (team: any): string[] => {
  if (!team || typeof team !== 'object') return [];

  const rawId = team.teamId || team.id || team.providerId;
  const idToUse = typeof rawId === 'string' && rawId.includes('::') ? rawId.split('::').pop() : rawId;

  const teamName = team.name || team.shortName || team.officialName;
  const normalized = normalizeTeamName(teamName);

  const urls = [
    team.imagery?.teamLogoLight ? resolveImageUrl(team.imagery.teamLogoLight.replace('_light', 'light')) : null,
    idToUse ? `https://img.legaseriea.it/vimages/clubLogos/${idToUse}light.webp` : null,
    team.imagery?.teamLogo ? resolveImageUrl(team.imagery.teamLogo) : null,
    idToUse ? `https://img.legaseriea.it/vimages/clubLogos/${idToUse}.webp` : null,
    normalized ? TEAM_LOGOS[normalized] : null,
    teamName ? TEAM_LOGOS[teamName] : null
  ];

  return Array.from(new Set(urls.filter((u): u is string => typeof u === 'string')));
};

const getTeamLogoUrl = (team: any) => getTeamLogoUrls(team)[0] || null;

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
  const [imgIndex, setImgIndex] = useState(0);
  const urls = getTeamLogoUrls(team);
  const src = imgIndex < urls.length ? urls[imgIndex] : null;

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
        setImgIndex(prev => prev + 1);
      }}
    />
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
    return { left: `${xPos}%`, top: `${yPos}%` };
  };

const getPlayerImageUrl = (p: any, sId?: string, tId?: string, forceSide: string = 'home') => {
  if (!p) return null;
  const directFields = [
    'playerImagehomeleft', 'playerImagehomemiddle', 'playerImagehomeceleb',
    'playerImageawayleft', 'playerImageawaymiddle', 'playerImageawayceleb',
    'image', 'photo', 'pictureUrl', 'imageUrl'
  ];
  for (const field of directFields) {
    if (typeof p[field] === 'string' && p[field].startsWith('http')) return p[field];
  }
  if (p.details) {
    for (const field of directFields) {
      if (typeof p.details[field] === 'string' && p.details[field].startsWith('http')) return p.details[field];
    }
  }
  const pId = (p.playerId || p.id || '')?.split('::').pop();
  if (sId && tId && pId) {
    return `https://media-sdp.legaseriea.it/playerImages/ec93b94f74294dc98ab5bcfd67fc0d88/${sId}/${tId}/${forceSide}/${pId}left.webp`;
  }
  return null;
};

  const CombinedTacticalPitch = ({ matchDetails, homeTeam, awayTeam }: any) => {
    if (!matchDetails?.lineups?.home?.fielded || !matchDetails?.lineups?.away?.fielded) return null;

    const homeLineup = matchDetails.lineups.home;
    const awayLineup = matchDetails.lineups.away;

    const rolesHome: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
    homeLineup.fielded.forEach((p: any) => {
      if (rolesHome[p.role]) rolesHome[p.role].push(p); else rolesHome[3].push(p);
    });

    const rolesAway: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
    awayLineup.fielded.forEach((p: any) => {
      if (rolesAway[p.role]) rolesAway[p.role].push(p); else rolesAway[3].push(p);
    });

    const renderPlayer = (p: any, side: 'home'|'away', roleArray: any[]) => {
      const roleIndex = roleArray.findIndex(x => x.playerId === p.playerId);
      const pos = getPlayerPosition(p, roleIndex, roleArray.length);
      
      let top = pos.top;
      let left = pos.left;
      
      if (side === 'away') {
         const y = parseFloat(pos.top);
         const x = parseFloat(pos.left);
         top = `${100 - y}%`;
         left = `${100 - x}%`;
      } else {
         if (typeof p.tacticalYPosition !== 'number') {
            const y = parseFloat(pos.top);
            top = `${50 + (y / 2)}%`;
         }
      }

      if (side === 'away' && typeof p.tacticalYPosition !== 'number') {
         const y = parseFloat(pos.top); 
         top = `${50 - (y / 2)}%`;
      }

      const goals = p.events?.filter((e: any) => e.type && e.type.includes('goal')).length || 0;
      const yellow = p.events?.some((e: any) => e.type === 'yellow-card');
      const red = p.events?.some((e: any) => e.type === 'red-card');

      const PitchPlayerImage = () => {
         const [err, setErr] = useState(false);
         const sId = matchDetails?.header?.seasonId?.split('::').pop();
         const tId = (side === 'home' ? homeTeam?.teamId || homeTeam?.id : awayTeam?.teamId || awayTeam?.id)?.split('::').pop();

         const url = getPlayerImageUrl(p, sId, tId, 'home');

         if (err || !url) {
            return (
               <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full shadow-lg border-2 transition-colors shrink-0
                 ${side === 'home' ? 'bg-cyan-500 border-white drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-white border-zinc-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'}`} />
            );
         }

         return (
            <img 
               src={url}
               onError={() => setErr(true)}
               className={`w-6 h-6 md:w-8 md:h-8 rounded-full shadow-lg border-2 object-cover shrink-0 bg-zinc-800
                 ${side === 'home' ? 'border-cyan-500/80 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'border-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'}`}
               alt={p.displayName || p.shortName || 'Player'}
            />
         );
      };

      return (
        <div key={p.playerId || p.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20 group transition-transform duration-500 hover:scale-125 hover:z-30" style={{ left, top }}>
          <div className="relative flex justify-center mt-1">
            <PitchPlayerImage />
            <div className="absolute -top-1 -right-3 flex flex-col gap-0.5">
              {goals > 0 && Array(goals).fill(0).map((_, i) => <span key={i} className="text-[10px] md:text-[12px] drop-shadow-md z-30">⚽</span>)}
              {red ? <div className="w-1.5 h-2 bg-red-500 rounded-sm border border-red-700 shadow-sm z-30" /> : yellow ? <div className="w-1.5 h-2 bg-yellow-400 rounded-sm border border-yellow-600 shadow-sm z-30" /> : null}
            </div>
          </div>
          <div className="mt-0.5 whitespace-nowrap flex flex-col items-center bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded outline outline-1 outline-white/5">
            <span className="text-[8px] md:text-[9px] font-black uppercase text-white tracking-widest text-shadow-sm drop-shadow-md truncate max-w-[70px] md:max-w-[90px]">
              {p.displayName || p.shortName || p.shirtName || getDisplayPlayerName(p).split(' ').pop()}
            </span>
          </div>
        </div>
      );
    };

    return (
      <div className="w-full max-w-4xl mx-auto flex-1 border border-white/5 rounded-[2.5rem] p-6 md:p-10 bg-[#060606] shadow-2xl relative overflow-hidden aspect-[3/4] md:aspect-[4/3] lg:aspect-auto lg:h-[700px]">
        {homeLineup.coach && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">All.</span>
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-500/10 shadow-sm">{getDisplayPlayerName({player: homeLineup.coach})}</span>
          </div>
        )}
        {awayLineup.coach && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">All.</span>
            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10 shadow-sm">{getDisplayPlayerName({player: awayLineup.coach})}</span>
          </div>
        )}
        
        <div className="relative w-full h-full bg-gradient-to-b from-[#0a180d] via-[#112a17] to-[#0a180d] rounded-[2rem] border-8 border-[#0c1a10] overflow-hidden mt-0 shadow-[0_15px_60px_-15px_rgba(34,197,94,0.1)]">
          {/* Pitch Lines */}
          <div className="absolute inset-x-8 inset-y-8 border-2 border-white/10 rounded-xl" />
          <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-white/10 -translate-y-1/2" />
          <div className="absolute left-1/2 top-1/2 w-40 h-40 border-2 border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          {/* Home Area (Bottom) */}
          <div className="absolute left-1/2 bottom-8 w-64 h-32 border-2 border-white/10 border-b-0 -translate-x-1/2" />
          <div className="absolute left-1/2 bottom-8 w-24 h-12 border-2 border-white/10 border-b-0 -translate-x-1/2" />
          <div className="absolute left-1/2 bottom-[calc(2rem+32px)] w-24 h-16 border-2 border-white/10 border-b-0 -translate-x-1/2 rounded-t-full scale-y-50 origin-bottom opacity-50" />

          {/* Away Area (Top) */}
          <div className="absolute left-1/2 top-8 w-64 h-32 border-2 border-white/10 border-t-0 -translate-x-1/2" />
          <div className="absolute left-1/2 top-8 w-24 h-12 border-2 border-white/10 border-t-0 -translate-x-1/2" />
          <div className="absolute left-1/2 top-[calc(2rem+32px)] w-24 h-16 border-2 border-white/10 border-t-0 -translate-x-1/2 rounded-b-full scale-y-50 origin-top opacity-50" />
          
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/60" />
          
          {homeLineup.fielded.map((p: any) => renderPlayer(p, 'home', rolesHome[p.role] || rolesHome[3]))}
          {awayLineup.fielded.map((p: any) => renderPlayer(p, 'away', rolesAway[p.role] || rolesAway[3]))}
        </div>
      </div>
    );
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

            const goals = p.events?.filter((e: any) => e.type && e.type.includes('goal')).length || 0;
            const yellow = p.events?.some((e: any) => e.type === 'yellow-card');
            const red = p.events?.some((e: any) => e.type === 'red-card');

            return (
              <div key={p.playerId || p.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20 group transition-transform duration-500 hover:scale-110 hover:z-30" style={{ left: pos.left, top: pos.top }}>
                <div className="relative flex justify-center mt-1">
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full shadow-lg border-2 transition-colors
                    ${side === 'home' ? 'bg-cyan-500 border-white drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-white border-zinc-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'}`} />
                  <div className="absolute -top-1 -right-3 flex flex-col gap-0.5">
                    {goals > 0 && Array(goals).fill(0).map((_, i) => <span key={i} className="text-[10px] md:text-[14px] drop-shadow-md">⚽</span>)}
                    {red ? <div className="w-1.5 h-2 bg-red-500 rounded-sm border border-red-700 shadow-sm" /> : yellow ? <div className="w-1.5 h-2 bg-yellow-400 rounded-sm border border-yellow-600 shadow-sm" /> : null}
                  </div>
                </div>
                <div className="mt-0.5 whitespace-nowrap flex flex-col items-center bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded outline outline-1 outline-white/5">
                  <span className="text-[7.5px] md:text-[9.5px] font-black uppercase text-white tracking-widest text-shadow-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate max-w-[60px] md:max-w-[70px]">
                    {p.displayName || p.shortName || p.shirtName || getDisplayPlayerName(p).split(' ').pop()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  export default function ScoutHub() {
  const [activeTab, setActiveTab]           = useState('calendario');
  const [selectedRound, setSelectedRound]   = useState<number>(30);
  const [matches, setMatches]               = useState<any[]>([]);
  const [standings, setStandings]           = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchError, setMatchError]         = useState<string | null>(null);
  const [modalFixture, setModalFixture]     = useState<any>(null);
  const [matchDetails, setMatchDetails]     = useState<any>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [matchDetailsError, setMatchDetailsError] = useState<string | null>(null);
  const [loadingModal, setLoadingModal]     = useState(false);
  const [modalTab, setModalTab]             = useState('eventi');
  const scrollRef = useRef<HTMLDivElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalScrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [modalTab]);

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
      .catch(() => null)
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


  useEffect(() => {
    fetch('/api/football?endpoint=matchdays')
      .then(r => r.json())
      .then(res => {
         const matchdays = res.data || [];
         const live = matchdays.find((md: any) => md.matchdayStatus === "Playing");
         const lastPlayed = matchdays
           .filter((md: any) => md.matchdayStatus === "Played")
           .sort((a: any, b: any) => new Date(b.endDateUtc).getTime() - new Date(a.endDateUtc).getTime())[0];
         const nextScheduled = matchdays
           .filter((md: any) => md.matchdayStatus === "Scheduled")
           .sort((a: any, b: any) => new Date(a.startDateUtc).getTime() - new Date(b.startDateUtc).getTime())[0];
         
         const active = live || lastPlayed || nextScheduled;
         if (active && active.round) {
            setSelectedRound(active.round);
            loadRound(active.round);
         } else {
            loadRound(30);
         }
      })
      .catch(() => loadRound(30));
  }, [loadRound]);

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
      const seasonId = m.seasonId || m.competition?.seasonId || m.competitionId || m.matchSet?.seasonId || 'serie-a::Football_Season::5f0e080fc3a44073984b75b3a8e06a8a';
      const res = await fetch(`/api/football?endpoint=match&id=${encodeURIComponent(matchId)}&seasonId=${encodeURIComponent(seasonId)}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'API Match: risposta non OK');
      setMatchDetails(json.data);
    } catch (err: any) {
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
    // console.log('rawStats before normalization:', rawStats);
    const result = { home: [] as any[], away: [] as any[] };
    
    if (!rawStats || typeof rawStats !== 'object') {
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
    } else if (rawStats.stats) {
      const arr = extractArray(rawStats.stats);
      arr.forEach((s: any) => {
        const valH = s.statsValueHome ?? s.home ?? s.homeValue ?? s.homeTeamValue ?? s.value ?? s.statsValue;
        const valA = s.statsValueAway ?? s.away ?? s.awayValue ?? s.awayTeamValue ?? s.value ?? s.statsValue;
        result.home.push({ ...s, statsValue: valH, value: valH });
        result.away.push({ ...s, statsValue: valA, value: valA });
      });
    } else if (rawStats.home || rawStats.away) {
      result.home = extractArray(rawStats.home);
      result.away = extractArray(rawStats.away);
    } else if (rawStats.teamstats?.home || rawStats.teamstats?.away) {
      result.home = extractArray(rawStats.teamstats.home);
      result.away = extractArray(rawStats.teamstats.away);
    } else if (Array.isArray(rawStats.teamstats)) {
      if (rawStats.teamstats.length === 2 && rawStats.teamstats[0].stats) {
        result.home = extractArray(rawStats.teamstats[0].stats);
        result.away = extractArray(rawStats.teamstats[1].stats);
      }
    } else if (Array.isArray(rawStats)) {
      if (rawStats.length === 2 && (rawStats[0].stats || rawStats[0].teamId)) {
         result.home = extractArray(rawStats[0].stats || rawStats[0]);
         result.away = extractArray(rawStats[1].stats || rawStats[1]);
      } else {
         rawStats.forEach((s: any) => {
           const valH = s.statsValueHome ?? s.home ?? s.homeValue ?? s.homeTeamValue ?? s.value ?? s.statsValue;
           const valA = s.statsValueAway ?? s.away ?? s.awayValue ?? s.awayTeamValue ?? s.value ?? s.statsValue;
           result.home.push({ ...s, statsValue: valH, value: valH });
           result.away.push({ ...s, statsValue: valA, value: valA });
         });
      }
    }

    if (!Array.isArray(result.home)) result.home = [];
    if (!Array.isArray(result.away)) result.away = [];

    // console.log('normalizedStats final:', result);
    return result;
  };

  const buildStatsGroups = (rawStatsPayload: any) => {
    let statsArray: any[] = [];
    if (Array.isArray(rawStatsPayload)) {
      statsArray = rawStatsPayload;
    } else if (rawStatsPayload?.stats && Array.isArray(rawStatsPayload.stats)) {
      statsArray = rawStatsPayload.stats;
    }

    if (statsArray.length === 0) return [];

    const map: Record<string, any> = {};
    statsArray.forEach(s => {
       const id = (s.statsId || s.id || s.name || '').toLowerCase();
       map[id] = {
          label: s.statsLabel || s.label || id,
          home: s.statsValueHome !== undefined ? s.statsValueHome : s.value,
          away: s.statsValueAway !== undefined ? s.statsValueAway : s.value,
          isPercent: id.includes('perc') || String(s.statsLabel).includes('%')
       };
    });

    const findKey = (aliases: string[]) => {
      for (const a of aliases) {
        const key = a.toLowerCase();
        for (const mapKey of Object.keys(map)) {
           if (mapKey === key || mapKey.includes(key)) return mapKey;
        }
      }
      return null;
    };

    const find = (aliases: string[], label: string) => {
      const foundKey = findKey(aliases);
      if (foundKey) {
        return { ...map[foundKey], label };
      }
      return null;
    };

    const findPrecisePasses = () => {
        let stats = find(['accurate-pass-perc', 'passing-accuracy-perc', 'accuratepassespercentage'], 'Precisione passaggi');
        if (!stats) {
            const accPasses = findKey(['accurate-pass', 'accuratepass']);
            const totPasses = findKey(['total-passes', 'totalpass']);
            if (accPasses && totPasses) {
               const h = map[totPasses].home > 0 ? Math.round((map[accPasses].home / map[totPasses].home) * 100) : 0;
               const a = map[totPasses].away > 0 ? Math.round((map[accPasses].away / map[totPasses].away) * 100) : 0;
               return { label: 'Precisione passaggi', home: h, away: a, isPercent: true };
            }
        }
        return stats;
    };

    const attack = [
      find(['totalscoringatt', 'shots'], 'Tiri totali'),
      find(['ontargetscoringatt', 'shots_on_target', 'shots-on-target'], 'Tiri in porta'),
      find(['shotsofftarget', 'shots-off-target'], 'Tiri fuori'),
      find(['blockedscoringatt', 'blocked-shots'], 'Tiri bloccati'),
      find(['attemptsibox', 'shots-at-goal-inside-box'], 'Tiri da dentro area'),
      find(['attemptsobox', 'shots-at-goal-outside-box'], 'Tiri da fuori area'),
      find(['goals', 'goal'], 'Gol'),
      find(['expectedgoals', 'expected-goals'], 'Expected Goals (xG)'),
    ].filter(Boolean);

    const passes = [
      find(['totalpass', 'total-passes', 'pass-attempts'], 'Passaggi totali'),
      find(['accuratepass', 'passes-successful', 'passes-completed'], 'Passaggi riusciti'),
      findPrecisePasses(),
      find(['keypass', 'key-passes', 'keypasses', 'chances-created'], 'Passaggi chiave'),
      find(['totalcross', 'crosses', 'openplaycross'], 'Cross'),
      find(['cornertaken', 'corners'], 'Corner'),
      find(['totallongballs', 'long-balls'], 'Lanci lunghi'),
      find(['totalfinalthirdpasses', 'successfulfinalthirdpasses'], "Passaggi nell'ultimo terzo"),
    ].filter(Boolean);

    const defense = [
      find(['totaltackle', 'tackles-total', 'tackles'], 'Contrasti'),
      find(['wontackle', 'tackles-successful'], 'Contrasti vinti'),
      find(['interception', 'interceptions'], 'Intercetti'),
      find(['ballrecovery', 'recoveries'], 'Recuperi'),
      find(['wasfouled', 'fouls-suffered'], 'Falli subiti'),
      find(['fouls', 'fouls_committed', 'fouls_total', 'foulsconceded'], 'Falli commessi'),
      find(['totaloffside', 'offsides'], 'Fuorigioco'),
      find(['saves', 'saves_total', 'total_saves'], 'Salvataggi portiere'),
    ].filter(Boolean);

    const general = [
      find(['possession-perc', 'possessionpercentage'], 'Possesso Palla'),
      find(['totalcontest', 'duels'], 'Duelli totali'),
      find(['woncontest', 'duels-won'], 'Duelli vinti'),
      find(['totalballsplayed', 'dribbles'], 'Dribbling tentati'),
      find(['succdribblingperc', 'dribbling-successful'], 'Dribbling riusciti'),
      find(['totalyellowcard', 'yellow-cards', 'yellowcard'], 'Cartellini gialli'),
      find(['totalredcard', 'red-cards'], 'Cartellini rossi'),
      find(['free-kicks', 'freekickpass'], 'Calci di punizione'),
      find(['totalthrows', 'accurate-throws'], 'Rimesse laterali'),
    ].filter(Boolean);

    return [
      { title: 'Attacco', stats: attack, iconColor: 'text-orange-400' },
      { title: 'Passaggi', stats: passes, iconColor: 'text-cyan-400' },
      { title: 'Difesa', stats: defense, iconColor: 'text-blue-500' },
      { title: 'Generali', stats: general, iconColor: 'text-purple-400' }
    ].filter(g => g.stats && g.stats.length > 0);
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

            <div ref={modalScrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#050505]">
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
                      const hVal = stat.home;
                      const aVal = stat.away;
                      
                      if ((hVal === null || hVal === undefined) && (aVal === null || aVal === undefined)) return null;
                      if ((hVal === 0 || hVal === '0') && (aVal === 0 || aVal === '0')) return null;

                      const hasHome = typeof hVal === 'number' && !isNaN(hVal);
                      const hasAway = typeof aVal === 'number' && !isNaN(aVal);
                      
                      const homeColor = modalFixture.homeTeam?.color || modalFixture.home?.color || 'rgba(255, 255, 255, 0.85)';
                      const awayColor = modalFixture.awayTeam?.color || modalFixture.away?.color || 'rgba(160, 160, 160, 0.65)';

                      let homePct = 50;
                      let awayPct = 50;
                      const isPerc = stat.isPercent;

                      if (isPerc) {
                         homePct = hVal || 0;
                         awayPct = 100 - homePct; // garantiamo proporzione
                      } else {
                         const total = (hVal || 0) + (aVal || 0);
                         if (total > 0) {
                            homePct = (hVal / total) * 100;
                            awayPct = (aVal / total) * 100;
                         } else {
                            if ((hVal === 0) && (aVal === 0)) return null; 
                         }
                      }

                      return (
                        <div className="flex flex-col py-4 border-b border-white/5 group hover:bg-white/5 px-4 transition-colors last:border-0 relative">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-sm md:text-base font-black w-24 text-left" style={{ color: hVal > aVal ? homeColor : '#cbd5e1' }}>
                               {hasHome ? `${hVal}${isPerc ? '%' : ''}` : '-'}
                             </span>
                             <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-zinc-500 group-hover:text-white transition-colors text-center px-4 flex-1">
                                {stat.label}
                             </span>
                             <span className="text-sm md:text-base font-black w-24 text-right" style={{ color: aVal > hVal ? awayColor : '#cbd5e1' }}>
                               {hasAway ? `${aVal}${isPerc ? '%' : ''}` : '-'}
                             </span>
                          </div>
                          
                          <div className="flex items-center w-full max-w-[280px] mx-auto opacity-80 group-hover:opacity-100 transition-opacity">
                             <div className="flex-1 h-[4px] bg-white/10 rounded-full overflow-hidden flex" style={{ display: 'flex', width: '100%' }}>
                                <div className="h-full" style={{ width: `${homePct}%`, backgroundColor: homeColor }} />
                                <div className="h-full" style={{ width: `${awayPct}%`, backgroundColor: awayColor }} />
                             </div>
                          </div>
                        </div>
                      );
                    };

                    const StatGroup = ({ title, stats, iconColor }: { title: string, stats: any[], iconColor: string }) => {
                      if (!stats || stats.length === 0) return null;
                      const validStats = stats.filter(s => {
                         const h = s.home;
                         const a = s.away;
                         if ((h === null || h === undefined) && (a === null || a === undefined)) return false;
                         if ((h === 0 || h === '0') && (a === 0 || a === '0')) return false;
                         return (typeof h === 'number' && !isNaN(h)) || (typeof a === 'number' && !isNaN(a));
                      });
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
                          <div className="flex justify-between items-center mb-8 px-8 border-b border-white/5 pb-8">
                             <div className="flex flex-col items-center gap-3">
                               <TeamLogo team={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa')} className="w-12 h-12" />
                               <span className="text-[10px] font-black uppercase tracking-wider text-white">
                                  {resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name}
                               </span>
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 bg-white/5 px-4 py-1.5 rounded-full">Statistiche</span>
                             <div className="flex flex-col items-center gap-3">
                               <TeamLogo team={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite')} className="w-12 h-12" />
                               <span className="text-[10px] font-black uppercase tracking-wider text-white">
                                  {resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name}
                               </span>
                             </div>
                          </div>
                          
                          {statsGroups.length === 0 ? (
                             <div className="py-24 text-center">
                                <span className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">
                                   Nessun dato statistico disponibile
                                </span>
                             </div>
                          ) : (
                             statsGroups.map((group, idx) => (
                               <StatGroup key={idx} title={group.title} stats={group.stats} iconColor={group.iconColor} />
                             ))
                          )}
                        </div>
                      </section>
                    );
                  })()}

                  {/* ====== TAB: FORMAZIONI ====== */}
                  {(modalTab === 'formazioni') && matchDetails.lineups && (
                    <section className="relative px-4 md:px-0">
                      <div className="space-y-16">
                        <div className="flex flex-col lg:flex-row gap-8">
                          {/* Mobile Layout (separate pitches) */}
                          <div className="flex flex-col gap-8 lg:hidden w-full">
                            <div className="flex-1 flex flex-col gap-4">
                              <div className="flex items-center gap-4 justify-center bg-white/5 py-4 rounded-3xl border border-white/5 shadow-inner">
                                <TeamLogo team={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa')} className="w-8 h-8" />
                                <span className="text-[12px] font-black uppercase text-cyan-400 tracking-widest">{resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name}</span>
                              </div>
                              <TacticalPitch lineup={matchDetails.lineups.home} side="home" />
                            </div>
                            <div className="flex-1 flex flex-col gap-4">
                              <div className="flex items-center gap-4 justify-center bg-white/5 py-4 rounded-3xl border border-white/5 shadow-inner">
                                <span className="text-[12px] font-black uppercase text-white tracking-widest">{resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name}</span>
                                <TeamLogo team={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite')} className="w-8 h-8" />
                              </div>
                              <TacticalPitch lineup={matchDetails.lineups.away} side="away" />
                            </div>
                          </div>

                          {/* Desktop Layout (combined pitch) */}
                          <div className="hidden lg:flex w-full items-center justify-center">
                            <CombinedTacticalPitch 
                               matchDetails={matchDetails} 
                               homeTeam={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa')} 
                               awayTeam={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite')}
                             />
                          </div>
                        </div>

                        {/* ====== Panchina ====== */}
                        <div className="bg-zinc-900/40 rounded-[3rem] p-10 md:p-16 border border-white/10 shadow-3xl relative overflow-hidden mt-8">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                          <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-400 mb-16 text-center">Panchina</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 divide-y md:divide-y-0 md:divide-x divide-white/5">
                            {/* Casa Bench */}
                            <div className="space-y-6 pr-0 md:pr-10 pb-12 md:pb-0">
                               <div className="flex items-center gap-3 mb-6 bg-white/5 py-2 px-4 rounded-full w-fit">
                                 <TeamLogo team={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa')} className="w-5 h-5" />
                                 <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em]">Casa</p>
                               </div>
                                 <div className="flex flex-col gap-2">
                                   {(matchDetails.lineups?.home?.benched || [])
                                     .sort((a: any, b: any) => {
                                        const aIn = a.events?.some((e: any) => e.type === 'substitution-in');
                                        const bIn = b.events?.some((e: any) => e.type === 'substitution-in');
                                        return aIn === bIn ? 0 : aIn ? -1 : 1;
                                     })
                                     .map((p: any) => {
                                     const subInEvent = p.events?.find((e: any) => e.type === 'substitution-in');
                                     return (
                                       <div key={p.playerId || p.id} className="flex items-center gap-2">
                                         <span className={`text-[11px] font-black truncate uppercase tracking-widest ${subInEvent ? 'text-white' : 'text-zinc-500'}`}>{getDisplayPlayerName(p).split(' ').pop()}</span>
                                         {subInEvent && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
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
                                 <div className="flex flex-col gap-2 items-end text-right">
                                   {(matchDetails.lineups?.away?.benched || [])
                                     .sort((a: any, b: any) => {
                                        const aIn = a.events?.some((e: any) => e.type === 'substitution-in');
                                        const bIn = b.events?.some((e: any) => e.type === 'substitution-in');
                                        return aIn === bIn ? 0 : aIn ? -1 : 1;
                                     })
                                     .map((p: any) => {
                                     const subInEvent = p.events?.find((e: any) => e.type === 'substitution-in');
                                     return (
                                       <div key={p.playerId || p.id} className="flex items-center gap-2 justify-end">
                                         {subInEvent && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                         <span className={`text-[11px] font-black truncate uppercase tracking-widest ${subInEvent ? 'text-white' : 'text-zinc-500'}`}>{getDisplayPlayerName(p).split(' ').pop()}</span>
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

                  {/* ====== TAB: STATISTICHE GIOCATORI ====== */}
                  {modalTab === 'player-stats' && (() => {
                     const PlayerStatsTable = ({ players, teamName, side, teamObj }: { players: any[], teamName: string, side: 'home' | 'away', teamObj: any }) => {
                       if (!players || players.length === 0) return null;

                       const extractId = (raw: any) => typeof raw === 'string' && raw.includes('::') ? raw.split('::').pop() : raw;
                       
                       const PlayerImage = ({ p, className = '' }: { p: any, className?: string }) => {
                         const [err, setErr] = useState(false);
                         const tId = extractId(teamObj?.teamId || teamObj?.id || teamObj?.providerId);
                         const sId = extractId(modalFixture?.seasonId || matchDetails?.header?.seasonId);

                         const url = getPlayerImageUrl(p, sId, tId, 'home');

                         if (err || !url) {
                            const name = p.displayName || p.shortName || p.shirtName || '?';
                            const initial = name.substring(0, 2).toUpperCase();
                            return (
                               <div className={`bg-zinc-800 rounded-full flex flex-col items-center justify-center border border-white/10 shrink-0 shadow-inner overflow-hidden ${className}`}>
                                  <span className="text-[10px] font-black tracking-widest text-zinc-400 leading-none">{initial}</span>
                               </div>
                            );
                         }

                         return (
                            <img
                               src={url}
                               className={`object-cover rounded-full bg-zinc-800 shrink-0 border border-white/10 ${className}`}
                               onError={() => setErr(true)}
                               alt={p.displayName || p.shortName || ''}
                            />
                         );
                       };

                       const getStatVal = (p: any, keys: string[]) => {
                         let pStats = p.stats;
                         if (!pStats && matchDetails?.playerStats?.players) {
                           const found = matchDetails.playerStats.players.find((s: any) => s.playerId === p.playerId || s.playerId === p.id);
                           if (found && found.stats) {
                              pStats = {};
                              found.stats.forEach((s: any) => {
                                 pStats[s.statsId] = s.statsValue;
                              });
                           }
                         }

                         if (!pStats) return null;
                         for (const k of keys) {
                           if (pStats[k] !== undefined && pStats[k] !== null && pStats[k] !== '') {
                             return pStats[k];
                           }
                         }
                         return null;
                       };

                       const activePlayers = players.filter(p => {
                         const played = getStatVal(p, ['mins_played', 'minutesPlayed', 'minutes_played']);
                         const subIn = p.events?.some((e: any) => e.type === 'substitution-in');
                         const wasFielded = p.tacticalXPosition != null;
                         return (played && parseInt(String(played)) > 0) || subIn || wasFielded;
                       });

                       if (activePlayers.length === 0) return null;

                       const metrics = [
                         { label: 'Ruolo', keys: [], isCustom: true, type: 'role', color: 'text-zinc-500' },
                         { label: 'Min', keys: ['minutes', 'mins_played', 'minutesPlayed', 'minutes_played', 'minsPlayed'], color: 'text-zinc-500' },
                         { label: 'Voto', keys: ['match_rating', 'rating'], color: 'text-cyan-400' },
                         { label: 'Gol', keys: ['goals', 'goal'], isEventCount: true, type: 'goal', color: 'text-cyan-400' },
                         { label: 'Assist', keys: ['assists', 'goal_assist', 'assist', 'goalAssist'], color: 'text-emerald-400' },
                         { label: 'Tiri', keys: ['shots', 'totalScoringAtt'], color: 'text-white' },
                         { label: 'Tiri nello specchio', keys: ['shots-on-goal', 'ontargetScoringAtt'], color: 'text-white' },
                         { label: 'Passaggi', keys: ['pass-attempts', 'totalPass'], color: 'text-white' },
                         { label: 'Acc%', keys: ['passing-accuracy-perc', 'accurate-pass-perc'], color: 'text-white', isPercent: true },
                         { label: 'Passaggi chiave', keys: ['keypass', 'key-passes', 'chances-created'], color: 'text-white' },
                         { label: 'Duelli vinti', keys: ['duels-won', 'duelWon', 'woncontest'], color: 'text-white' },
                         { label: 'Contrasti', keys: ['totaltackle', 'tackles-total'], color: 'text-white' },
                         { label: 'Intercetti', keys: ['interception', 'interceptions'], color: 'text-white' },
                         { label: 'Dribbling riusciti', keys: ['succdribblingperc', 'dribbling-successful'], color: 'text-white' },
                         { label: 'Falli', keys: ['fouls', 'foulsconceded', 'fouls_committed'], color: 'text-white' },
                         { label: 'Amm.', keys: ['yellow-cards', 'yellowCard', 'totalYellowCard'], isEventCount: true, type: 'yellow-card', icon: '🟨' },
                         { label: 'Esp.', keys: ['red-cards', 'redCard', 'totalRedCard'], isEventCount: true, type: 'red-card', icon: '🟥' }
                       ];

                       const visibleMetrics = metrics.filter(m => {
                         return activePlayers.some(p => {
                           if (m.type === 'role') return !!(p.position || p.role);
                           if (m.isEventCount) {
                             const evCount = p.events?.filter((e: any) => e.type && e.type.includes(m.type!)).length || 0;
                             const val = getStatVal(p, m.keys);
                             if (evCount > 0 || (val !== null && val !== undefined && val !== 0 && val !== '0' && val !== '0%')) return true;
                             return false;
                           }
                           const val = getStatVal(p, m.keys);
                           return val !== null && val !== undefined && val !== 0 && val !== '0' && val !== '0%';
                         });
                       });

                       return (
                         <div className="bg-zinc-900/20 rounded-[2.5rem] p-6 md:p-10 border border-white/5 shadow-2xl backdrop-blur-sm mb-8 overflow-hidden">
                           <h4 className="text-[12px] font-black uppercase text-cyan-400 tracking-widest mb-6 flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-lg" />
                             {teamName}
                           </h4>
                           <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                             <table className="w-full text-left border-collapse min-w-[max-content]">
                               <thead>
                                 <tr className="border-b border-white/10 text-[8.5px] uppercase tracking-[0.2em] text-zinc-500 font-black">
                                   <th className="py-3 px-3 sticky left-0 bg-[#0c1210] z-10 w-48 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">Giocatore</th>
                                   {visibleMetrics.map((m, i) => (
                                     <th key={i} className={`py-3 px-3 text-center ${m.color || ''}`}>{m.label}</th>
                                   ))}
                                 </tr>
                               </thead>
                               <tbody className="text-[11px] font-medium text-zinc-300">
                                 {activePlayers.map(p => {
                                   const yellow = p.events?.some((e: any) => e.type === 'yellow-card');
                                   const red = p.events?.some((e: any) => e.type === 'red-card');
                                   
                                   return (
                                     <tr key={p.playerId || p.id} onClick={() => {
                                        console.log('--- PLAYER CLICK DEBUG ---');
                                        console.log('Player ID:', p.playerId || p.id);
                                        console.log('Raw player object:', p);
                                        if (!p) {
                                           console.warn('Player object is null/undefined. Aborting detail view.');
                                           return;
                                        }
                                        setSelectedPlayer({ p, teamName, getStatVal, PlayerImage });
                                     }} className="cursor-pointer border-b border-white/5 hover:bg-white/[0.04] transition-colors group">
                                       <td className="py-3 px-3 sticky left-0 bg-[#0a0f0d] group-hover:bg-[#111815] transition-colors z-10 font-black uppercase tracking-wider text-white flex items-center gap-3 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                                         <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-zinc-800 border border-white/10 flex items-center justify-center text-[9px] shrink-0 text-zinc-400">
                                              {p.jerseyNumber || '-'}
                                            </div>
                                            <PlayerImage p={p} className="w-8 h-8" />
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
                                       {visibleMetrics.map((m, i) => {
                                         let val: any = '-';
                                         if (m.type === 'role') {
                                            val = p.position || p.role || '-';
                                         }
                                         else if (m.isEventCount) {
                                            const evCount = p.events?.filter((e: any) => e.type && e.type.includes(m.type!)).length || 0;
                                            const stVal = getStatVal(p, m.keys);
                                            if (evCount > 0) val = evCount;
                                            else if (stVal !== null && stVal !== undefined && stVal !== '0%') val = stVal;
                                            else if (m.showZero) val = '0';
                                         } else {
                                           const rawVal = getStatVal(p, m.keys);
                                           if (rawVal !== null && rawVal !== undefined) {
                                              val = rawVal;
                                              if (m.isPercent && val && val !== '0') val = val + '%';
                                           }
                                         }
                                         
                                         const hasVal = val !== '-' && val !== '';
                                         return (
                                           <td key={i} className={`py-4 px-3 text-center border-l border-white/5 align-middle ${hasVal && val !== '0' && val !== '0%' && val !== 0 ? m.color || '' : 'text-zinc-600'}`}>
                                             {hasVal ? (
                                                <span className={`${m.isEventCount && m.icon ? 'inline-flex w-5 h-5 items-center justify-center bg-white/10 rounded-full font-black text-[10px] shadow-sm' : 'text-[11px] font-black'}`}>
                                                  {m.icon && val > 0 ? (val > 1 ? `${m.icon}x${val}` : m.icon) : val}
                                                </span>
                                             ) : (
                                                <span className="text-zinc-700 font-bold">-</span>
                                             )}
                                           </td>
                                         );
                                       })}
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

                     // check if any player has stats or subbed in
                     const hasActive = (arr: any[]) => arr.some(p => {
                       let pStats = p.stats;
                       if (!pStats && matchDetails?.playerStats?.players) {
                         const found = matchDetails.playerStats.players.find((s: any) => s.playerId === p.playerId || s.playerId === p.id);
                         if (found) pStats = found.stats;
                       }
                       const pPlayed = pStats?.find ? pStats.find((s:any)=>s.statsId==='mins_played' || s.statsId==='minutesPlayed') : (pStats && pStats['mins_played']);
                       const played = pPlayed?.statsValue ?? pPlayed;
                       return (played && parseInt(String(played)) > 0) || p.events?.some((e: any) => e.type === 'substitution-in') || p.tacticalXPosition != null;
                     });

                     if (!hasActive(homeRos) && !hasActive(awayRos)) {
                       return <div className="py-24 text-center"><span className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">Statistiche giocatori non disponibili</span></div>;
                     }

                     const renderSubModal = () => {
                       if (!selectedPlayer) return null;
                       const { p, teamName, getStatVal, PlayerImage } = selectedPlayer;
                       if (!p) return null;
                       
                       const grp = (title: string, metrics: Array<{label:string, keys:string[], applyPerc?:boolean}>) => {
                          const validStats = metrics.map(m => {
                            try {
                               let val = getStatVal(p, m.keys);
                               if (val === null && m.keys.includes('passAcc')) {
                                  const accuratePass = getStatVal(p, ['accuratePass', 'accurate_pass']);
                                  const totalPass = getStatVal(p, ['totalPass', 'total_pass']);
                                  if (accuratePass != null && totalPass != null && totalPass > 0) {
                                     val = Math.round((accuratePass / totalPass) * 100);
                                  }
                               }
                               if (val != null) {
                                  return { label: m.label, value: m.applyPerc && String(val).indexOf('%')===-1 ? `${val}%` : val };
                               }
                               return null;
                            } catch (e) {
                               console.error('Failed to parse stat', m.label, e);
                               return null;
                            }
                          }).filter(Boolean);
                          if (validStats.length === 0) return null;
                          return (
                            <div className="mb-6 last:mb-0">
                               <h5 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b border-white/5 pb-2 mb-3">{title}</h5>
                               <div className="space-y-2">
                                 {validStats.map((s: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center bg-white/5 p-2 px-3 rounded text-[11px] font-bold">
                                       <span className="text-zinc-400">{s.label}</span>
                                       <span className="text-white">{s.value}</span>
                                    </div>
                                 ))}
                               </div>
                            </div>
                          );
                       };

                       return (
                         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)}>
                           <div className="bg-[#0a0f0d] border border-white/10 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                                 <div className="flex items-center gap-4">
                                   <PlayerImage p={p} className="w-16 h-16" />
                                   <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded bg-zinc-800 border border-white/10 flex items-center justify-center text-[9px] font-black text-white">
                                          {p.jerseyNumber || '-'}
                                        </div>
                                        <span className="text-sm font-black text-white uppercase tracking-wider truncate max-w-[140px]">{p.displayName || p.shortName}</span>
                                      </div>
                                      <span className="text-[9px] text-zinc-500 tracking-widest uppercase mt-1">{p.position || p.role || teamName}</span>
                                   </div>
                                 </div>
                                 <button onClick={() => setSelectedPlayer(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
                                   ✕
                                 </button>
                              </div>
                              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                 {grp('Attacco', [
                                   { label: 'Gol', keys: ['goals', 'goal'] },
                                   { label: 'Tiri Totali', keys: ['total_scoring_att', 'shots', 'total_shots', 'shots_total', 'totalScoringAtt'] },
                                   { label: 'Tiri in Porta', keys: ['ontarget_scoring_att', 'shots_on_target', 'shotsOnTarget', 'ontargetScoringAtt'] },
                                   { label: 'Fuorigioco', keys: ['total_offside', 'offsides', 'offside'] }
                                 ])}
                                 {grp('Passaggi', [
                                   { label: 'Assist', keys: ['goal_assist', 'assists', 'assist', 'goalAssist'] },
                                   { label: 'Occasioni Create', keys: ['big_chance_created', 'chances_created', 'key_passes', 'keyPasses'] },
                                   { label: 'Passaggi Totali', keys: ['total_pass', 'total_passes', 'passes', 'totalPass'] },
                                   { label: 'Passaggi Riusciti', keys: ['accurate_pass', 'accuratePass', 'accuratePasses'] },
                                   { label: 'Precisione Passaggi', keys: ['accurate_pass_percentage', 'passes_accuracy', 'pass_accuracy', 'passAcc', 'accurate_pass'], applyPerc: true }
                                 ])}
                                 {grp('Difesa', [
                                   { label: 'Tackle', keys: ['total_tackle', 'tackles', 'tackle', 'totalTackle'] },
                                   { label: 'Intercetti', keys: ['interceptions', 'interception', 'interceptionWon'] },
                                   { label: 'Spazzate', keys: ['effective_clearance', 'clearances', 'clearance', 'totalClearance'] },
                                   { label: 'Tiri Rimpallati', keys: ['blocked_scoring_att', 'blocked_shots', 'blockedShots'] },
                                   { label: 'Parate', keys: ['saves', 'saves_total', 'savesTotal'] }
                                 ])}
                                 {grp('Disciplina', [
                                   { label: 'Ammonizioni', keys: ['yellow_card', 'yellowCards'] },
                                   { label: 'Espulsioni', keys: ['red_card', 'redCards'] },
                                   { label: 'Falli Commessi', keys: ['fouls_committed', 'fouls', 'foulsCommitted'] },
                                   { label: 'Falli Subiti', keys: ['was_fouled', 'fouls_drawn', 'foulsWon', 'foulsSuffered'] }
                                 ])}
                                 {grp('Fisico', [
                                   { label: 'Minuti Giocati', keys: ['mins_played', 'minutesPlayed', 'minutes_played'] },
                                   { label: 'Duelli Totali', keys: ['duel', 'duels_total', 'totalDuels', 'duelTotal'] },
                                   { label: 'Duelli Vinti', keys: ['won_contest', 'duelsWon', 'duels_won', 'duelWon'] },
                                   { label: 'Duelli Aerei', keys: ['aerial_won', 'aerialsWon', 'aerialWon'] }
                                 ])}
                              </div>
                           </div>
                         </div>
                       );
                     };

                     return (
                       <section className="relative px-0">
                         {renderSubModal()}
                         <PlayerStatsTable players={homeRos} teamName={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} side="home" teamObj={modalFixture.homeTeam || modalFixture.home} />
                         <PlayerStatsTable players={awayRos} teamName={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} side="away" teamObj={modalFixture.awayTeam || modalFixture.away} />
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
