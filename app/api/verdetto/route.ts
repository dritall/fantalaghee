
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

// Fallback URL if env is not set (derived from user's public link)
const SPREADSHEET_ID = '1lHQEZoQT3TmgA-mPwExzorjxv6ub-xvFW-9WTm5805Y';
const SPREADSHEET_URL = process.env.SPREADSHEET_URL || `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1105159540`;

export const runtime = 'edge';
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
    try {
        const response = await fetch(SPREADSHEET_URL, { next: { revalidate: 60 } });
        if (!response.ok) {
            throw new Error(`Errore nel caricare lo spreadsheet: ${response.statusText}`);
        }

        const csvText = await response.text();

        const parseResult = Papa.parse(csvText, { skipEmptyLines: false });
        const allData = parseResult.data as string[][];

        if (!allData || allData.length === 0) {
            throw new Error("Nessun dato trovato nel CSV");
        }

        const processedData = parseSheetData(allData);

        return NextResponse.json(processedData);

    } catch (error: any) {
        console.error('Errore in /api/verdetto:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}

const parseSheetData = (data: string[][]) => {
    const findRowIndex = (label: string, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase() === label.toLowerCase());

    // --- Data Extraction Logic (Based on getDashboard.js) ---
    // Note: getDashboard.js used hardcoded indices. We try to respect them but add safety checks.

    // A60 (Index 59) -> Numero Giornata
    const numeroGiornataText = data[59] ? data[59][0] : '';
    const numeroGiornata = parseInt(numeroGiornataText.match(/\d+/)?.[0] || '0');

    // A56 (Index 55) -> Leader Attuale
    const leaderAttuale = data[55] ? data[55][0] : 'N/D';

    // B62 (Index 61) -> Campione di Giornata
    const campioneDiGiornata = data[61] ? data[61][1] : 'N/D';

    // Podio (Rows 65, 66, 67 -> Indices 64, 65, 66)
    const podio = [
        { squadra: data[64]?.[0] || 'N/D', punteggio: data[64]?.[1] || 'N/D' },
        { squadra: data[65]?.[0] || 'N/D', punteggio: data[65]?.[1] || 'N/D' },
        { squadra: data[66]?.[0] || 'N/D', punteggio: data[66]?.[1] || 'N/D' }
    ];

    // Record Assoluto (G56, G57, G58 -> Indices 55, 56, 57, Col 6)
    const recordAssoluto = {
        punteggio: data[55] ? data[55][6] : 'N/D',
        squadra: data[56] ? data[56][6] : 'N/D',
        giornata: data[57] ? data[57][6] : 'N/D'
    };

    // Cucchiaio di Legno (G61, G62, G63 -> Indices 60, 61, 62, Col 6)
    // Note: Original code used indices 60, 61, 62 for F61, F62, F63
    const cucchiaioDiLegno = {
        punteggio: data[60] ? data[60][6] : 'N/D',
        squadra: data[61] ? data[61][6] : 'N/D',
        giornata: data[62] ? data[62][6] : 'N/D'
    };

    // --- Sezioni Dinamiche ---

    // Classifica (Squadre On Fire) - Top 5 from Dashboard!A3:C7
    // A3 starts at index 2. We read Rows 3,4,5,6,7.
    // Col A (Index 0) = Squadra, Col B (Index 1) = Generale, Col C (Index 2) = Media
    const classifica: any[] = [];

    // We iterate from row index 2 (A3) to 6 (A7) - total 5 rows
    for (let i = 2; i <= 6; i++) {
        const row = data[i];
        if (row && row[0]) {
            classifica.push({
                squadra: row[0],
                punti: parseFloat(row[1]?.replace(',', '.') || '0'),
                mediaPunti: parseFloat(row[2]?.replace(',', '.') || '0')
            });
        }
    }

    // Sort by Total Points (Descending) as requested
    classifica.sort((a, b) => b.punti - a.punti);

    // Premi di Giornata (Starts Index 71, Row 72 to Index 98, Row 99)
    const premiDiGiornata: any[] = [];
    for (let i = 71; i <= 98; i++) {
        const row = data[i];
        if (row && (row[5] || row[6])) { // Col F or G present
            premiDiGiornata.push({ squadra: row[5], premio: row[6] });
        }
    }

    // Premi Classifica Generale
    // Search "Premi Classifica Generale" in Col A (0) is unreliable if we want fixed C73:C77.
    // C73 is Index 72 (Row 73). Range C73:C77 means indices 72, 73, 74, 75, 76.
    const premiClassifica: any[] = [];
    // We assume the structure: Squadra is in Col A (0), and Prize Amount is now in Col C (2) as requested.
    // If user meant "Value is in C, Team is in A", we use that.

    for (let i = 72; i <= 76; i++) {
        const row = data[i];
        if (row && row[0]) {
            // Squadra at 0 (A), Premio at 2 (C)
            premiClassifica.push({ squadra: row[0], premio: row[2] });
        }
    }

    // Miglior Punteggio
    // Search "Miglior Punteggio" in Col A (0)
    let migliorPunteggio = { info: 'N/D', premio: 'N/D' };
    const migliorPunteggioRow = findRowIndex("Miglior Punteggio", 0);
    if (migliorPunteggioRow !== -1 && data[migliorPunteggioRow + 1]) {
        const row = data[migliorPunteggioRow + 1];
        migliorPunteggio = { info: row[0], premio: row[2] };
    }

    return {
        numeroGiornata,
        leaderAttuale,
        campioneDiGiornata,
        podio,
        recordAssoluto,
        cucchiaioDiLegno,
        classifica,
        premi: {
            classifica: premiClassifica,
            giornata: premiDiGiornata,
            migliorPunteggio: migliorPunteggio
        }
    };
};
