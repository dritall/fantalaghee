"use client";

import React, { useState, useMemo } from 'react';
import { getPlayerImageUrl, getDisplayPlayerName } from './utils';

interface PlayerStatsTableProps {
  matchDetails: any;
  modalFixture: any;
  selectedPlayer: any;
  setSelectedPlayer: (val: any) => void;
  resolveTeam: (team: any, fallback: string) => any;
}

const extractId = (raw: any) =>
  typeof raw === "string" && raw.includes("::") ? raw.split("::").pop() : raw;

const getStatVal = (p: any, keys: string[], matchDetails: any) => {
  let pStats = p.stats;
  if (!pStats && matchDetails?.playerStats?.players) {
    const found = matchDetails.playerStats.players.find(
      (s: any) => s.playerId === p.playerId || s.playerId === p.id
    );
    if (found && found.stats) {
      pStats = {};
      found.stats.forEach((s: any) => {
        pStats[s.statsId.toLowerCase()] = s.statsValue;
      });
    }
  }

  if (Array.isArray(pStats)) {
    const temp: any = {};
    pStats.forEach((s: any) => {
      temp[(s.statsId || s.id || "").toLowerCase()] = s.statsValue || s.value;
    });
    pStats = temp;
  } else if (pStats && typeof pStats === "object" && !pStats._normalized) {
    const temp: any = { _normalized: true };
    for (const [k, v] of Object.entries(pStats)) {
      temp[k.toLowerCase()] = v;
    }
    pStats = temp;
  }

  if (!pStats) return null;
  for (const k of keys) {
    const val = pStats[k.toLowerCase()];
    if (val !== undefined && val !== null && val !== "") {
      return val;
    }
  }
  return null;
};

const PlayerImage = ({ p, className = "", teamObj, modalFixture, matchDetails }: any) => {
  const [err, setErr] = useState(false);
  const tId = extractId(teamObj?.teamId || teamObj?.id || teamObj?.providerId);
  const sId = extractId(modalFixture?.seasonId || matchDetails?.header?.seasonId);

  const url = getPlayerImageUrl(p, sId, tId, "home");

  if (err || !url) {
    const name = p.displayName || p.shortName || p.shirtName || "?";
    const initial = name.substring(0, 2).toUpperCase();
    return (
      <div
        className={`bg-zinc-800 rounded-full flex flex-col items-center justify-center border border-white/10 shrink-0 shadow-inner overflow-hidden ${className}`}
      >
        <span className="text-[10px] font-black tracking-widest text-zinc-400 leading-none">
          {initial}
        </span>
      </div>
    );
  }

  return (
    <img
      src={url}
      className={`object-cover rounded-full bg-zinc-800 shrink-0 border border-white/10 ${className}`}
      onError={() => setErr(true)}
      alt={p.displayName || p.shortName || ""}
    />
  );
};

