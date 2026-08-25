import type { Metadata } from "next";
import { Trophy, Shuffle, Swords, ArrowRight } from "lucide-react";
import { SeasonBanner } from "@/components/ui/SeasonBanner";
import { SeasonPill } from "@/components/ui/SeasonPill";
import { SeasonLink } from "@/components/ui/SeasonLink";
import { WaitingFirstMatchday } from "@/components/ui/WaitingFirstMatchday";
import { CURRENT_SEASON, SQUADRE_ISCRITTE } from "@/lib/seasons";
import { SUPER_LEGA, COPPA_UEFA } from "@/lib/premi-2627";

export const metadata: Metadata = {
    title: "Le Coppe",
    description: "Coppa Super Lega e Coppa UEFA della Fanta Laghèe: struttura a gironi, tabelloni e premi.",
};

/**
 * Le Coppe partono alla G9 (fine del Ranking di qualificazione) e il foglio
 * non ha ancora una scheda con gironi/tabelloni: non c'è dato reale da
 * mostrare finché non si arriva lì. Questa pagina esiste già ora — non a
 * ridosso della G9 — proprio per non doverla improvvisare come è successo
 * con i premi di quest'anno. Quando i gironi partiranno, il posto dove
 * agganciare i veri dati (classifica di girone, tabelloni) è qui: server
 * component, nessun fetch client ancora perché non c'è endpoint a cui
 * chiedere. Vedi CLAUDE.md per la struttura completa.
 */
const FASI = [
    {
        icona: Shuffle,
        titolo: "G1–G18 · Qualificazione",
        testo: `La classifica generale delle prime 8 giornate diventa il Ranking 1°–${SQUADRE_ISCRITTE}°. Da lì, 4 gironi da 10 squadre col metodo serpentone (G9–G18): sola andata, nessuna eliminazione. Le prime 5 di ogni girone vanno in Coppa Super Lega, le ultime 5 in Coppa UEFA — tutte e ${SQUADRE_ISCRITTE} finiscono in una delle due.`,
    },
    {
        icona: Swords,
        titolo: "G20–G32 · Tabelloni",
        testo: "Due tabelloni da 32 (12 BYE agli ottavi + 8 al preliminare), a scontro diretto andata/ritorno: il punteggio diventa gol secondo le soglie. Finali alla G32, gara unica.",
    },
];

export default function CoppePage() {
    return (
        <main className="min-h-screen pt-28 pb-16 px-4 md:px-8 relative">
            <div className="relative z-30 max-w-4xl mx-auto space-y-8">
                <SeasonBanner />

                <header className="text-center space-y-4">
                    <h1 className="font-score text-5xl md:text-7xl font-bold text-3d-metallic uppercase tracking-wide">
                        Le Coppe
                    </h1>
                    <SeasonPill stagione={CURRENT_SEASON} />
                </header>

                <WaitingFirstMatchday
                    title="In attesa della fase a gironi"
                    subtitle="Le coppe si accendono dopo la giornata 8, quando il Ranking diventa gironi. Qui sotto trovi già come funzioneranno."
                />

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {FASI.map((f) => (
                        <div key={f.titolo} className="surface rounded-[var(--ro-m)] p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <f.icona className="w-4 h-4 shrink-0 text-[color:var(--lario)]" />
                                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--lario)]">
                                    {f.titolo}
                                </h2>
                            </div>
                            <p className="text-sm text-[color:var(--calce)]/85 leading-relaxed">{f.testo}</p>
                        </div>
                    ))}
                </section>

                <section className="surface rounded-[var(--ro-m)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-4 h-4 shrink-0 text-[color:var(--viola)]" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--viola)]">
                            Premi delle coppe
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-[color:var(--fumo)] mb-2">
                                Coppa Super Lega
                            </p>
                            <ul className="space-y-1">
                                {SUPER_LEGA.map((v) => (
                                    <li key={v.titolo} className="flex items-center justify-between text-sm">
                                        <span className="text-[color:var(--calce)]/80">{v.titolo}</span>
                                        <span className="font-black text-[color:var(--viola)] tabular-nums">{v.importo} 🍆</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-[color:var(--fumo)] mb-2">
                                Coppa UEFA
                            </p>
                            <ul className="space-y-1">
                                {COPPA_UEFA.map((v) => (
                                    <li key={v.titolo} className="flex items-center justify-between text-sm">
                                        <span className="text-[color:var(--calce)]/80">{v.titolo}</span>
                                        <span className="font-black text-[color:var(--viola)] tabular-nums">{v.importo} 🍆</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <SeasonLink
                    href="/regolamento"
                    className="group scheda flex items-center justify-between gap-4 px-5 py-4"
                >
                    <span className="text-sm font-black uppercase tracking-wider text-[color:var(--calce)]">
                        Tutta la struttura, con calendario e regole di parità
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--fumo)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[color:var(--calce)]" />
                </SeasonLink>
            </div>
        </main>
    );
}
