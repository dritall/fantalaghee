/**
 * Colori delle squadre di Serie A, presi dagli stemmi.
 *
 * Servono a distinguere le due squadre in ogni schedina: campo, statistiche,
 * eventi, momento. Due vincoli rendono la cosa meno banale di una mappa:
 *
 * 1. Il sito ha il fondo notturno. Il nero della Juventus o il granata del
 *    Torino su #080c20 sono illeggibili, quindi ogni colore viene schiarito
 *    fino a superare una soglia di luminosità.
 * 2. In Serie A i colori si somigliano parecchio — sei squadre sul blu, sei
 *    sul rosso, quattro sul giallo. Inter contro Atalanta con due blu quasi
 *    identici renderebbe le barre delle statistiche indistinguibili, quindi
 *    quando i due colori sono troppo vicini il secondo viene sostituito.
 */

export type TeamPalette = { primary: string; secondary: string };

/** Fondo su cui i colori devono restare leggibili. */
const DARK_BG_LUMINANCE = 0.045;

/** Colori di riserva, scelti perché ben distinti fra loro e dal fondo. */
const FALLBACKS = ['#f59e0b', '#22d3ee', '#a78bfa', '#34d399', '#fb7185', '#e5e7eb'];

/**
 * Squadre di Serie A. `primary` è il colore dominante dello stemma,
 * `secondary` quello di appoggio: viene usato quando il primario finisce
 * troppo vicino a quello dell'avversaria.
 */
const TEAMS: Record<string, TeamPalette> = {
    inter: { primary: '#0068A8', secondary: '#1D1D1B' },
    milan: { primary: '#FB090B', secondary: '#1D1D1B' },
    juventus: { primary: '#D9DDE3', secondary: '#1D1D1B' },
    napoli: { primary: '#12A0D7', secondary: '#003C82' },
    roma: { primary: '#970A2C', secondary: '#F0BC42' },
    lazio: { primary: '#87D8F7', secondary: '#0B5D33' },
    atalanta: { primary: '#1E71B8', secondary: '#1D1D1B' },
    fiorentina: { primary: '#59309C', secondary: '#C9A227' },
    bologna: { primary: '#A81920', secondary: '#1A2F5B' },
    torino: { primary: '#881600', secondary: '#C9A227' },
    genoa: { primary: '#A21C24', secondary: '#0B3C7B' },
    udinese: { primary: '#D9DDE3', secondary: '#1D1D1B' },
    lecce: { primary: '#FFE500', secondary: '#C8102E' },
    verona: { primary: '#FFD400', secondary: '#0B3C7B' },
    cagliari: { primary: '#B5132D', secondary: '#0B3C7B' },
    parma: { primary: '#FFD700', secondary: '#0B3C7B' },
    sassuolo: { primary: '#00A752', secondary: '#1D1D1B' },
    como: { primary: '#005AA7', secondary: '#D9DDE3' },
    pisa: { primary: '#00519E', secondary: '#1D1D1B' },
    monza: { primary: '#E30613', secondary: '#1D1D1B' },
    empoli: { primary: '#00579C', secondary: '#D9DDE3' },
    venezia: { primary: '#F58220', secondary: '#0B5D33' },
    cremonese: { primary: '#E30613', secondary: '#8A8D8F' },
    frosinone: { primary: '#FFD700', secondary: '#0B3C7B' },
    salernitana: { primary: '#7A1E2D', secondary: '#D9DDE3' },
    sampdoria: { primary: '#1B449C', secondary: '#D9DDE3' },
    palermo: { primary: '#F19DC0', secondary: '#1D1D1B' },
    spezia: { primary: '#D9DDE3', secondary: '#1D1D1B' },
    catanzaro: { primary: '#C8102E', secondary: '#FFD700' },
};

/* ------------------------------------------------------------ conversioni */

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return [
        parseInt(full.slice(0, 2), 16),
        parseInt(full.slice(2, 4), 16),
        parseInt(full.slice(4, 6), 16),
    ];
}

