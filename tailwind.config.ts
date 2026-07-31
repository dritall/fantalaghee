import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // NB: queste chiavi devono stare *dentro* fontFamily, altrimenti
            // classi come `font-oswald` o `font-sans` non vengono generate e
            // il sito ricade sui font di sistema.
            fontFamily: {
                sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
                serif: ["var(--font-lora)", "ui-serif", "Georgia"],
                outfit: ['var(--font-outfit)', 'sans-serif'],
                inter: ['var(--font-inter)', 'sans-serif'],
                // Titoli display del sito
                oswald: ["var(--font-outfit)", "ui-sans-serif", "system-ui"],
                display: ["var(--font-outfit)", "ui-sans-serif", "system-ui"],
                cursive: ["var(--font-great-vibes)", "cursive"],
                // Coppia della Gazzetta: condensato per i titoli, grazie per il testo
                testata: ['var(--font-condensed)', 'ui-sans-serif', 'system-ui'],
                lora: ['var(--font-lora)', 'Georgia', 'serif']
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                // Alone che "respira": segnala la stagione attualmente in vista
                "season-pulse": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,211,238,0.45)" },
                    "50%": { boxShadow: "0 0 0 7px rgba(34,211,238,0)" },
                },
                "season-pulse-archive": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(250,204,21,0.5)" },
                    "50%": { boxShadow: "0 0 0 7px rgba(250,204,21,0)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                "float-soft": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-6px)" },
                },
                "fade-up": {
                    from: { opacity: "0", transform: "translateY(14px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "season-pulse": "season-pulse 2.4s ease-out infinite",
                "season-pulse-archive": "season-pulse-archive 2.4s ease-out infinite",
                shimmer: "shimmer 2.8s linear infinite",
                "float-soft": "float-soft 6s ease-in-out infinite",
                "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
};
export default config;
