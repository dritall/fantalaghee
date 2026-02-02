import Papa from 'papaparse';

// Helper function to fetch and parse CSV data
const fetchAndParseCSV = async (url, options = { header: true }, timeout = 10000) => {
    try {
        const controller = new AbortController();
        const signal = controller.signal;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, { signal });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText}`);

        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                ...options,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length) {
                        reject(new Error(results.errors.map(e => e.message).join(', ')));
                    } else {
                        resolve(results.data);
                    }
                },
                error: (error) => reject(new Error(`Error parsing CSV from ${url}: ${error.message}`)),
            });
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout / 1000} seconds for ${url}`);
        }
        throw new Error(`Network or parsing error for ${url}: ${error.message}`);
    }
};

// Custom parser for the complex Dashboard sheet structure
const parseDashboardData = (data) => {
    const dashboard = {};
    const findRowIndex = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase() === label.toLowerCase());

    // LEADER ATTUALE
    let rowIndex = findRowIndex("LEADER ATTUALE");
    if (rowIndex !== -1 && data[rowIndex + 1]) {
        dashboard.leaderAttuale = { team: data[rowIndex + 1][0], punteggio: data[rowIndex + 1][1] };
    }

    // RECORD ASSOLUTO
    rowIndex = findRowIndex("RECORD ASSOLUTO");
    if (rowIndex !== -1 && data[rowIndex + 1]) {
        dashboard.recordAssoluto = { team: data[rowIndex + 1][0], punteggio: data[rowIndex + 1][1] };
    }

    // Campione della Giornata X
    const campioneRowIndex = data.findIndex(row => row && row[0] && row[0].trim().toLowerCase().startsWith("campione della giornata"));
    if (campioneRowIndex !== -1 && data[campioneRowIndex + 1]) {
        dashboard.campioneDellaGiornata = {
            giornata: data[campioneRowIndex][0],
            team: data[campioneRowIndex + 1][0],
            punteggio: data[campioneRowIndex + 1][1]
        };
    }

    // Cucchiaio di Legno
    rowIndex = findRowIndex("Cucchiaio di Legno");
    if (rowIndex !== -1 && data[rowIndex + 1]) {
        dashboard.cucchiaioDiLegno = { team: data[rowIndex + 1][0], punteggio: data[rowIndex + 1][1] };
    }

    // Podio della Giornata X
    const podioRowIndex = data.findIndex(row => row && row[0] && row[0].trim().toLowerCase().startsWith("podio della giornata"));
    if (podioRowIndex !== -1) {
        dashboard.podioDellaGiornata = {
            giornata: data[podioRowIndex][0],
            primo: data[podioRowIndex + 1] ? { team: data[podioRowIndex + 1][0], punteggio: data[podioRowIndex + 1][1] } : {},
            secondo: data[podioRowIndex + 2] ? { team: data[podioRowIndex + 2][0], punteggio: data[podioRowIndex + 2][1] } : {},
            terzo: data[podioRowIndex + 3] ? { team: data[podioRowIndex + 3][0], punteggio: data[podioRowIndex + 3][1] } : {},
        };
    }

    // Miglior Punteggio
    rowIndex = findRowIndex("Miglior Punteggio");
    if (rowIndex !== -1 && data[rowIndex + 1]) {
        dashboard.migliorPunteggio = { team: data[rowIndex + 1][0], punteggio: data[rowIndex + 1][1] };
    }

    // PREMI
    rowIndex = findRowIndex("PREMI");
    if (rowIndex !== -1) {
        dashboard.premi = { classificaGenerale: [], totali: [] };
        let premiRowIndex = data.findIndex(row => row && row[1] && row[1].trim() === "Premi Classifica Generale");
        if (premiRowIndex !== -1) {
            for (let i = premiRowIndex + 1; i < data.length && data[i][1] && data[i][1].trim() !== "Premi Totali"; i++) {
                dashboard.premi.classificaGenerale.push({ posizione: data[i][1], premio: data[i][2] });
            }
        }
        premiRowIndex = data.findIndex(row => row && row[1] && row[1].trim() === "Premi Totali");
        if (premiRowIndex !== -1) {
            for (let i = premiRowIndex + 1; i < data.length && data[i][1]; i++) {
                dashboard.premi.totali.push({ posizione: data[i][1], premio: data[i][2] });
            }
        }
    }

    return dashboard;
};

export default async function handler(req, res) {
    const CLASSIFICA_URL = process.env.CLASSIFICA_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeH6kU2nBf5h4s4p_z4a7b0zD_l-5dG3bOaJ2c-d-A9aN-u-s_s0bA-fR_cI-e_kXzJgV/pub?gid=0&single=true&output=csv';
    const DASHBOARD_URL = process.env.DASHBOARD_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeH6kU2nBf5h4s4p_z4a7b0zD_l-5dG3bOaJ2c-d-A9aN-u-s_s0bA-fR_cI-e_kXzJgV/pub?gid=1904323238&single=true&output=csv';

    try {
        const [classificaData, rawDashboardData] = await Promise.all([
            fetchAndParseCSV(CLASSIFICA_URL, { header: true }),
            fetchAndParseCSV(DASHBOARD_URL, { header: false })
        ]);

        // --- INIZIO BLOCCO DI PULIZIA DATI ---

        // 1. Filtra via le righe non valide: quelle senza nome del team,
        //    quelle vuote o quella specifica con il "7".
        const datiFiltrati = classificaData.filter(riga =>
            riga.Team && riga.Team.trim() !== '' && riga.Team.trim() !== '7'
        );

        // 2. Prendi solo un massimo di 51 squadre valide per sicurezza.
        const classifica = datiFiltrati.slice(0, 51);

        // --- FINE BLOCCO DI PULIZIA DATI ---

        const dashboardParsed = parseDashboardData(rawDashboardData);

        res.status(200).json({
            classifica: classifica,
            dashboard: dashboardParsed
        });

    } catch (error) {
        console.error("API Error in getClassifica:", error);
        res.status(500).json({
            error: 'Impossibile caricare o processare i dati CSV.',
            details: error.message
        });
    }
}
