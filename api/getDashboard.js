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
    // Funzione per trovare dinamicamente l'inizio della classifica
    const findRowIndex = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase() === label.toLowerCase());

    const classifica = [];
    let classificaStartIndex = findRowIndex("Squadre On Fire 🔥", 8); // Colonna I
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

    // --- Uso dei riferimenti di cella statici come da istruzioni finali ---

    const numeroGiornataText = data[59] ? data[59][0] : ''; // Cella A60
    const numeroGiornata = parseInt(numeroGiornataText.match(/\d+/)?.[0] || 0);

    const premiDiGiornata = [];
    // Legge tutti i premi di giornata a partire dalla riga 72 (indice 71)
    for (let i = 71; i < data.length; i++) {
        const row = data[i];
        if (row && row[5] && row[6]) { // Colonne F e G
            premiDiGiornata.push({ squadra: row[5], premio: row[6] });
        } else {
            // Se trova una riga vuota interrompe il ciclo per sicurezza
            break;
        }
    }

    return {
        numeroGiornata,
        classifica,
        leaderAttuale: data[55] ? data[55][0] : 'N/D',                 // Cella A56
        campioneDiGiornata: data[61] ? data[61][1] : 'N/D',             // Cella B62
        podio: [
            { squadra: data[64]?.[0] || 'N/D', punteggio: data[64]?.[1] || 'N/D' }, // Riga 65
            { squadra: data[65]?.[0] || 'N/D', punteggio: data[65]?.[1] || 'N/D' }, // Riga 66
            { squadra: data[66]?.[0] || 'N/D', punteggio: data[66]?.[1] || 'N/D' }  // Riga 67
        ],
        recordAssoluto: {
            punteggio: data[55] ? data[55][5] : 'N/D', // Cella F56
            squadra: data[56] ? data[56][5] : 'N/D',   // Cella F57
            giornata: data[57] ? data[57][5] : 'N/D'    // Cella F58
        },
        cucchiaioDiLegno: {
            punteggio: data[60] ? data[60][5] : 'N/D', // Cella F61
            squadra: data[61] ? data[61][5] : 'N/D',   // Cella F62
            giornata: data[62] ? data[62][5] : 'N/D'    // Cella F63
        },
        premi: {
            classifica: [ // Dati presi da un range fisso
                 { squadra: data[68]?.[0] || '', premio: data[68]?.[3] || '' },
                 { squadra: data[69]?.[0] || '', premio: data[69]?.[3] || '' },
                 { squadra: data[70]?.[0] || '', premio: data[70]?.[3] || '' },
                 { squadra: data[71]?.[0] || '', premio: data[71]?.[3] || '' },
                 { squadra: data[72]?.[0] || '', premio: data[72]?.[3] || '' }
            ].filter(p => p.squadra),
            giornata: premiDiGiornata,
            migliorPunteggio: {
                 info: data[75]?.[0] || 'N/D', // Cella A76
                 premio: data[75]?.[2] || 'N/D' // Cella C76
            }
        }
    };
};
