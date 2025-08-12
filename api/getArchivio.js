import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    if (!kv) {
        return response.status(503).json({ message: 'KV store is not connected.' });
    }

    const { giornata } = request.query;

    try {
        if (giornata) {
            const giornataKey = `classifica_giornata_${giornata}`;
            const data = await kv.get(giornataKey);
            return data
                ? response.status(200).json(data)
                : response.status(404).json({ error: `Nessuna classifica trovata per la giornata ${giornata}.` });
        } else {
            const listKey = 'giornate_disponibili';
            const data = await kv.get(listKey);
            return response.status(200).json(data || []);
        }
    } catch (error) {
        console.error('API Error in get-archivio:', error);
        return response.status(500).json({ error: 'Impossibile recuperare i dati dall\'archivio.', details: error.message });
    }
}
