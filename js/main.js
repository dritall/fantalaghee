document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('main-header');
    if (!header) return;

    // --- LOGICA COMUNE (MENU MOBILE E LINK ATTIVO) ---
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
    const currentPage = window.location.pathname;
    header.querySelectorAll('a.nav-button').forEach(link => {
        if (new URL(link.href, window.location.origin).pathname === currentPage && !link.href.includes('#')) {
            link.classList.add('active');
        }
    });

    // --- LOGICA SPECIFICA PER LA HOMEPAGE ---
    if (currentPage === '/' || currentPage.endsWith('/index.html')) {
        // Gestione Accordion
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const icon = header.querySelector('svg');
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
                icon.classList.toggle('rotate-180');
            });
        });

        // Gestione Navigazione Sezioni
        const contentSections = document.querySelectorAll('.content-section');
        const switchTab = (targetId) => {
             if (!targetId) targetId = 'panoramica';
             contentSections.forEach(section => {
                 section.style.display = section.id === targetId ? 'block' : 'none';
             });
        };
        document.querySelectorAll('a.nav-link[href*="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = new URL(link.href).hash.substring(1);
                switchTab(targetId);
            });
        });
        const hash = window.location.hash.substring(1);
        switchTab(hash || 'panoramica');

        // Caricamento Protagonisti con Emoji
        const protagonistiContainer = document.getElementById('protagonisti-container');
        if (protagonistiContainer) {
            const emojiMap = { "Real Como": "👑", "Aston Birra": "🍺", "F.C. Malinatese": "🍑" /* Aggiungi qui altre squadre */ };
            fetch('/api/getSquadre').then(res => res.json()).then(squadre => {
                if (squadre && squadre.length > 0) {
                    protagonistiContainer.innerHTML = squadre.map(squadra => {
                        const emoji = emojiMap[squadra] || '⚽';
                        return `<div class="p-4 bg-gray-800 rounded-lg text-center font-semibold flex items-center justify-center gap-2">${emoji} ${squadra}</div>`
                    }).join('');
                }
            }).catch(err => console.error("Errore caricamento squadre:", err));
        }
    }
});
