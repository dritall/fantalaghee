/**
 * Normalizzazione dei dati partita di Lega Serie A.
 *
 * L'API SDP restituisce le stesse informazioni in forme diverse a seconda
 * dell'endpoint e del momento della stagione: le statistiche a volte sono un
 * array di `{statsId, statsValue}`, a volte un oggetto con chiavi in camelCase,
 * a volte stanno su `playerstats` invece che dentro la formazione; le foto sono
 * nascoste in chiavi il cui *nome* contiene l'URL.
 *
 * Qui quella confusione viene risolta una volta sola, lato server, così il
 * client riceve una struttura stabile e non deve tirare a indovinare le chiavi.
 */

export type NormalizedEvent = {
    type: string;
    /** famiglia dell'evento, per decidere icona e trattamento */
    kind: 'goal' | 'own-goal' | 'penalty-goal' | 'penalty-missed' | 'yellow' | 'red' | 'sub' | 'var' | 'other';
    minute: number;
    extra: number;
    label: string;
    side: 'home' | 'away';
    playerId: string | null;
    player: string;
    /** per le sostituzioni: chi esce */
    playerOut?: string | null;
    assist?: string | null;
};

export type NormalizedPlayer = {
    id: string;
    name: string;
    fullName: string;
    number: number | null;
    /** 1 portiere, 2 difensore, 3 centrocampista, 4 attaccante */
    role: number;
    roleLabel: string;
    position: string | null;
    starter: boolean;
    captain: boolean;
    /** coordinate tattiche 0..1 già normalizzate (x da sinistra, y dalla propria porta) */
    x: number | null;
    y: number | null;
    photo: string | null;
    stats: Record<string, number | string>;
    goals: number;
    ownGoals: number;
    yellow: boolean;
    red: boolean;
    subbedIn: number | null;
    subbedOut: number | null;
    minutes: number | null;
    rating: number | null;
};

export type NormalizedTeam = {
    id: string | null;
    name: string;
    logo: string | null;
    formation: string | null;
    coach: string | null;
    starters: NormalizedPlayer[];
    bench: NormalizedPlayer[];
};

export type NormalizedMatch = {
    home: NormalizedTeam;
    away: NormalizedTeam;
    events: NormalizedEvent[];
    hasLineups: boolean;
};

const ROLE_LABELS: Record<number, string> = { 1: 'Portiere', 2: 'Difensore', 3: 'Centrocampista', 4: 'Attaccante' };

const MEDIA_BASE = 'https://media-sdp.legaseriea.it';

/** Chiave fissa della libreria foto di Lega, uguale per tutte le stagioni. */
const PLAYER_IMAGES_KEY = 'ec93b94f74294dc98ab5bcfd67fc0d88';

export const shortId = (raw: any): string => {
    if (raw == null) return '';
    const s = String(raw);
    return s.includes('::') ? s.split('::').pop() || s : s;
};

/** Nome breve da mostrare sulla maglia / sul campo. */
export function playerName(p: any): string {
    if (!p) return 'Giocatore';
    const src = p.player || p;
    let name: string =
        src.displayName || src.mediaLastName || src.shirtName || src.shortName || src.officialName || src.name || '';

    name = String(name).replace(/\.{2,}/g, '').trim();
    // "V. Carboni" -> "Carboni"
    name = name.replace(/^[A-Z]\.\s*/, '').trim();

    if (!name) return 'Giocatore';
    if (name.length > 18 && name.includes(' ')) {
        const parts = name.split(' ');
        name = parts[parts.length - 1];
    }
    return name;
}

function fullPlayerName(p: any): string {
    const src = p?.player || p || {};
    return String(src.officialName || src.name || src.displayName || src.shortName || playerName(p)).trim();
}

/**
 * Ricava l'URL della foto giocatore.
 *
 * L'API a volte mette il percorso nel *valore*, a volte nel *nome della chiave*
 * (es. `playerImagehomeleft/playerImages/....webp`). Se non troviamo niente
 * costruiamo l'URL con lo schema noto: basta stagione, squadra e giocatore.
 */
