import { kv } from '@vercel/kv';
import Papa from 'papaparse';

// Helper to fetch and parse CSV data
const fetchAndParseCSV = (url) => {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => results.errors.length ? reject(results.errors) : resolve(results.data),
            error: (error) => reject(error),
        });
    });
};

export default async function handler(request, response) {
    // This endpoint should be protected by a secret, checked via the query string,
    // to prevent unauthorized execution. The secret should be an environment variable.
    // Example: /api/cron/update-archivio?cron_secret=YOUR_SECRET
    if (process.env.CRON_SECRET && request.query.cron_secret !== process.env.CRON_SECRET) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    const CLASSIFICA_URL = process.env.CLASSIFICA_CSV_URL;
    if (!CLASSIFICA_URL) {
        return response.status(500).json({ error: 'CLASSIFICA_CSV_URL environment variable is not set.' });
    }

    try {
        const classificaData = await fetchAndParseCSV(CLASSIFICA_URL);

        // Requirement: Limit data to the first 49 rows
        const classificaLimited = classificaData.slice(0, 49);

        if (classificaLimited.length === 0) {
            throw new Error("I dati della classifica sono vuoti dopo il parsing.");
        }

        // Requirement: Extract "Numero Giornata"
        // We assume the column name is 'Numero Giornata' and it's consistent for all rows.
        const numeroGiornata = classificaLimited[0]['Numero Giornata'];
        if (!numeroGiornata) {
            throw new Error("La colonna 'Numero Giornata' non è stata trovata nei dati CSV.");
        }

        const giornataKey = `classifica_giornata_${numeroGiornata}`;
        const listKey = 'giornate_disponibili';

        // Save the full classification data for the specific "giornata"
        await kv.set(giornataKey, JSON.stringify(classificaLimited));

        // Update the list of available "giornate"
        let giornateDisponibili = await kv.get(listKey) || [];
        if (!giornateDisponibili.includes(numeroGiornata)) {
            giornateDisponibili.push(numeroGiornata);
            // Optional: sort the list
            giornateDisponibili.sort((a, b) => parseInt(a) - parseInt(b));
            await kv.set(listKey, JSON.stringify(giornateDisponibili));
        }

        response.status(200).json({
            message: `Archivio aggiornato con successo per la giornata ${numeroGiornata}.`,
            giornataSalvata: numeroGiornata,
            righeSalvate: classificaLimited.length
        });

    } catch (error) {
        console.error('Errore nel Cron Job di aggiornamento archivio:', error);
        response.status(500).json({
            error: 'Esecuzione del Cron Job fallita.',
            details: error.message
        });
    }
}
