import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    const { giornata } = request.query;

    try {
        if (giornata) {
            // Fetch specific classification for a given "giornata"
            const giornataKey = `classifica_giornata_${giornata}`;
            const data = await kv.get(giornataKey);

            if (data) {
                // Data is stored as a JSON string, so we parse it before sending
                response.status(200).json(JSON.parse(data));
            } else {
                response.status(404).json({ error: `Nessuna classifica trovata per la giornata ${giornata}.` });
            }
        } else {
            // Fetch the list of all available "giornate"
            const listKey = 'giornate_disponibili';
            const data = await kv.get(listKey);

            if (data) {
                // Data is stored as a JSON string of an array
                response.status(200).json(JSON.parse(data));
            } else {
                // If the list doesn't exist yet, return an empty array
                response.status(200).json([]);
            }
        }
    } catch (error) {
        console.error('Errore API in get-archivio:', error);
        response.status(500).json({
            error: 'Impossibile recuperare i dati dall\'archivio.',
            details: error.message
        });
    }
}
