// @ts-nocheck
/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, AlertTriangle } from 'lucide-react';

const TOTAL_ROUNDS = 38;
const IMG_BASE = 'https://img.legaseriea.it/vimages/';

const TeamLogo = ({ logo, name, className }: { logo?: string, name: string, className: string }) => {
  const [imgError, setImgError] = useState(false);
  const src = logo ? `${IMG_BASE}${logo}` : null;
  if (!src || imgError) {
    const short = name?.substring(0, 3).toUpperCase() || '?';
    return <img src={`https://ui-avatars.com/api/?name=${short}&background=27272a&color=22d3ee&rounded=true&bold=true&font-size=0.4`} className={`${className} object-contain rounded-full`} alt={name} />;
  }
  return <img src={src} onError={() => setImgError(true)} className={`${className} object-contain`} alt={name} />;
};

export default function ScoutHub() {
  const [activeTab, setActiveTab]       = useState('calendario');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [matches, setMatches]           = useState<any[]>([]);
  const [standings, setStandings]       = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingStandings, setLoadingStandings] = useState(true);
  const [matchError, setMatchError]     = useState<string | null>(null);
  const [modalFixture, setModalFixture] = useState<any>(null);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- CARICA CLASSIFICA una volta sola ---
  useEffect(() => {
    fetch('/api/football?endpoint=standings')
      .then(r => r.json())
      .then(res => {
        const teams = res?.data?.teams || [];
        const parsed = teams.map((t: any) => {
          const getStat = (id: string) => {
            const s = t.stats?.find((x: any) => x.statsId === id);
            return s ? parseInt(s.statsValue) || 0 : 0;
          };
          return {
            id: t.teamId,
            name: t.shortName || t.officialName || 'N/A',
            logo: t.imagery?.teamLogo,
            points: getStat('points'),
            played: getStat('matches-played'),
            win:    getStat('win'),
            draw:   getStat('draw'),
            lose:   getStat('lose'),
            gd:     getStat('goal-difference'),
          };
        }).sort((a: any, b: any) => b.points - a.points);
        setStandings(parsed);
      })
      .catch(e => console.error('Standings error:', e))
      .finally(() => setLoadingStandings(false));
  }, []);

  // --- CARICA PARTITE per giornata selezionata ---
  const loadRound = useCallback(async (round: number) => {
    setLoadingMatches(true);
    setMatchError(null);
    setMatches([]);
    try {
      const res = await fetch(`/api/football?endpoint=matches&round=${round}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Errore sconosciuto');
      setMatches(json.data?.matches || []);
    } catch (e: any) {
      setMatchError(e.message);
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  // Carica la giornata più recente all'avvio: stima round corrente (giornata 30 ora)
  useEffect(() => {
    // Partiamo dalla 30 come default (stagione in corso), poi l'utente naviga
    const currentRound = 30;
    setSelectedRound(currentRound);
    loadRound(currentRound);
  }, [loadRound]);

  const handleRoundChange = (r: number) => {
    setSelectedRound(r);
    loadRound(r);
  };

  // Auto scroll tab giornate
  useEffect(() => {
    if (scrollRef.current && activeTab === 'calendario') {
      setTimeout(() => {
        const btn = scrollRef.current?.querySelector('.active-round-btn');
        btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 150);
    }
  }, [selectedRound, activeTab]);

  // --- APRI MODAL PARTITA ---
  const openMatch = async (m: any) => {
    setModalFixture(m);
    setMatchDetails(null);
    setLoadingModal(true);
    try {
      const res = await fetch(`/api/football?endpoint=match&id=${m.matchId}`);
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

  return (
    <div className="min-h-screen bg-black text-white p-4 pt-24 font-sans selection:bg-cyan-500/30">
      <div className="max-w-5xl mx-auto">

        {/* TAB switcher */}
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl mb-8 max-w-xs mx-auto border border-white/5 shadow-2xl">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300
                ${activeTab === t ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ===== CALENDARIO ===== */}
        {activeTab === 'calendario' && (
          <div className="space-y-6">

            {/* Scroll giornate */}
            <div ref={scrollRef} className="flex overflow-x-auto gap-2 pb-4 no-scrollbar scroll-smooth">
              {Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1).map(r => (
                <button key={r} onClick={() => handleRoundChange(r)}
                  className={`px-5 py-2 rounded-xl shrink-0 font-bold text-xs border transition-all duration-300
                    ${selectedRound === r
                      ? 'active-round-btn border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                      : 'border-white/5 text-zinc-600 hover:border-white/20'}`}>
                  G.{r}
                </button>
              ))}
            </div>

            {/* Partite */}
            {loadingMatches ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : matchError ? (
              <div className="bg-red-900/20 border border-red-500/30 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-2 text-xs uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4" /> Errore caricamento
                </div>
                <p className="text-zinc-400 text-xs">{matchError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((m, idx) => {
                  const home = resolveTeam(m.homeTeam || m.home, 'Casa');
                  const away = resolveTeam(m.awayTeam || m.away, 'Ospite');
                  const homeScore = m.providerHomeScore ?? m.homeScore;
                  const awayScore = m.providerAwayScore ?? m.awayScore;
                  const isPlayed = homeScore !== null && homeScore !== undefined;
                  return (
                    <div key={m.matchId || idx} onClick={() => openMatch(m)}
                      className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-zinc-800 hover:border-white/20 transition-all group shadow-lg">
                      <div className="flex items-center gap-4 w-[42%]">
                        <TeamLogo logo={home.logo} name={home.name} className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{home.name}</span>
                      </div>
                      <div className="text-center font-black text-cyan-400 italic text-sm tracking-tighter">
                        {isPlayed ? `${homeScore} - ${awayScore}` : 'VS'}
                      </div>
                      <div className="flex items-center gap-4 w-[42%] justify-end text-right">
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{away.name}</span>
                        <TeamLogo logo={away.logo} name={away.name} className="w-10 h-10 group-hover:scale-110 transition-transform" />
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
            <div className="min-w-[600px]">
              <div className="grid grid-cols-12 items-center py-2 px-6 text-[10px] font-black uppercase text-zinc-500 border-b border-white/10 mb-2">
                <span className="col-span-1">#</span>
                <span className="col-span-5">Squadra</span>
                <span className="col-span-1 text-center">G</span>
                <span className="col-span-1 text-center text-emerald-500">V</span>
                <span className="col-span-1 text-center text-zinc-400">N</span>
                <span className="col-span-1 text-center text-red-500">P</span>
                <span className="col-span-1 text-center">DR</span>
                <span className="col-span-1 text-right text-cyan-400">PTS</span>
              </div>
              {loadingStandings ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
              ) : standings.map((t, i) => (
                <div key={t.id} className="grid grid-cols-12 items-center py-3.5 border-b border-white/5 last:border-0 hover:bg-white/5 px-6 rounded-2xl transition-all group">
                  <span className="col-span-1 text-[11px] font-black text-zinc-600 group-hover:text-cyan-500">{String(i + 1).padStart(2, '0')}</span>
                  <div className="col-span-5 flex items-center gap-4">
                    <TeamLogo logo={t.logo} name={t.name} className="w-8 h-8" />
                    <span className="text-sm font-bold uppercase tracking-tight group-hover:translate-x-1 transition-transform truncate">{t.name}</span>
                  </div>
                  <span className="col-span-1 text-center text-xs font-mono text-white/80">{t.played}</span>
                  <span className="col-span-1 text-center text-xs font-mono text-emerald-400/80">{t.win}</span>
                  <span className="col-span-1 text-center text-xs font-mono text-zinc-400">{t.draw}</span>
                  <span className="col-span-1 text-center text-xs font-mono text-red-400/80">{t.lose}</span>
                  <span className="col-span-1 text-center text-xs font-mono font-bold text-white/50">{t.gd > 0 ? `+${t.gd}` : t.gd}</span>
                  <span className="col-span-1 text-right font-black text-cyan-400 tracking-tighter group-hover:scale-110 transition-transform">{t.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL PARTITA ===== */}
      <Dialog.Root open={!!modalFixture} onOpenChange={() => { setModalFixture(null); setMatchDetails(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080808] border border-white/10 rounded-[3.5rem] w-[95vw] max-w-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            <Dialog.Title className="sr-only">Dettagli Partita</Dialog.Title>

            {/* Header con squadre e punteggio */}
            {modalFixture && (() => {
              const home = resolveTeam(modalFixture.homeTeam || modalFixture.home, 'Casa');
              const away = resolveTeam(modalFixture.awayTeam || modalFixture.away, 'Ospite');
              const hs = modalFixture.providerHomeScore ?? modalFixture.homeScore ?? '-';
              const as_ = modalFixture.providerAwayScore ?? modalFixture.awayScore ?? '-';
              return (
                <div className="p-8 bg-white/5 border-b border-white/5 flex flex-col items-center">
                  <div className="flex justify-between items-center w-full px-4">
                    <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                      <TeamLogo logo={home.logo} name={home.name} className="w-16 h-16" />
                      <span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{home.name}</span>
                    </div>
                    <div className="text-6xl font-black italic tracking-tighter text-white drop-shadow-2xl">
                      {hs} - {as_}
                    </div>
                    <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                      <TeamLogo logo={away.logo} name={away.name} className="w-16 h-16" />
                      <span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{away.name}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Body modal */}
            <div className="flex-1 overflow-y-auto p-8">
              {loadingModal ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : matchDetails?.stats ? (
                // Stats squadre
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Statistiche</h3>
                  {(matchDetails.stats?.homeTeamStats || []).map((stat: any, i: number) => {
                    const homeVal = parseInt(stat.value) || 0;
                    const awayVal = parseInt(matchDetails.stats?.awayTeamStats?.[i]?.value) || 0;
                    const total = homeVal + awayVal || 1;
                    return (
                      <div key={stat.label || i} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                          <span className="text-white">{homeVal}</span>
                          <span className="uppercase tracking-widest">{stat.label}</span>
                          <span className="text-white">{awayVal}</span>
                        </div>
                        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-zinc-800">
                          <div className="bg-cyan-400 rounded-l-full transition-all" style={{ width: `${(homeVal / total) * 100}%` }} />
                          <div className="bg-zinc-600 rounded-r-full transition-all" style={{ width: `${(awayVal / total) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-zinc-600 text-xs uppercase tracking-widest py-10">
                  {matchDetails === null ? 'Nessun dato disponibile' : 'Statistiche non ancora disponibili per questa partita'}
                </p>
              )}
            </div>

            <button onClick={() => { setModalFixture(null); setMatchDetails(null); }}
              className="absolute top-8 right-8 p-3 bg-zinc-900/50 rounded-full border border-white/10 hover:bg-red-500 hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
