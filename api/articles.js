import { kv } from '@vercel/kv';

// This token must be the same as the one in /api/login.js
const HARDCODED_AUTH_TOKEN = "a-very-secret-and-hard-to-guess-token-fanta-laghee-2025";

// Helper function to safely parse JSON
const safeJsonParse = (str) => {
    try {
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
};

export default async function handler(request, response) {
    const { method } = request;

    // --- Authentication Check for Protected Routes ---
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        const authHeader = request.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${HARDCODED_AUTH_TOKEN}`) {
            return response.status(401).json({ message: 'Unauthorized: Invalid or missing token.' });
        }
    }

    try {
        let body;
        // Ensure body is parsed correctly, especially for Vercel edge functions
        if (request.body) {
            body = typeof request.body === 'string' ? safeJsonParse(request.body) : request.body;
            if (body === null && typeof request.body === 'string') {
                 return response.status(400).json({ message: 'Invalid JSON in request body.' });
            }
        }

        switch (method) {
            // --- PUBLIC: GET a single article or all articles ---
            case 'GET': {
                const { id } = request.query;
                if (id) {
                    const article = await kv.get(`article:${id}`);
                    return article
                        ? response.status(200).json(article)
                        : response.status(404).json({ message: 'Article not found.' });
                } else {
                    const articleKeys = await kv.keys('article:*');
                    if (articleKeys.length === 0) return response.status(200).json([]);

                    const articles = await kv.mget(...articleKeys);
                    articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first
                    return response.status(200).json(articles);
                }
            }

            // --- PROTECTED: CREATE a new article ---
            case 'POST': {
                if (!body || !body.title || !body.content) {
                    return response.status(400).json({ message: 'Title and content are required.' });
                }
                const newId = `art_${Date.now()}`;
                const newArticle = {
                    id: newId,
                    title: body.title,
                    content: body.content,
                    createdAt: new Date().toISOString(),
                };
                await kv.set(`article:${newId}`, newArticle);
                return response.status(201).json(newArticle);
            }

            // --- PROTECTED: UPDATE an existing article ---
            case 'PUT': {
                if (!body || !body.id || !body.title || !body.content) {
                    return response.status(400).json({ message: 'Article ID, title, and content are required.' });
                }
                const existingArticle = await kv.get(`article:${body.id}`);
                if (!existingArticle) {
                    return response.status(404).json({ message: 'Article not found.' });
                }
                const updatedArticle = { ...existingArticle, title: body.title, content: body.content };
                await kv.set(`article:${body.id}`, updatedArticle);
                return response.status(200).json(updatedArticle);
            }

            // --- PROTECTED: DELETE an article ---
            case 'DELETE': {
                const idToDelete = request.query.id; // Get ID from query param for DELETE
                if (!idToDelete) {
                    return response.status(400).json({ message: 'Article ID is required as a query parameter.' });
                }
                const delResult = await kv.del(`article:${idToDelete}`);
                return delResult > 0
                    ? response.status(200).json({ message: 'Article deleted successfully.' })
                    : response.status(404).json({ message: 'Article not found.' });
            }

            default:
                response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return response.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error('API Error in /api/articles:', error);
        return response.status(500).json({ message: 'An internal server error occurred.', error: error.message });
    }
}
