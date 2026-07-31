import { ImageResponse } from 'next/og';
import { LEAGUE_TAGLINE } from '@/lib/seasons';

export const alt = 'Fanta Laghèe — Il Fantacalcio del Lario';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Anteprima predefinita del sito, usata da tutte le pagine senza una propria. */
export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0b0824 0%, #131a45 55%, #0a1030 100%)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        fontSize: 128,
                        fontWeight: 900,
                        color: '#ffffff',
                        letterSpacing: -3,
                    }}
                >
                    FANTA LAGHÈE
                </div>

                <div
                    style={{
                        display: 'flex',
                        marginTop: 28,
                        padding: '14px 34px',
                        borderRadius: 999,
                        border: '2px solid rgba(103, 232, 249, 0.35)',
                        fontSize: 30,
                        letterSpacing: 8,
                        textTransform: 'uppercase',
                        color: '#67e8f9',
                    }}
                >
                    {LEAGUE_TAGLINE}
                </div>

                <div
                    style={{
                        display: 'flex',
                        marginTop: 46,
                        fontSize: 24,
                        letterSpacing: 3,
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.35)',
                    }}
                >
                    Classifica · Verdetto · Serie A · La Gazzetta
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
