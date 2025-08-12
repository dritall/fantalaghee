// api/getCalendario.js
const API_KEY = '123'; // Free public API key from TheSportsDB
const LEAGUE_ID = '4332'; // Serie A

export default async function handler(request, response) {
    try {
        // Step 1: Fetch all available seasons for the league
        const seasonsResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/search_all_seasons.php?id=${LEAGUE_ID}`);
        if (!seasonsResponse.ok) {
            throw new Error('Failed to fetch seasons from TheSportsDB');
        }
        const seasonsData = await seasonsResponse.json();

        if (!seasonsData.seasons || seasonsData.seasons.length === 0) {
            throw new Error('No seasons found for this league.');
        }

        // Step 2: Determine the most recent season.
        const latestSeason = seasonsData.seasons[seasonsData.seasons.length - 1].strSeason;

        // Step 3: Fetch the schedule for the most recent season
        const scheduleResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsseason.php?id=${LEAGUE_ID}&s=${latestSeason}`);
        if (!scheduleResponse.ok) {
            throw new Error(`Failed to fetch schedule for season ${latestSeason}`);
        }
        const scheduleData = await scheduleResponse.json();

        // Step 4: Return the data in the format the frontend expects
        response.status(200).json({ fixtures: scheduleData.events || [] });

    } catch (error) {
        console.error("API Error in getCalendario:", error);
        response.status(500).json({
            error: 'Failed to fetch league schedule.',
            details: error.message,
            fixtures: [] // Return empty array on error to prevent frontend crash
        });
    }
}
