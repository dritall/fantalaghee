import { kv } from '@vercel/kv';

const HARDCODED_AUTH_TOKEN = "a-very-secret-and-hard-to-guess-token-fanta-laghee-2025";

const safeJsonParse = (str) => {
    try { return JSON.parse(str); } catch (e) { return null; }
};

export default async function handler(request, response) {
    // 1. KV Store Connection Check
    if (!kv) {
        console.error("CRITICAL: KV store is not connected.");
        return response.status(503).json({ message: 'Service Unavailable: Database connection failed.' });
    }

    const { method } = request;

    // 2. Authentication Check
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        console.log(`[Auth] Checking token for ${method} request...`);
        const authHeader = request.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${HARDCODED_AUTH_TOKEN}`) {
            console.warn("[Auth] Unauthorized attempt detected.");
            return response.status(401).json({ message: 'Unauthorized: Invalid or missing token.' });
        }
        console.log("[Auth] Token validated successfully.");
    }

    try {
        let body;
        if (request.body) {
            body = typeof request.body === 'string' ? safeJsonParse(request.body) : request.body;
            if (body === null && typeof request.body === 'string') {
                 return response.status(400).json({ message: 'Invalid JSON in request body.' });
            }
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
                console.log('[POST] Received request with body:', body);
                if (!body || !body.title || !body.content) {
                    return response.status(400).json({ message: 'Title and content are required.' });
                }
                const newId = `art_${Date.now()}`;
                const newArticle = { id: newId, title: body.title, content: body.content, createdAt: new Date().toISOString() };
                console.log(`[POST] Creating article with ID: ${newId}`);
                await kv.set(`article:${newId}`, newArticle);
                console.log(`[POST] Article ${newId} created successfully.`);
                return response.status(201).json(newArticle);
            }

            case 'PUT': {
                console.log('[PUT] Received request with body:', body);
                if (!body || !body.id || !body.title || !body.content) {
                    return response.status(400).json({ message: 'Article ID, title, and content are required.' });
                }
                const { id, title, content } = body;
                console.log(`[PUT] Updating article with ID: ${id}`);
                const existingArticle = await kv.get(`article:${id}`);
                if (!existingArticle) {
                    console.warn(`[PUT] Article not found: ${id}`);
                    return response.status(404).json({ message: 'Article not found.' });
                }
                const updatedArticle = { ...existingArticle, title, content };
                await kv.set(`article:${id}`, updatedArticle);
                console.log(`[PUT] Article ${id} updated successfully.`);
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
