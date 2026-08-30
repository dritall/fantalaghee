"use client";

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertTriangle, CalendarDays, ListOrdered, ChevronLeft, ChevronRight } from 'lucide-react';
import { SEASONS, CURRENT_SEASON } from '@/lib/seasons';
import { SeasonBanner } from '@/components/ui/SeasonBanner';
import { TeamLogo, getTeamLogoUrl } from './TeamLogo';
import { MatchSheet } from './MatchSheet';
import { matchColors } from '@/lib/team-colors';
import { usaTema } from '@/lib/usa-tema';
import { clockFields, isLiveMatch, matchClock } from '@/lib/match-clock';

const TOTAL_ROUNDS = 38;

/** Data e ora di inizio, nel formato compatto usato sulle card partita. */
const formatKickoff = (m: any): string => {
  const raw = m?.matchDateLocal || m?.matchDateUtc || m?.dateTime;
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(d).replace('.', '');
};

const FormDot = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    W: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.55)]',
    D: 'bg-[color:var(--fumo)]',
    L: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]',
  };
  return (
    <span
      title={type === 'W' ? 'Vittoria' : type === 'L' ? 'Sconfitta' : 'Pareggio'}
      className={`w-2 h-2 rounded-full inline-block ${colors[type] || 'bg-[color:var(--velo-alto)]'}`}
    />
  );
};

