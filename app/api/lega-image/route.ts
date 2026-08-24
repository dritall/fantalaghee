import { NextResponse } from 'next/server';

/**
 * Ponte per le immagini di Lega Serie A (foto giocatori, stemmi).
 *
 * I loro server rispondono solo a richieste che dichiarano di arrivare da
 * legaseriea.it — è la stessa ragione per cui le chiamate JSON in
 * /api/football mandano Referer e Origin. Un `<img>` caricato dal browser
 * manda invece il referer del nostro sito e si becca un rifiuto: da qui le
 * foto vuote. Passando da qui la richiesta parte dal server con le
 * intestazioni giuste, e al browser arriva una normale immagine.
 */

const ALLOWED_HOSTS = new Set([
    'media-sdp.legaseriea.it',
    'img.legaseriea.it',
]);

const HEADERS: HeadersInit = {
    'User-Agent':
        'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    Referer: 'https://www.legaseriea.it/',
    Origin: 'https://www.legaseriea.it',
    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const src = searchParams.get('src');

    if (!src) {
        return NextResponse.json({ ok: false, error: 'parametro src mancante' }, { status: 400 });
    }

    let target: URL;
    try {
        target = new URL(src);
    } catch {
        return NextResponse.json({ ok: false, error: 'src non è un URL valido' }, { status: 400 });
    }

    // Allowlist stretta: senza, questa rotta diventerebbe un proxy aperto
    // utilizzabile da chiunque per far uscire traffico dal nostro dominio.
    if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
        return NextResponse.json(
            { ok: false, error: `host non consentito: ${target.hostname}` },
            { status: 400 }
        );
    }

    try {
        // Niente Data Cache di Next su un corpo binario: qui passano webp da
        // decine di kB e la cache dei fetch è pensata per JSON, con un limite
        // di dimensione oltre il quale si comporta in modo diverso. La cache
        // vera la fa comunque la CDN, con il Cache-Control della risposta.
        const upstream = await fetch(target.toString(), {
            headers: HEADERS,
            cache: 'no-store',
        });

        if (!upstream.ok) {
            // Il corpo dell'errore è volutamente leggibile: aprendo l'URL nel
            // browser si distingue un percorso sbagliato (404) da un rifiuto
            // per hotlinking (403), che sono due problemi molto diversi.
            const detail = await upstream.text().catch(() => '');
            return NextResponse.json(
                {
                    ok: false,
                    error: `Lega ha risposto ${upstream.status}`,
                    src: target.toString(),
                    dettaglio: detail.slice(0, 300) || undefined,
                },
                { status: 404 }
            );
        }

        const body = await upstream.arrayBuffer();
        const contentType = upstream.headers.get('content-type') || 'image/webp';

        return new NextResponse(body, {
            headers: {
                'Content-Type': contentType,
                // le foto dei giocatori non cambiano: teniamole a lungo
                'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
            },
        });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message || 'immagine non raggiungibile', src: target.toString() },
            { status: 502 }
        );
    }
}
