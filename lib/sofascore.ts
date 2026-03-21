// lib/sofascore.ts

export interface MatchEvent {
  incidentType: string;
  incidentClass?: string;
  time: number;
  player: { name: string; id?: number } | null;
  assist1?: { name: string; id?: number } | null;
  isHome: boolean;
}

export async function fetchMatchDetails(matchId: number) {
  try {
    // 1. Fetch Statistics (Tentiamo la radice events e come fallback matches)
    let statsRes = await fetch(`/api/sofascore?endpoint=events/v1/get-statistics&eventId=${matchId}`).then(res => res.json()).catch(() => null);
    if (!statsRes || statsRes.message?.includes('does not exist') || statsRes.error) {
        statsRes = await fetch(`/api/sofascore?endpoint=matches/v1/get-statistics&matchId=${matchId}`).then(res => res.json()).catch(() => null);
    }
    
    // 2. Fetch Incidents (Tentiamo la radice events e come fallback il root base)
    let incidentsRes = await fetch(`/api/sofascore?endpoint=events/v1/get-incidents&eventId=${matchId}`).then(res => res.json()).catch(() => null);
    if (!incidentsRes || incidentsRes.message?.includes('does not exist') || incidentsRes.error) {
        incidentsRes = await fetch(`/api/sofascore?endpoint=events/get-incidents&eventId=${matchId}`).then(res => res.json()).catch(() => null);
    }
    
    // Parsing corazzato basato sul dump ufficiale di Sofascore API
    const rawIncidents = incidentsRes?.incidents || [];
    
    const parsedIncidents: MatchEvent[] = rawIncidents.map((inc: any) => {
        // Estrazione sicura del nome giocatore (Sofascore usa 'playerName' o 'player.name')
        const playerName = inc.playerName || inc.player?.name || null;
        const playerId = inc.player?.id || null;
        
        return {
            incidentType: inc.incidentType, // 'goal', 'card', 'substitution'
            incidentClass: inc.incidentClass, // 'yellow', 'red', 'regular'
            time: inc.time,
            player: playerName ? { name: playerName, id: playerId } : null,
            assist1: inc.assist1 ? { name: inc.assist1.name, id: inc.assist1.id } : null,
            isHome: inc.isHome
        };
    });

    return {
      stats: statsRes?.statistics?.[0]?.groups || [],
      incidents: parsedIncidents
    };
  } catch (error) {
    console.error("Errore fetchMatchDetails:", error);
    return { stats: [], incidents: [] };
  }
}
