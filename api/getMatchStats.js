// api/getMatchStats.js
const API_KEY = '123';

export default async function handler(request, response) {
    const { id } = request.query;

    if (!id) {
        return response.status(400).json({ error: 'Event ID is required' });
    }

    try {
        const statsResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookupeventstats.php?id=${id}`);
        if (!statsResponse.ok) {
            throw new Error(`Failed to fetch stats for event ${id}`);
        }
        const statsData = await statsResponse.json();

        response.status(200).json({ stats: statsData.eventstats || [] });

    } catch (error) {
        console.error(`API Error in getMatchStats for event ${id}:`, error);
        response.status(500).json({
            error: `Failed to fetch stats for event ${id}.`,
            details: error.message,
            stats: []
        });
    }
}
