import type { Metadata } from "next";

/** La pagina è un componente client: il titolo per tab/anteprime vive qui. */
export const metadata: Metadata = {
    title: "Regolamento",
    description: "Il regolamento ufficiale della Fanta Laghèe: quota, rosa, bonus e malus, coppe e premi della stagione.",
};

export default function RegolamentoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
