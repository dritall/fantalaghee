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
function normalizeTeamName(name: string): string {
  if (!name) return "";
  const normalized = name.toLowerCase()
    .replace(/ fc/g, "")
    .replace(/fc /g, "")
    .replace(/ ac/g, "")
    .replace(/ac /g, "")
    .replace(/ calcio/g, "")
    .trim();
    
  const teamNameMap: Record<string, string> = {
    "hellas verona": "verona",
    "juventus fc": "juventus",
    "fc internazionale": "inter",
    "ac milan": "milan",
    "as roma": "roma",
    "ss lazio": "lazio",
    "bologna fc": "bologna",
    "torino fc": "torino",
    "genoa cfc": "genoa",
    "udinese calcio": "udinese",
    "parma calcio 1913": "parma",
    "como 1907": "como",
    "us lecce": "lecce",
    "empoli fc": "empoli",
    "ac monza": "monza",
    "venezia fc": "venezia",
    "cagliari calcio": "cagliari"
  };
  
  if (teamNameMap[name.toLowerCase()]) {
     return teamNameMap[name.toLowerCase()];
  }
  
  if (teamNameMap[normalized]) {
     return teamNameMap[normalized];
  }
  
  // Specific fallbacks for Italian teams
  if (normalized.includes("inter")) return "inter";
  if (normalized.includes("milan")) return "ac milan"; // Sofascore usually has AC Milan
  if (normalized.includes("roma")) return "roma";
  if (normalized.includes("lazio")) return "lazio";
  if (normalized.includes("napoli")) return "napoli";
  if (normalized.includes("juve")) return "juventus";
  
  return normalized;
}

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
    const nHome = normalizeTeamName(homeName);
    const nAway = normalizeTeamName(awayName);

    // Find the right event
    const matchEvent = events.find((evt: any) => {
       const evtHomeAPI = evt?.homeTeam?.name || "";
       const evtAwayAPI = evt?.awayTeam?.name || "";
       
       const evtHome = normalizeTeamName(evtHomeAPI);
       const evtAway = normalizeTeamName(evtAwayAPI);
       
       const isHomeMatch = evtHome.includes(nHome) || nHome.includes(evtHome);
       const isAwayMatch = evtAway.includes(nAway) || nAway.includes(evtAway);
       
       return isHomeMatch && isAwayMatch;
    });

    if (!matchEvent || !matchEvent.id) {
       console.warn(`Match non trovato su Sofascore. Cercavo: [Home: "${homeName}" -> "${nHome}"] | [Away: "${awayName}" -> "${nAway}"]. Data: ${isoDate}`);
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
