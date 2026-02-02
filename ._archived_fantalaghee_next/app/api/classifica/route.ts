import { NextResponse } from 'next/server';
import Papa from 'papaparse';

// Helper function to fetch and parse CSV data
const fetchAndParseCSV = async (url: string, options = { header: true }, timeout = 10000) => {
    try {
        const controller = new AbortController();
        const signal = controller.signal;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, { signal, redirect: 'follow' }); // Added redirect: follow

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText}`);

        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                ...options,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length) {
                        reject(new Error(results.errors.map((e: any) => e.message).join(', ')));
                    } else {
                        resolve(results.data);
                    }
                },
                error: (error: any) => reject(new Error(`Error parsing CSV from ${url}: ${error.message}`)),
            });
        });
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout / 1000} seconds for ${url}`);
        }
        throw new Error(`Network or parsing error for ${url}: ${error.message}`);
    }
};

export async function GET() {
    // REAL Google Sheet URL provided by user
    const CLASSIFICA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9q-d7H5HzRRIzdoK4LLFU9GX5JUppoNy3-kWEVSDqcpL7dK1IcNIioj9ykzygz28H1xrmWyWoAyyc/pub?output=csv';

    try {
        const classificaData: any = await fetchAndParseCSV(CLASSIFICA_URL, { header: true });

        // Data cleaning
        // 1. Filter invalid rows: Ensure Team Name exists and isn't empty
        const datiFiltrati = classificaData.filter((riga: any) =>
            riga.Team && riga.Team.trim() !== ''
        );

        // 2. Sort by Generale (Total Points) descending
        const sortedClassifica = datiFiltrati.sort((a: any, b: any) => {
            const pA = parseFloat(a.Generale || 0);
            const pB = parseFloat(b.Generale || 0);
            return pB - pA;
        });

        // 3. Map to include Rank but keep all data
        const result = sortedClassifica.map((item: any, index: number) => ({
            rank: index + 1,
            ...item // Spread all original columns (Team, Mister, NickName, Generale, G1...G38)
        }));

        return NextResponse.json({
            classifica: result
        });

    } catch (error: any) {
        console.error("API Error in Classifica Route:", error);

        // Fallback Mock Data ONLY if real fetch fails hard
        const mockData = [
            { rank: 1, team: "AC Ciucco (FALLBACK)", owner: "Marco", points: 42, last: "W", change: "up" },
            { rank: 2, team: "Real Colizzati", owner: "Giuseppe", points: 39, last: "W", change: "same" },
        ];

        return NextResponse.json({
            classifica: mockData,
            warning: "Impossibile recuperare i dati live. Visualizzo dati simulati."
        });
    }
}
