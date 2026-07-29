import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import matter from 'gray-matter';
import { getSeason } from '@/lib/seasons';

export const runtime = 'nodejs';

const GITHUB_API = 'https://api.github.com';

function ghHeaders(token: string) {
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'fantalaghee-publish',
    };
}

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

/** Valida a mano il payload, accumulando TUTTI gli errori trovati. */
function valida(payload: any): string[] {
    const errori: string[] = [];

    if (typeof payload?.title !== 'string' || !payload.title.trim()) {
        errori.push('title: mancante o vuoto');
    }

    if (typeof payload?.description !== 'string' || !payload.description.trim()) {
        errori.push('description: mancante o vuoto');
    } else if (payload.description.length > 200) {
        errori.push(`description: troppo lunga (${payload.description.length} caratteri, massimo 200)`);
    }

    if (typeof payload?.body_md !== 'string' || !payload.body_md.trim()) {
        errori.push('body_md: mancante o vuoto');
    } else if (payload.body_md.trim().length < 500) {
        errori.push(`body_md: troppo corto (${payload.body_md.trim().length} caratteri, minimo 500 - probabile generazione troncata)`);
    }

    if (typeof payload?.cover !== 'object' || payload.cover === null) {
        errori.push('cover: mancante');
    } else {
        const c = payload.cover;
        if (typeof c.titolo_principale !== 'string' || !c.titolo_principale.trim()) {
            errori.push('cover.titolo_principale: mancante o vuoto');
        } else if (c.titolo_principale.length > 60) {
            errori.push(`cover.titolo_principale: troppo lungo (${c.titolo_principale.length} caratteri, massimo 60)`);
        }

        if (typeof c.sottotitolo !== 'string' || !c.sottotitolo.trim()) {
            errori.push('cover.sottotitolo: mancante o vuoto');
        } else if (c.sottotitolo.length > 200) {
            errori.push(`cover.sottotitolo: troppo lungo (${c.sottotitolo.length} caratteri, massimo 200)`);
        }

        if (typeof c.image_prompt !== 'string' || !c.image_prompt.trim()) {
            errori.push('cover.image_prompt: mancante o vuoto');
        }

        if ('box1' in c || 'box2' in c || 'box3' in c) {
            errori.push('cover.box1/box2/box3: non vanno inclusi, li calcola il server dai dati reali di /api/verdetto');
        }
    }

    if (payload?.box1 !== undefined || payload?.box2 !== undefined || payload?.box3 !== undefined) {
        errori.push('box1/box2/box3: non vanno inclusi nel payload, li calcola il server dai dati reali di /api/verdetto');
    }

    if (payload?.giornata !== undefined && (typeof payload.giornata !== 'number' || !Number.isInteger(payload.giornata) || payload.giornata <= 0)) {
        errori.push('giornata: se presente deve essere un numero intero positivo');
    }

    if (payload?.stagione !== undefined && typeof payload.stagione !== 'string') {
        errori.push('stagione: se presente deve essere una stringa');
    }

    if (payload?.force !== undefined && typeof payload.force !== 'boolean') {
        errori.push('force: se presente deve essere booleano');
    }

    return errori;
}

/** Scarta valori senza contenuto reale ('N/D', vuoto, NaN). */
function pulisci(v: any): string | null {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    if (!s || s === 'N/D' || s.toLowerCase() === 'nan') return null;
    return s;
}

function costruisciBox1(dati: any) {
    const podio = Array.isArray(dati?.podio) ? dati.podio : [];
    const rows: string[] = [];
    podio.forEach((p: any) => {
        const squadra = pulisci(p?.squadra);
        const punteggio = pulisci(p?.punteggio);
        if (squadra && punteggio) rows.push(`${rows.length + 1}. ${squadra}|${punteggio}`);
    });
    return { title: '🏆 TOP 5 DI GIORNATA', rows };
}

function costruisciBox2(dati: any) {
    const classifica = Array.isArray(dati?.classifica) ? dati.classifica : [];
    const rows: string[] = [];
    classifica.slice(0, 5).forEach((c: any) => {
        const squadra = pulisci(c?.squadra);
        const punti = pulisci(c?.punti);
        if (squadra && punti) rows.push(`${rows.length + 1}. ${squadra}|${punti}`);
    });
    return { title: '📊 CLASSIFICA GENERALE', rows };
}

function costruisciBox3(dati: any) {
    const rows: string[] = [];

    const campione = pulisci(dati?.campioneDiGiornata);
    if (campione) rows.push(`Campione|${campione}`);

    const recPunteggio = pulisci(dati?.recordAssoluto?.punteggio);
    const recSquadra = pulisci(dati?.recordAssoluto?.squadra);
    if (recPunteggio && recSquadra) rows.push(`Record|${recPunteggio} ${recSquadra}`);

    const cucSquadra = pulisci(dati?.cucchiaioDiLegno?.squadra);
    const cucPunteggio = pulisci(dati?.cucchiaioDiLegno?.punteggio);
    if (cucSquadra && cucPunteggio) rows.push(`Cucchiaio|${cucSquadra} ${cucPunteggio}`);

    return { title: '📌 I VERDETTI', rows };
}

