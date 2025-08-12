// Placeholder API endpoint to resolve 404 error for classifica_2425.html.

export default async function handler(request, response) {
    // The frontend expects a 'standings' property.
    response.status(200).json({ standings: [] });
}