function StatsTable({
  players,
  teamName,
  teamObj,
  modalFixture,
  matchDetails,
  setSelectedPlayer
}: any) {
  const activePlayers = useMemo(() => players.filter((p: any) => {
    const played = getStatVal(p, ["mins_played", "minutesPlayed", "minutes_played"], matchDetails) || p.statistics?.minutesPlayed || p.stats?.minutesPlayed;
    const isStarter = p.starting || p.tacticalXPosition != null || p.substitute === false;
    const subbedIn = p.events?.some((e: any) => e.type === "substitution-in");
    return (played && parseInt(String(played)) > 0) || isStarter || subbedIn;
  }), [players, matchDetails]);

  if (activePlayers.length === 0) return null;

  const metrics = [
    { label: 'Ruolo', keys: [], isCustom: true, type: 'role', color: 'text-zinc-500' },
    { label: 'Min', keys: ['minutes', 'mins_played', 'minutesPlayed', 'minutes_played', 'minsPlayed'], color: 'text-zinc-500' },
    { label: 'Voto', keys: ['match_rating', 'rating'], color: 'text-cyan-400' },
    { label: 'Gol', keys: ['goals', 'goal'], isEventCount: true, type: 'goal', color: 'text-cyan-400' },
    { label: 'Assist', keys: ['assists', 'goal_assist', 'assist', 'goalAssist'], color: 'text-emerald-400' },
    { label: 'Tiri', keys: ['totalScoringAtt', 'totalscoringatt', 'total_scoring_att', 'shots'], color: 'text-white' },
    { label: 'Tiri in porta', keys: ['ontargetScoringAtt', 'ontargetscoringatt', 'shots_on_target', 'shots-on-goal'], color: 'text-white' },
    { label: 'Parate', keys: ['saves', 'saves_total', 'savesTotal', 'total_saves'], color: 'text-white' },
    { label: 'Passaggi', keys: ['totalPass', 'totalpass', 'total-passes', 'pass-attempts'], color: 'text-white' },
    { label: 'Acc%', keys: ['passing-accuracy-perc', 'accurate-pass-perc', 'passingaccuracyperc'], color: 'text-white', isPercent: true },
    { label: 'Passaggi chiave', keys: ['keypass', 'key-passes', 'chances-created'], color: 'text-white' },
    { label: 'Duelli vinti', keys: ['duels-won', 'duelWon', 'woncontest'], color: 'text-white' },
    { label: 'Contrasti', keys: ['totaltackle', 'tackles-total', 'tackles'], color: 'text-white' },
    { label: 'Intercetti', keys: ['interception', 'interceptions', 'held-interceptions'], color: 'text-white' },
    { label: 'Dribbling', keys: ['succdribblingperc', 'dribbling-successful'], color: 'text-white' },
    { label: 'Falli', keys: ['fouls', 'foulsconceded', 'fouls_committed'], color: 'text-white' },
    { label: 'Amm.', keys: ['yellow-cards', 'yellowCard', 'totalYellowCard'], isEventCount: true, type: 'yellow-card', icon: '🟨' },
    { label: 'Esp.', keys: ['red-cards', 'redCard', 'totalRedCard'], isEventCount: true, type: 'red-card', icon: '🟥' }
  ];

  const visibleMetrics = metrics.filter(m => {
    return activePlayers.some((p: any) => {
      if (m.type === 'role') return !!(p.position || p.role);
      if (m.isEventCount) {
        const evCount = p.events?.filter((e: any) => e.type && e.type.includes(m.type!)).length || 0;
        const val = getStatVal(p, m.keys, matchDetails);
        if (evCount > 0 || (val !== null && val !== undefined && val !== 0 && val !== '0' && val !== '0%')) return true;
        return false;
      }
      const val = getStatVal(p, m.keys, matchDetails);
      return val !== null && val !== undefined && val !== 0 && val !== '0' && val !== '0%';
    });
  });

  return (
    <div className="bg-zinc-900/20 rounded-[2.5rem] p-6 md:p-10 border border-white/5 shadow-2xl backdrop-blur-sm mb-8 overflow-hidden">
      <h4 className="text-[12px] font-black uppercase text-cyan-400 tracking-widest mb-6 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-lg" />
        {teamName}
      </h4>
      <div className="flex flex-col gap-2">
        {activePlayers.map((p: any) => {
          const yellow = p.events?.some((e: any) => e.type === 'yellow-card');
          const red = p.events?.some((e: any) => e.type === 'red-card');
          const fullPlayerName = p.player?.name || p.displayName || p.shortName || p.name || getDisplayPlayerName(p);
          
          return (
            <div 
              key={p.playerId || p.id} 
              onClick={() => {
                if (!p) return;
                setSelectedPlayer({ 
                  p, 
                  teamName, 
                  getStatVal: (pObj:any, k:string[]) => getStatVal(pObj, k, matchDetails), 
                  PlayerImage: (props:any) => <PlayerImage {...props} teamObj={teamObj} modalFixture={modalFixture} matchDetails={matchDetails} />
                });
              }} 
              className="cursor-pointer bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-lg p-3 flex items-center gap-3 transition-colors group"
            >
              <div className="flex-1 flex items-center gap-3">
                <span className="font-bold text-sm text-zinc-300 group-hover:text-white transition-colors">
                  {fullPlayerName}
                </span>
                <div className="flex gap-1.5 items-center">
                  {yellow && <div className="w-2 h-3 bg-yellow-400 rounded-sm shadow-md" />}
                  {red && <div className="w-2 h-3 bg-red-500 rounded-sm shadow-md" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayerStatsTable({
  matchDetails,
  modalFixture,
  selectedPlayer,
  setSelectedPlayer,
  resolveTeam
}: PlayerStatsTableProps) {
  if (!matchDetails || !modalFixture) return null;

  const homeRos = [...(matchDetails.lineups?.home?.fielded || []), ...(matchDetails.lineups?.home?.benched || [])];
  const awayRos = [...(matchDetails.lineups?.away?.fielded || []), ...(matchDetails.lineups?.away?.benched || [])];

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
    const { p, teamName, getStatVal: subGetStatVal, PlayerImage: SubPlayerImage } = selectedPlayer;
    if (!p) return null;
    
    const grp = (title: string, metrics: Array<{label:string, keys:string[], applyPerc?:boolean}>) => {
       const validStats = metrics.map(m => {
         try {
            let val = subGetStatVal(p, m.keys);
            if (val === null && m.keys.includes('passAcc')) {
               const accuratePass = subGetStatVal(p, ['accuratePass', 'accurate_pass']);
               const totalPass = subGetStatVal(p, ['totalPass', 'total_pass']);
               if (accuratePass != null && totalPass != null && totalPass > 0) {
                  val = Math.round((accuratePass / totalPass) * 100);
               }
            }
            if (val != null) {
               return { label: m.label, value: m.applyPerc && String(val).indexOf('%')===-1 ? `${val}%` : val };
            }
            return null;
         } catch (e) {
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
                <SubPlayerImage p={p} className="w-16 h-16" />
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
      <StatsTable 
        players={homeRos} 
        teamName={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} 
        teamObj={modalFixture.homeTeam || modalFixture.home}
        modalFixture={modalFixture}
        matchDetails={matchDetails}
        setSelectedPlayer={setSelectedPlayer}
      />
      <StatsTable 
        players={awayRos} 
        teamName={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} 
        teamObj={modalFixture.awayTeam || modalFixture.away}
        modalFixture={modalFixture}
        matchDetails={matchDetails}
        setSelectedPlayer={setSelectedPlayer}
      />
    </section>
  );
}
