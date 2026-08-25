import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NEW_SEASON_ARTICLES_FROM, CURRENT_SEASON, ARCHIVED_SEASON } from './seasons';

export type ArticleMetadata = {
    id: string;
    title: string;
    date: string;
    description: string;
    author: string;
    image: string;
};

export type ArticleListItem = {
    id: string;
    title: string;
    date: string;
    description: string;
    author: string;
    imageUrl: string;
    stagione: string;
    placeholder: false;
};

const MD_DIR = path.join(process.cwd(), 'public', 'articoli', 'md');

/**
 * Tutti gli articoli pubblicati (niente bozze Hermes), più recenti prima.
 *
 * Usata sia dalla rotta /api/articles (per i componenti client: fascia
 * numeri, tabellone, elenco Gazzetta) sia direttamente dai componenti
 * server come la home, che così non fanno una fetch verso la propria API
 * per un dato già leggibile da disco.
 */
export function getAllArticles(): ArticleListItem[] {
    if (!fs.existsSync(MD_DIR)) return [];
    const files = fs.readdirSync(MD_DIR).filter((f) => f.endsWith('.md'));

    const articles: ArticleListItem[] = files.flatMap((filename) => {
        const filePath = path.join(MD_DIR, filename);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContent);

        // Bozze Hermes (preview copertina): non in elenco pubblico
        if (data.draft === true) return [];

        const date = data.date || 'Senza Data';
        const stagione = data.stagione || (
            new Date(date) >= new Date(NEW_SEASON_ARTICLES_FROM) ? CURRENT_SEASON : ARCHIVED_SEASON
        );

        return [{
            id: filename.replace('.md', ''),
            title: data.title || filename.replace('.md', ''),
            date,
            description: data.description || '',
            author: data.author || 'La Redazione',
            imageUrl: data.image || '/image/gazzetta/default.jpg',
            stagione,
            placeholder: false as const,
        }];
    });

    articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return articles;
}

/** L'ultimo articolo pubblicato, o null se non ce n'è ancora nessuno. */
export function getLatestArticle(): ArticleListItem | null {
    return getAllArticles()[0] ?? null;
}

/**
 * Legge il frontmatter di un articolo della Gazzetta dal disco.
 *
 * Serve ai file di metadata (titolo, descrizione e immagine di anteprima),
 * che girano lato server e non possono passare dalla rotta API.
 */
export function getArticleMetadata(id: string): ArticleMetadata | null {
    // `id` arriva dall'URL: niente traversal fuori dalla cartella degli articoli
    const safeId = path.basename(String(id || ''));
    if (!safeId || safeId.startsWith('.')) return null;

    const file = path.join(MD_DIR, `${safeId}.md`);
    if (!file.startsWith(MD_DIR) || !fs.existsSync(file)) return null;

    try {
        const { data } = matter(fs.readFileSync(file, 'utf8'));
        return {
            id: safeId,
            title: data.title || safeId,
            date: data.date || '',
            description: data.description || '',
            author: data.author || 'La Redazione',
            image: data.image || '',
        };
    } catch {
        return null;
    }
}
