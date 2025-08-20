import Papa from 'papaparse';

const SPREADSHEET_URL = process.env.SPREADSHEET_URL;

export const config = {
  runtime: 'edge',
};

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
    // Helper function to safely access data
    const get = (row, col) => (data && data[row] && data[row][col]) ? data[row][col] : 'N/D';

    // Dynamic finders for data that might move
    const findRowIndex = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase() === label.toLowerCase());
    const findRowStartsWith = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase().startsWith(label.toLowerCase()));

    // --- Static & Dynamic Data Extraction ---

    const giornataInfoRow = findRowStartsWith("campione della giornata");
    const giornataText = giornataInfoRow !== -1 ? data[giornataInfoRow][0] : "N/D";
    const numeroGiornata = parseInt(giornataText.match(/\d+/)?.[0] || 0);

    const classifica = [];
    let classificaStartIndex = findRowIndex("Squadre On Fire 🔥", 8);
    if (classificaStartIndex !== -1) {
        for (let i = 1; i <= 5; i++) {
            const row = data[classificaStartIndex + i];
            if (row && row[8]) {
                classifica.push({
                    squadra: row[8],
                    punti: parseFloat(row[9]) || 0,
                    mediaPunti: parseFloat(row[11]) || 0,
                });
            }
        }
    }

    const premiClassificaRow = findRowIndex("Premi Classifica Generale", 0);
    const migliorPunteggioRow = findRowIndex("Miglior Punteggio", 0);
    const premi = { classifica: [], giornata: [], migliorPunteggio: {} };
    if (premiClassificaRow !== -1) {
        for (let i = premiClassificaRow + 2; i < premiClassificaRow + 7; i++) {
            const row = data[i];
            if (row && row[0]) premi.classifica.push({ squadra: row[0], premio: row[3] });
        }
    }
     for (let i = 71; i <= 73; i++) { // Premi di giornata: F e G dalla 72 in giù
        const row = data[i];
        if (row && row[5]) premi.giornata.push({ squadra: row[5], premio: row[6] });
    }
    if (migliorPunteggioRow !== -1 && data[migliorPunteggioRow+1]) {
        premi.migliorPunteggio = { info: get(migliorPunteggioRow+1, 0), premio: get(migliorPunteggioRow+1, 2) };
    }

    return {
        numeroGiornata,
        classifica,
        leaderAttuale: get(55, 0), // A56
        campioneDiGiornata: get(61, 1), // B62
        podio: [ // A e B 65, 66 e 67
            { squadra: get(64, 0), punteggio: get(64, 1) },
            { squadra: get(65, 0), punteggio: get(65, 1) },
            { squadra: get(66, 0), punteggio: get(66, 1) }
        ],
        recordAssoluto: { // F57, F56
            punteggio: get(56, 5),
            squadra: get(55, 5),
            giornata: '' // Not provided
        },
        cucchiaioDiLegno: { // F62, F61
            punteggio: get(61, 5),
            squadra: get(60, 5),
            giornata: '' // Not provided
        },
        premi
    };
};
