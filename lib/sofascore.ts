export async function fetchMatchDetails(matchId: number) {
  try {
    const [statsRes, incidentsRes] = await Promise.all([
      fetch(`/api/sofascore?endpoint=matches/get-statistics&matchId=${matchId}`).then(res => res.json()),
      fetch(`/api/sofascore?endpoint=matches/get-incidents&matchId=${matchId}`).then(res => res.json())
    ]);

    const rawIncidents = incidentsRes?.incidents || [];
    const parsedIncidents = rawIncidents
      .filter((inc: any) => inc.incidentType === 'goal' || inc.incidentType === 'card' || inc.incidentType === 'substitution')
      .map((inc: any) => ({
        incidentType: inc.incidentType,
        incidentClass: inc.incidentClass,
        time: inc.time,
        player: inc.player?.shortName || inc.playerName || 'Sconosciuto',
        playerIn: inc.playerIn?.shortName,
        isHome: inc.isHome
      }));

    return { 
      stats: statsRes?.statistics?.[0]?.groups || [], 
      incidents: parsedIncidents 
    };
  } catch (error) {
    return { stats: [], incidents: [] };
  }
}
