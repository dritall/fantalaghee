export async function fetchMatchDetails(matchId: number) {
  try {
    const [statsRes, incidentsRes, lineupsRes] = await Promise.all([
      fetch("/api/sofascore?endpoint=matches/get-statistics&matchId=" + matchId).then(res => res.json()),
      fetch("/api/sofascore?endpoint=matches/get-incidents&matchId=" + matchId).then(res => res.json()),
      fetch("/api/sofascore?endpoint=matches/get-lineups&matchId=" + matchId).then(res => res.json())
    ]);
    const incidents = incidentsRes?.incidents || [];
    const subsMap: Record<number, number> = {};
    incidents.forEach((inc: any) => {
      if (inc.incidentType === 'substitution' && inc.playerIn) subsMap[Number(inc.playerIn.id)] = inc.time;
    });
    const parseL = (side: any) => ({
      starters: (side?.players || []).filter((p: any) => !p.substitute).map((p: any) => ({
        id: p.player.id, name: String(p.player.shortName || p.player.name), number: p.shirtNumber
      })),
      subs: (side?.players || []).filter((p: any) => p.substitute).map((p: any) => ({
        id: p.player.id, name: String(p.player.shortName || p.player.name), number: p.shirtNumber, enteredAt: subsMap[Number(p.player.id)] || null
      }))
    });
    return {
      stats: statsRes?.statistics?.[0]?.groups || [],
      incidents: incidents.filter((i: any) => ['goal', 'card', 'substitution'].includes(i.incidentType)).map((inc: any) => ({
        type: inc.incidentType, class: inc.incidentClass, time: inc.time, isHome: inc.isHome,
        playerName: String(inc.player?.shortName || inc.playerName || "Sconosciuto"),
        playerInName: inc.playerIn ? String(inc.playerIn.shortName) : "",
        playerOutName: inc.playerOut ? String(inc.playerOut.shortName) : "",
        assist: inc.assist1 ? String(inc.assist1.shortName || inc.assist1.name) : null
      })),
      lineups: { home: parseL(lineupsRes?.home), away: parseL(lineupsRes?.away) }
    };
  } catch (e) { 
    console.error("🔥 [LIB ERROR] fetchMatchDetails fallita per Match ID " + matchId + ":", e);
    return { stats: [], incidents: [], lineups: null }; 
  }
}
