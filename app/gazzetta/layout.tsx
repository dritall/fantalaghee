import type { Metadata } from "next";

/** La pagina è un componente client: il titolo per tab/anteprime vive qui. */
export const metadata: Metadata = {
    title: "La Gazzetta",
    description: "Il giornale della Fanta Laghèe: la cronaca di ogni giornata, raccontata come si deve.",
};

export default function GazzettaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
