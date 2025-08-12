// api/getMatchTimeline.js
const API_KEY = '123';

export default async function handler(request, response) {
    const { id } = request.query;

    if (!id) {
        return response.status(400).json({ error: 'Event ID is required' });
    }

    try {
        const timelineResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookuptimeline.php?id=${id}`);
        if (!timelineResponse.ok) {
            throw new Error(`Failed to fetch timeline for event ${id}`);
        }
        const timelineData = await timelineResponse.json();

        response.status(200).json({ timeline: timelineData.timeline || [] });

    } catch (error) {
        console.error(`API Error in getMatchTimeline for event ${id}:`, error);
        response.status(500).json({
            error: `Failed to fetch timeline for event ${id}.`,
            details: error.message,
            timeline: []
        });
    }
}
