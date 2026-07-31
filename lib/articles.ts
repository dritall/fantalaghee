import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type ArticleMetadata = {
    id: string;
    title: string;
    date: string;
    description: string;
    author: string;
    image: string;
};

const MD_DIR = path.join(process.cwd(), 'public', 'articoli', 'md');

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
