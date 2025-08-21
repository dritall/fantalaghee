import Papa from 'papaparse';

const SPREADSHEET_URL = process.env.SPREADSHEET_URL;

export const config = { runtime: 'edge' };

export default async function handler(req) {
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
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
    } catch (error) {
        console.error('Errore in /api/getDashboard:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500 });
    }
}

const parseSheetData = (data) => {
    const findRowIndex = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase() === label.toLowerCase());

    const premi = { classifica: [], giornata: [], migliorPunteggio: {} };
    const premiClassificaRow = findRowIndex("Premi Classifica Generale", 0);
    if (premiClassificaRow !== -1) {
        for (let i = premiClassificaRow + 2; i < premiClassificaRow + 7; i++) {
            const row = data[i];
            if (row && row[0] && row[3]) premi.classifica.push({ squadra: row[0], premio: row[3] });
        }
    }

    const premiGiornataRow = findRowIndex("Premi di Giornata", 5);
    if (premiGiornataRow !== -1) {
        for (let i = premiGiornataRow + 1; i < data.length; i++) {
            const row = data[i];
            if (row && row[5] && row[6]) {
                premi.giornata.push({ squadra: row[5], premio: row[6] });
            } else if (row && !row[5] && !row[6]) {
                break;
            }
        }
    }

    const migliorPunteggioRow = findRowIndex("Miglior Punteggio", 0);
    if (migliorPunteggioRow !== -1 && data[migliorPunteggioRow+1]) {
        premi.migliorPunteggio = { info: data[migliorPunteggioRow+1][0], premio: data[migliorPunteggioRow+1][2] };
    }

    const classifica = [];
    let classificaStartIndex = findRowIndex("Squadre On Fire 🔥", 8);
    if (classificaStartIndex !== -1) {
        for (let i = 1; i <= 5; i++) {
            const row = data[classificaStartIndex + i];
            if (row && row[8]) classifica.push({ squadra: row[8], punti: parseFloat(row[9]) || 0, mediaPunti: parseFloat(row[11]) || 0 });
        }
    }

    return {
        numeroGiornata: parseInt((data[59]?.[0] || '').match(/\d+/)?.[0] || 0),
        classifica,
        leaderAttuale: data[55]?.[0] || 'N/D',
        campioneDiGiornata: data[61]?.[1] || 'N/D',
        podio: [
            { squadra: data[64]?.[0] || 'N/D', punteggio: data[64]?.[1] || 'N/D' },
            { squadra: data[65]?.[0] || 'N/D', punteggio: data[65]?.[1] || 'N/D' },
            { squadra: data[66]?.[0] || 'N/D', punteggio: data[66]?.[1] || 'N/D' }
        ],
        recordAssoluto: { punteggio: data[55]?.[5], squadra: data[56]?.[5], giornata: data[57]?.[5] },
        cucchiaioDiLegno: { punteggio: data[60]?.[5], squadra: data[61]?.[5], giornata: data[62]?.[5] },
        premi
    };
};