/** GET contenuti da GitHub: restituisce lo sha se il file esiste già, null se non esiste. */
async function trovaShaEsistente(owner: string, repo: string, repoPath: string, token: string): Promise<string | null> {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${repoPath}?ref=main`, {
        headers: ghHeaders(token),
        cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`GitHub ha risposto ${res.status} nel controllo esistenza file: ${body.slice(0, 200)}`);
    }
    const json = await res.json();
    return json?.sha || null;
}

/** PUT contenuti su GitHub: crea o sovrascrive (se sha è passato) il file su main. */
async function committaFile(owner: string, repo: string, repoPath: string, content: string, message: string, token: string, sha: string | null): Promise<string> {
    const body: Record<string, unknown> = {
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch: 'main',
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${repoPath}`, {
        method: 'PUT',
        headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const body_ = await res.text().catch(() => '');
        throw new Error(`GitHub ha rifiutato il commit (${res.status}): ${body_.slice(0, 300)}`);
    }
    const json = await res.json();
    return json?.commit?.sha || '';
}

export async function POST(request: NextRequest) {
    const publishSecret = process.env.GAZZETTA_PUBLISH_SECRET;
    if (!publishSecret) {
        return NextResponse.json(
            { ok: false, error: 'GAZZETTA_PUBLISH_SECRET non configurato sul server: impossibile pubblicare in sicurezza.' },
            { status: 500 }
        );
    }
    if (!autenticato(request, publishSecret)) {
        return NextResponse.json({ ok: false, error: 'Autenticazione mancante o non valida.' }, { status: 401 });
    }

    let payload: any;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ ok: false, error: 'Corpo della richiesta non è JSON valido.' }, { status: 400 });
    }

    const errori = valida(payload);
    if (errori.length > 0) {
        return NextResponse.json(
            { ok: false, error: 'Payload non valido: correggi i campi indicati e riprova.', dettagli: errori },
            { status: 400 }
        );
    }

    const ghToken = process.env.GAZZETTA_GH_TOKEN;
    if (!ghToken) {
        return NextResponse.json(
            { ok: false, error: 'GAZZETTA_GH_TOKEN non configurato sul server: impossibile committare su GitHub.' },
            { status: 500 }
        );
    }

    const url = new URL(request.url);
    const origin = url.origin;
    const season = getSeason(typeof payload.stagione === 'string' ? payload.stagione : undefined);
    const stagione = season.slug;
    const force = payload.force === true;

    // 1. Giornata: dal payload, oppure da /api/gazzetta/stato
    let giornata: number;
    if (typeof payload.giornata === 'number') {
        giornata = payload.giornata;
    } else {
        const statoRes = await fetch(`${origin}/api/gazzetta/stato?stagione=${encodeURIComponent(stagione)}`, { cache: 'no-store' });
        const stato = await statoRes.json();
        if (stato.stato !== 'PRONTA' && !force) {
            return NextResponse.json(
                { ok: false, error: stato.motivo || 'La gazzetta non è pronta per essere pubblicata.' },
                { status: 409 }
            );
        }
        giornata = stato.giornata;
    }

    // 2. Slug e percorso
    const slug = `gazzetta-g${giornata}`;
    const repoPath = `public/articoli/md/${slug}.md`;
    const owner = process.env.GITHUB_REPO_OWNER || 'dritall';
    const repo = process.env.GITHUB_REPO_NAME || 'fantalaghee';

    // 3. Idempotenza: il file esiste già su main?
    let shaEsistente: string | null;
    try {
        shaEsistente = await trovaShaEsistente(owner, repo, repoPath, ghToken);
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: `Impossibile verificare se l'articolo esiste già su GitHub: ${e.message}` },
            { status: 502 }
        );
    }
    if (shaEsistente && !force) {
        return NextResponse.json(
            { ok: false, error: `L'articolo della giornata ${giornata} (${slug}) esiste già. Passa force:true per sovrascriverlo.` },
            { status: 409 }
        );
    }

    // 4. Dati reali per i tre box (mai dal payload)
    let dati: any;
    try {
        const verdettoRes = await fetch(`${origin}/api/verdetto?stagione=${encodeURIComponent(stagione)}`, { cache: 'no-store' });
        dati = await verdettoRes.json();
        if (!verdettoRes.ok || dati?.error) {
            throw new Error(dati?.details || dati?.error || `/api/verdetto ha risposto ${verdettoRes.status}`);
        }
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: `Impossibile leggere i dati della giornata da /api/verdetto: ${e.message}. Niente è stato pubblicato.` },
            { status: 502 }
        );
    }

    const box1 = costruisciBox1(dati);
    const box2 = costruisciBox2(dati);
    const box3 = costruisciBox3(dati);

    // 5. Composizione del file (frontmatter via gray-matter, mai YAML a mano)
    const isoDate = new Date().toISOString().slice(0, 10);
    const frontmatter = {
        title: payload.title,
        date: isoDate,
        description: payload.description,
        author: "L'Oracolo del Laghèe",
        image: `/image/gazzetta/${slug}.png`,
        stagione,
        cover: {
            giornata,
            titolo_principale: payload.cover.titolo_principale,
            sottotitolo: payload.cover.sottotitolo,
            image_prompt: payload.cover.image_prompt,
            box1,
            box2,
            box3,
        },
    };
    const fileContent = matter.stringify(`${payload.body_md.trim()}\n`, frontmatter);

    // 6. Commit su GitHub
    let commitSha: string;
    try {
        commitSha = await committaFile(owner, repo, repoPath, fileContent, `Gazzetta: giornata ${giornata}`, ghToken, shaEsistente);
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: `Commit su GitHub fallito: ${e.message}. Riprova; se persiste controlla GAZZETTA_GH_TOKEN.` },
            { status: 502 }
        );
    }

    // 7. Risposta
    return NextResponse.json(
        {
            ok: true,
            slug,
            giornata,
            commit: commitSha,
            liveUrl: `https://www.fantalaghee.live/gazzetta/${slug}`,
            coverUrl: `https://www.fantalaghee.live/image/gazzetta/${slug}.png`,
        },
        { status: 201 }
    );
}
