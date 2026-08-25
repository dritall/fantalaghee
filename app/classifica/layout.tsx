import type { Metadata } from "next";

/** La pagina è un componente client: il titolo per tab/anteprime vive qui. */
export const metadata: Metadata = {
    title: "Classifica",
    description: "La classifica generale della Fanta Laghèe, giornata per giornata: chi comanda la lega.",
};

export default function ClassificaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
