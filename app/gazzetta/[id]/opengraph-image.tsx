import { ImageResponse } from 'next/og';
import { getArticleMetadata } from '@/lib/articles';

export const alt = 'La Gazzetta del Laghèe';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Anteprima usata quando un articolo viene incollato su WhatsApp o sui social.
 *
 * È disegnata da zero invece di riusare la copertina dell'articolo: le
 * copertine sono in webp, formato che il motore di rendering delle immagini
 * OpenGraph non gestisce, quindi finirebbero in un riquadro vuoto.
 */
export default async function Image({ params }: { params: { id: string } }) {
    const article = getArticleMetadata(params.id);
    const title = article?.title || 'La Gazzetta del Laghèe';
    const date = article?.date
        ? new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(article.date))
        : '';

    // il titolo detta la scala: i titoloni della Gazzetta sono lunghi
    const titleSize = title.length > 78 ? 60 : title.length > 48 ? 72 : 88;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '70px 80px',
                    background: 'linear-gradient(135deg, #0b0824 0%, #131a45 55%, #0a1030 100%)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 7, background: '#ec4899', display: 'flex' }} />
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 26,
                            letterSpacing: 8,
                            textTransform: 'uppercase',
                            color: '#f9a8d4',
                            fontWeight: 700,
                        }}
                    >
                        La Gazzetta del Laghèe
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: titleSize,
                            lineHeight: 1.08,
                            fontWeight: 900,
                            color: '#ffffff',
                            textTransform: 'uppercase',
                            letterSpacing: -1,
                        }}
                    >
                        {title}
                    </div>
                    {date && (
                        <div style={{ display: 'flex', marginTop: 26, fontSize: 28, color: 'rgba(255,255,255,0.45)' }}>
                            {date}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
                        FANTA LAGHÈE
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 22,
                            letterSpacing: 4,
                            textTransform: 'uppercase',
                            color: '#67e8f9',
                        }}
                    >
                        Il Fantacalcio del Lario
                    </div>
                </div>

                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 10,
                        display: 'flex',
                        background: 'linear-gradient(90deg, #1e3a8a, #2563EB, #22d3ee, #ec4899)',
                    }}
                />
            </div>
        ),
        size
    );
}
