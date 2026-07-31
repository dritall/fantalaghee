"use client";

import { useState } from "react";

/** Stemmi di riserva quando Lega Serie A non espone l'immagine della squadra. */
const TEAM_LOGOS: Record<string, string> = {
    Inter: "https://tmssl.akamaized.net/images/wappen/head/46.png",
    Milan: "https://tmssl.akamaized.net/images/wappen/head/5.png",
    Napoli: "https://tmssl.akamaized.net/images/wappen/head/6195.png",
    Juventus: "https://tmssl.akamaized.net/images/wappen/head/506.png",
    Roma: "https://tmssl.akamaized.net/images/wappen/head/12.png",
    Lazio: "https://tmssl.akamaized.net/images/wappen/head/398.png",
    Atalanta: "https://tmssl.akamaized.net/images/wappen/head/800.png",
    Bologna: "https://tmssl.akamaized.net/images/wappen/head/1025.png",
    Fiorentina: "https://tmssl.akamaized.net/images/wappen/head/430.png",
    Torino: "https://tmssl.akamaized.net/images/wappen/head/416.png",
    Genoa: "https://tmssl.akamaized.net/images/wappen/head/252.png",
    Udinese: "https://tmssl.akamaized.net/images/wappen/head/410.png",
    Lecce: "https://tmssl.akamaized.net/images/wappen/head/1005.png",
    Verona: "https://tmssl.akamaized.net/images/wappen/head/276.png",
    Cagliari: "https://tmssl.akamaized.net/images/wappen/head/1390.png",
    Parma: "https://tmssl.akamaized.net/images/wappen/head/130.png",
    Sassuolo: "https://tmssl.akamaized.net/images/wappen/head/6574.png",
    Como: "https://tmssl.akamaized.net/images/wappen/head/1047.png",
    Pisa: "https://tmssl.akamaized.net/images/wappen/head/4172.png",
    Monza: "https://tmssl.akamaized.net/images/wappen/head/2919.png",
    Empoli: "https://tmssl.akamaized.net/images/wappen/head/749.png",
    Venezia: "https://tmssl.akamaized.net/images/wappen/head/607.png",
    Cremonese: "https://tmssl.akamaized.net/images/wappen/head/2239.png",
    Frosinone: "https://tmssl.akamaized.net/images/wappen/head/8970.png",
};

const normalizeTeamName = (name?: string) => {
    if (!name) return "";
    const cleaned = name
        .replace(/\s+FC$/i, "")
        .replace(/\s+AC$/i, "")
        .replace(/\s+1907$/i, "")
        .replace(/\s+1908$/i, "")
        .trim();

    const aliases: Record<string, string> = {
        "Como 1907": "Como",
        "Genoa CFC": "Genoa",
        "Pisa Sporting Club": "Pisa",
        "Hellas Verona": "Verona",
    };

    return aliases[name] || aliases[cleaned] || cleaned;
};

const resolveImageUrl = (path: string | null | undefined): string | null => {
    if (!path || typeof path !== "string") return null;
    if (path.startsWith("http")) return path;

    let cleanPath = path.trim();
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);

    if (
        cleanPath.startsWith("clubLogos") ||
        cleanPath.startsWith("teamImages") ||
        cleanPath.startsWith("teamLogoLight") ||
        cleanPath.startsWith("stadiums")
    ) {
        return `https://img.legaseriea.it/vimages/${cleanPath}`;
    }
    return null;
};

/** Tutti gli URL plausibili, dal più specifico al più generico. */
/**
 * Gli stemmi stanno sull'infrastruttura di Lega, che risponde solo a chi
 * dichiara di arrivare dal loro sito: come le foto dei giocatori, passano dal
 * ponte. Le altre sorgenti (Transfermarkt) restano dirette.
 */
const viaProxy = (url: string) =>
    url.includes("legaseriea.it") ? `/api/lega-image?src=${encodeURIComponent(url)}` : url;

export const getTeamLogoUrls = (team: any): string[] => {
    if (!team || typeof team !== "object") return [];

    const rawId = team.teamId || team.id || team.providerId;
    const idToUse = typeof rawId === "string" && rawId.includes("::") ? rawId.split("::").pop() : rawId;

    const teamName = team.name || team.shortName || team.officialName;
    const normalized = normalizeTeamName(teamName);

    const urls = [
        team.imagery?.teamLogoLight ? resolveImageUrl(team.imagery.teamLogoLight.replace("_light", "light")) : null,
        idToUse ? `https://img.legaseriea.it/vimages/clubLogos/${idToUse}light.webp` : null,
        team.imagery?.teamLogo ? resolveImageUrl(team.imagery.teamLogo) : null,
        idToUse ? `https://img.legaseriea.it/vimages/clubLogos/${idToUse}.webp` : null,
        normalized ? TEAM_LOGOS[normalized] : null,
        teamName ? TEAM_LOGOS[teamName] : null,
    ];

    return Array.from(new Set(urls.filter((u): u is string => typeof u === "string"))).map(viaProxy);
};

export const getTeamLogoUrl = (team: any) => getTeamLogoUrls(team)[0] || null;

/** Stemma con caduta progressiva sulle sorgenti alternative. */
export function TeamLogo({ team, className }: { team: any; className: string }) {
    const [imgIndex, setImgIndex] = useState(0);
    const urls = getTeamLogoUrls(team);
    const src = imgIndex < urls.length ? urls[imgIndex] : null;
    const teamName = team?.name || team?.shortName || team?.officialName || "?";

    if (!src) {
        return (
            <div
                className={`${className} bg-[#131a38] rounded-full flex items-center justify-center border border-white/10 shrink-0 overflow-hidden`}
            >
                <span className="text-[10px] font-black tracking-widest text-cyan-400/80 leading-none">
                    {teamName.substring(0, 3).toUpperCase()}
                </span>
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={teamName}
            className={`${className} object-contain shrink-0 drop-shadow-md`}
            onError={() => setImgIndex((prev) => prev + 1)}
        />
    );
}