function rgbToHex(r: number, g: number, b: number): string {
    const to = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`;
}

/** Luminanza relativa secondo WCAG: serve a misurare il contrasto vero. */
export function luminance(hex: string): number {
    const [r, g, b] = hexToRgb(hex).map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapporto di contrasto fra due colori (1 = identici, 21 = massimo). */
export function contrast(a: string, b: string): number {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function rgbToHsl(hex: string): [number, number, number] {
    const [r0, g0, b0] = hexToRgb(hex).map((v) => v / 255);
    const max = Math.max(r0, g0, b0);
    const min = Math.min(r0, g0, b0);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    if (max === r0) h = ((g0 - b0) / d + (g0 < b0 ? 6 : 0)) / 6;
    else if (max === g0) h = ((b0 - r0) / d + 2) / 6;
    else h = ((r0 - g0) / d + 4) / 6;
    return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
    const hue = ((h % 360) + 360) % 360 / 360;
    if (s === 0) {
        const v = l * 255;
        return rgbToHex(v, v, v);
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const channel = (t: number) => {
        let tt = t;
        if (tt < 0) tt += 1;
        if (tt > 1) tt -= 1;
        if (tt < 1 / 6) return p + (q - p) * 6 * tt;
        if (tt < 1 / 2) return q;
        if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
        return p;
    };
    return rgbToHex(channel(hue + 1 / 3) * 255, channel(hue) * 255, channel(hue - 1 / 3) * 255);
}

/* -------------------------------------------------------------- leggibilità */

/**
 * Schiarisce un colore finché non stacca abbastanza dal fondo notturno.
 * Alza anche la saturazione dei colori spenti, così restano vivi.
 */
export function readableOnDark(hex: string, minContrast = 4.5): string {
    let [h, s, l] = rgbToHsl(hex);

    // Un colore quasi neutro deve restare neutro: il bianco della Juventus
    // saturato diventerebbe azzurro, cioè un'altra squadra. Sopra la soglia
    // invece conviene ravvivare, perché schiarire spegne sempre un po'.
    if (s > 0.25) s = Math.max(s, 0.62);
    // il nero degli stemmi va schiarito: senza azzerare la tinta residua
    // verrebbe fuori un grigio verdastro invece di un grigio pulito
    else if (s < 0.12) {
        s = 0;
        // e un grigio medio su fondo notturno resta smorto: meglio argento
        l = Math.max(l, 0.78);
    }

    let out = hslToHex(h, s, l);
    let guard = 0;
    while (luminance(out) < DARK_BG_LUMINANCE * minContrast && l < 0.92 && guard < 40) {
        l += 0.03;
        out = hslToHex(h, s, l);
        guard++;
    }
    return out;
}

/** Due colori si distinguono se cambia la tinta o, in mancanza, la luminosità. */
export function areDistinct(a: string, b: string, minHue = 38): boolean {
    const [ha, sa, la] = rgbToHsl(a);
    const [hb, sb, lb] = rgbToHsl(b);

    // se almeno uno è acromatico la tinta non dice niente: conta la luminosità
    if (sa < 0.15 || sb < 0.15) return Math.abs(la - lb) > 0.22 || Math.abs(sa - sb) > 0.35;

    const diff = Math.abs(ha - hb);
    const hueDist = Math.min(diff, 360 - diff);
    return hueDist >= minHue || Math.abs(la - lb) > 0.3;
}

/** Chiave di ricerca: toglie prefissi, suffissi e anni dai nomi ufficiali. */
export function teamKey(name?: string | null): string {
    if (!name) return '';
    return String(name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\b(fc|ac|as|ssc|us|uc|calcio|1907|1908|1909|1913|hellas|sporting club|cfc)\b/g, '')
        .replace(/[^a-z]/g, '')
        .trim();
}

/** Tavolozza della squadra, o null se il nome non è in elenco. */
export function paletteOf(name?: string | null): TeamPalette | null {
    const key = teamKey(name);
    if (!key) return null;
    if (TEAMS[key]) return TEAMS[key];
    // nomi composti tipo "veronahellas": cerchiamo la squadra contenuta
    const hit = Object.keys(TEAMS).find((k) => key.includes(k));
    return hit ? TEAMS[hit] : null;
}

/**
 * Colore di ripiego per una squadra fuori elenco (una neopromossa, una
 * competizione diversa). Deriva dal nome, quindi resta lo stesso a ogni
 * caricamento: meglio un colore arbitrario ma stabile e personale che la
 * stessa coppia di riserva su tutte le partite.
 */
function coloreDaNome(name?: string | null): string {
    const key = teamKey(name) || 'squadra';
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return hslToHex(hash % 360, 0.72, 0.56);
}

/**
 * Colori delle due squadre di una partita, leggibili sul fondo scuro e
 * garantiti diversi fra loro.
 *
 * Se i primari si somigliano prova il secondario dell'ospite, poi quello di
 * casa, e in ultimo pesca dai colori di riserva. Il colore della squadra di
 * casa non viene mai cambiato: è il riferimento.
 */
export function matchColors(homeName?: string | null, awayName?: string | null): { home: string; away: string } {
    const homePal = paletteOf(homeName);
    const awayPal = paletteOf(awayName);

    const home = readableOnDark(homePal?.primary ?? coloreDaNome(homeName));

    const candidates = [
        awayPal?.primary ?? coloreDaNome(awayName),
        awayPal?.secondary,
        ...FALLBACKS,
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
        const away = readableOnDark(candidate);
        if (areDistinct(home, away)) return { home, away };
    }

    // non dovrebbe accadere: l'ultimo di riserva è sempre lontano dagli altri
    return { home, away: readableOnDark(FALLBACKS[FALLBACKS.length - 1]) };
}
