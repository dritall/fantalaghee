import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

const GITHUB_API = 'https://api.github.com';
const WORKFLOW_FILE = 'gazzetta-cover.yml';

/** Confronto a tempo costante tra il token ricevuto e il secret configurato. */
function autenticato(request: NextRequest, secret: string): boolean {
    const header = request.headers.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/);
    const fornito = match ? match[1] : '';
    const a = Buffer.from(fornito);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

/**
 * Rigenera la copertina di un articolo già pubblicato con un seed diverso, così Hermes
 * può proporre una variante dell'illustrazione senza che l'utente debba aprire GitHub.
 *
 * Non genera l'immagine qui: fa partire la GitHub Action gazzetta-cover.yml (che ha le
 * chiavi immagine) via workflow_dispatch, passandole slug + seed + force. In questo modo
 * nessuna chiave immagine deve stare su Vercel.
 *
 * Body: { slug?: string, giornata?: number, seed?: number }
 * - almeno uno tra slug e giornata (slug ha la precedenza).
 * - seed assente -> ne genera uno casuale (serve un seed nuovo per avere un'immagine diversa).
 */
export async function POST(request: NextRequest) {
    const publishSecret = process.env.GAZZETTA_PUBLISH_SECRET;
    if (!publishSecret) {
        return NextResponse.json(
            { ok: false, error: 'GAZZETTA_PUBLISH_SECRET non configurato sul server.' },
            { status: 500 }
        );
    }
    if (!autenticato(request, publishSecret)) {
        return NextResponse.json({ ok: false, error: 'Autenticazione mancante o non valida.' }, { status: 401 });
    }

    const ghToken = process.env.GAZZETTA_GH_TOKEN;
    if (!ghToken) {
        return NextResponse.json(
            { ok: false, error: 'GAZZETTA_GH_TOKEN non configurato sul server.' },
            { status: 500 }
        );
    }

    let payload: any = {};
    try {
        const testo = await request.text();
        if (testo) payload = JSON.parse(testo);
    } catch {
        return NextResponse.json({ ok: false, error: 'Corpo della richiesta non è JSON valido.' }, { status: 400 });
    }

    let slug: string | null = typeof payload.slug === 'string' && payload.slug.trim() ? payload.slug.trim() : null;
    if (!slug) {
        if (typeof payload.giornata === 'number' && Number.isInteger(payload.giornata) && payload.giornata > 0) {
            slug = `gazzetta-g${payload.giornata}`;
        } else {
            return NextResponse.json(
                { ok: false, error: 'Indica quale copertina rigenerare: passa "slug" (es. gazzetta-g7) oppure "giornata".' },
                { status: 400 }
            );
        }
    }
    if (!/^gazzetta-g\d+$/.test(slug)) {
        return NextResponse.json(
            { ok: false, error: `Slug non valido: "${slug}". Atteso il formato gazzetta-g{numero}.` },
            { status: 400 }
        );
    }

    // Seed nuovo -> immagine diversa. Se il chiamante non lo passa, ne generiamo uno casuale.
    const seed = (typeof payload.seed === 'number' && Number.isInteger(payload.seed))
        ? payload.seed
        : Math.floor(Math.random() * 1_000_000);

    const owner = process.env.GITHUB_REPO_OWNER || 'dritall';
    const repo = process.env.GITHUB_REPO_NAME || 'fantalaghee';

    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ghToken}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'fantalaghee-publish',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ref: 'main',
            // gli input di workflow_dispatch sono sempre stringhe
            inputs: { slug, seed: String(seed), force: 'true' },
        }),
    });

    if (res.status === 403) {
        return NextResponse.json(
            {
                ok: false,
                error: 'Il token GitHub non ha il permesso di avviare le Action (Actions: write). '
                    + 'Con un token classic "repo" è incluso; con un fine-grained aggiungi "Actions: Read and write". '
                    + 'In alternativa rigenera la copertina a mano dalla tab Actions di GitHub (Run workflow).',
            },
            { status: 403 }
        );
    }
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        return NextResponse.json(
            { ok: false, error: `Avvio della rigenerazione fallito (${res.status}): ${body.slice(0, 300)}` },
            { status: 502 }
        );
    }

    // workflow_dispatch risponde 204 senza corpo
    return NextResponse.json({
        ok: true,
        slug,
        seed,
        messaggio: `Rigenerazione della copertina ${slug} avviata (seed ${seed}). `
            + `Attendi ~90 secondi, poi ricontrolla https://www.fantalaghee.live/image/gazzetta/${slug}.png`,
    });
}
