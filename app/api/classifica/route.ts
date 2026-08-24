import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getSeason } from '@/lib/seasons';

export const dynamic = 'force-dynamic';
// Helper function to fetch and parse CSV data
const fetchAndParseCSV = async (url: string, options = { header: true }, timeout = 10000) => {
    try {
        const controller = new AbortController();
        const signal = controller.signal;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // il foglio cambia durante la giornata: mai servire una copia in cache
        const response = await fetch(url, { signal, redirect: 'follow', cache: 'no-store' });

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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const season = getSeason(searchParams.get('stagione'));

    try {
        const classificaData: any = await fetchAndParseCSV(season.classificaUrl, { header: true });

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
            classifica: result,
            stagione: season.slug
        });

    } catch (error: any) {
        console.error("API Error in Classifica Route:", error);

        // Niente classifica finta: durante una giornata di campionato una
        // tabella di squadre inventate è peggio di un errore, perché sembra
        // vera. Chi chiama vede l'errore e la pagina lo dice.
        return NextResponse.json(
            {
                error: 'Classifica non raggiungibile',
                details: error?.message || 'errore sconosciuto',
                stagione: season.slug,
            },
            { status: 502 }
        );
    }
}
