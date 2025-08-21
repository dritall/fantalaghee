import Papa from 'papaparse';

const fetchAndParseCSV = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch CSV from ${url}`);
    const csvText = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => results.errors.length ? reject(results.errors) : resolve(results.data),
            error: (error) => reject(error),
        });
    });
};

export default async function handler(req, res) {
    const CLASSIFICA_URL = process.env.CLASSIFICA_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeH6kU2nBf5h4s4p_z4a7b0zD_l-5dG3bOaJ2c-d-A9aN-u-s_s0bA-fR_cI-e_kXzJgV/pub?gid=0&single=true&output=csv';
    try {
        const classificaData = await fetchAndParseCSV(CLASSIFICA_URL);
        const validData = classificaData.filter(row => row.Team && row.Team.trim() !== '');
        const processedData = validData.map(row => {
            const keysToDelete = Object.keys(row).filter(k => k.toLowerCase() === 'mister' || k.toLowerCase() === 'nickname');
            keysToDelete.forEach(key => delete row[key]);
            return row;
        });
        res.status(200).json({ classifica: processedData.slice(0, 49) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load or process data.', details: error.message });
    }
}
