import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSeason } from '@/lib/seasons';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DUE_ORE_MS = 2 * 60 * 60 * 1000;

type Stato = 'PRONTA' | 'FOGLIO_DA_RICALCOLARE' | 'GIA_PUBBLICATA' | 'NON_ANCORA';

/**
 * Giornata di Serie A più alta già chiusa: endDateUtc passato da più di 2 ore
 * e matchdayStatus diverso da "Playing" (veto, non fonte primaria: la data lo è).
 * Ritorna 0 se /api/football non risponde o non ha giornate — non deve mai far
 * fallire /api/gazzetta/stato.
 */
async function leggiGiornataChiusaSerieA(origin: string, stagione: string): Promise<number> {
    try {
        const res = await fetch(
            `${origin}/api/football?endpoint=matchdays&stagione=${encodeURIComponent(stagione)}`,
            { cache: 'no-store' }
        );
        const json = await res.json();
        if (!json?.ok || !Array.isArray(json.data) || json.data.length === 0) return 0;

        const ora = Date.now();
        const chiuse = json.data.filter((g: any) => {
            const fine = new Date(g.endDateUtc).getTime();
            if (!fine || Number.isNaN(fine)) return false;
            if (ora - fine <= DUE_ORE_MS) return false;
            return g.matchdayStatus !== 'Playing';
        });

        if (chiuse.length === 0) return 0;
        return Math.max(...chiuse.map((g: any) => Number(g.round) || 0));
    } catch (e) {
        console.error('Errore lettura /api/football in /api/gazzetta/stato:', e);
        return 0;
    }
}

/** Numero giornata calcolato sul foglio Google, letto da /api/verdetto. */
async function leggiGiornataFoglio(origin: string, stagione: string): Promise<number> {
    try {
        const res = await fetch(`${origin}/api/verdetto?stagione=${encodeURIComponent(stagione)}`, { cache: 'no-store' });
        const json = await res.json();
        return Number(json?.numeroGiornata) || 0;
    } catch (e) {
        console.error('Errore lettura /api/verdetto in /api/gazzetta/stato:', e);
        return 0;
    }
}

/** Giornata più alta già pubblicata, dai nomi file public/articoli/md/gazzetta-g{N}.md. */
function leggiGiornataPubblicata(): number {
    try {
        const mdDir = path.join(process.cwd(), 'public', 'articoli', 'md');
        const files = fs.readdirSync(mdDir);
        let max = 0;
        for (const f of files) {
            const m = f.match(/^gazzetta-g(\d+)\.md$/);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        }
        return max;
    } catch (e) {
        console.error('Errore lettura public/articoli/md in /api/gazzetta/stato:', e);
        return 0;
    }
}

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const season = getSeason(url.searchParams.get('stagione'));
    const stagione = season.slug;
    const origin = url.origin;

    const [giornataChiusaSerieA, giornataFoglio] = await Promise.all([
        leggiGiornataChiusaSerieA(origin, stagione),
        leggiGiornataFoglio(origin, stagione),
    ]);
    const giornataPubblicata = leggiGiornataPubblicata();

    let stato: Stato;
    let giornata: number;
    let motivo: string;

    if (giornataChiusaSerieA === 0) {
        stato = 'NON_ANCORA';
        giornata = giornataFoglio;
        motivo = `Nessuna giornata di Serie A risulta ancora chiusa (il foglio è fermo alla giornata ${giornataFoglio}): non c'è ancora niente da raccontare.`;
    } else if (giornataFoglio < giornataChiusaSerieA) {
        stato = 'FOGLIO_DA_RICALCOLARE';
        giornata = giornataChiusaSerieA;
        motivo = `La giornata ${giornataChiusaSerieA} di Serie A è chiusa, ma il foglio è ancora fermo alla giornata ${giornataFoglio}: va fatto ricalcolare.`;
    } else if (giornataFoglio <= giornataPubblicata) {
        stato = 'GIA_PUBBLICATA';
        giornata = giornataFoglio;
        motivo = `La giornata ${giornataFoglio} è già stata pubblicata (ultima gazzetta pubblicata: giornata ${giornataPubblicata}).`;
    } else {
        stato = 'PRONTA';
        giornata = giornataFoglio;
        motivo = `La giornata ${giornataFoglio} è chiusa, il foglio è aggiornato e la gazzetta non è ancora stata pubblicata.`;
    }

    return NextResponse.json({
        stagione,
        giornata,
        pronta: stato === 'PRONTA',
        stato,
        motivo,
        slugAtteso: `gazzetta-g${giornata}`,
        dettaglio: { giornataChiusaSerieA, giornataFoglio, giornataPubblicata },
    });
}
