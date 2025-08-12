// api/getClassifica_2425.js
const API_KEY = '123'; // Free public API key from TheSportsDB
const LEAGUE_ID = '4332'; // Serie A
const SEASON = '2024-2025'; // Hardcoded season for this specific archive page

export default async function handler(request, response) {
    try {
        const tableResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookuptable.php?l=${LEAGUE_ID}&s=${SEASON}`);
        if (!tableResponse.ok) {
            throw new Error(`Failed to fetch league table for season ${SEASON}`);
        }
        const tableData = await tableResponse.json();

        response.status(200).json({ standings: tableData.table || [] });

    } catch (error) {
        console.error("API Error in getClassifica_2425:", error);
        response.status(500).json({
            error: `Failed to fetch league classification for season ${SEASON}.`,
            details: error.message,
            standings: []
        });
    }
}
