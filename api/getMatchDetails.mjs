// api/getMatchDetails.js
const API_KEY = '123';

export default async function handler(request, response) {
    const { id } = request.query;
    if (!id) return response.status(400).json({ error: 'Event ID is required' });
    try {
        const [lineupRes, statsRes, timelineRes] = await Promise.all([
            fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookuplineup.php?id=${id}`),
            fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookupeventstats.php?id=${id}`),
            fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookuptimeline.php?id=${id}`)
        ]);
        
        let lineupData = {}, statsData = {}, timelineData = {};
        
        if (lineupRes.ok) lineupData = await lineupRes.json();
        if (statsRes.ok) statsData = await statsRes.json();
        if (timelineRes.ok) timelineData = await timelineRes.json();
        
        response.status(200).json({ 
            lineup: lineupData.lineup || [],
            stats: statsData.eventstats || [],
            timeline: timelineData.timeline || []
        });
    } catch (error) {
        console.error(`API Error in getMatchDetails for event ${id}:`, error);
        response.status(500).json({ error: `Failed to fetch match details for event ${id}.`, details: error.message });
    }
}
