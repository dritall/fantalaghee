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

    // --- Static & Dynamic Data Extraction ---

    const numeroGiornataText = get(59, 0); // A60
    const numeroGiornata = parseInt(numeroGiornataText.match(/\d+/)?.[0] || 0);

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

    let i = 71; // Starts at row 72 (F72, G72)
    while (data[i] && data[i][5]) { // Check if row and cell F exist
        premi.giornata.push({ squadra: data[i][5], premio: data[i][6] });
        i++;
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
        recordAssoluto: { // Punteggio: F56, Squadra: F57, Giornata: F58
            punteggio: get(55, 5),
            squadra: get(56, 5),
            giornata: get(57, 5)
        },
        cucchiaioDiLegno: { // Punteggio: F61, Squadra: F62, Giornata: F63
            punteggio: get(60, 5),
            squadra: get(61, 5),
            giornata: get(62, 5)
        },
        premi
    };
};