export function playerPhoto(p: any, seasonId?: string, teamId?: string, side: 'home' | 'away' = 'home'): string | null {
    if (!p) return null;

    // Le immagini di Lega rispondono solo a chi dichiara di arrivare dal loro
    // sito, quindi non si possono mettere direttamente in un <img>: passano
    // dal ponte /api/lega-image, che rifà la richiesta con le intestazioni
    // giuste.
    const proxied = (absolute: string) => `/api/lega-image?src=${encodeURIComponent(absolute)}`;
    const absolutize = (v: string) =>
        proxied(v.startsWith('http') ? v : `${MEDIA_BASE}${v.startsWith('/') ? '' : '/'}${v}`);

    const prefixes = ['playerimagehome', 'playerimageaway'];
    for (const key of Object.keys(p)) {
        const lower = key.toLowerCase();
        if (!prefixes.some((pre) => lower.startsWith(pre))) continue;

        const value = p[key];
        if (typeof value === 'string' && value.includes('.webp')) return absolutize(value);
        // percorso incorporato nel nome della chiave
        if (lower.includes('.webp')) {
            const idx = key.toLowerCase().indexOf('playerimages');
            if (idx > -1) return absolutize(key.slice(idx));
        }
    }

    for (const field of ['image', 'photo', 'pictureUrl', 'imageUrl', 'playerImage']) {
        const v = p[field] ?? p.details?.[field] ?? p.player?.[field];
        if (typeof v === 'string' && v.includes('.webp')) return absolutize(v);
    }

    const pid = shortId(p.playerId || p.id || p.player?.playerId);
    const sid = shortId(seasonId);
    const tid = shortId(teamId);
    // Schema verificato su un URL reale servito da legaseriea.it:
    // /playerImages/{costante}/{stagione}/{squadra}/{lato}/{giocatore}_left.webp
    // L'underscore prima di "left" mancava, e senza quello ogni foto era un 404.
    if (pid && sid && tid) {
        return proxied(
            `${MEDIA_BASE}/playerImages/${PLAYER_IMAGES_KEY}/${sid}/${tid}/${side}/${pid}_left.webp`
        );
    }
    return null;
}

/** Riduce a un oggetto piatto le tre forme in cui arrivano le statistiche. */
function flattenStats(raw: any): Record<string, number | string> {
    const out: Record<string, number | string> = {};
    if (!raw) return out;

    const put = (k: any, v: any) => {
        if (k == null || v == null || v === '') return;
        const key = String(k).toLowerCase().replace(/[_-]/g, '');
        const num = typeof v === 'number' ? v : Number(String(v).replace(',', '.').replace('%', ''));
        out[key] = Number.isFinite(num) ? num : v;
    };

    if (Array.isArray(raw)) {
        raw.forEach((s: any) => put(s?.statsId ?? s?.id ?? s?.name, s?.statsValue ?? s?.value));
    } else if (typeof raw === 'object') {
        Object.entries(raw).forEach(([k, v]) => {
            if (v != null && typeof v === 'object') return;
            put(k, v);
        });
    }
    return out;
}

/** Primo valore disponibile fra più alias della stessa statistica. */
export function statOf(stats: Record<string, any>, aliases: string[]): number | string | null {
    for (const a of aliases) {
        const key = a.toLowerCase().replace(/[_-]/g, '');
        const v = stats[key];
        if (v !== undefined && v !== null && v !== '') return v;
    }
    return null;
}

function numStat(stats: Record<string, any>, aliases: string[]): number | null {
    const v = statOf(stats, aliases);
    if (v == null) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}

function eventKind(type: string): NormalizedEvent['kind'] {
    const t = (type || '').toLowerCase();
    if (t.includes('own')) return 'own-goal';
    if (t.includes('penalty') && t.includes('miss')) return 'penalty-missed';
    if (t.includes('penalty') && t.includes('goal')) return 'penalty-goal';
    if (t.includes('goal')) return 'goal';
    if (t.includes('yellow')) return 'yellow';
    if (t.includes('red')) return 'red';
    if (t.includes('sub')) return 'sub';
    if (t.includes('var')) return 'var';
    return 'other';
}

function minuteLabel(minute: number, extra: number): string {
    if (!minute) return '';
    return extra > 0 ? `${minute}+${extra}'` : `${minute}'`;
}

/**
 * Coordinate tattiche normalizzate.
 *
 * Quando l'API le fornisce (`tacticalXPosition`/`tacticalYPosition`) le usiamo,
 * altrimenti le ricaviamo dal ruolo distribuendo il reparto sulla larghezza.
 * In uscita: x = 0 sinistra → 1 destra, y = 0 porta propria → 1 porta avversaria.
 */
