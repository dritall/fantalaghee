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
    const [statsRes, incidentsRes] = await Promise.all([
      fetch(`/api/sofascore?endpoint=matches/v1/get-statistics&matchId=${matchId}`).then(res => res.json()),
      fetch(`/api/sofascore?endpoint=matches/v1/get-incidents&matchId=${matchId}`).then(res => res.json())
    ]);
    
    const rawIncidents = incidentsRes?.incidents || [];
    const parsedIncidents: MatchEvent[] = rawIncidents
      .filter((inc: any) => inc.incidentType === 'goal' || inc.incidentType === 'card')
      .map((inc: any) => ({
        incidentType: inc.incidentType,
        incidentClass: inc.incidentClass,
        time: inc.time,
        player: inc.player ? { name: inc.player.shortName || inc.player.name, id: inc.player.id } : (inc.playerName ? { name: inc.playerName } : null),
        // Gli assist in Sofascore sono spesso nell'array footballPassingNetworkAction o come assist1
        assist1: inc.assist1 ? { name: inc.assist1.shortName || inc.assist1.name } : null,
        isHome: inc.isHome
      }));

    return { 
      stats: statsRes?.statistics?.[0]?.groups || [], 
      incidents: parsedIncidents.sort((a,b) => a.time - b.time) 
    };
  } catch (error) {
    return { stats: [], incidents: [] };
  }
}
