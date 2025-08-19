document.addEventListener('DOMContentLoaded', () => {
    // --- Logica Comune a Tutte le Pagine ---
    const header = document.getElementById('main-header');
    if (!header) return;

    const hamburgerBtn = header.querySelector('#hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            header.querySelector('#hamburger-open')?.classList.toggle('hidden');
            header.querySelector('#hamburger-close')?.classList.toggle('hidden');
        });
        const desktopNav = header.querySelector('nav');
        if (desktopNav) {
            mobileMenu.innerHTML = `<div class="container mx-auto p-4 flex flex-col items-center gap-4">${desktopNav.innerHTML}</div>`;
        }
    }

    const currentPage = window.location.pathname;
    header.querySelectorAll('a.nav-button').forEach(link => {
        const linkUrl = new URL(link.href, window.location.origin);
        if (linkUrl.pathname === currentPage && !linkUrl.hash) {
            link.classList.add('active');
        }
    });

    // --- Logica Specifica per la Homepage ---
    const isHomepage = currentPage === '/' || currentPage.endsWith('/index.html');
    if (isHomepage) {
        const tabButtons = document.querySelectorAll('button[data-target]');
        const contentSections = document.querySelectorAll('.content-section');
        const navLinks = document.querySelectorAll('a.nav-link[href*="#"]');

        const switchTab = (targetId) => {
            if (!targetId) targetId = 'panoramica';
            contentSections.forEach(section => {
                section.style.display = section.id === targetId ? 'block' : 'none';
            });
            tabButtons.forEach(button => {
                button.classList.toggle('active', button.dataset.target === targetId);
            });
        };

        // Attiva i bottoni interni alla pagina
        tabButtons.forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.target));
        });

        // Gestisce i click sui link dell'header che puntano alle ancore
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                const targetId = new URL(link.href).hash.substring(1);
                switchTab(targetId);
            });
        });

        // Controlla l'URL all'arrivo per mostrare la sezione corretta
        const handleHashChange = () => {
            const hash = window.location.hash.substring(1);
            switchTab(hash || 'panoramica');
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Esegui al caricamento iniziale

        // Carica i nomi dei protagonisti
        const protagonistiContainer = document.getElementById('protagonisti-container');
        if (protagonistiContainer) {
            fetch('/api/getSquadre')
                .then(res => res.json())
                .then(squadre => {
                    protagonistiContainer.innerHTML = squadre.map(squadra =>
                        `<div class="p-4 bg-gray-800 rounded-lg text-center">${squadra}</div>`
                    ).join('');
                })
                .catch(err => {
                    console.error("Errore caricamento squadre:", err);
                    protagonistiContainer.innerHTML = '<p>Impossibile caricare i nomi delle squadre.</p>';
                });
        }
    }
});
