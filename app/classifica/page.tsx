"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Trophy, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { WaitingFirstMatchday } from "@/components/ui/WaitingFirstMatchday";
import { CURRENT_SEASON } from "@/lib/seasons";
import { toNumber, stripDecorations } from "@/lib/numbers";
import { SeasonBanner } from "@/components/ui/SeasonBanner";
import { SeasonPill } from "@/components/ui/SeasonPill";
import { SelettoreGiornata } from "@/components/ui/SelettoreGiornata";

function ClassificaContent() {
    const searchParams = useSearchParams();
    const stagione = searchParams.get("stagione") || CURRENT_SEASON;

    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<"totale" | "giornata">("totale");
    /** giornata scelta nel selettore; null finché non si sceglie, e allora vale l'ultima giocata */
    const [giornataScelta, setGiornataScelta] = useState<number | null>(null);
    const tabellaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/classifica?stagione=${stagione}`);
                if (!res.ok) throw new Error('Failed to fetch data');
                const data = await res.json();
                setLeaderboard(data.classifica || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [stagione]);

    // Scegliere una giornata sul desktop non serve a niente se la colonna resta
    // fuori schermo: la tabella ci scorre sopra da sola.
    useEffect(() => {
        if (giornataScelta === null) return;
        tabellaRef.current
            ?.querySelector(`[data-giornata="${giornataScelta}"]`)
            ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, [giornataScelta]);

    // Le giornate si ricavano dalle colonne che il foglio espone davvero: se
    // una intestazione cambia o ne manca una, la tabella segue il dato invece
    // di mostrare buchi. G1..G38 resta come ripiego finché non arrivano righe.
    const matchdays = (() => {
        const found = new Set<string>();
        leaderboard.forEach((team) => {
            Object.keys(team || {}).forEach((k) => {
                if (/^G\s*\d{1,2}$/i.test(k.trim())) found.add(k);
            });
        });
        if (found.size === 0) return Array.from({ length: 38 }, (_, i) => `G${i + 1}`);
        return Array.from(found).sort(
            (a, b) => parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10)
        );
    })();

    // Ultima giornata giocata: serve un punteggio vero, non una cella
    // riempita da una formula con stringa vuota o uno zero di comodo.
    const lastPlayedMatchday = matchdays.reduce((acc, g) => {
        const played = leaderboard.some((team) => {
            const n = toNumber(team[g]);
            return n !== null && n > 0;
        });
        return played ? g : acc;
    }, matchdays[0]);

    // Miglior punteggio di ogni giornata: serve a evidenziare la casella vincente
    const bestPerMatchday = matchdays.reduce((acc, g) => {
        const values = leaderboard
            .map((team) => toNumber(team[g]))
            .filter((v): v is number => v !== null);
        if (values.length > 0) acc[g] = Math.max(...values);
        return acc;
    }, {} as Record<string, number>);

    // Numeri delle giornate giocate, per il selettore
    const numeriGiocati = matchdays
        .filter((g) => leaderboard.some((team) => {
            const n = toNumber(team[g]);
            return n !== null && n > 0;
        }))
        .map((g) => parseInt(g.replace(/\D/g, ""), 10));

    // Colonna mostrata: quella scelta nel menu, altrimenti l'ultima giocata
    const colonnaGiornata =
        giornataScelta !== null
            ? matchdays.find((g) => parseInt(g.replace(/\D/g, ""), 10) === giornataScelta) ?? lastPlayedMatchday
            : lastPlayedMatchday;

    // Classifica della sola giornata scelta, ordinata per punteggio della giornata
    const giornataBoard = [...leaderboard]
        .map((team) => ({ ...team, _giornataScore: toNumber(team[colonnaGiornata]) ?? 0 }))
        .sort((a, b) => b._giornataScore - a._giornataScore);

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex justify-center items-center p-4">
            <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20 text-red-500 flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8" />
                <span>Errore caricamento: {error}</span>
            </div>
        </div>
    );

    // Stagione non ancora iniziata: nessun dato o tutti i totali a zero
    const isPreSeason = leaderboard.length === 0 || leaderboard.every((t) => !toNumber(t.Generale));

    if (isPreSeason) return (
        <main className="min-h-screen pt-24 pb-8 px-4 md:px-8 flex flex-col relative">
            <div className="relative z-30 flex flex-col flex-1 max-w-6xl mx-auto w-full">
                <SeasonBanner />
                <div className="my-6">
                    <h1 className="text-3xl md:text-5xl font-black font-oswald uppercase tracking-tight text-3d-metallic mb-3">Classifica Generale</h1>
                    <SeasonPill stagione={stagione} />
                </div>
                <WaitingFirstMatchday subtitle="La classifica si popolerà dopo la prima giornata di campionato." />
            </div>
        </main>
    );

    return (
        <main className="min-h-screen pt-28 pb-10 px-4 md:px-8 flex flex-col relative">

            <div className="relative z-30 flex flex-col flex-1 max-w-6xl mx-auto w-full">
                <SeasonBanner />

                <div className="my-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black font-oswald uppercase tracking-tight text-3d-metallic mb-3">
                            Classifica Generale
                        </h1>
                        <SeasonPill stagione={stagione} />
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                        <SelettoreGiornata
                            giornate={numeriGiocati}
                            valore={giornataScelta}
                            onChange={(g) => {
                                setGiornataScelta(g);
                                if (g !== null) setMobileView("giornata");
                            }}
                            etichettaGenerale={`Ultima giocata · ${lastPlayedMatchday}`}
                        />
                        <p className="text-[color:var(--fumo)] text-[11px] hidden sm:block">
                            <span className="bg-[color:var(--oro)] text-[color:var(--pece)] px-1.5 py-0.5 font-black">In oro</span> il miglior punteggio di giornata
                        </p>
                    </div>
                </div>

                {/* ===== TELEFONO: card per squadra ===== */}
                <div className="sm:hidden">
                    <div className="flex gap-1 mb-4 p-1 border-2 border-[color:var(--filo)] bg-[color:var(--fondale)] w-fit">
                        {([
                            { key: "totale" as const, label: "Totale", icon: Trophy },
                            { key: "giornata" as const, label: colonnaGiornata, icon: CalendarDays },
                        ]).map((v) => (
                            <button
                                key={v.key}
                                onClick={() => setMobileView(v.key)}
                                aria-pressed={mobileView === v.key}
                                className={cn(
                                    "relative flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors",
                                    mobileView === v.key ? "text-[color:var(--pece)]" : "text-[color:var(--fumo)]"
                                )}
                            >
                                {mobileView === v.key && (
                                    <span className="absolute inset-0 bg-[color:var(--calce)]" />
                                )}
                                <v.icon className="relative w-3.5 h-3.5" />
                                <span className="relative">{v.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2">
                        {(mobileView === "totale" ? leaderboard : giornataBoard)?.map((team, index) => {
                            const value = stripDecorations(mobileView === "totale" ? team.Generale : team[colonnaGiornata]) || "-";
                            return (
                                <div
                                    key={team.Team || index}
                                    className={cn(
                                        // fondo pieno e sfocatura: sotto c'è la foto dello stadio,
                                        // con una card troppo trasparente i numeri si perdono
                                        "relative flex items-center gap-3 p-3.5 border-2 transition-colors",
                                        "bg-[color:var(--fondale)]",
                                        index === 0
                                            ? "border-[color:var(--vermiglio)]"
                                            : index < 3
                                              ? "border-[color:var(--calce)]/40"
                                              : "border-[color:var(--filo)]"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "numerone w-9 h-9 shrink-0 flex items-center justify-center text-sm",
                                            index === 0
                                                ? "bg-[color:var(--vermiglio)] text-[color:var(--calce)]"
                                                : index < 3
                                                  ? "bg-[color:var(--calce)] text-[color:var(--pece)]"
                                                  : "border-2 border-[color:var(--filo)] text-[color:var(--fumo)]"
                                        )}
                                    >
                                        {mobileView === "totale" ? team.rank : index + 1}
                                    </span>

                                    <span className="stampino flex-1 min-w-0 text-[15px] text-[color:var(--calce)] truncate">{team.Team}</span>

                                    <span className="text-right shrink-0">
                                        <span className="numerone block text-[color:var(--lario)] text-[26px]">
                                            {value}
                                        </span>
                                        <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--fumo)] mt-1.5">
                                            {mobileView === "totale" ? "Totale" : colonnaGiornata}
                                        </span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== DESKTOP: tabella con tutte le giornate ===== */}
                <div className="hidden sm:flex flex-1 w-full flex-col border-2 border-[color:var(--filo)] bg-[color:var(--fondale)] overflow-hidden">
                    <div ref={tabellaRef} className="overflow-auto w-full max-h-[76vh] custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="sticky top-0 z-40">
                                <tr>
                                    <th className="sticky left-0 z-50 bg-[color:var(--pece)] p-3 w-14 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/30 border-b border-r border-white/[0.08]">
                                        #
                                    </th>
                                    <th className="sticky left-14 z-50 bg-[color:var(--pece)] p-3 min-w-[190px] text-[10px] font-black uppercase tracking-[0.14em] text-white/50 border-b border-r border-white/[0.08]">
                                        Squadra
                                    </th>
                                    <th className="sticky left-[calc(3.5rem+190px)] z-50 bg-[color:var(--secca)] p-3 text-center text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--lario)] border-b border-r border-[color:var(--filo-alto)]">
                                        Totale
                                    </th>
                                    {matchdays.map((g) => (
                                        <th
                                            key={g}
                                            data-giornata={parseInt(g.replace(/\D/g, ""), 10)}
                                            className={cn(
                                                "p-3 min-w-[58px] text-center text-[10px] font-black uppercase tracking-wider border-b border-r border-white/[0.05]",
                                                g === colonnaGiornata && giornataScelta !== null
                                                    ? "bg-[color:var(--secca)] text-[color:var(--lario)]"
                                                    : "bg-[color:var(--pece)] text-[color:var(--fumo)]/70"
                                            )}
                                        >
                                            {g}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard?.map((team, index) => (
                                    <tr key={index} className="group">
                                        <td
                                            className={cn(
                                                "sticky left-0 z-30 bg-[color:var(--pece)] p-2.5 text-center border-b border-r border-[color:var(--filo)]",
                                                "group-hover:bg-[color:var(--secca)]"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "numerone w-7 h-7 flex items-center justify-center text-[12px] mx-auto",
                                                    index === 0
                                                        ? "bg-[color:var(--vermiglio)] text-[color:var(--calce)]"
                                                        : index < 3
                                                          ? "bg-[color:var(--calce)] text-[color:var(--pece)]"
                                                          : "text-[color:var(--fumo)]"
                                                )}
                                            >
                                                {team.rank}
                                            </span>
                                        </td>

                                        <td className="sticky left-14 z-30 bg-[color:var(--pece)] py-2.5 px-3 border-b border-r border-[color:var(--filo)] group-hover:bg-[color:var(--secca)]">
                                            <span className="stampino text-[15px] text-[color:var(--calce)]/90 group-hover:text-[color:var(--calce)] transition-colors">
                                                {team.Team}
                                            </span>
                                        </td>

                                        <td className="sticky left-[calc(3.5rem+190px)] z-30 bg-[color:var(--secca)] py-2.5 px-3 text-center border-b border-r border-[color:var(--filo-alto)] group-hover:bg-[color:var(--secca)]">
                                            <span className="numerone text-[color:var(--lario)] text-[22px]">
                                                {stripDecorations(team.Generale)}
                                            </span>
                                        </td>

                                        {matchdays.map((g) => {
                                            const value = toNumber(team[g]);
                                            const raw = stripDecorations(team[g]);
                                            // il miglior punteggio della giornata si riconosce a colpo d'occhio
                                            const isBest =
                                                value !== null && bestPerMatchday[g] != null && value === bestPerMatchday[g];
                                            return (
                                                <td
                                                    key={g}
                                                    className={cn(
                                                        "p-2.5 text-center border-b border-r border-[color:var(--filo)] tabular-nums transition-colors",
                                                        "group-hover:bg-[color:var(--calce)]/[0.04]",
                                                        isBest ? "bg-[color:var(--oro)] text-[color:var(--pece)] font-black" : "text-[color:var(--fumo)]",
                                                        g === colonnaGiornata && giornataScelta !== null && !isBest &&
                                                            "bg-[color:var(--lario)]/10 text-[color:var(--calce)]"
                                                    )}
                                                >
                                                    {raw || "-"}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </main>
    );
}

export default function ClassificaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex justify-center items-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        }>
            <ClassificaContent />
        </Suspense>
    );
}
