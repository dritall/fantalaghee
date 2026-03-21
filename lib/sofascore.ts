export async function fetchMatchDetails(matchId: number) {
  try {
    const [statsRes, incidentsRes, lineupsRes] = await Promise.all([
      fetch(`/api/sofascore?endpoint=matches/get-statistics&matchId=${matchId}`).then(res => res.json()),
      fetch(`/api/sofascore?endpoint=matches/get-incidents&matchId=${matchId}`).then(res => res.json()),
      fetch(`/api/sofascore?endpoint=matches/get-lineups&matchId=${matchId}`).then(res => res.json())
    ]);

    const incidents = incidentsRes?.incidents || [];
    const subsIn: Record<number, number> = {};
    incidents.forEach((inc: any) => {
      if (inc.incidentType === 'substitution' && inc.playerIn) subsIn[inc.playerIn.id] = inc.time;
    });

    const parseL = (side: any) => ({
      starters: (side?.players || []).filter((p: any) => !p.substitute).map((p: any) => ({
        id: p.player.id, name: p.player.shortName || p.player.name, number: p.shirtNumber
      })),
      subs: (side?.players || []).filter((p: any) => p.substitute).map((p: any) => ({
        id: p.player.id, name: p.player.shortName || p.player.name, number: p.shirtNumber, enteredAt: subsIn[p.player.id] || null
      }))
    });

    return { 
      stats: statsRes?.statistics?.[0]?.groups || [], 
      incidents: incidents.filter((i: any) => ['goal', 'card', 'substitution'].includes(i.incidentType)),
      lineups: { home: parseL(lineupsRes?.home), away: parseL(lineupsRes?.away) }
    };
  } catch (e) { 
    console.error(`🔥 [LIB ERROR] fetchMatchDetails fallita per Match ID ${matchId}:`, e);
    return { stats: [], incidents: [], lineups: null }; 
  }
}
