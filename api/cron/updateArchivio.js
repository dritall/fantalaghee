import { kv } from '@vercel/kv';
import Papa from 'papaparse';

const fetchAndParseCSV = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText}`);
        const csvText = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => results.errors.length ? reject(results.errors) : resolve(results.data),
                error: (error) => reject(new Error(`Error parsing CSV from ${url}: ${error.message}`)),
            });
        });
    } catch (error) {
        throw new Error(`Network or parsing error for ${url}: ${error.message}`);
    }
};

export default async function handler(request, response) {
    if (process.env.CRON_SECRET && request.query.cron_secret !== process.env.CRON_SECRET) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    const CLASSIFICA_URL = process.env.CLASSIFICA_CSV_URL;
    if (!CLASSIFICA_URL) {
        return response.status(500).json({ error: 'CLASSIFICA_CSV_URL environment variable is not set.' });
    }
    if (!kv) {
        return response.status(503).json({ message: 'KV store is not connected.' });
    }

    try {
        const classificaData = await fetchAndParseCSV(CLASSIFICA_URL);

        const validData = classificaData.filter(row => row.Team && row.Team.trim() !== '');
        const classificaLimited = validData.slice(0, 49);

        if (classificaLimited.length === 0) {
            throw new Error("I dati della classifica sono vuoti dopo il parsing e il filtraggio.");
        }

        const numeroGiornata = classificaLimited[0]['Numero Giornata'];
        if (!numeroGiornata) {
            throw new Error("La colonna 'Numero Giornata' non è stata trovata nei dati CSV.");
        }

        const giornataKey = `classifica_giornata_${numeroGiornata}`;
        const listKey = 'giornate_disponibili';

        await kv.set(giornataKey, JSON.stringify(classificaLimited));

        const giornateDisponibili = await kv.get(listKey) || [];
        if (!giornateDisponibili.includes(numeroGiornata)) {
            giornateDisponibili.push(numeroGiornata);
            giornateDisponibili.sort((a, b) => parseInt(a) - parseInt(b));
            await kv.set(listKey, giornateDisponibili); // No need to stringify, kv handles it
        }

        response.status(200).json({ message: `Archivio aggiornato con successo per la giornata ${numeroGiornata}.`});

    } catch (error) {
        console.error('Errore nel Cron Job di aggiornamento archivio:', error);
        response.status(500).json({ error: 'Esecuzione del Cron Job fallita.', details: error.message });
    }
}
