import { kv } from '@vercel/kv';

function parseCookie(str) {
  if (!str) return {};
  return str
    .split(';')
    .map(v => v.split('='))
    .reduce((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});
}

async function isAuthenticated(req) {
  try {
    const cookie = req.headers.cookie;
    if (!cookie) return false;
    const { auth } = parseCookie(cookie);
    if (!auth) return false;
    const session = JSON.parse(Buffer.from(auth, 'base64').toString());
    return session.loggedIn === true;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST' || req.method === 'DELETE') {
    const authenticated = await isAuthenticated(req);
    if (!authenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (req.method === 'POST') {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    const id = `article_${Date.now()}`;
    // Also store the id in the object itself
    await kv.set(id, { id, title, body });
    return res.status(201).json({ id, title, body });
  } else if (req.method === 'GET') {
    const keys = await kv.keys('article_*');
    if (!keys.length) {
      return res.status(200).json([]);
    }
    const articles = await kv.mget(...keys);
    return res.status(200).json(articles.filter(Boolean));
  } else if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }
    await kv.del(id);
    return res.status(204).end();
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
