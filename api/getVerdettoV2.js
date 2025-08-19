import Papa from 'papaparse';

const SPREADSHEET_URL = process.env.SPREADSHEET_URL;

export const config = {
  runtime: 'edge',
};

// Funzione principale che viene eseguita quando chiamiamo /api/getVerdettoV2
export default async function handler(req) {
  try {
    if (!SPREADSHEET_URL) {
      throw new Error("SPREADSHEET_URL non è configurata.");
    }

    const response = await fetch(SPREADSHEET_URL, { next: { revalidate: 60 } });
    if (!response.ok) {
      throw new Error(`Errore nel caricare lo spreadsheet: ${response.statusText}`);
    }
    const csvData = await response.text();
    const allData = Papa.parse(csvData).data;

    // Usiamo il nostro parser intelligente per estrarre e strutturare i dati
    const processedData = parseSheetData(allData);

    return new Response(JSON.stringify(processedData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Errore in /api/getVerdettoV2:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500 });
  }
}

// ====================================================================================
// PARSER INTELLIGENTE: Il cuore della nostra nuova logica
// ====================================================================================
const parseSheetData = (data) => {
    const output = {
        classifica: [],
        dashboard: {}
    };

    // Funzioni di utilità per trovare le righe in modo sicuro
    const findRowIndex = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase() === label.toLowerCase());
    const findRowIndexStartsWith = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase().startsWith(label.toLowerCase()));

    // --- 1. ESTRAZIONE CLASSIFICA ---
    let classificaStartIndex = findRowIndex("CLASSIFICA GENERALE");
    if (classificaStartIndex !== -1) {
        // Ipotizziamo che la classifica inizi 2 righe dopo l'intestazione
        let i = classificaStartIndex + 2;
        while (i < data.length && data[i] && data[i][0] && !isNaN(parseInt(data[i][0]))) {
            output.classifica.push({
                "POS": parseInt(data[i][0]),
                "SQUADRA": data[i][1] || '',
                "PUNTI": parseFloat(data[i][2]) || 0,
                "MEDIA": parseFloat(data[i][3]) || 0
            });
            i++;
        }
    }

    // --- 2. ESTRAZIONE DATI DASHBOARD (WIDGETS) ---
    // Leader Attuale
    let rowIndex = findRowIndex("LEADER ATTUALE");
    if (rowIndex !== -1 && data[rowIndex + 1]) {
        output.dashboard.leaderAttuale = { team: data[rowIndex + 1][0] };
    }

    // Record Assoluto
    rowIndex = findRowIndex("RECORD ASSOLUTO", 4);
    if (rowIndex !== -1) {
        output.dashboard.recordAssoluto = {
            team: data[rowIndex + 2] ? data[rowIndex + 2][5] : '',
            punteggio: data[rowIndex + 1] ? data[rowIndex + 1][5] : '',
            giornata: data[rowIndex + 3] ? data[rowIndex + 3][5] : ''
        };
    }
    
    // Podio della Giornata
    rowIndex = findRowIndexStartsWith("campione della giornata");
    if (rowIndex !== -1) {
        output.dashboard.giornataInfo = data[rowIndex][0]; // Es. "Campione della Giornata 2"
        output.dashboard.podio = [
            { pos: '🥇', team: data[rowIndex + 2] ? data[rowIndex + 2][1] : '', punteggio: data[rowIndex + 1] ? data[rowIndex + 1][1] : '' },
            { pos: '🥈', team: data[rowIndex + 4] ? data[rowIndex + 4][1] : '', punteggio: data[rowIndex + 3] ? data[rowIndex + 3][1] : '' },
            { pos: '🥉', team: data[rowIndex + 6] ? data[rowIndex + 6][1] : '', punteggio: data[rowIndex + 5] ? data[rowIndex + 5][1] : '' }
        ];
        // Il campione è il primo del podio
        output.dashboard.campioneDellaGiornata = output.dashboard.podio[0];
    }

    // Aggiungiamo qui gli altri premi fissi che avevamo già identificato
    // (Cucchiaio di Legno, Miglior Punteggio, etc.)
    // ...

    return output;
};