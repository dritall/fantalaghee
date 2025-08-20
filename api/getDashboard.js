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
    const findRowIndex = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase() === label.toLowerCase());
    const findRowStartsWith = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase().startsWith(label.toLowerCase()));

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

    const leaderAttualeRow = findRowIndex("LEADER ATTUALE");
    const recordAssolutoRow = findRowIndex("RECORD ASSOLUTO", 5);
    const cucchiaioDiLegnoRow = findRowIndex("Cucchiaio di Legno", 5);
    const podioRow = findRowStartsWith("podio della giornata");

    const premiClassificaRow = findRowIndex("Premi Classifica Generale", 0);
    const premiDiGiornataRow = findRowIndex("Premi di Giornata", 6);
    const migliorPunteggioRow = findRowIndex("Miglior Punteggio", 0);

    const premi = { classifica: [], giornata: [], migliorPunteggio: {} };
    if (premiClassificaRow !== -1) {
        for (let i = premiClassificaRow + 2; i < premiClassificaRow + 7; i++) {
            const row = data[i];
            if (row && row[0]) premi.classifica.push({ squadra: row[0], premio: row[3] });
        }
    }
    if (premiDiGiornataRow !== -1) {
        for (let i = premiDiGiornataRow + 1; i < premiDiGiornataRow + 4; i++) {
             const row = data[i];
             if (row && row[5]) premi.giornata.push({ squadra: row[5], premio: row[6] });
        }
    }
    if (migliorPunteggioRow !== -1 && data[migliorPunteggioRow+1]) {
        premi.migliorPunteggio = { info: data[migliorPunteggioRow+1][0], premio: data[migliorPunteggioRow+1][2] };
    }

    return {
        numeroGiornata,
        classifica,
        leaderAttuale: leaderAttualeRow !== -1 ? data[leaderAttualeRow + 1][0] : 'N/D',
        campioneDiGiornata: giornataInfoRow !== -1 ? data[giornataInfoRow + 2][1] : 'N/D',
        podio: podioRow !== -1 ? [
            { squadra: data[podioRow + 1][0], punteggio: data[podioRow + 1][1] },
            { squadra: data[podioRow + 2][0], punteggio: data[podioRow + 2][1] },
            { squadra: data[podioRow + 3][0], punteggio: data[podioRow + 3][1] }
        ] : [],
        recordAssoluto: recordAssolutoRow !== -1 ? { punteggio: data[recordAssolutoRow + 1][6], squadra: data[recordAssolutoRow + 2][6], giornata: data[recordAssolutoRow + 3][6] } : {},
        cucchiaioDiLegno: cucchiaioDiLegnoRow !== -1 ? { punteggio: data[cucchiaioDiLegnoRow + 1][6], squadra: data[cucchiaioDiLegnoRow + 2][6], giornata: data[cucchiaioDiLegnoRow + 3][6] } : {},
        premi
    };
};
