export async function fetchMatchDetails(matchId: number) {
  console.log("🔍 Fetching details for matchId:", matchId);
  try {
    const [statsRes, incidentsRes] = await Promise.all([
      fetch(`/api/sofascore?endpoint=matches/v1/get-statistics&matchId=${matchId}`).then(res => res.json()),
      fetch(`/api/sofascore?endpoint=matches/v1/get-incidents&matchId=${matchId}`).then(res => res.json())
    ]);
    console.log("📦 RAW INCIDENTS DATA:", incidentsRes);
    const rawIncidents = incidentsRes?.incidents || [];
    const parsedIncidents = rawIncidents
      .filter((inc: any) => inc.incidentType === 'goal' || inc.incidentType === 'card')
      .map((inc: any) => ({
        incidentType: inc.incidentType,
        incidentClass: inc.incidentClass,
        time: inc.time,
        player: { name: inc.playerName || inc.player?.name || 'Sconosciuto' },
        isHome: inc.isHome
      }));
    return { stats: statsRes?.statistics?.[0]?.groups || [], incidents: parsedIncidents };
  } catch (error) {
    console.error("❌ ERR fetchMatchDetails:", error);
    return { stats: [], incidents: [] };
  }
}