function ScoutHubContent() {
  const searchParams = useSearchParams();
  const stagione = searchParams.get('stagione') || CURRENT_SEASON;
  const seasonConfig = SEASONS[stagione] || SEASONS[CURRENT_SEASON];
  const seasonLabel = seasonConfig.label;
  const isArchiveSeason = seasonConfig.archived;

  const tema = usaTema();
  const [activeTab, setActiveTab] = useState('calendario');
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [initializingRound, setInitializingRound] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [seasonUnavailable, setSeasonUnavailable] = useState(false);

  const [modalFixture, setModalFixture] = useState<any>(null);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [matchDetailsError, setMatchDetailsError] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------ classifica */
  useEffect(() => {
    setSeasonUnavailable(false);
    setLoadingStandings(true);
    fetch(`/api/football?endpoint=standings&stagione=${stagione}`)
      .then(r => r.json())
      .then(res => {
        if (res?.seasonUnavailable) { setSeasonUnavailable(true); setStandings([]); return; }
        const teams = res?.data?.teams || [];
        const parsed = teams.map((t: any) => {
          const getStat = (id: string) => {
            const s = t.stats?.find((x: any) => x.statsId === id);
            return s ? (parseInt(s.statsValue) || 0) : 0;
          };
          return {
            id: t.teamId,
            name: t.shortName || t.officialName || 'N/A',
            logo: t.imagery?.teamLogo,
            imagery: t.imagery,
            teamId: t.teamId,
            points: getStat('points'),
            played: getStat('matches-played'),
            win: getStat('win'),
            draw: getStat('draw'),
            lose: getStat('lose'),
            gd: getStat('goal-difference'),
            gf: getStat('goals-for'),
            ga: getStat('goals-against'),
            form: (t.stats?.find((x: any) => x.statsId === 'form')?.statsValue || []).map((f: any) => f.formType),
          };
        }).sort((a: any, b: any) => b.points - a.points || b.gd - a.gd);
        setStandings(parsed);
      })
      .catch(() => null)
      .finally(() => setLoadingStandings(false));
  }, [stagione]);

  /* -------------------------------------------------------------- partite */
  const loadRound = useCallback(async (round: number, silent = false) => {
    if (!silent) {
      setLoadingMatches(true);
      setMatchError(null);
      setMatches([]);
    }
    try {
      const res = await fetch(`/api/football?endpoint=matches&round=${round}&stagione=${stagione}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.seasonUnavailable) { setSeasonUnavailable(true); return; }
      if (!json.ok) throw new Error(json.error || 'Errore sconosciuto');

      const rawMatches = json.data?.matches || [];
      const sorted = [...rawMatches].sort((a: any, b: any) => {
        const da = new Date(a.matchDateUtc || a.matchDateLocal || 0).getTime();
        const db = new Date(b.matchDateUtc || b.matchDateLocal || 0).getTime();
        return da - db;
      });
      setMatches(sorted);
    } catch (e: any) {
      if (!silent) setMatchError(e.message);
    } finally {
      if (!silent) setLoadingMatches(false);
    }
  }, [stagione]);

  useEffect(() => {
    setSeasonUnavailable(false);
    setInitializingRound(true);
    fetch(`/api/football?endpoint=matchdays&stagione=${stagione}`)
      .then(r => r.json())
      .then(res => {
        if (res?.seasonUnavailable) { setSeasonUnavailable(true); return; }
        if (!res?.ok) { setMatchError(res?.error || 'Giornate non disponibili al momento'); return; }
        const matchdays = res.data || [];
        const live = matchdays.find((md: any) => md.matchdayStatus === 'Playing');
        const lastPlayed = matchdays
          .filter((md: any) => md.matchdayStatus === 'Played')
          .sort((a: any, b: any) => new Date(b.endDateUtc).getTime() - new Date(a.endDateUtc).getTime())[0];
        const nextScheduled = matchdays
          .filter((md: any) => md.matchdayStatus === 'Scheduled')
          .sort((a: any, b: any) => new Date(a.startDateUtc).getTime() - new Date(b.startDateUtc).getTime())[0];
        const firstAvailable = [...matchdays].filter((md: any) => md.round).sort((a: any, b: any) => a.round - b.round)[0];

        const active = live || lastPlayed || nextScheduled || firstAvailable;
        if (active?.round) {
          setSelectedRound(active.round);
          loadRound(active.round);
        } else {
          setMatchError('Impossibile determinare la giornata corrente');
        }
      })
      .catch(() => setMatchError('Impossibile contattare Lega Serie A. Riprova più tardi.'))
      .finally(() => setInitializingRound(false));
  }, [loadRound]);

  const handleRoundChange = (r: number) => {
    setSelectedRound(r);
    loadRound(r);
  };

  useEffect(() => {
    if (scrollRef.current && activeTab === 'calendario') {
      const id = setTimeout(() => {
        scrollRef.current?.querySelector('.active-round-btn')
          ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 150);
      return () => clearTimeout(id);
    }
  }, [selectedRound, activeTab]);

  /* ------------------------------------------------------- dettaglio match */
  const openMatch = async (m: any, silent = false) => {
    if (!silent) {
      setModalFixture(m);
      setMatchDetails(null);
      setMatchDetailsError(null);
      setLoadingModal(true);
    }
    try {
      const matchId = m.matchId || m.id;
      const seasonId = m.seasonId || m.competition?.seasonId || m.matchSet?.seasonId || seasonConfig.serieASeasonId;
      const qs = new URLSearchParams({ endpoint: 'match', id: String(matchId) });
      if (seasonId) qs.set('seasonId', String(seasonId));
      const res = await fetch(`/api/football?${qs.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Risposta non valida');
      setMatchDetails(json.data);
      if (json.data?.header) {
        setModalFixture((prev: any) => (prev ? { ...prev, ...clockFields(json.data.header) } : prev));
      }
    } catch (err: any) {
      if (!silent) {
        setMatchDetailsError(err.message || 'Errore nel caricamento del tabellino');
        setMatchDetails(null);
      }
    } finally {
      if (!silent) setLoadingModal(false);
    }
  };

  const anyLive = matches.some(isLiveMatch);

  useEffect(() => {
    if (!selectedRound || !anyLive) return;
    const id = window.setInterval(() => {
      loadRound(selectedRound, true);
    }, 20000);
    return () => window.clearInterval(id);
  }, [selectedRound, anyLive, loadRound]);

  useEffect(() => {
    if (!modalFixture) return;
    const src = matchDetails?.header || modalFixture;
    if (!isLiveMatch(src)) return;
    const id = window.setInterval(() => {
      openMatch(modalFixture, true);
    }, 20000);
    return () => window.clearInterval(id);
    // openMatch è ricreato ogni render: dipendere da lui rifarebbe il poll in loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalFixture?.matchId || modalFixture?.id, matchDetails?.header?.status, matchDetails?.header?.phase]);

  const closeMatch = () => {
    setModalFixture(null);
    setMatchDetails(null);
    setMatchDetailsError(null);
  };

  const resolveTeam = (teamObj: any, fallback: string) => ({
    ...teamObj,
    id: teamObj?.teamId || teamObj?.id,
    name: teamObj?.shortName || teamObj?.officialName || teamObj?.name || fallback,
    logo: getTeamLogoUrl(teamObj),
  });

  return (
    <div className="min-h-screen p-4 pt-28 pb-16 font-sans">
      <div className="max-w-5xl mx-auto">

        <SeasonBanner />

        {/* ===== TESTATA ===== */}
        <header className="text-center space-y-4 mb-8 mt-4" data-rivela>
          <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] px-4 py-1.5 rounded-full border
            ${isArchiveSeason
              ? 'text-[color:var(--su-colore)] bg-[color:var(--archivio)] border-[color:var(--archivio)]'
              : 'text-[color:var(--su-colore)] bg-[color:var(--lario)] border-[color:var(--lario)]'}`}>
            <span className="relative flex h-1.5 w-1.5">
              {!isArchiveSeason && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--su-colore)] opacity-70" />}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isArchiveSeason ? 'bg-amber-300' : 'bg-[color:var(--su-colore)]'}`} />
            </span>
            Serie A {seasonLabel}
          </span>
          <h1 className="text-4xl md:text-6xl font-black font-oswald uppercase tracking-tight text-3d-metallic">
            Risultati Serie A
          </h1>
          <p className="text-[color:var(--fumo)] text-sm max-w-xl mx-auto">
            Calendario, tabellini e classifica ufficiale. Tocca una partita per formazioni, eventi e statistiche —
            e un giocatore per la sua scheda.
          </p>
        </header>

        {/* ===== SELETTORE VISTA ===== */}
        <div className="relative flex p-1 rounded-full mb-8 max-w-xs mx-auto glass-forte">
          {[
            { id: 'calendario', label: 'Calendario', icon: CalendarDays },
            { id: 'classifica', label: 'Classifica', icon: ListOrdered },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              aria-pressed={activeTab === t.id}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.16em] transition-colors duration-300
                ${activeTab === t.id ? 'text-[color:var(--calce)]' : 'text-[color:var(--fumo)] hover:text-[color:var(--calce)]/80'}`}>
              {activeTab === t.id && (
                <span className="absolute inset-0 rounded-full bg-[color:var(--fondale)] shadow-[0_4px_14px_var(--ombra)] border-b-2 border-[color:var(--vermiglio)]" />
              )}
              <t.icon className="relative w-3.5 h-3.5" />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        {seasonUnavailable ? (
          <div className="surface rounded-[var(--ro-m)] p-12 flex flex-col items-center justify-center gap-4 text-center">
            <AlertTriangle className="w-10 h-10 text-[color:var(--fumo)]" />
            <p className="text-[color:var(--calce)]/80 text-sm font-black uppercase tracking-widest">Calendario non ancora disponibile</p>
            <p className="text-[color:var(--fumo)] text-xs max-w-md leading-relaxed">Lega Serie A non ha ancora pubblicato il calendario della stagione {seasonLabel}. Torna a controllare più avanti.</p>
          </div>
        ) : initializingRound ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="relative">
              <Loader2 className="w-9 h-9 text-[color:var(--lario)] animate-spin" />
              <div className="absolute inset-0 bg-[color:var(--lario)]/25 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-[color:var(--fumo)] text-[11px] font-black uppercase tracking-[0.28em]">Cerco la giornata in corso…</p>
          </div>
        ) : selectedRound === null ? (
          <div className="surface rounded-[var(--ro-m)] p-12 flex flex-col items-center justify-center gap-4 text-center">
            <AlertTriangle className="w-10 h-10 text-[color:var(--fumo)]" />
            <p className="text-[color:var(--calce)]/80 text-sm font-black uppercase tracking-widest">Dati non disponibili</p>
            <p className="text-[color:var(--fumo)] text-xs max-w-md leading-relaxed break-all">{matchError || 'Lega Serie A non ha risposto. Riprova più tardi.'}</p>
          </div>
        ) : (
          <>
            {/* ===== CALENDARIO ===== */}
            {activeTab === 'calendario' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectedRound > 1 && handleRoundChange(selectedRound - 1)}
                    disabled={selectedRound <= 1}
                    aria-label="Giornata precedente"
                    className="shrink-0 w-9 h-9 rounded-full border border-[color:var(--filo)] bg-[color:var(--velo)] flex items-center justify-center
                               text-[color:var(--calce)]/80 hover:text-[color:var(--calce)] hover:bg-[color:var(--velo-alto)] disabled:opacity-25 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div ref={scrollRef} className="flex-1 flex overflow-x-auto gap-1.5 py-1 no-scrollbar scroll-smooth edge-fade-x">
                    {Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1).map(r => (
                      <button key={r} onClick={() => handleRoundChange(r)}
                        aria-current={selectedRound === r ? 'true' : undefined}
                        className={`px-4 py-2 rounded-[var(--ro-s)] shrink-0 font-black text-xs tabular-nums border transition-all duration-300
                          ${selectedRound === r
                            ? 'active-round-btn border-[color:var(--calce)] bg-[color:var(--calce)] text-[color:var(--pece)]'
                            : 'border-[color:var(--filo)] bg-[color:var(--velo)] text-[color:var(--fumo)] hover:text-[color:var(--calce)] hover:border-[color:var(--filo-alto)] hover:bg-[color:var(--velo-alto)]'}`}>
                        {r}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => selectedRound < TOTAL_ROUNDS && handleRoundChange(selectedRound + 1)}
                    disabled={selectedRound >= TOTAL_ROUNDS}
                    aria-label="Giornata successiva"
                    className="shrink-0 w-9 h-9 rounded-full border border-[color:var(--filo)] bg-[color:var(--velo)] flex items-center justify-center
                               text-[color:var(--calce)]/80 hover:text-[color:var(--calce)] hover:bg-[color:var(--velo-alto)] disabled:opacity-25 disabled:pointer-events-none transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--fumo)]">
                    Giornata {selectedRound}
                  </h2>
                  <span className="h-px flex-1 bg-[color:var(--velo-alto)]" />
                </div>

                {loadingMatches ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-[92px] rounded-[var(--ro-m)] border border-[color:var(--filo)] bg-[color:var(--velo)] overflow-hidden relative">
                        <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)] bg-[length:200%_100%]" />
                      </div>
                    ))}
                  </div>
                ) : matchError ? (
                  <div className="rounded-[var(--ro-m)] border border-red-500/30 bg-red-500/[0.08] p-6">
                    <div className="flex items-center gap-2 text-red-600 font-black mb-2 text-xs uppercase tracking-widest">
                      <AlertTriangle className="w-4 h-4" /> Errore caricamento
                    </div>
                    <p className="text-[color:var(--fumo)] text-xs font-mono break-all">{matchError}</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="surface rounded-[var(--ro-m)] p-10 text-center">
                    <p className="text-[color:var(--fumo)] text-xs font-black uppercase tracking-[0.2em]">Nessuna partita per questa giornata</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {matches.map((m: any, idx: number) => {
                      const home = resolveTeam(m.homeTeam || m.home, 'Casa');
                      const away = resolveTeam(m.awayTeam || m.away, 'Ospite');
                      const hs = m.providerHomeScore ?? m.homeScore;
                      const as_ = m.providerAwayScore ?? m.awayScore;
                      const clock = matchClock(m);
                      const played = clock.isFinished || (hs !== null && hs !== undefined && !clock.isUpcoming);
                      const isLive = clock.isLive;
                      const homeWin = played && !isLive && hs > as_;
                      const awayWin = played && !isLive && as_ > hs;
                      // stessi colori della schedina: la card anticipa chi gioca
                      const cardColors = matchColors(home.name, away.name, tema);

                      return (
                        <button
                          key={m.matchId || m.id || idx}
                          onClick={() => openMatch(m)}
                          className="group scatto relative text-left rounded-[var(--ro-m)] border overflow-hidden bg-[color:var(--fondale)]
                                     shadow-[0_1px_2px_rgba(11,34,51,0.05),0_10px_24px_-16px_rgba(11,34,51,0.3)]"
                          style={{ borderColor: 'var(--filo)' }}
                        >
                          <div className="relative px-4 py-3.5 overflow-hidden">
                            <span className="absolute left-0 top-0 h-[3px] w-1/2 rounded-tl-[var(--ro-m)]" style={{ backgroundColor: cardColors.home }} />
                            <span className="absolute right-0 top-0 h-[3px] w-1/2 rounded-tr-[var(--ro-m)]" style={{ backgroundColor: cardColors.away }} />
                            <span
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                              style={{
                                backgroundImage:
                                  `radial-gradient(220px circle at 12% -25%, ${cardColors.home}2e, transparent 68%),` +
                                  `radial-gradient(220px circle at 88% -25%, ${cardColors.away}2e, transparent 68%)`,
                              }}
                            />

                            <div className="relative flex items-center justify-between mb-2.5">
                              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--fumo)]">
                                {formatKickoff(m)}
                              </span>
                              {isLive ? (
                                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-red-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                  {clock.label && clock.label !== "LIVE" ? clock.label : "Live"}
                                </span>
                              ) : clock.isFinished || played ? (
                                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Finita</span>
                              ) : (
                                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[color:var(--fumo)]">Da giocare</span>
                              )}
                            </div>

                            <div className="relative flex items-center gap-3">
                              <div className="flex-1 min-w-0 flex items-center gap-2.5">
                                <TeamLogo team={home} className="w-9 h-9 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110" />
                                {/* Su telefono la schedina si stringe: parla solo lo stemma */}
                                <span
                                  className={`hidden sm:block text-[13px] truncate ${homeWin ? 'font-black' : played ? 'font-bold text-[color:var(--fumo)]' : 'font-bold text-[color:var(--calce)]/80'}`}
                                  style={homeWin ? { color: cardColors.home } : undefined}
                                >
                                  {home.name}
                                </span>
                              </div>

                              <div className="shrink-0 px-2.5 min-w-[62px] text-center">
                                <span className={`numerone ${played ? 'text-[22px] text-[color:var(--calce)]' : 'text-[11px] text-[color:var(--fumo)]'}`}>
                                  {played ? `${hs}\u00b7${as_}` : 'VS'}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0 flex items-center gap-2.5 justify-end">
                                <span
                                  className={`hidden sm:block text-[13px] truncate text-right ${awayWin ? 'font-black' : played ? 'font-bold text-[color:var(--fumo)]' : 'font-bold text-[color:var(--calce)]/80'}`}
                                  style={awayWin ? { color: cardColors.away } : undefined}
                                >
                                  {away.name}
                                </span>
                                <TeamLogo team={away} className="w-9 h-9 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110" />
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===== CLASSIFICA ===== */}
            {activeTab === 'classifica' && (
              <div className="space-y-4">
                <div className="surface rounded-[var(--ro-m)] p-3 md:p-5 overflow-x-auto custom-scrollbar">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-12 items-center py-2.5 px-3 text-[9px] font-black uppercase text-[color:var(--fumo)] border-b border-[color:var(--filo)] tracking-[0.16em]">
                      <span className="col-span-1 text-center">#</span>
                      <span className="col-span-4">Squadra</span>
                      <span className="col-span-1 text-center text-[color:var(--lario)]/80">Pt</span>
                      <span className="col-span-1 text-center">G</span>
                      <span className="col-span-1 text-center text-emerald-600/80">V</span>
                      <span className="col-span-1 text-center">N</span>
                      <span className="col-span-1 text-center text-red-500/80">P</span>
                      <span className="col-span-1 text-center">DR</span>
                      <span className="col-span-1 text-center">Forma</span>
                    </div>

                    {loadingStandings ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[color:var(--lario)] animate-spin" /></div>
                    ) : standings.length === 0 ? (
                      <p className="py-12 text-center text-[color:var(--fumo)] text-xs font-black uppercase tracking-[0.2em]">
                        Classifica non ancora disponibile
                      </p>
                    ) : standings.map((t: any, i: number) => {
                      const zone =
                        i < 4 ? 'bg-[color:var(--lario)]'
                          : i < 6 ? 'bg-[color:var(--viola)]'
                            : i >= standings.length - 3 ? 'bg-red-500'
                              : 'bg-transparent';
                      return (
                        <div
                          key={t.id}
                          className="relative grid grid-cols-12 items-center py-2.5 px-3 border-b border-[color:var(--filo)] last:border-0
                                     hover:bg-[color:var(--velo)] rounded-[var(--ro-s)] transition-colors group"
                        >
                          <span className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full ${zone}`} />

                          <span className="col-span-1 text-center text-[11px] font-black text-[color:var(--fumo)] tabular-nums group-hover:text-[color:var(--lario)] transition-colors">
                            {i + 1}
                          </span>

                          <div className="col-span-4 flex items-center gap-3 min-w-0">
                            <TeamLogo team={t} className="w-7 h-7 shrink-0" />
                            <span className="text-xs font-black uppercase tracking-tight truncate text-[color:var(--calce)]/80 group-hover:text-[color:var(--calce)] transition-colors">
                              {t.name}
                            </span>
                          </div>

                          <span className="col-span-1 text-center font-score font-bold text-[color:var(--lario)] text-base tabular-nums">{t.points}</span>
                          <span className="col-span-1 text-center text-xs tabular-nums text-[color:var(--fumo)]">{t.played}</span>
                          <span className="col-span-1 text-center text-xs tabular-nums text-emerald-600/90">{t.win}</span>
                          <span className="col-span-1 text-center text-xs tabular-nums text-[color:var(--fumo)]">{t.draw}</span>
                          <span className="col-span-1 text-center text-xs tabular-nums text-red-500/90">{t.lose}</span>
                          <span className="col-span-1 text-center text-xs tabular-nums font-bold text-[color:var(--fumo)]">
                            {t.gd > 0 ? `+${t.gd}` : t.gd}
                          </span>

                          <div className="col-span-1 flex justify-center gap-1">
                            {(t.form || []).slice(-3).map((f: string, fi: number) => (
                              <FormDot key={fi} type={f} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--fumo)]">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-[3px] rounded-full bg-[color:var(--lario)]" /> Champions</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-[3px] rounded-full bg-[color:var(--viola)]" /> Europa</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-[3px] rounded-full bg-red-500" /> Retrocessione</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalFixture && (
        <MatchSheet
          fixture={modalFixture}
          details={matchDetails}
          loading={loadingModal}
          error={matchDetailsError}
          stagione={stagione}
          onClose={closeMatch}
        />
      )}
    </div>
  );
}

export default function ScoutHub() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex justify-center items-center pt-24">
        <Loader2 className="w-10 h-10 text-[color:var(--lario)] animate-spin" />
      </div>
    }>
      <ScoutHubContent />
    </Suspense>
  );
}
