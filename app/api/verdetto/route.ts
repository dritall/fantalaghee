
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getSeason } from '@/lib/seasons';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const season = getSeason(searchParams.get('stagione'));

    try {
        const response = await fetch(`${season.verdettoUrl}&t=${Date.now()}`, { cache: 'no-store' });
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

        return NextResponse.json({ ...processedData, stagione: season.slug });

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

    // Il foglio viene azzerato a inizio stagione e le righe tornano corte: una
    // cella letta a posizione fissa può non esistere affatto. `cella` legge
    // sempre una stringa, così nessuna lettura qui sotto può far esplodere la
    // rotta e lasciare il Verdetto con la schermata d'errore.
    const cella = (riga: number, colonna: number): string => {
        const v = data[riga]?.[colonna];
        return typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
    };
    const cellaOrND = (riga: number, colonna: number): string => cella(riga, colonna) || 'N/D';

    // A60 (Index 59) -> Numero Giornata
    const numeroGiornata = parseInt(cella(59, 0).match(/\d+/)?.[0] || '0');

    // A56 (Index 55) -> Leader Attuale
    const leaderAttuale = cellaOrND(55, 0);

    // B62 (Index 61) -> Campione di Giornata
    const campioneDiGiornata = cellaOrND(61, 1);

    // Podio (Rows 65, 66, 67 -> Indices 64, 65, 66)
    const podio = [64, 65, 66].map((riga) => ({
        squadra: cellaOrND(riga, 0),
        punteggio: cellaOrND(riga, 1),
    }));

    // Record Assoluto (G56, G57, G58 -> Indices 55, 56, 57, Col 6)
    const recordAssoluto = {
        punteggio: cellaOrND(55, 6),
        squadra: cellaOrND(56, 6),
        giornata: cellaOrND(57, 6),
    };

    // Cucchiaio di Legno (G61, G62, G63 -> Indices 60, 61, 62, Col 6)
    // Note: Original code used indices 60, 61, 62 for F61, F62, F63
    const cucchiaioDiLegno = {
        punteggio: cellaOrND(60, 6),
        squadra: cellaOrND(61, 6),
        giornata: cellaOrND(62, 6),
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
        migliorPunteggio = {
            info: cellaOrND(migliorPunteggioRow + 1, 0),
            premio: cellaOrND(migliorPunteggioRow + 1, 2),
        };
    }

    // Premi Super Lega (A82:C87 -> indices 81-86, data rows at 83-86)
    const premiSuperLega: any[] = [];
    for (let i = 83; i <= 86; i++) {
        const row = data[i];
        if (row && row[0]) {
            premiSuperLega.push({ squadra: row[0], posizione: row[1], premio: row[2] });
        }
    }

    // Premi Coppa UEFA (A88:C90 -> indices 87-89, data rows at 88-89)
    const premiCoppaUefa: any[] = [];
    for (let i = 88; i <= 89; i++) {
        const row = data[i];
        if (row && row[0]) {
            premiCoppaUefa.push({ squadra: row[0], posizione: row[1], premio: row[2] });
        }
    }

    // Riepilogo aggregato per squadra (somma di tutte le categorie premi)
    const totals: Record<string, number> = {};
    const addPrize = (squadra: string, premio: any) => {
        const val = parseFloat(String(premio).replace(',', '.'));
        if (squadra && squadra.trim() && !isNaN(val) && val > 0) {
            totals[squadra.trim()] = (totals[squadra.trim()] || 0) + val;
        }
    };
    premiClassifica.forEach(p => addPrize(p.squadra, p.premio));
    premiDiGiornata.forEach(p => addPrize(p.squadra, p.premio));
    if (migliorPunteggio.info !== 'N/D') addPrize(migliorPunteggio.info.split(' - ')[0].trim(), migliorPunteggio.premio);
    premiSuperLega.forEach(p => addPrize(p.squadra, p.premio));
    premiCoppaUefa.forEach(p => addPrize(p.squadra, p.premio));

    // Merge varianti nome Cippalippa1418 (es. spazi/maiuscole diverse tra sheet e migliorPunteggio)
    const cippaKeys = Object.keys(totals).filter(k => k.toLowerCase().replace(/\s/g, '') === 'cippalippa1418');
    if (cippaKeys.length > 1) {
        const merged = cippaKeys.reduce((sum, k) => sum + totals[k], 0);
        cippaKeys.forEach(k => delete totals[k]);
        totals['Cippalippa1418'] = merged;
    }

    const premiRiepilogo = Object.entries(totals)
        .map(([squadra, totale]) => ({ squadra, totale }))
        .sort((a, b) => b.totale - a.totale);

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
            migliorPunteggio: migliorPunteggio,
            superLega: premiSuperLega,
            coppaUefa: premiCoppaUefa,
            riepilogo: premiRiepilogo
        }
    };
};
