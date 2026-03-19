// Sofascore/API-Dojo utility functions

export interface MatchEvent {
  incidentType: string; // 'goal', 'card', etc.
  incidentClass?: string; // 'regular', 'yellow', 'red'
  time: number;
  player: { name: string; id?: number } | null;
  assist1?: { name: string; id?: number } | null;
  isHome: boolean;
}

/**
 * Normalizes team names for better matching between API-Football and Sofascore.
 */
const normalizeName = (name: string): string => {
  if (!name) return "";
  return name.toLowerCase()
    .replace(/\b(fc|ac|ss|as|hellas|calcio|us|1907|1899|internazionale)\b/g, '')
    .trim();
};

/**
 * Hybrid Bridge to fetch match events from Sofascore via API-Dojo
 * Step A: Retrieve the Match ID
 * Step B: Fetch Incidents array
 */
export async function fetchMatchEvents(homeName: string, awayName: string, dateStr: string): Promise<MatchEvent[]> {
  try {
    // Step A: Search for the schedule around that date
    // Make sure date is YYYY-MM-DD
    const dateQuery = new Date(dateStr).toISOString().split('T')[0].split('-').join(''); // API-Dojo schedule format is YYYYMMDD
    const isoDate = new Date(dateStr).toISOString().split('T')[0]; // API-Dojo schedule/v2/get-matches might use YYYY-MM-DD
    
    // Some API-Dojo endpoints: schedule/get-schedule requires a date in YYYY-MM-DD
    const scheduleRes = await fetch(`/api/sofascore?endpoint=schedule/v2/get-matches&date=${isoDate}&timezone=Europe/Rome`).then(res => res.json());
    
    const events = scheduleRes?.events || [];

    // Find the right event
    const matchEvent = events.find((evt: any) => {
       const sHome = normalizeName(evt?.homeTeam?.name || evt?.home?.name || evt?.entity?.homeTeam?.name);
       const sAway = normalizeName(evt?.awayTeam?.name || evt?.away?.name || evt?.entity?.awayTeam?.name);
       const aHome = normalizeName(homeName);
       const aAway = normalizeName(awayName);
       
       const isHomeMatch = sHome.includes(aHome) || aHome.includes(sHome);
       const isAwayMatch = sAway.includes(aAway) || aAway.includes(sAway);
       
       return isHomeMatch && isAwayMatch;
    });

    if (!matchEvent || !matchEvent.id) {
       console.warn(`Match non trovato su Sofascore. Cercavo: [Home: "${homeName}" -> "${normalizeName(homeName)}"] | [Away: "${awayName}" -> "${normalizeName(awayName)}"]. Data: ${isoDate}`);
       return [];
    }

    const eventId = matchEvent.id;

    // Step B: Get incidents using the fetched ID
    const incidentsRes = await fetch(`/api/sofascore?endpoint=events/get-incidents&eventId=${eventId}`).then(res => res.json());
    
    const rawIncidents = incidentsRes?.incidents || [];
    
    // Parse incidents into MatchEvent array
    const parsedIncidents: MatchEvent[] = rawIncidents.map((inc: any) => {
        return {
            incidentType: inc.incidentType,
            incidentClass: inc.incidentClass,
            time: inc.time,
            player: inc.player || null,
            assist1: inc.assist1 || null,
            isHome: inc.isHome
        };
    });

    // Sort chronologically
    return parsedIncidents.sort((a, b) => a.time - b.time);

  } catch (error) {
    console.error("Errore fetchMatchEvents:", error);
    return [];
  }
}
