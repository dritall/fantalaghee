document.addEventListener('DOMContentLoaded', () => {
    // --- Logica Comune a Tutte le Pagine ---
    const header = document.getElementById('main-header');
    if (!header) return;

    // Gestione Menu Mobile
    const hamburgerBtn = header.querySelector('#hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            header.querySelector('#hamburger-open')?.classList.toggle('hidden');
            header.querySelector('#hamburger-close')?.classList.toggle('hidden');
        });
        const desktopNav = header.querySelector('nav');
        if (desktopNav) mobileMenu.innerHTML = `<div class="container mx-auto p-4 flex flex-col items-center gap-4">${desktopNav.innerHTML}</div>`;
    }

    // Evidenzia il link della pagina attiva
    const currentPage = window.location.pathname;
    header.querySelectorAll('a.nav-button').forEach(link => {
        if (new URL(link.href, window.location.origin).pathname === currentPage && !link.href.includes('#')) {
            link.classList.add('active');
        }
    });

    // --- Logica Specifica per la Homepage ---
    if (currentPage === '/' || currentPage.endsWith('/index.html')) {
        // Gestione Accordion per Regolamento e Mercato
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const icon = header.querySelector('svg');
                content.classList.toggle('hidden');
                icon.classList.toggle('rotate-180');
            });
        });

        // Carica i nomi dei protagonisti con emoji
        const protagonistiContainer = document.getElementById('protagonisti-container');
        if (protagonistiContainer) {
            // Mappa Squadra -> Emoji
            const emojiMap = {
                "Real Como": "👑", "Aston Birra": "🍺", "Borussia Tradate": "🟡",
                "Lokomotiv Fagnano": "🚂", "Scarsenal": "💣", "Fc Crotone": "🦈",
                "US Appianese": "🦅", "Armata Brancaleone": "🦁", "Fc Puteolana": "👹",
                "Red Bull Lurate": "🐂", "Paris San Gennar": "⚜️", "Virtus Bugiroga": "🐞",
                "Longobarda": "🛡️", "Apoel frontalieri": "🛂", "Deportivo La Carogna": "💀",
                "F.C. Barella": "🍻", "Real maledetti": "😈", "As lessona": "🍷",
                "U.S.D. Cacciatori": "🎯", "F.C. Malinatese": "🍑"
                // Aggiungi altre squadre se necessario
            };

            fetch('/api/getSquadre')
                .then(res => res.json())
                .then(squadre => {
                    if (squadre && squadre.length > 0) {
                        protagonistiContainer.innerHTML = squadre.map(squadra => {
                            const emoji = emojiMap[squadra] || '⚽'; // Emoji di default
                            return `<div class="p-4 bg-gray-800 rounded-lg text-center font-semibold flex items-center justify-center gap-2">${emoji} ${squadra}</div>`
                        }).join('');
                    }
                })
                .catch(err => console.error("Errore caricamento squadre:", err));
        }
    }
});
