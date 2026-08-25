import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NEW_SEASON_ARTICLES_FROM, CURRENT_SEASON, ARCHIVED_SEASON } from '@/lib/seasons';

export async function GET() {
    try {
        const mdDir = path.join(process.cwd(), 'public', 'articoli', 'md');
        const files = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));

        const articles = files.flatMap(filename => {
            const filePath = path.join(mdDir, filename);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data } = matter(fileContent);

            // Bozze Hermes (preview copertina): non in elenco pubblico
            if (data.draft === true) return [];

            const date = data.date || "Senza Data";
            const stagione = data.stagione || (
                new Date(date) >= new Date(NEW_SEASON_ARTICLES_FROM) ? CURRENT_SEASON : ARCHIVED_SEASON
            );

            return [{
                id: filename.replace('.md', ''),
                title: data.title || filename.replace('.md', ''),
                date,
                description: data.description || "",
                author: data.author || "La Redazione",
                imageUrl: data.image || "/image/gazzetta/default.jpg",
                stagione,
                placeholder: false
            }];
        });

        // Strict chronological sort by date descending (newest first)
        articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
