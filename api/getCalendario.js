// Placeholder API endpoint to resolve 404 error for calendario.html.
// This should be implemented with the actual data source (e.g., TheSportsDB API).

export default async function handler(request, response) {
    // Returning an empty array of fixtures to prevent the page from crashing.
    // The frontend is designed to handle this state gracefully.
    response.status(200).json({ fixtures: [] });
}
