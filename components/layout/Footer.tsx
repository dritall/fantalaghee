import Image from "next/image";

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-[#050505] mt-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                    <Image
                        src="/image/logo-fantalaghee.png"
                        alt="Fantalaghee Logo"
                        width={180}
                        height={70}
                        className="object-contain"
                    />
                    <span className="text-gray-500 text-sm md:border-l border-gray-800 md:pl-4 font-serif">Since 2025</span>
                </div>
                <div className="text-xs text-gray-600 font-mono">
                    © {new Date().getFullYear()} drbb
                </div>
            </div>
        </footer>
    );
}
