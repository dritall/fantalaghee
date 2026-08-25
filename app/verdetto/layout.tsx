import type { Metadata } from "next";

/** La pagina è un componente client: il titolo per tab/anteprime vive qui. */
export const metadata: Metadata = {
    title: "Il Verdetto",
    description: "Premi, statistiche e record di stagione del Fanta Laghèe: podio, leader e cucchiaio di legno di ogni giornata.",
};

export default function VerdettoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
