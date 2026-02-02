// api/getCalendario.js
const API_KEY = '1'; // Free public API key from TheSportsDB
const LEAGUE_ID = '4332'; // Serie A

export default async function handler(request, response) {
    try {
        // Step 1: Fetch all available seasons
        const seasonsResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/search_all_seasons.php?id=${LEAGUE_ID}`);
        if (!seasonsResponse.ok) throw new Error('Failed to fetch seasons from TheSportsDB');

        const seasonsData = await seasonsResponse.json();
        if (!seasonsData.seasons || seasonsData.seasons.length === 0) throw new Error('No seasons found for this league.');

        // Step 2: Correctly determine the most recent season
        const latestSeason = seasonsData.seasons.reduce((latest, season) => {
            const currentYear = parseInt(season.strSeason.split('-')[0]);
            const latestYear = parseInt(latest.split('-')[0]);
            return currentYear > latestYear ? season.strSeason : latest;
        }, "0");

        if (latestSeason === "0") throw new Error('Could not determine the latest season.');

        // Step 3: Fetch the schedule for the most recent season
        const scheduleResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsseason.php?id=${LEAGUE_ID}&s=${latestSeason}`);
        if (!scheduleResponse.ok) throw new Error(`Failed to fetch schedule for season ${latestSeason}`);

        const scheduleData = await scheduleResponse.json();
        response.status(200).json({ fixtures: scheduleData.events || [] });

    } catch (error) {
        console.error("API Error in getCalendario:", error);
        response.status(500).json({
            error: 'Failed to fetch league schedule.',
            details: error.message,
            fixtures: []
        });
    }
}
