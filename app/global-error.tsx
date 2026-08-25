"use client";

import { useEffect } from "react";

/**
 * Ultima rete di sicurezza: scatta solo se l'errore è nel root layout stesso
 * (quindi Navbar, Footer e provider non sono disponibili). Per questo è
 * volutamente minimale e non importa componenti del sito — deve funzionare
 * anche quando il resto è rotto.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="it">
            <body
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "system-ui, sans-serif",
                    background: "#E7F1F7",
                    color: "#0B2233",
                    padding: "1.5rem",
                }}
            >
                <div style={{ textAlign: "center", maxWidth: "24rem" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
                        Il sito ha avuto un problema
                    </h1>
                    <p style={{ fontSize: "0.9rem", color: "#496879", marginBottom: "1.5rem" }}>
                        Non è colpa tua. Prova a ricaricare la pagina.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            borderRadius: "9999px",
                            background: "#EE5124",
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            padding: "0.65rem 1.4rem",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        Riprova
                    </button>
                </div>
            </body>
        </html>
    );
}
