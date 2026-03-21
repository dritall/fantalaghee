export async function fetchMatchDetails(matchId: number) {
  try {
    const [statsRes, incidentsRes, lineupsRes] = await Promise.all([
      fetch(`/api/sofascore?endpoint=matches/get-statistics&matchId=${matchId}`).then(res => res.json()),
      fetch(`/api/sofascore?endpoint=matches/get-incidents&matchId=${matchId}`).then(res => res.json()),
      fetch(`/api/sofascore?endpoint=matches/get-lineups&matchId=${matchId}`).then(res => res.json())
    ]);

    const rawIncidents = incidentsRes?.incidents || [];
    const parsedIncidents = rawIncidents.map((inc: any) => ({
      type: inc.incidentType, // 'goal', 'card', 'substitution'
      class: inc.incidentClass, // 'yellow', 'red', 'regular'
      time: inc.time,
      player: inc.player?.shortName || inc.playerName || 'Sconosciuto',
      playerIn: inc.playerIn?.shortName,
      playerOut: inc.playerOut?.shortName,
      isHome: inc.isHome,
      description: inc.description
    })).filter((i: any) => ['goal', 'card', 'substitution'].includes(i.type));

    return { 
      stats: statsRes?.statistics?.[0]?.groups || [], 
      incidents: parsedIncidents.sort((a:any, b:any) => a.time - b.time),
      lineups: {
        home: lineupsRes?.home || { players: [] },
        away: lineupsRes?.away || { players: [] }
      }
    };
  } catch (error) {
    console.error("Dettagli falliti:", error);
    return { stats: [], incidents: [], lineups: { home: { players: [] }, away: { players: [] } } };
  }
}
