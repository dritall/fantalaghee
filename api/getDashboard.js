import Papa from 'papaparse';

const SPREADSHEET_URL = process.env.SPREADSHEET_URL;

export const config = { runtime: 'edge' };

export default async function handler(req) {
    // ... (questa parte non cambia)
    try {
        if (!SPREADSHEET_URL) {
            throw new Error("La variabile SPREADSHEET_URL non è configurata sul server.");
        }
        const response = await fetch(SPREADSHEET_URL, { next: { revalidate: 60 } });
        if (!response.ok) {
            throw new Error(`Errore nel caricare lo spreadsheet: ${response.statusText}`);
        }
        const csvData = await response.text();
        const allData = Papa.parse(csvData).data;
        const processedData = parseSheetData(allData);
        return new Response(JSON.stringify(processedData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Errore in /api/getDashboard:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500 });
    }
}

const parseSheetData = (data) => {
    const findRowIndex = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase() === label.toLowerCase());

    // --- DATI CON CELLE FISSE (Questi funzionavano già) ---
    const numeroGiornataText = data[59] ? data[59][0] : ''; // A60
    const numeroGiornata = parseInt(numeroGiornataText.match(/\d+/)?.[0] || 0);
    const leaderAttuale = data[55] ? data[55][0] : 'N/D'; // A56
    const campioneDiGiornata = data[61] ? data[61][1] : 'N/D'; // B62
    const podio = [
        { squadra: data[64]?.[0] || 'N/D', punteggio: data[64]?.[1] || 'N/D' }, // Riga 65
        { squadra: data[65]?.[0] || 'N/D', punteggio: data[65]?.[1] || 'N/D' }, // Riga 66
        { squadra: data[66]?.[0] || 'N/D', punteggio: data[66]?.[1] || 'N/D' }  // Riga 67
    ];
    const recordAssoluto = {
        punteggio: data[55] ? data[55][5] : 'N/D', // F56
        squadra: data[56] ? data[56][5] : 'N/D',   // F57
        giornata: data[57] ? data[57][5] : 'N/D'    // F58
    };
    const cucchiaioDiLegno = {
        punteggio: data[60] ? data[60][5] : 'N/D', // F61
        squadra: data[61] ? data[61][5] : 'N/D',   // F62
        giornata: data[62] ? data[62][5] : 'N/D'    // F63
    };

    // --- SEZIONI CON LOGICA AGGIORNATA ---
    const classifica = [];
    let classificaStartIndex = findRowIndex("Squadre On Fire 🔥", 8);
    if (classificaStartIndex !== -1) {
        for (let i = 1; i <= 5; i++) {
            const row = data[classificaStartIndex + i];
            if (row && row[8]) classifica.push({ squadra: row[8], punti: parseFloat(row[9]) || 0, mediaPunti: parseFloat(row[11]) || 0 });
        }
    }

    const premiDiGiornata = [];
    for (let i = 71; i < data.length; i++) { // Parte da riga 72
        const row = data[i];
        if (row && row[5] && row[6]) {
            premiDiGiornata.push({ squadra: row[5], premio: row[6] });
        } else if (row && !row[5] && !row[6]) {
            break;
        }
    }

    // CORREZIONE: Logica dinamica per trovare i premi
    const premiClassifica = [];
    const premiClassificaRow = findRowIndex("Premi Classifica Generale", 0);
    if (premiClassificaRow !== -1) {
        for (let i = premiClassificaRow + 2; i < premiClassificaRow + 7; i++) { // Legge le 5 righe successive
            const row = data[i];
            if (row && row[0]) premiClassifica.push({ squadra: row[0], premio: row[3] });
        }
    }

    // CORREZIONE: Logica dinamica per il miglior punteggio
    let migliorPunteggio = {};
    const migliorPunteggioRow = findRowIndex("Miglior Punteggio", 0);
    if (migliorPunteggioRow !== -1 && data[migliorPunteggioRow + 1]) {
        const row = data[migliorPunteggioRow + 1];
        migliorPunteggio = { info: row[0], premio: row[2] };
    }

    return {
        numeroGiornata, leaderAttuale, campioneDiGiornata, podio, recordAssoluto, cucchiaioDiLegno, classifica,
        premi: {
            classifica: premiClassifica,
            giornata: premiDiGiornata,
            migliorPunteggio: migliorPunteggio
        }
    };
};
