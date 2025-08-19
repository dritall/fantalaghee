// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Logica Comune a Tutte le Pagine ---
    const header = document.getElementById('main-header');
    if (!header) return;

    const hamburgerBtn = header.querySelector('#hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    // Gestione Menu Mobile
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

    // Evidenzia il link della pagina attiva
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

        const scrollToSection = (targetId) => {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const headerOffset = header.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        };

        // Attiva i bottoni interni alla pagina
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                switchTab(targetId);
            });
        });

        // Gestisce i click sui link dell'header che puntano alle ancore
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Previene il comportamento di default del link
                const targetId = new URL(link.href).hash.substring(1);
                switchTab(targetId);
                scrollToSection(targetId);
                window.history.pushState(null, null, `#${targetId}`); // Aggiorna l'URL
            });
        });

        // Controlla l'URL all'arrivo per mostrare la sezione corretta
        const handleHashChange = () => {
            const hash = window.location.hash.substring(1);
            switchTab(hash || 'panoramica');
            if (hash) {
                setTimeout(() => scrollToSection(hash), 100); // Leggero ritardo per assicurarsi che tutto sia visibile
            }
        };

        handleHashChange(); // Esegui al caricamento iniziale

        // Logica Accordion
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const svg = header.querySelector('svg');

                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                    svg.style.transform = 'rotate(0deg)';
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                    svg.style.transform = 'rotate(180deg)';
                }
            });
        });

        // Carica i nomi dei protagonisti
        const protagonistiContainer = document.getElementById('protagonisti-container');
        if (protagonistiContainer) {
            const teamEmojis = {
                'Ac Alcapian': '👑',
                'Atletico Selva': '🦁',
                'Aston Birra': '🍺',
                'Team Amblar': '🏃‍♂️',
                'Borussia Porcmund': '🐷',
                'Real Como': '🦢',
                'Scarsenal': '🚽',
                'I Gufi': '🦉'
            };

            fetch('/api/getSquadre')
                .then(res => res.json())
                .then(squadre => {
                    if (squadre && squadre.length > 0) {
                        protagonistiContainer.innerHTML = squadre.map(squadra => {
                            const emoji = teamEmojis[squadra] || '⚽️';
                            return `<div class="p-4 bg-gray-800 rounded-lg text-center font-semibold">${emoji} ${squadra}</div>`;
                        }).join('');
                    } else {
                        protagonistiContainer.innerHTML = '<p>Nomi delle squadre non disponibili.</p>';
                    }
                })
                .catch(err => {
                    console.error("Errore caricamento squadre:", err);
                    protagonistiContainer.innerHTML = '<p>Impossibile caricare i nomi delle squadre.</p>';
                });
        }
    }
});
