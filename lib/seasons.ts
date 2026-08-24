export type SeasonConfig = {
    slug: string;
    label: string;
    archived: boolean;
    classificaUrl: string;
    verdettoUrl: string;
    /** Lega Serie A "Football_Season" id - undefined finché non verificato/pubblicato */
    serieASeasonId?: string;
};

export const SEASONS: Record<string, SeasonConfig> = {
    '2526': {
        slug: '2526',
        label: '2025/26',
        archived: true,
        classificaUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9q-d7H5HzRRIzdoK4LLFU9GX5JUppoNy3-kWEVSDqcpL7dK1IcNIioj9ykzygz28H1xrmWyWoAyyc/pub?output=csv',
        verdettoUrl: 'https://docs.google.com/spreadsheets/d/1lHQEZoQT3TmgA-mPwExzorjxv6ub-xvFW-9WTm5805Y/export?format=csv&gid=1105159540',
        serieASeasonId: 'serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a',
    },
    '2627': {
        slug: '2627',
        label: '2026/27',
        archived: false,
        classificaUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRt2OX76DFf3kFwhgnbv7q7QGsVUxMw8ZuN-pqexwndNILTEypAGJIT-Aclj7fFWXgujdNkJi04ApgP/pub?output=csv&gid=1557944383',
        verdettoUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRt2OX76DFf3kFwhgnbv7q7QGsVUxMw8ZuN-pqexwndNILTEypAGJIT-Aclj7fFWXgujdNkJi04ApgP/pub?output=csv&gid=1105159540',
        // Id stagione 2026/27 di Lega Serie A (calendario pubblicato)
        serieASeasonId: 'serie-a%3A%3AFootball_Season%3A%3Aed7fdc2a3e7b408b942ec177b7b956b5',
    },
};

export const CURRENT_SEASON = '2627';
export const ARCHIVED_SEASON = '2526';

/** Data a partire dalla quale un articolo della Gazzetta è considerato della nuova stagione */
export const NEW_SEASON_ARTICLES_FROM = '2026-08-01';

/**
 * Squadre iscritte alla stagione in corso.
 *
 * Le iscrizioni sono chiuse e il campionato è partito: questo numero non è più
 * una stima, ed è quello da cui dipendono la struttura delle coppe e gli
 * importi dei premi. La stagione scorsa erano 50 (vedi `premi-riferimento`).
 */
export const SQUADRE_ISCRITTE = 40;

/** PDF del regolamento in vigore, servito da /public/docs */
export const REGOLAMENTO_PDF_URL = '/docs/regolamento-fantalaghee-2627.pdf';

/** Sottotitolo della lega, usato nell'header e nei metadati */
export const LEAGUE_TAGLINE = 'Il Fantacalcio del Lario';

export function getSeason(slug?: string | null): SeasonConfig {
    if (slug && SEASONS[slug]) return SEASONS[slug];
    return SEASONS[CURRENT_SEASON];
}

/**
 * Id stagione Lega Serie A (solo il segmento corto), dalla più recente.
 * Serve alle foto giocatore: Lega pubblica le facce della stagione nuova in
 * ritardo, e quelle dell'anno prima restano online con lo stesso playerId.
 */
export function serieASeasonShortIds(preferred?: string | null): string[] {
    const corto = (raw?: string | null) => {
        if (!raw) return '';
        const decoded = raw.includes('%') ? decodeURIComponent(raw) : raw;
        return decoded.includes('::') ? decoded.split('::').pop() || decoded : decoded;
    };
    const out: string[] = [];
    const push = (raw?: string | null) => {
        const id = corto(raw);
        if (id && !out.includes(id)) out.push(id);
    };
    push(preferred);
    Object.values(SEASONS).forEach((s) => push(s.serieASeasonId));
    return out;
}
