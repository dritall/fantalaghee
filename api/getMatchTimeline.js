// Placeholder API endpoint to resolve 404 error for dettaglio_partita.html.

export default async function handler(request, response) {
    // The frontend expects a 'timeline' property.
    response.status(200).json({ timeline: [] });
}
