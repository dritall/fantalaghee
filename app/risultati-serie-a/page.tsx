"use client";
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Users, BarChart3, Clock, ArrowUpRight, Construction } from 'lucide-react';

export default function ScoutHub() {
  const [activeTab, setActiveTab] = useState('calendario');
  const [roundsMatches, setRoundsMatches] = useState<Record<number, any[]>>({});
  const [selectedRound, setSelectedRound] = useState(1);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalFixture, setModalFixture] = useState<any>(null);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [matchTab, setMatchTab] = useState<'cronaca' | 'stats' | 'formazioni'>('cronaca');

  useEffect(() => {
    async function load() {
      try {
        // Chiamate sicure al nostro nuovo Shield (Lega Serie A API)
        const [matchesRes, standingsRes] = await Promise.all([
          fetch('/api/football?endpoint=matches').then(r => r.json()),
          fetch('/api/football?endpoint=standings').then(r => r.json())
        ]);

        // 1. ELABORAZIONE CALENDARIO (Matches)
        // La Lega Serie A restituisce un array diretto o dentro un oggetto base
        const allMatches = matchesRes.data || matchesRes.matches || (Array.isArray(matchesRes) ? matchesRes : []);
        
        const map: Record<number, any[]> = {};
        let maxPlayedRound = 1;

        allMatches.forEach((m: any) => {
          // Estraiamo il numero della giornata da "Matchday 30"
          let r = 1;
          if (m.shortName && typeof m.shortName === 'string') {
            const matchNum = m.shortName.match(/\d+/);
            if (matchNum) r = parseInt(matchNum[0]);
          }

          if (!map[r]) map[r] = [];
          map[r].push(m);

          // Calcoliamo l'ultima giornata giocata
          if (m.matchdayStatus === 'Played' || m.scheduleStatus === 'Played') {
            if (r > maxPlayedRound) maxPlayedRound = r;
          }
        });

        setRoundsMatches(map);
        setSelectedRound(maxPlayedRound);

        // 2. ELABORAZIONE CLASSIFICA (Standings)
        const teamsList = standingsRes.teams || standingsRes.data?.teams || [];
        
        const parsedStandings = teamsList.map((t: any) => {
           // I punti sono un oggetto dentro l'array "stats" con id "points"
           const ptsObj = t.stats?.find((s: any) => s.statsId === 'points');
           return {
             id: t.teamId,
             name: t.shortName || t.officialName,
             logo: t.imagery?.teamLogo,
             points: ptsObj ? ptsObj.statsValue : 0
           };
        });

        // Ordiniamo per punti decrescenti
        parsedStandings.sort((a: any, b: any) => b.points - a.points);
        setStandings(parsedStandings);

      } catch (e) {
        console.error("🔥 [UI ERROR] Errore sincronizzazione Hub Serie A:", e);
      } finally { 
        setLoading(false); 
      }
    }
    load();
  }, []);

  const openMatch = async (m: any) => {
    setModalFixture(m); 
    setMatchTab('cronaca'); 
    setMatchDetails(null);
    
    // Simuliamo un caricamento in attesa di collegare l'endpoint dei feed/formazioni ufficiali
    setTimeout(() => {
        setMatchDetails({ wip: true });
    }, 1000);
  };

  const getLogo = (logoCode?: string) => {
    if (!logoCode) return ""; // Placeholder se manca
    return `https://img.legaseriea.it/vimages/${logoCode}`;
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-bold uppercase tracking-[0.3em] animate-pulse italic text-sm">Sincronizzazione Serie A...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 pt-24 font-sans selection:bg-cyan-500/30">
      <div className="max-w-5xl mx-auto">
        
        {/* TAB HEADER */}
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl mb-8 max-w-xs mx-auto border border-white/5 shadow-2xl">
          {['calendario', 'classifica'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${activeTab === t ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-zinc-500 hover:text-white'}`}>{t}</button>
          ))}
        </div>

        {/* CONTENUTO CALENDARIO */}
        {activeTab === 'calendario' ? (
          <div className="space-y-6">
            <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar scroll-smooth">
              {Array.from({length: 38}, (_, i) => i + 1).map((r) => (
                <button key={r} onClick={() => setSelectedRound(r)} className={`px-5 py-2 rounded-xl shrink-0 font-bold text-xs border transition-all duration-300 ${selectedRound===r?'border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]':'border-white/5 text-zinc-600 hover:border-white/20'}`}>G.{r}</button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundsMatches[selectedRound] ? roundsMatches[selectedRound].map(m => {
                const homeScore = m.providerHomeScore;
                const awayScore = m.providerAwayScore;
                const isPlayed = m.matchdayStatus === 'Played' || m.scheduleStatus === 'Played' || homeScore !== null;

                return (
                  <div key={m.matchId} onClick={() => openMatch(m)} className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-zinc-800 hover:border-white/20 transition-all group shadow-lg">
                    {/* SQUADRA CASA */}
                    <div className="flex items-center gap-4 w-[42%]">
                        <img src={getLogo(m.homeTeam?.imagery?.teamLogo)} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt=""/>
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{m.homeTeam?.shortName}</span>
                    </div>
                    
                    {/* PUNTEGGIO */}
                    <div className="text-center font-black text-cyan-400 italic text-sm tracking-tighter shadow-cyan-500/10 drop-shadow-md">
                        {!isPlayed ? 'VS' : `${homeScore ?? 0} - ${awayScore ?? 0}`}
                    </div>
                    
                    {/* SQUADRA OSPITE */}
                    <div className="flex items-center gap-4 w-[42%] justify-end text-right">
                        <span className="text-xs font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{m.awayTeam?.shortName}</span>
                        <img src={getLogo(m.awayTeam?.imagery?.teamLogo)} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt=""/>
                    </div>
                  </div>
                )
              }) : <div className="col-span-full py-20 text-center text-zinc-700 font-black uppercase text-xs tracking-[0.4em] opacity-50">Giornata non ancora disponibile</div>}
            </div>
          </div>
        ) : (
          /* CONTENUTO CLASSIFICA */
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-sm shadow-2xl">
            {standings.map((t, i) => (
              <div key={t.id} className="grid grid-cols-12 items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-6 rounded-2xl transition-all group">
                <span className="col-span-1 text-[10px] font-black text-zinc-600 group-hover:text-cyan-500 transition-colors">{(i+1).toString().padStart(2,'0')}</span>
                <div className="col-span-8 flex items-center gap-4">
                    <img src={getLogo(t.logo)} className="w-8 h-8 object-contain" alt="" />
                    <span className="text-sm font-bold uppercase tracking-tight group-hover:translate-x-1 transition-transform">{t.name}</span>
                </div>
                <span className="col-span-3 text-right font-black text-cyan-400 tracking-tighter group-hover:scale-110 transition-transform">{t.points} PT</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALE DETTAGLIO PARTITA */}
      <Dialog.Root open={!!modalFixture} onOpenChange={() => setModalFixture(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080808] border border-white/10 rounded-[3.5rem] w-[95vw] max-w-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_100px_rgba(0,0,0,1)]">
            <Dialog.Title className="sr-only">Dettagli Partita</Dialog.Title>
            <Dialog.Description className="sr-only">Resoconto eventi, statistiche e formazioni ufficiali.</Dialog.Description>
            
            <div className="p-8 bg-white/5 border-b border-white/5 flex flex-col items-center">
               <div className="flex justify-between items-center mb-8 px-4 w-full">
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                      <img src={getLogo(modalFixture?.homeTeam?.imagery?.teamLogo)} className="w-16 h-16 object-contain" alt="" />
                      <span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{modalFixture?.homeTeam?.shortName}</span>
                  </div>
                  <div className="text-6xl font-black italic tracking-tighter text-white shadow-cyan-500/20 drop-shadow-2xl">
                      {modalFixture?.providerHomeScore ?? 0} - {modalFixture?.providerAwayScore ?? 0}
                  </div>
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                      <img src={getLogo(modalFixture?.awayTeam?.imagery?.teamLogo)} className="w-16 h-16 object-contain" alt="" />
                      <span className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">{modalFixture?.awayTeam?.shortName}</span>
                  </div>
               </div>
               
               <div className="flex bg-black p-1 rounded-2xl border border-white/5 w-full max-w-md mx-auto shadow-inner">
                  {[ {id:'cronaca', i:Clock}, {id:'stats', i:BarChart3}, {id:'formazioni', i:Users} ].map(t => (
                    <button key={t.id} onClick={() => setMatchTab(t.id as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all duration-300 ${matchTab === t.id ? 'bg-zinc-800 text-cyan-400 shadow-md' : 'text-zinc-600 hover:text-white'}`}><t.i className="w-3 h-3"/>{t.id}</button>
                  ))}
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               {!matchDetails ? (
                   <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
                       <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest italic">Sincronizzazione Dati...</span>
                   </div>
               ) : (
                   <div className="flex flex-col items-center justify-center h-full gap-4 py-20 text-zinc-500">
                       <Construction className="w-12 h-12 text-zinc-700" />
                       <span className="text-xs font-black uppercase tracking-[0.2em]">Integrazione API Feed Ufficiale in corso...</span>
                       <span className="text-[10px] w-2/3 text-center opacity-60">I dettagli dei singoli match verranno aggiunti nel prossimo step con i nuovi endpoint di Matchday.</span>
                   </div>
               )}
            </div>
            <button onClick={() => setModalFixture(null)} className="absolute top-8 right-8 p-3 bg-zinc-900/50 rounded-full border border-white/10 hover:bg-red-500 hover:text-white text-zinc-500 transition-all duration-300 shadow-2xl backdrop-blur-md flex items-center justify-center active:scale-95"><X className="w-5 h-5"/></button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
