export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-[#050505] mt-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                    <span className="font-bold font-oswald text-white tracking-wider text-xl">FANTA LAGHÈE</span>
                    <span className="text-gray-500 text-sm ml-4 border-l border-gray-800 pl-4 font-serif">Since 2025</span>
                </div>
                <div className="text-xs text-gray-600 font-mono">
                    © {new Date().getFullYear()} drbb
                </div>
            </div>
        </footer>
    );
}
