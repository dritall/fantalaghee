import { NextResponse } from 'next/server';

const API_KEY = '1'; // Public API Key
const LEAGUE_ID = '4332'; // Serie A
const SEASON = '2024-2025';

export async function GET() {
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsseason.php?id=${LEAGUE_ID}&s=${SEASON}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Fantalaghee-Next/1.0' } });

        if (!response.ok) throw new Error(`Failed to fetch schedule: ${response.statusText}`);

        const data = await response.json();

        // Return structured data
        return NextResponse.json({
            fixtures: data.events || []
        });

    } catch (error: any) {
        console.error("API Error in Calendar Route:", error);

        // Mock Data for Demo
        const mockFixtures = [];
        const teams = ["Inter", "Milan", "Juventus", "Napoli", "Roma", "Lazio", "Atalanta", "Fiorentina", "Torino", "Bologna", "Monza", "Lecce", "Genoa", "Udinese", "Sassuolo", "Verona", "Empoli", "Salernitana", "Frosinone", "Cagliari"];

        // Generate 38 rounds
        for (let r = 1; r <= 38; r++) {
            // 10 matches per round
            for (let m = 0; m < 10; m++) {
                const home = teams[m];
                const away = teams[19 - m]; // Simple pairing
                mockFixtures.push({
                    idEvent: `${r}-${m}`,
                    intRound: r.toString(),
                    dateEvent: "2024-09-01", // Placeholder date
                    strTime: "15:00:00",
                    strHomeTeam: home,
                    strAwayTeam: away,
                    intHomeScore: Math.floor(Math.random() * 4).toString(),
                    intAwayScore: Math.floor(Math.random() * 3).toString(),
                    strHomeTeamBadge: "https://www.thesportsdb.com/images/media/team/badge/small/uvxqrq1420581425.png", // Generic/Inter badge
                    strAwayTeamBadge: "https://www.thesportsdb.com/images/media/team/badge/small/1qxg5w1420581483.png", // Generic/Milan badge
                    strVenue: "Stadio Comunale"
                });
            }
        }

        return NextResponse.json({
            fixtures: mockFixtures,
            warning: "Dati simulati (API Error)"
        });
    }
}
