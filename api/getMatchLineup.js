// api/getMatchLineup.js
const API_KEY = '123';

export default async function handler(request, response) {
    const { id } = request.query;
    if (!id) return response.status(400).json({ error: 'Event ID is required' });
    try {
        const res = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookuplineup.php?id=${id}`);
        if (!res.ok) throw new Error(`Failed to fetch lineup for event ${id}`);
        const data = await res.json();
        response.status(200).json({ lineup: data.lineup || [] });
    } catch (error) {
        console.error(`API Error in getMatchLineup for event ${id}:`, error);
        response.status(500).json({ error: `Failed to fetch lineup for event ${id}.`, details: error.message, lineup: [] });
    }
}
