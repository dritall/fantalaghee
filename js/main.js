// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Logica Comune a Tutte le Pagine ---
    const header = document.getElementById('main-header');
    if (!header) return;

    // --- Active Nav Link Highlighter (Vanilla JS - No jQuery) ---
    // Ottieni il nome del file della pagina corrente (es. "verdetto.html")
    let currentPage = window.location.pathname.split("/").pop();

    // Se la pagina è la root, mappala sulla homepage
    if (currentPage === '' || currentPage === 'index.html') {
        currentPage = 'homepage-v2.html';
    }

    // Seleziona tutti i link nella navigazione principale e mobile
    const navLinks = document.querySelectorAll('.nav-menu a, .nav-button-mobile');

    navLinks.forEach(function(link) {
        const linkPage = link.getAttribute('href').split("/").pop();

        if (linkPage === currentPage) {
            // Aggiungi la classe al link attivo
            link.classList.add('active-link');

            // Aggiungi la classe al genitore <li> per un targeting più facile
            link.parentElement.classList.add('active-link');

            // Se il link è dentro un dropdown, evidenzia anche la voce principale del menu
            const dropdownParent = link.closest('.drop-down');
            if (dropdownParent) {
                dropdownParent.querySelector('a').classList.add('active-link');
            }
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

        // Carica i nomi dei protagonisti
        const protagonistiContainer = document.getElementById('protagonisti-container');
        if (protagonistiContainer) {
            fetch('/api/getSquadre')
                .then(res => res.json())
                .then(squadre => {
                    if (squadre && squadre.length > 0) {
                        protagonistiContainer.innerHTML = squadre.map(squadra =>
                            `<div class="p-4 bg-gray-800 rounded-lg text-center font-semibold">${squadra}</div>`
                        ).join('');
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

    // --- Accordion Logic for info-complete.html ---
    const accordionContainer = document.getElementById('info-accordion');
    if (accordionContainer) {
        // Open the first accordion item by default
        const firstItem = accordionContainer.querySelector('.accordion-item');
        if (firstItem) {
            const firstContent = firstItem.querySelector('.accordion-content');
            const firstIcon = firstItem.querySelector('.accordion-header svg');
            firstContent.style.maxHeight = firstContent.scrollHeight + "px";
            firstIcon.classList.add('rotate-180');
        }

        const accordionItems = accordionContainer.querySelectorAll('.accordion-item');
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            const content = item.querySelector('.accordion-content');
            const icon = header.querySelector('svg');

            header.addEventListener('click', () => {
                const isOpen = content.style.maxHeight;

                // Close all items
                accordionItems.forEach(otherItem => {
                    otherItem.querySelector('.accordion-content').style.maxHeight = null;
                    otherItem.querySelector('.accordion-header svg')?.classList.remove('rotate-180');
                });

                // If the clicked item was not already open, open it
                if (!isOpen) {
                    content.style.maxHeight = content.scrollHeight + "px";
                    icon?.classList.add('rotate-180');
                }
            });
        });
    }

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenuPanel = document.getElementById('mobile-menu-panel');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const openIcon = document.getElementById('hamburger-open-icon');
    const closeIcon = document.getElementById('hamburger-close-icon');

    if (mobileMenuButton && mobileMenuPanel && mobileMenuOverlay) {
        const toggleMenu = () => {
            mobileMenuPanel.classList.toggle('translate-x-0');
            mobileMenuPanel.classList.toggle('-translate-x-full');
            mobileMenuOverlay.classList.toggle('hidden');
            openIcon.classList.toggle('hidden');
            closeIcon.classList.toggle('hidden');
        };

        mobileMenuButton.addEventListener('click', toggleMenu);
        mobileMenuOverlay.addEventListener('click', toggleMenu);
    }
});
