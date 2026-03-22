export async function fetchMatchDetails(matchId: number) {
  try {
    const [statsRes, incidentsRes, lineupsRes] = await Promise.all([
      fetch("/api/sofascore?endpoint=matches/get-statistics&matchId=" + matchId).then(res => res.json()),
      fetch("/api/sofascore?endpoint=matches/get-incidents&matchId=" + matchId).then(res => res.json()),
      fetch("/api/sofascore?endpoint=matches/get-lineups&matchId=" + matchId).then(res => res.json())
    ]);

    const incidents = incidentsRes?.incidents || [];
    const subsIn: Record<number, number> = {};
    incidents.forEach((inc: any) => {
      if (inc.incidentType === 'substitution' && inc.playerIn) {
        subsIn[Number(inc.playerIn.id)] = inc.time;
      }
    });

    const parseL = (side: any) => ({
      starters: (side?.players || []).filter((p: any) => !p.substitute).map((p: any) => ({
        id: p.player.id, 
        name: String(p.player.shortName || p.player.name || "Sconosciuto"), 
        number: p.shirtNumber
      })),
      subs: (side?.players || []).filter((p: any) => p.substitute).map((p: any) => ({
        id: p.player.id, 
        name: String(p.player.shortName || p.player.name || "Sconosciuto"), 
        number: p.shirtNumber, 
        enteredAt: subsIn[Number(p.player.id)] || null
      }))
    });

    const parsedIncidents = incidents
      .filter((i: any) => ['goal', 'card', 'substitution'].includes(i.incidentType))
      .map((inc: any) => ({
        type: inc.incidentType,
        class: inc.incidentClass,
        time: inc.time,
        playerName: String(inc.player?.shortName || inc.player?.name || inc.playerName || "Sconosciuto"),
        playerInName: inc.playerIn ? String(inc.playerIn.shortName) : "",
        isHome: inc.isHome
      }));

    return { 
      stats: statsRes?.statistics?.[0]?.groups || [], 
      incidents: parsedIncidents,
      lineups: { home: parseL(lineupsRes?.home), away: parseL(lineupsRes?.away) }
    };
  } catch (e) { 
    return { stats: [], incidents: [], lineups: null }; 
  }
}
