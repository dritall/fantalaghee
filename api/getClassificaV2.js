import Papa from 'papaparse';

// Helper function to fetch and parse CSV data
const fetchAndParseCSV = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText}`);
        }
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
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

export default async function handler(req, res) {
    // IMPORTANT: These URLs must be set as Environment Variables in Vercel.
    // Using placeholder URLs for local development.
    const CLASSIFICA_URL = process.env.CLASSIFICA_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeH6kU2nBf5h4s4p_z4a7b0zD_l-5dG3bOaJ2c-d-A9aN-u-s_s0bA-fR_cI-e_kXzJgV/pub?gid=0&single=true&output=csv';
    const DASHBOARD_URL = process.env.DASHBOARD_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeH6kU2nBf5h4s4p_z4a7b0zD_l-5dG3bOaJ2c-d-A9aN-u-s_s0bA-fR_cI-e_kXzJgV/pub?gid=1904323238&single=true&output=csv';

    try {
        // Fetch both CSV files in parallel
        const [classificaData, dashboardData] = await Promise.all([
            fetchAndParseCSV(CLASSIFICA_URL),
            fetchAndParseCSV(DASHBOARD_URL)
        ]);

        // CRUCIAL REQUIREMENT: Limit classifica data to the first 49 rows.
        // The header is row 1, so data rows are from index 0 to 47 (48 rows of data).
        // PapaParse with `header: true` returns an array of objects, so we just need to slice the array.
        const classificaLimited = classificaData.slice(0, 49);

        res.status(200).json({
            classifica: classificaLimited,
            dashboard: dashboardData
        });

    } catch (error) {
        console.error("API Error in get-classifica-v2:", error);
        res.status(500).json({
            error: 'Impossibile caricare o processare i dati CSV.',
            details: error.message
        });
    }
}
