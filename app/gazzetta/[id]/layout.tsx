import type { Metadata } from 'next';
import { getArticleMetadata } from '@/lib/articles';

/**
 * La pagina dell'articolo è un componente client, quindi non può esportare
 * `metadata`: titolo e descrizione per le anteprime dei link vivono qui.
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const article = getArticleMetadata(params.id);
    if (!article) return { title: 'La Gazzetta del Laghèe' };

    const description = article.description || `${article.title} — La Gazzetta del Laghèe.`;

    return {
        title: article.title,
        description,
        openGraph: {
            title: article.title,
            description,
            type: 'article',
            locale: 'it_IT',
            publishedTime: article.date || undefined,
            authors: article.author ? [article.author] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description,
        },
    };
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
