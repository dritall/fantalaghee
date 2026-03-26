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

  const MatchTimeline = ({ detail, homeName, awayName }: any) => {
    const events: any[] = [];
    
    // Extract from events API
    if (detail.events?.events) {
      detail.events.events.forEach((ev: any) => {
        events.push({
          minute: ev.minute,
          second: ev.second || 0,
          type: ev.type,
          player: ev.player?.shortName || ev.player?.officialName || 'Player',
          team: ev.teamId === detail.header?.homeTeam?.teamId ? 'home' : 'away',
          related: ev.relatedPlayer?.shortName,
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
              minute: ev.minute,
              type: ev.type,
              player: p.player?.shortName || p.officialName || p.shortName || 'Player',
              team: side,
              subOff: ev.subOffPlayer?.shortName
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

    const sorted = [...events].sort((a, b) => a.minute - b.minute);
    if (sorted.length === 0) return <p className="text-center text-zinc-600 text-[10px] py-4 uppercase tracking-widest">Nessun evento registrato</p>;

    const getTypeLabel = (t: string) => {
      if (t.includes('goal')) return '⚽';
      if (t.includes('yellow')) return '🟨';
      if (t.includes('red')) return '🟥';
      if (t.includes('substitution')) return '🔄';
      return '•';
    };

    return (
      <div className="space-y-3 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
        {sorted.map((ev, i) => (
          <div key={i} className="flex items-start gap-4 text-xs relative px-4">
            <span className="w-8 text-[9px] font-black text-cyan-400 mt-0.5">{ev.minute}&apos;</span>
            <div className={`mt-0.5 w-4 h-4 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[8px] z-10`}>
              {getTypeLabel(ev.type)}
            </div>
            <div className="flex-1">
              <span className={`font-bold ${ev.team === 'home' ? 'text-white' : 'text-zinc-400'}`}>{ev.player}</span>
              {ev.type.includes('substitution') && ev.subOff && (
                <span className="text-zinc-500 text-[10px] ml-2 italic">per {ev.subOff}</span>
              )}
              <div className="text-[9px] text-zinc-600 uppercase tracking-tighter">
                {ev.team === 'home' ? homeName : awayName}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const TacticalPitch = ({ lineup, side }: any) => {
    if (!lineup?.fielded) return null;
    return (
      <div className="relative aspect-[3/4] bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden p-4">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-4 border border-white rounded-lg" />
          <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white -translate-x-1/2" />
          <div className="absolute left-1/2 top-1/2 w-20 h-20 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        {lineup.fielded.map((p: any, i: number) => {
          const x = p.tacticalXPosition || 50;
          const y = side === 'away' ? (100 - (p.tacticalYPosition || 50)) : (p.tacticalYPosition || 50);
          return (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1" style={{ left: `${x}%`, top: `${y}%` }}>
              <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-cyan-400 flex items-center justify-center text-[10px] font-black shadow-lg">
                {p.jerseyNumber}
              </div>
              <span className="text-[8px] font-bold text-white whitespace-nowrap bg-black/50 px-1 rounded truncate max-w-[50px]">
                {p.player?.shortName || p.shortName}
              </span>
            </div>
          );
        })}
      </div>
    );
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

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Caricamento dettagli...</p>
                </div>
              ) : matchDetails ? (
                <>
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                       Timeline Match
                    </h3>
                    <MatchTimeline detail={matchDetails} homeName={resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name} awayName={resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name} />
                  </section>

                  {matchDetails.stats && (
                    <section>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">Statistiche</h3>
                      <div className="space-y-4">
                        {(matchDetails.stats?.homeTeamStats || []).map((stat: any, i: number) => {
                          const hv = parseInt(stat.value) || 0;
                          const av = parseInt(matchDetails.stats?.awayTeamStats?.[i]?.value) || 0;
                          const total = hv + av || 1;
                          return (
                            <div key={stat.label || i} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-zinc-400 px-1">
                                <span className={hv > av ? 'text-cyan-400' : 'text-white'}>{hv}{stat.value.includes('%') ? '%' : ''}</span>
                                <span className="uppercase tracking-[0.1em] opacity-40">{stat.label}</span>
                                <span className={av > hv ? 'text-cyan-400' : 'text-white'}>{av}{stat.value.includes('%') ? '%' : ''}</span>
                              </div>
                              <div className="flex gap-1 h-1 rounded-full overflow-hidden bg-white/5">
                                <div className="bg-cyan-400 h-full transition-all duration-700" style={{ width: `${(hv / total) * 100}%` }} />
                                <div className="bg-zinc-700 h-full transition-all duration-700" style={{ width: `${(av / total) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {matchDetails.lineups && (
                    <section>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">Formazioni Ufficiali</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-cyan-400 uppercase mb-2 text-center">{resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa').name}</p>
                          <TacticalPitch lineup={matchDetails.lineups.home} side="home" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-white uppercase mb-2 text-center">{resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite').name}</p>
                          <TacticalPitch lineup={matchDetails.lineups.away} side="away" />
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 text-center">Panchine</h3>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2">
                         {(matchDetails.lineups?.home?.benched || []).map((p: any, i: number) => (
                           <div key={i} className="flex items-center justify-between text-[10px]">
                             <span className="text-zinc-400 truncate w-[70px]">{p.player?.shortName || p.shortName}</span>
                             {p.events?.some((e: any) => e.type === 'substitution-in') && <span className="text-emerald-400 font-bold shrink-0">IN</span>}
                           </div>
                         ))}
                       </div>
                       <div className="space-y-2 text-right">
                         {(matchDetails.lineups?.away?.benched || []).map((p: any, i: number) => (
                           <div key={i} className="flex items-center justify-between text-[10px] flex-row-reverse">
                             <span className="text-zinc-400 truncate w-[70px] text-right">{p.player?.shortName || p.shortName}</span>
                             {p.events?.some((e: any) => e.type === 'substitution-in') && <span className="text-emerald-400 font-bold shrink-0">IN</span>}
                           </div>
                         ))}
                       </div>
                    </div>
                  </section>
                </>
              ) : (
                <p className="text-center text-zinc-600 text-[10px] uppercase tracking-widest py-10 font-bold">
                  Dati non ancora disponibili per questo match
                </p>
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