function tacticalPosition(p: any, indexInRole: number, totalInRole: number): { x: number | null; y: number | null } {
    const rawX = p?.tacticalXPosition;
    const rawY = p?.tacticalYPosition;
    if (typeof rawX === 'number' && typeof rawY === 'number') {
        return { x: Math.min(1, Math.max(0, rawX)), y: Math.min(1, Math.max(0, rawY)) };
    }

    const role = Number(p?.role) || 3;
    const depth: Record<number, number> = { 1: 0.06, 2: 0.28, 3: 0.55, 4: 0.82 };
    const y = depth[role] ?? 0.55;
    const x = totalInRole > 1 ? 0.12 + (0.76 / (totalInRole - 1)) * indexInRole : 0.5;
    return { x, y };
}

function normalizePlayers(
    list: any[],
    starter: boolean,
    ctx: { seasonId?: string; teamId?: string; side: 'home' | 'away'; playerStats: Map<string, any> }
): NormalizedPlayer[] {
    const byRole: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
    list.forEach((p) => {
        const role = Number(p?.role);
        (byRole[role] || byRole[3]).push(p);
    });

    return list.map((p) => {
        const id = shortId(p?.playerId || p?.id);
        const role = Number(p?.role) || 3;
        const group = byRole[role] || byRole[3];
        const idx = group.indexOf(p);
        const { x, y } = starter ? tacticalPosition(p, Math.max(0, idx), group.length) : { x: null, y: null };

        // le statistiche possono stare sul giocatore o nel blocco playerstats
        const stats = { ...flattenStats(ctx.playerStats.get(id)), ...flattenStats(p?.stats) };

        const events: any[] = Array.isArray(p?.events) ? p.events : [];
        const evOf = (pred: (t: string) => boolean) => events.filter((e) => pred(String(e?.type || '').toLowerCase()));
        const minuteOf = (e: any) => Number(e?.time ?? e?.minute) || null;

        const goalEvents = evOf((t) => t.includes('goal') && !t.includes('own'));
        const ownGoalEvents = evOf((t) => t.includes('own'));
        const subIn = evOf((t) => t.includes('substitution-in') || t === 'subon')[0];
        const subOut = evOf((t) => t.includes('substitution-out') || t === 'suboff')[0];

        const statGoals = numStat(stats, ['goals', 'goal']);

        return {
            id,
            name: playerName(p),
            fullName: fullPlayerName(p),
            number: Number(p?.jerseyNumber ?? p?.shirtNumber) || null,
            role,
            roleLabel: ROLE_LABELS[role] || 'Giocatore',
            position: p?.position || null,
            starter,
            captain: !!(p?.captain || p?.isCaptain),
            x,
            y,
            photo: playerPhoto(p, ctx.seasonId, ctx.teamId, ctx.side),
            stats,
            goals: goalEvents.length || statGoals || 0,
            ownGoals: ownGoalEvents.length,
            yellow: evOf((t) => t.includes('yellow')).length > 0 || !!numStat(stats, ['yellowcard', 'totalyellowcard']),
            red: evOf((t) => t.includes('red')).length > 0 || !!numStat(stats, ['redcard', 'totalredcard']),
            subbedIn: subIn ? minuteOf(subIn) : null,
            subbedOut: subOut ? minuteOf(subOut) : null,
            minutes: numStat(stats, ['minsplayed', 'minutesplayed', 'minutes']),
            rating: numStat(stats, ['matchrating', 'rating']),
        };
    });
}

function teamName(t: any, fallback: string): string {
    return t?.shortName || t?.officialName || t?.name || fallback;
}

