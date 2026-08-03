"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { statOf, type NormalizedPlayer } from "@/lib/lega-normalize";
import { cn } from "@/lib/utils";

type StatDef = { label: string; keys: string[]; percent?: boolean };

const GROUPS: { title: string; stats: StatDef[] }[] = [
    {
        title: "Attacco",
        stats: [
            { label: "Gol", keys: ["goals", "goal"] },
            { label: "Tiri totali", keys: ["totalscoringatt", "shots", "totalshots"] },
            { label: "Tiri in porta", keys: ["ontargetscoringatt", "shotsontarget"] },
            { label: "Tiri dentro area", keys: ["attemptsibox", "shotinsidebox"] },
            { label: "Tiri fuori area", keys: ["attemptsobox", "shotoutsidebox"] },
            { label: "xG", keys: ["expectedgoals", "expected-goals"] },
            { label: "Assist", keys: ["goalassist", "assists", "assist"] },
            { label: "Occasioni create", keys: ["bigchancecreated", "chancescreated", "keypass", "keypasses"] },
            { label: "Tocchi area avversaria", keys: ["touchesinoppbox", "touchesinopponentbox"] },
            { label: "Fuorigioco", keys: ["totaloffside", "offsides", "offside"] },
        ],
    },
    {
        title: "Passaggi",
        stats: [
            { label: "Passaggi totali", keys: ["totalpass", "totalpasses", "passes"] },
            { label: "Passaggi riusciti", keys: ["accuratepass", "accuratepasses"] },
            { label: "Precisione", keys: ["accuratepassperc", "passingaccuracyperc", "passaccuracy"], percent: true },
            { label: "Passaggi in avanti", keys: ["fwdpass", "forwardpass", "accurateforwardpass"] },
            { label: "Passaggi chiave", keys: ["keypass", "keypasses", "totalattassist"] },
            { label: "Cross", keys: ["totalcross", "crosses"] },
            { label: "Cross riusciti", keys: ["accuratecross", "crossessuccessful"] },
        ],
    },
    {
        title: "Difesa",
        stats: [
            { label: "Contrasti", keys: ["totaltackle", "tackles", "tackle"] },
            { label: "Contrasti riusciti", keys: ["wontackle", "tacklessuccessful", "tackleswon"] },
            { label: "Intercetti", keys: ["interception", "interceptions", "interceptionwon"] },
            { label: "Spazzate", keys: ["effectiveclearance", "clearances", "totalclearance"] },
            { label: "Tiri rimpallati", keys: ["blockedscoringatt", "blockedshots"] },
            { label: "Duelli aerei vinti", keys: ["aerialwon", "aerialswon", "aerialduelswon"] },
            { label: "Palle recuperate", keys: ["ballrecovery", "ballrecoveries", "recovery"] },
            { label: "Parate", keys: ["saves", "savestotal", "totalsaves"] },
        ],
    },
    {
        title: "Duelli e disciplina",
        stats: [
            { label: "Duelli vinti", keys: ["woncontest", "duelswon", "duelwon"] },
            { label: "Duelli aerei vinti", keys: ["aerialwon", "aerialswon"] },
            { label: "Dribbling riusciti", keys: ["succdribblingperc", "dribblingsuccessful"] },
            { label: "Falli commessi", keys: ["fouls", "foulscommitted", "foulsconceded"] },
            { label: "Falli subiti", keys: ["wasfouled", "foulssuffered", "foulswon", "fkfoulwon"] },
            { label: "Palle perse", keys: ["posslostall", "possessionlost", "turnovers"] },
            { label: "Tocchi", keys: ["touches"] },
        ],
    },
];

