/**
 * Orologio partita Lega SDP.
 *
 * L'elenco match 2026/27 espone `status` / `phase` / `time` / `additionalTime`.
 * Non esiste `matchStatus`. Se si guarda solo quello, una partita in corso
 * con il punteggio già valorizzato viene mostrata come finita.
 */

export type MatchClock = {
    isLive: boolean;
    isFinished: boolean;
    isUpcoming: boolean;
    minute: number | null;
    extra: number;
    label: string | null;
};

function token(v: unknown): string {
    return String(v ?? "")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");
}

function bag(m: any): string {
    return [m?.status, m?.matchStatus, m?.providerStatus, m?.phase]
        .map(token)
        .filter(Boolean)
        .join(" ");
}

const FINISHED_RE =
    /\b(FINISHED|PLAYED|FULL_TIME|COMPLETED|ENDED|POST_MATCH|ABANDONED|CANCELLED|CANCELED|POSTPONED|AWARDED)\b/;
const PRE_RE = /\b(UPCOMING|SCHEDULED|FIXTURE|PRE_MATCH|NOT_STARTED)\b/;
const LIVE_RE =
    /\b(LIVE|PLAYING|IN_PLAY|INPLAY|FIRST_HALF|SECOND_HALF|HALF_TIME|HALFTIME|HALF_TIME_BREAK|HALFTIMEBREAK|EXTRA_TIME|EXTRA_FIRST|EXTRA_SECOND|PENALTIES|PENALTY|END_FIRST_HALF|ENDFIRSTHALF)\b/;
const INTERVAL_RE = /\b(HALF_TIME|HALFTIME|HALF_TIME_BREAK|HALFTIMEBREAK)\b/;

function readMinute(m: any): { minute: number | null; extra: number } {
    const raw = Number(m?.time);
    const extra = Number(m?.additionalTime) || 0;
    const minute = Number.isFinite(raw) && raw > 0 ? raw : null;
    return { minute, extra };
}

export function matchClock(m: any): MatchClock {
    const text = bag(m);
    const { minute, extra } = readMinute(m);

    const isFinished = FINISHED_RE.test(text);
    const isUpcoming = !isFinished && PRE_RE.test(text);
    let isLive = !isFinished && !isUpcoming && LIVE_RE.test(text);

    // Se Lega manda un status nuovo, il minuto è comunque l'orologio vero.
    if (!isFinished && !isUpcoming && !isLive && minute != null && minute < 90) {
        isLive = true;
    }
    if (!isFinished && !isUpcoming && !isLive && minute === 90 && extra > 0 && !FINISHED_RE.test(text)) {
        isLive = true;
    }

    let label: string | null = null;
    if (isLive) {
        if (INTERVAL_RE.test(text)) label = "INT";
        else if (minute != null && extra > 0 && (minute === 45 || minute === 90)) label = `${minute}+${extra}'`;
        else if (minute != null) label = `${minute}'`;
        else label = "LIVE";
    }

    return { isLive, isFinished, isUpcoming, minute, extra, label };
}

export function isLiveMatch(m: any): boolean {
    return matchClock(m).isLive;
}

/** Campi orologio/punteggio da copiare dall'header al fixture della card. */
export function clockFields(h: any): Record<string, unknown> {
    if (!h) return {};
    return {
        status: h.status,
        matchStatus: h.matchStatus,
        providerStatus: h.providerStatus,
        phase: h.phase,
        time: h.time,
        additionalTime: h.additionalTime,
        providerHomeScore: h.providerHomeScore,
        providerAwayScore: h.providerAwayScore,
        homeScorePush: h.homeScorePush,
        awayScorePush: h.awayScorePush,
    };
}
