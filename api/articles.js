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
                if (id) {
                    try {
                        const article = await kv.get(`article:${id}`);
                        if (!article) {
                            return response.status(404).json({ message: 'Article not found.' });
                        }
                        return response.status(200).json(article);
                    } catch (kvError) {
                        console.error(`[KV ERROR] Failed to kv.get('article:${id}'):`, kvError);
                        return response.status(500).json({ message: 'Database read error.', error: kvError.message });
                    }
                } else {
                    let articleKeys = [];
                    try {
                        articleKeys = await kv.keys('article:*');
                        if (articleKeys.length === 0) {
                            return response.status(200).json([]);
                        }
                    } catch (kvError) {
                        console.error('[KV ERROR] Failed to kv.keys("article:*"):', kvError);
                        return response.status(500).json({ message: 'Database key scan error.', error: kvError.message });
                    }

                    try {
                        const articles = await kv.mget(...articleKeys);
                        articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        return response.status(200).json(articles);
                    } catch (kvError) {
                        console.error('[KV ERROR] Failed to kv.mget() with keys:', articleKeys, kvError);
                        return response.status(500).json({ message: 'Database multi-read error.', error: kvError.message });
                    }
                }
            }

            case 'POST': {
                const { title, content } = request.body;
                if (!title || !content) {
                    return response.status(400).json({ message: 'Title and content are required.' });
                }
                const newId = `art_${Date.now()}`;
                const newArticle = { id: newId, title, content, createdAt: new Date().toISOString() };
                try {
                    await kv.set(`article:${newId}`, newArticle);
                    return response.status(201).json(newArticle);
                } catch (kvError) {
                    console.error(`[KV ERROR] Failed to kv.set('article:${newId}'):`, kvError);
                    return response.status(500).json({ message: 'Database write error.', error: kvError.message });
                }
            }

            case 'PUT': {
                const { id, title, content } = request.body;
                if (!id || !title || !content) {
                    return response.status(400).json({ message: 'Article ID, title, and content are required.' });
                }
                try {
                    const existingArticle = await kv.get(`article:${id}`);
                    if (!existingArticle) {
                        return response.status(404).json({ message: 'Article not found.' });
                    }
                    const updatedArticle = { ...existingArticle, title, content, updatedAt: new Date().toISOString() };
                    await kv.set(`article:${id}`, updatedArticle);
                    return response.status(200).json(updatedArticle);
                } catch (kvError) {
                    console.error(`[KV ERROR] Failed to get or set article ('article:${id}'):`, kvError);
                    return response.status(500).json({ message: 'Database read/write error during update.', error: kvError.message });
                }
            }

            case 'DELETE': {
                const { id } = request.query;
                if (!id) {
                    return response.status(400).json({ message: 'Article ID is required as a query parameter.' });
                }
                try {
                    const delResult = await kv.del(`article:${id}`);
                    if (delResult === 0) {
                         return response.status(404).json({ message: 'Article not found.' });
                    }
                    return response.status(200).json({ message: 'Article deleted successfully.' });
                } catch (kvError) {
                    console.error(`[KV ERROR] Failed to kv.del('article:${id}'):`, kvError);
                    return response.status(500).json({ message: 'Database delete error.', error: kvError.message });
                }
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
