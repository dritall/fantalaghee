import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/articles';

export async function GET() {
    try {
        const articles = getAllArticles();

        // Cambia solo quando esce un nuovo articolo (nuovo deploy): più
        // componenti della stessa pagina la richiamano (fascia numeri,
        // tabellone, elenco Gazzetta), ha senso tenerla in cache un po'.
        return NextResponse.json(articles, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
        });
    } catch (error) {
        console.error("Error reading articles frontmatter:", error);
        return NextResponse.json({ error: 'Failed to load articles' }, { status: 500 });
    }
}
