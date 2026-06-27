import Image from "next/image";

export function Footer() {
    return (
        <footer className="relative z-10 mt-auto border-t border-white/10 bg-[#0d0a2a]/70 backdrop-blur-xl">
            <div className="h-[2px] w-full gradient-bar opacity-60" />
            <div className="max-w-7xl mx-auto py-4 px-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <Image
                        src="/image/logo-fantalaghee.png"
                        alt="Fantalaghee Logo"
                        width={90}
                        height={36}
                        className="object-contain h-7 w-auto opacity-90"
                    />
                    <span className="text-white/40 text-xs font-serif hidden sm:inline border-l border-white/15 pl-2.5">
                        Since 2025
                    </span>
                </div>
                <div className="text-[11px] text-white/35 font-mono">
                    © {new Date().getFullYear()} drbb
                </div>
            </div>
        </footer>
    );
}