function StatGroup({ title, stats, source }: { title: string; stats: StatDef[]; source: Record<string, any> }) {
    const rows = stats
        .map((s) => {
            const raw = statOf(source, s.keys);
            if (raw == null) return null;
            const n = typeof raw === "number" ? raw : Number(raw);
            if (Number.isFinite(n) && n === 0) return null;
            return { label: s.label, value: s.percent && !String(raw).includes("%") ? `${raw}%` : String(raw) };
        })
        .filter(Boolean) as { label: string; value: string }[];

    if (rows.length === 0) return null;

    return (
        <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)] mb-2">{title}</h4>
            <dl className="rounded-none border border-[color:var(--filo)] bg-[color:var(--velo)] overflow-hidden">
                {rows.map((r) => (
                    <div
                        key={r.label}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-[color:var(--filo)] last:border-0"
                    >
                        <dt className="text-xs text-[color:var(--fumo)]">{r.label}</dt>
                        <dd className="text-sm font-black text-[color:var(--calce)] tabular-nums">{r.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function HeroStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex-1 rounded-none border border-[color:var(--filo)] bg-[color:var(--velo)] py-2.5 text-center">
            <span
                className={cn(
                    "block font-score text-2xl font-bold tabular-nums leading-none",
                    accent ? "text-[color:var(--lario)]" : "text-[color:var(--calce)]"
                )}
            >
                {value}
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[color:var(--fumo)] mt-1.5">{label}</span>
        </div>
    );
}

/**
 * Scheda del singolo giocatore.
 *
 * Le statistiche della partita arrivano già normalizzate e sono sempre
 * disponibili; la scheda di stagione viene chiesta all'API solo all'apertura, e
 * se quella stagione non la espone il pannello semplicemente non compare.
 */
export function PlayerSheet({
    player,
    teamName,
    accent,
    stagione,
    onClose,
}: {
    player: NormalizedPlayer | null;
    teamName: string;
    accent: string;
    stagione: string;
    onClose: () => void;
}) {
    const [season, setSeason] = useState<any>(null);
    const [loadingSeason, setLoadingSeason] = useState(false);
    const [photoFailed, setPhotoFailed] = useState(false);

    useEffect(() => {
        setPhotoFailed(false);
        setSeason(null);
        if (!player?.id) return;

        let alive = true;
        setLoadingSeason(true);
        fetch(`/api/football?endpoint=player&id=${encodeURIComponent(player.id)}&stagione=${stagione}`)
            .then((r) => r.json())
            .then((json) => {
                if (alive && json?.ok) setSeason(json.data);
            })
            .catch(() => null)
            .finally(() => alive && setLoadingSeason(false));

        return () => {
            alive = false;
        };
    }, [player?.id, stagione]);

    const seasonStats = season?.seasonStats
        ? Object.fromEntries(
              (season.seasonStats?.stats || season.seasonStats || [])
                  .map?.((s: any) => [String(s?.statsId || "").toLowerCase().replace(/[_-]/g, ""), s?.statsValue]) || []
          )
        : null;

    if (!player) return null;

    return (
        // Dialog annidato dentro quello della partita: Radix lo porta in un
        // portale sul body, quindi resta sopra al modale padre e riceve i
        // click — cosa che un semplice `position: fixed` dentro la pagina non
        // garantisce, perché qualunque antenato con transform o filter lo
        // intrappolerebbe nel proprio stacking context.
        <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[120] bg-[color:var(--pece)]/85 backdrop-blur-md" />
                <Dialog.Content
                    aria-describedby={undefined}
                    className="fixed z-[121] inset-x-0 bottom-0 md:inset-0 md:m-auto
                                   w-full md:w-[420px] h-fit max-h-[88vh] md:max-h-[80vh] flex flex-col
                                   rounded-t-[2rem] md:rounded-none border border-[color:var(--filo)] bg-[color:var(--fondale)]
                                   shadow-[0_-20px_60px_var(--ombra)] md:shadow-[0_30px_80px_var(--ombra)]
                                   overflow-hidden animate-fade-up focus:outline-none"
                >
                    <Dialog.Title className="sr-only">{player.fullName}</Dialog.Title>

                    {/* maniglia da foglio scorrevole, solo su telefono */}
                    <span className="md:hidden mx-auto mt-2.5 h-1 w-10 rounded-full bg-[color:var(--filo-alto)] shrink-0" />

                        <header className="relative flex items-center gap-4 p-5 pb-4 shrink-0">
                            <span
                                className="absolute inset-x-0 top-0 h-24 opacity-40 pointer-events-none"
                                style={{ background: `radial-gradient(circle at 20% 0%, ${accent}55, transparent 70%)` }}
                            />

                            {player.photo && !photoFailed ? (
                                <img
                                    src={player.photo}
                                    alt=""
                                    onError={() => setPhotoFailed(true)}
                                    className="relative w-16 h-16 rounded-none object-cover object-top border-2 bg-[color:var(--secca)] shrink-0"
                                    style={{ borderColor: accent }}
                                />
                            ) : (
                                <span
                                    className="relative w-16 h-16 rounded-none border-2 bg-[color:var(--secca)] shrink-0 flex items-center justify-center"
                                    style={{ borderColor: accent }}
                                >
                                    <span className="text-xl font-black text-[color:var(--calce)]/80 tabular-nums">
                                        {player.number ?? "–"}
                                    </span>
                                </span>
                            )}

                            <div className="relative flex-1 min-w-0">
                                <p className="text-base font-black text-[color:var(--calce)] leading-tight truncate">{player.fullName}</p>
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--fumo)] mt-1 truncate">
                                    {player.number != null && `#${player.number} · `}
                                    {player.roleLabel}
                                </p>
                                <p className="text-[11px] text-[color:var(--fumo)] truncate">{teamName}</p>
                            </div>

                            <button
                                onClick={onClose}
                                aria-label="Chiudi"
                                className="relative w-9 h-9 rounded-full border border-[color:var(--filo)] bg-[color:var(--velo-alto)] flex items-center justify-center
                                           text-[color:var(--calce)]/80 hover:text-[color:var(--calce)] hover:bg-[color:var(--velo-alto)] transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-8 space-y-5">
                            {/* numeri di sintesi della partita */}
                            <div className="flex gap-2">
                                <HeroStat label="Minuti" value={player.minutes != null ? `${player.minutes}'` : "–"} />
                                <HeroStat
                                    label="Voto"
                                    value={player.rating != null ? player.rating.toFixed(1) : "–"}
                                    accent
                                />
                                <HeroStat label="Gol" value={String(player.goals)} />
                            </div>

                            {(player.subbedIn || player.subbedOut || player.yellow || player.red) && (
                                <div className="flex flex-wrap gap-1.5">
                                    {player.subbedIn && (
                                        <span className="rounded-none bg-emerald-500/12 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                                            Entrato {player.subbedIn}&apos;
                                        </span>
                                    )}
                                    {player.subbedOut && (
                                        <span className="rounded-none bg-red-500/12 border border-red-500/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-600">
                                            Uscito {player.subbedOut}&apos;
                                        </span>
                                    )}
                                    {player.yellow && (
                                        <span className="rounded-none bg-yellow-400/15 border border-yellow-500/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-700">
                                            Ammonito
                                        </span>
                                    )}
                                    {player.red && (
                                        <span className="rounded-none bg-red-500/15 border border-red-500/35 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-600">
                                            Espulso
                                        </span>
                                    )}
                                </div>
                            )}

                            {GROUPS.map((g) => (
                                <StatGroup key={g.title} title={g.title} stats={g.stats} source={player.stats} />
                            ))}

                            {Object.keys(player.stats).length === 0 && (
                                <p className="py-6 text-center text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--fumo)]">
                                    Statistiche individuali non disponibili
                                </p>
                            )}

                            {loadingSeason && (
                                <div className="flex items-center justify-center gap-2 py-3 text-[color:var(--fumo)]">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                                        Cerco i dati di stagione…
                                    </span>
                                </div>
                            )}

                            {seasonStats && Object.keys(seasonStats).length > 0 && (
                                <div className="pt-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="h-px flex-1 bg-[color:var(--velo-alto)]" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--fumo)]">
                                            In stagione
                                        </span>
                                        <span className="h-px flex-1 bg-[color:var(--velo-alto)]" />
                                    </div>
                                    {GROUPS.map((g) => (
                                        <div key={g.title} className="mb-4 last:mb-0">
                                            <StatGroup title={g.title} stats={g.stats} source={seasonStats} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}