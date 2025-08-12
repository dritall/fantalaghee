import Papa from 'papaparse';

// Helper function to fetch and parse CSV data, now accepts PapaParse options
const fetchAndParseCSV = async (url, options = { header: true }) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText}`);
        }
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                ...options, // Spread the provided options
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length) {
                        reject(new Error(results.errors.map(e => e.message).join(', ')));
                    } else {
                        resolve(results.data);
                    }
                },
                error: (error) => {
                    reject(new Error(`Error parsing CSV from ${url}: ${error.message}`));
                }
            });
        });
    } catch (error) {
        throw new Error(`Network or parsing error for ${url}: ${error.message}`);
    }
};

// Custom parser for the complex Dashboard sheet structure
const parseDashboardData = (data) => {
    const dashboard = {};
    const rawData = data; // data is an array of arrays

    // Helper to find a row index by a label in a specific column
    const findRowIndex = (label, col = 0) => rawData.findIndex(row => row[col] && row[col].trim() === label);

    // --- Extract data for each section based on labels ---

    // "LEADER ATTUALE"
    let rowIndex = findRowIndex("LEADER ATTUALE");
    if (rowIndex !== -1) {
        dashboard.leaderAttuale = {
            team: rawData[rowIndex + 1] ? rawData[rowIndex + 1][0] : '',
            punteggio: rawData[rowIndex + 1] ? rawData[rowIndex + 1][1] : ''
        };
    }

    // "RECORD ASSOLUTO"
    rowIndex = findRowIndex("RECORD ASSOLUTO");
    if (rowIndex !== -1) {
        dashboard.recordAssoluto = {
            team: rawData[rowIndex + 1] ? rawData[rowIndex + 1][0] : '',
            punteggio: rawData[rowIndex + 1] ? rawData[rowIndex + 1][1] : ''
        };
    }

    // "Campione della Giornata X"
    const campioneRowIndex = rawData.findIndex(row => row[0] && row[0].startsWith("Campione della Giornata"));
    if (campioneRowIndex !== -1) {
        dashboard.campioneDellaGiornata = {
            giornata: rawData[campioneRowIndex][0],
            team: rawData[campioneRowIndex + 1] ? rawData[campioneRowIndex + 1][0] : '',
            punteggio: rawData[campioneRowIndex + 1] ? rawData[campioneRowIndex + 1][1] : ''
        };
    }

    // "Cucchiaio di Legno"
    rowIndex = findRowIndex("Cucchiaio di Legno");
    if (rowIndex !== -1) {
        dashboard.cucchiaioDiLegno = {
            team: rawData[rowIndex + 1] ? rawData[rowIndex + 1][0] : '',
            punteggio: rawData[rowIndex + 1] ? rawData[rowIndex + 1][1] : ''
        };
    }

    // "Podio della Giornata X"
    const podioRowIndex = rawData.findIndex(row => row[0] && row[0].startsWith("Podio della Giornata"));
    if (podioRowIndex !== -1) {
        dashboard.podioDellaGiornata = {
            giornata: rawData[podioRowIndex][0],
            primo: { team: rawData[podioRowIndex + 1] ? rawData[podioRowIndex + 1][0] : '', punteggio: rawData[podioRowIndex + 1] ? rawData[podioRowIndex + 1][1] : '' },
            secondo: { team: rawData[podioRowIndex + 2] ? rawData[podioRowIndex + 2][0] : '', punteggio: rawData[podioRowIndex + 2] ? rawData[podioRowIndex + 2][1] : '' },
            terzo: { team: rawData[podioRowIndex + 3] ? rawData[podioRowIndex + 3][0] : '', punteggio: rawData[podioRowIndex + 3] ? rawData[podioRowIndex + 3][1] : '' },
        };
    }

    // "Miglior Punteggio"
    rowIndex = findRowIndex("Miglior Punteggio");
    if (rowIndex !== -1) {
        dashboard.migliorPunteggio = {
            team: rawData[rowIndex + 1] ? rawData[rowIndex + 1][0] : '',
            punteggio: rawData[rowIndex + 1] ? rawData[rowIndex + 1][1] : ''
        };
    }

    // "PREMI"
    rowIndex = findRowIndex("PREMI");
    if (rowIndex !== -1) {
        dashboard.premi = {
            classificaGenerale: [],
            totali: []
        };
        // Premi Classifica Generale
        let premiRowIndex = findRowIndex("Premi Classifica Generale", 1);
        if (premiRowIndex !== -1) {
            for (let i = premiRowIndex + 1; i < rawData.length; i++) {
                if (!rawData[i][1] || rawData[i][1].trim() === "Premi Totali") break;
                dashboard.premi.classificaGenerale.push({
                    posizione: rawData[i][1],
                    premio: rawData[i][2]
                });
            }
        }
        // Premi Totali
        premiRowIndex = findRowIndex("Premi Totali", 1);
         if (premiRowIndex !== -1) {
            for (let i = premiRowIndex + 1; i < rawData.length; i++) {
                if (!rawData[i][1]) break;
                dashboard.premi.totali.push({
                    posizione: rawData[i][1],
                    premio: rawData[i][2]
                });
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
            fetchAndParseCSV(CLASSIFICA_URL, { header: true }), // Classifica has headers
            fetchAndParseCSV(DASHBOARD_URL, { header: false }) // Dashboard does not
        ]);

        const classificaLimited = classificaData.slice(0, 49);

        // Use the new custom parser for the dashboard data
        const dashboardParsed = parseDashboardData(rawDashboardData);

        res.status(200).json({
            classifica: classificaLimited,
            dashboard: dashboardParsed
        });

    } catch (error) {
        console.error("API Error in getClassificaV2:", error);
        res.status(500).json({
            error: 'Impossibile caricare o processare i dati CSV.',
            details: error.message
        });
    }
}
