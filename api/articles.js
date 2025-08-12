import { kv } from '@vercel/kv';

const HARDCODED_AUTH_TOKEN = "a-very-secret-and-hard-to-guess-token-fanta-laghee-2025";

export default async function handler(request, response) {
    const { method } = request;

    // 1. KV Store Connection Check (moved inside try block)

    // 2. Authentication Check
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        const authHeader = request.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${HARDCODED_AUTH_TOKEN}`) {
            return response.status(401).json({ message: 'Unauthorized: Invalid or missing token.' });
        }
    }

    try {
        if (!kv) {
            console.error("CRITICAL: KV store is not connected.");
            return response.status(503).json({ message: 'Service Unavailable: Database connection failed.' });
        }

        switch (method) {
            case 'GET': {
                const { id } = request.query;
                console.log(`[GET] Received request. ID: ${id || 'all'}`);
                if (id) {
                    const article = await kv.get(`article:${id}`);
                    console.log(`[GET] KV response for article:${id}:`, article);
                    return article
                        ? response.status(200).json(article)
                        : response.status(404).json({ message: 'Article not found.' });
                } else {
                    const articleKeys = await kv.keys('article:*');
                    console.log(`[GET] Found keys:`, articleKeys);
                    if (articleKeys.length === 0) return response.status(200).json([]);
                    const articles = await kv.mget(...articleKeys);
                    articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    console.log(`[GET] Returning ${articles.length} articles.`);
                    return response.status(200).json(articles);
                }
            }

            case 'POST': {
                const { title, content } = request.body;
                if (!title || !content) {
                    return response.status(400).json({ message: 'Title and content are required.' });
                }
                const newId = `art_${Date.now()}`;
                const newArticle = { id: newId, title, content, createdAt: new Date().toISOString() };
                await kv.set(`article:${newId}`, newArticle);
                return response.status(201).json(newArticle);
            }

            case 'PUT': {
                const { id, title, content } = request.body;
                if (!id || !title || !content) {
                    return response.status(400).json({ message: 'Article ID, title, and content are required.' });
                }
                const existingArticle = await kv.get(`article:${id}`);
                if (!existingArticle) {
                    return response.status(404).json({ message: 'Article not found.' });
                }
                const updatedArticle = { ...existingArticle, title, content, updatedAt: new Date().toISOString() };
                await kv.set(`article:${id}`, updatedArticle);
                return response.status(200).json(updatedArticle);
            }

            case 'DELETE': {
                const idToDelete = request.query.id;
                console.log(`[DELETE] Received request for ID: ${idToDelete}`);
                if (!idToDelete) {
                    return response.status(400).json({ message: 'Article ID is required as a query parameter.' });
                }
                const delResult = await kv.del(`article:${idToDelete}`);
                console.log(`[DELETE] KV deletion result for article:${idToDelete}: ${delResult}`);
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
