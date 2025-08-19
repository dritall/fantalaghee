import Papa from 'papaparse';

// Helper function to fetch and parse CSV data
const fetchAndParseCSV = async (url, options = { header: true }) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText}`);
        const csvText = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                ...options,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length) reject(new Error(results.errors.map(e => e.message).join(', ')));
                    else resolve(results.data);
                },
                error: (error) => reject(new Error(`Error parsing CSV from ${url}: ${error.message}`)),
            });
        });
    } catch (error) {
        throw new Error(`Network or parsing error for ${url}: ${error.message}`);
    }
};

// Custom parser for the complex Dashboard sheet structure
const parseDashboardData = (data) => {
    const dashboard = {};

    // Funzioni di utilità per trovare le righe
    const findRowIndex = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase() === label.toLowerCase());
    const findRowIndexStartsWith = (label, col = 0) => data.findIndex(row => row && row[col] && row[col].trim().toLowerCase().startsWith(label.toLowerCase()));

    // --- LEADER ATTUALE (Colonna A/B) ---
    let rowIndex = findRowIndex("LEADER ATTUALE");
    if (rowIndex !== -1 && data[rowIndex + 1]) {
        dashboard.leaderAttuale = { team: data[rowIndex + 1][0] };
    }

    // --- RECORD ASSOLUTO (Colonna E/F) ---
    rowIndex = findRowIndex("RECORD ASSOLUTO", 4); // Cerca nella colonna E (indice 4)
    if (rowIndex !== -1) {
        dashboard.recordAssoluto = {
            punteggio: data[rowIndex + 1] ? data[rowIndex + 1][5] : '', // Punteggio in colonna F
            team: data[rowIndex + 2] ? data[rowIndex + 2][5] : '',      // Squadra in colonna F
            giornata: data[rowIndex + 3] ? data[rowIndex + 3][5] : ''   // Giornata in colonna F
        };
    }

    // --- CAMPIONE DELLA GIORNATA (Colonna A/B) ---
    rowIndex = findRowIndexStartsWith("campione della giornata");
    if (rowIndex !== -1) {
        dashboard.campioneDellaGiornata = {
            giornata: data[rowIndex][0],
            punteggio: data[rowIndex + 1] ? data[rowIndex + 1][1] : '', // Punteggio in colonna B
            team: data[rowIndex + 2] ? data[rowIndex + 2][1] : ''      // Squadra in colonna B
        };
    }

    // --- CUCCHIAIO DI LEGNO (Colonna E/F) ---
    rowIndex = findRowIndex("Cucchiaio di Legno", 4); // Cerca nella colonna E
    if (rowIndex !== -1) {
        dashboard.cucchiaioDiLegno = {
            punteggio: data[rowIndex + 1] ? data[rowIndex + 1][5] : '', // Punteggio in colonna F
            team: data[rowIndex + 2] ? data[rowIndex + 2][5] : '',      // Squadra in colonna F
            giornata: data[rowIndex + 3] ? data[rowIndex + 3][5] : ''   // Giornata in colonna F
        };
    }

    // --- MIGLIOR PUNTEGGIO (Colonna B/C) ---
    rowIndex = findRowIndex("Miglior Punteggio");
    if (rowIndex !== -1 && data[rowIndex + 1]) {
        const fullText = data[rowIndex + 1][0] || '';
        const teamMatch = fullText.match(/^(.*?)\s*->/);
        const pointsMatch = fullText.match(/->\s*(\d+(\.\d+)?)\s*Punti/);

        dashboard.migliorPunteggio = {
            team: teamMatch ? teamMatch[1].trim() : 'N/D',
            punteggio: pointsMatch ? pointsMatch[1] : 'N/D'
        };
    }

    // --- NUOVO: PREMI DI GIORNATA (Dinamico, Colonne F/G) ---
    let premiRowIndex = findRowIndex("Premi di Giornata", 6); // Cerca "Premi di Giornata" nella colonna G (indice 6)
    if (premiRowIndex !== -1) {
        dashboard.premiDiGiornata = [];
        let i = premiRowIndex + 1; // Inizia dalla riga successiva all'etichetta
        // Continua a leggere finché c'è un nome squadra valido nella colonna F
        while (i < data.length && data[i] && data[i][5] && data[i][5].trim() !== '') {
            dashboard.premiDiGiornata.push({
                squadra: data[i][5],
                premio: data[i][6] || ''
            });
            i++;
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

        // Filter out empty rows from classifica before slicing
        const validClassificaData = classificaData.filter(row => row.Team && row.Team.trim() !== '');
        const classificaLimited = validClassificaData.slice(0, 49);

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
