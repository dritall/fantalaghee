// api/getCalendario_2425.js
const API_KEY = '1';
const LEAGUE_ID = '4332';
const SEASON = '2024-2025';

export default async function handler(request, response) {
    try {
        const scheduleResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsseason.php?id=${LEAGUE_ID}&s=${SEASON}`);
        if (!scheduleResponse.ok) throw new Error(`Failed to fetch schedule for season ${SEASON}`);
        const scheduleData = await scheduleResponse.json();
        response.status(200).json({ fixtures: scheduleData.events || [] });
    } catch (error) {
        console.error("API Error in getCalendario_2425:", error);
        response.status(500).json({ error: `Failed to fetch league schedule for season ${SEASON}.`, details: error.message, fixtures: [] });
    }
}
