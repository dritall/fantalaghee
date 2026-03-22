export async function fetchMatchDetails(matchId: number) {
  try {
    const [statsRes, incidentsRes, lineupsRes] = await Promise.all([
      fetch("/api/sofascore?endpoint=matches/get-statistics&matchId=" + matchId).then(res => res.json()),
      fetch("/api/sofascore?endpoint=matches/get-incidents&matchId=" + matchId).then(res => res.json()),
      fetch("/api/sofascore?endpoint=matches/get-lineups&matchId=" + matchId).then(res => res.json())
    ]);

    const rawIncidents = incidentsRes?.incidents || [];
    const subsInMap: Record<number, number> = {};
    
    // Mappiamo i minuti di ingresso dei panchinari
    rawIncidents.forEach((inc: any) => {
      if (inc.incidentType === 'substitution' && inc.playerIn) {
        subsInMap[Number(inc.playerIn.id)] = inc.time;
      }
    });

    const parsedIncidents = rawIncidents
      .filter((i: any) => ['goal', 'card', 'substitution'].includes(i.incidentType))
      .map((inc: any) => ({
        type: inc.incidentType,
        class: inc.incidentClass, // 'yellow', 'red'
        time: inc.time,
        isHome: inc.isHome,
        playerName: String(inc.player?.shortName || inc.playerName || "Sconosciuto"),
        playerInName: inc.playerIn ? String(inc.playerIn.shortName) : "",
        playerOutName: inc.playerOut ? String(inc.playerOut.shortName) : "",
        assist: inc.assist1 ? String(inc.assist1.shortName || inc.assist1.name) : null
      }));

    const parseSide = (side: any) => ({
      starters: (side?.players || []).filter((p: any) => !p.substitute).map((p: any) => ({
        id: p.player.id, 
        name: String(p.player.shortName || p.player.name), 
        number: p.shirtNumber
      })),
      subs: (side?.players || []).filter((p: any) => p.substitute).map((p: any) => ({
        id: p.player.id, 
        name: String(p.player.shortName || p.player.name), 
        number: p.shirtNumber,
        enteredAt: subsInMap[Number(p.player.id)] || null
      }))
    });

    return { 
      stats: statsRes?.statistics?.[0]?.groups || [], 
      incidents: parsedIncidents,
      lineups: { home: parseSide(lineupsRes?.home), away: parseSide(lineupsRes?.away) }
    };
  } catch (e) { 
    console.error("🔥 [LIB ERROR] fetchMatchDetails fallita per Match ID " + matchId + ":", e);
    return { stats: [], incidents: [], lineups: { home: { starters: [], subs: [] }, away: { starters: [], subs: [] } } }; 
  }
}
