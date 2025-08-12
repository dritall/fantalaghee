// api/getClassifica.js
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
        // Assuming the last season in the array is the most recent one.
        const latestSeason = seasonsData.seasons[seasonsData.seasons.length - 1].strSeason;

        // Step 3: Fetch the league table for the most recent season
        const tableResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookuptable.php?l=${LEAGUE_ID}&s=${latestSeason}`);
        if (!tableResponse.ok) {
            throw new Error(`Failed to fetch league table for season ${latestSeason}`);
        }
        const tableData = await tableResponse.json();

        // Step 4: Return the data in the format the frontend expects
        response.status(200).json({ standings: tableData.table || [] });

    } catch (error) {
        console.error("API Error in getClassifica:", error);
        response.status(500).json({
            error: 'Failed to fetch league classification.',
            details: error.message,
            standings: [] // Return empty array on error to prevent frontend crash
        });
    }
}
