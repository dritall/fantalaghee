import type { Metadata } from "next";

/** La pagina è un componente client: il titolo per tab/anteprime vive qui. */
export const metadata: Metadata = {
    title: "Serie A",
    description: "Risultati, calendario, formazioni e classifica reale della Serie A, con le schede partita complete.",
};

export default function RisultatiSerieALayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