/** Estrae gli eventi dalla timeline, unendo entrata e uscita in una sola sostituzione. */
function normalizeEvents(raw: any, homeTeamId: string, fallbackPlayers: { home: any[]; away: any[] }): NormalizedEvent[] {
    const list: any[] = raw?.events?.events || raw?.events || [];
    const collected: NormalizedEvent[] = [];

    const push = (e: any, side: 'home' | 'away', playerLabel: string) => {
        const minute = Number(e?.time ?? e?.minute) || 0;
        const extra = Number(e?.additionalTime) || 0;
        const type = String(e?.type || '').toLowerCase();
        collected.push({
            type,
            kind: eventKind(type),
            minute,
            extra,
            label: minuteLabel(minute, extra),
            side,
            playerId: shortId(e?.playerId || e?.player?.playerId) || null,
            player: playerLabel,
            playerOut: e?.subOff ? playerName(e.subOff) : e?.subOffPlayer ? playerName(e.subOffPlayer) : null,
            assist: e?.assist
                ? playerName(e.assist)
                : e?.relatedPlayerName && !type.includes('sub')
                  ? playerName({ shortName: e.relatedPlayerName })
                  : null,
        });
    };

    if (Array.isArray(list) && list.length > 0) {
        list.forEach((e) => {
            const side: 'home' | 'away' = shortId(e?.teamId) === shortId(homeTeamId) ? 'home' : 'away';
            push(e, side, playerName(e));
        });
    } else {
        // niente timeline: la ricostruiamo dagli eventi attaccati ai giocatori
        (['home', 'away'] as const).forEach((side) => {
            fallbackPlayers[side].forEach((p) => {
                (p?.events || []).forEach((e: any) => {
                    push(
                        { ...e, subOffPlayer: e?.subOffPlayer, relatedPlayerName: e?.relatedPlayerName },
                        side,
                        playerName(p)
                    );
                });
            });
        });
    }

    // fonde substitution-in / substitution-out dello stesso minuto e squadra
    const merged: NormalizedEvent[] = [];
    const used = new Set<number>();
    const sorted = collected.sort((a, b) => a.minute - b.minute || a.extra - b.extra);

    sorted.forEach((e, i) => {
        if (used.has(i)) return;
        if (e.type.includes('substitution-in') || e.type === 'subon') {
            const j = sorted.findIndex(
                (o, oi) =>
                    oi !== i &&
                    !used.has(oi) &&
                    (o.type.includes('substitution-out') || o.type === 'suboff') &&
                    o.minute === e.minute &&
                    o.side === e.side
            );
            if (j > -1) {
                used.add(j);
                merged.push({ ...e, kind: 'sub', playerOut: sorted[j].player });
                used.add(i);
                return;
            }
        }
        if (e.type.includes('substitution-out') || e.type === 'suboff') {
            const j = sorted.findIndex(
                (o, oi) =>
                    oi !== i &&
                    !used.has(oi) &&
                    (o.type.includes('substitution-in') || o.type === 'subon') &&
                    o.minute === e.minute &&
                    o.side === e.side
            );
            if (j > -1) {
                used.add(j);
                merged.push({ ...sorted[j], kind: 'sub', playerOut: e.player });
                used.add(i);
                return;
            }
        }
        used.add(i);
        merged.push(e);
    });

    return merged.sort((a, b) => a.minute - b.minute || a.extra - b.extra);
}

/** Punto d'ingresso: dai blocchi grezzi dell'API alla struttura usata dal sito. */
export function normalizeMatch(raw: {
    header?: any;
    lineups?: any;
    events?: any;
    playerStats?: any;
}): NormalizedMatch {
    const header = raw?.header || {};
    const lineups = raw?.lineups || {};
    const seasonId = header?.seasonId;

    const homeTeamRaw = header?.homeTeam || {};
    const awayTeamRaw = header?.awayTeam || {};
    const homeTeamId = homeTeamRaw?.teamId || homeTeamRaw?.id;
    const awayTeamId = awayTeamRaw?.teamId || awayTeamRaw?.id;

    // indice delle statistiche per giocatore, così la ricerca è O(1)
    const playerStats = new Map<string, any>();
    (raw?.playerStats?.players || raw?.playerStats || []).forEach?.((entry: any) => {
        const id = shortId(entry?.playerId || entry?.id);
        if (id) playerStats.set(id, entry?.stats ?? entry);
    });

    const build = (side: 'home' | 'away', teamRaw: any, teamId: any, fallbackName: string): NormalizedTeam => {
        const block = lineups?.[side] || {};
        const ctx = { seasonId, teamId, side, playerStats };
        return {
            id: shortId(teamId) || null,
            name: teamName(teamRaw, fallbackName),
            logo: teamRaw?.imagery?.teamLogo || teamRaw?.imagery?.teamLogoLight || null,
            formation: block?.formation || block?.tacticalModule || null,
            coach: block?.coach ? playerName({ player: block.coach }) : null,
            starters: normalizePlayers(block?.fielded || [], true, ctx),
            bench: normalizePlayers(block?.benched || [], false, ctx),
        };
    };

    const home = build('home', homeTeamRaw, homeTeamId, 'Casa');
    const away = build('away', awayTeamRaw, awayTeamId, 'Ospite');

    const events = normalizeEvents(raw?.events, homeTeamId, {
        home: [...(lineups?.home?.fielded || []), ...(lineups?.home?.benched || [])],
        away: [...(lineups?.away?.fielded || []), ...(lineups?.away?.benched || [])],
    });

    return {
        home,
        away,
        events,
        hasLineups: home.starters.length > 0 && away.starters.length > 0,
    };
}
