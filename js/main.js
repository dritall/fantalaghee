// js/main.js

function renderHeader() {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    headerContainer.innerHTML = `
    <header id="main-header" class="sticky top-0 z-50 backdrop-blur-lg border-b border-gray-700">
        <div class="container mx-auto px-4 flex justify-between items-center h-16">
            <a href="/index.html"><img src="/image/logo-header.jpg" alt="Fanta Laghèe Logo" class="h-12"></a>
            <nav class="nav-menu">
                <div class="hidden md:flex items-center gap-1">
                    <a href="/homepage-v2.html" class="nav-button rounded-md px-4 py-2 text-sm font-medium">Classifica</a>
                    <div class="relative group">
                        <a href="/info-complete.html" class="nav-button rounded-md px-4 py-2 text-sm font-medium inline-flex items-center">
                            <span>Regolamento</span>
                            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </a>
                        <div class="absolute z-10 hidden group-hover:block bg-gray-800 border border-gray-700 rounded-md shadow-lg w-40">
                            <a href="/info-complete.html#novita" class="block px-4 py-2 text-sm text-stone-300 hover:bg-gray-700">Novità</a>
                            <a href="/info-complete.html#mercato" class="block px-4 py-2 text-sm text-stone-300 hover:bg-gray-700">Mercato</a>
                            <a href="/info-complete.html#bonus-malus" class="block px-4 py-2 text-sm text-stone-300 hover:bg-gray-700">Bonus/Malus</a>
                        </div>
                    </div>
                    <a href="/gazzetta-del-laghee.html" class="nav-button nav-gazzetta rounded-md px-4 py-2 text-sm font-medium">La Gazzetta</a>
                    <a href="/il-verdetto.html" class="nav-button nav-verdetto rounded-md px-4 py-2 text-sm font-medium">Il Verdetto</a>
                </div>
            </nav>
            <div class="flex items-center gap-2">
                <a href="https://drive.google.com/file/d/1xLrx-tdMvLbsquIHVIUe_RpmKAn8-D3y/view?usp=sharing" target="_blank" rel="noopener noreferrer" class="btn-secondary px-4 py-2 rounded-full text-sm uppercase hidden sm:block">PDF</a>
                <a href="https://forms.gle/HRBX3hvc351Y2Mai7" target="_blank" class="btn-iscriviti px-4 py-2 rounded-full text-sm uppercase hidden sm:block">Iscriviti</a>
                <button id="mobile-menu-button" class="md:hidden p-2 cursor-pointer">
                    <svg class="w-6 h-6" id="hamburger-open-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    <svg class="w-6 h-6 hidden" id="hamburger-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
    </header>
    <div id="mobile-menu-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden"></div>
    <div id="mobile-menu-panel" class="mobile-menu-panel transform -translate-x-full transition-transform duration-300 ease-in-out">
        <nav class="flex flex-col p-4 gap-2">
            <a href="/homepage-v2.html" class="nav-button-mobile">Classifica</a>
            <a href="/info-complete.html" class="nav-button-mobile">Regolamento</a>
            <a href="/gazzetta-del-laghee.html" class="nav-button-mobile">La Gazzetta</a>
            <a href="/il-verdetto.html" class="nav-button-mobile">Il Verdetto</a>
            <hr class="border-gray-700 my-2"/>
            <a href="https://drive.google.com/file/d/1xLrx-tdMvLbsquIHVIUe_RpmKAn8-D3y/view?usp=sharing" target="_blank" rel="noopener noreferrer" class="nav-button-mobile">Scarica PDF</a>
            <a href="https://forms.gle/HRBX3hvc351Y2Mai7" target="_blank" class="nav-button-mobile-primary">Iscriviti Ora</a>
        </nav>
    </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    // Inject the header if container exists
    renderHeader();

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
            if (link.parentElement.tagName === 'LI') {
                 link.parentElement.classList.add('active-link');
            }

            // Se il link è dentro un dropdown, evidenzia anche la voce principale del menu
            const dropdownParent = link.closest('.group'); // Changed from .drop-down to .group as per HTML structure
            if (dropdownParent) {
                const parentLink = dropdownParent.querySelector('a');
                if (parentLink) parentLink.classList.add('active-link');
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
            if (hash) {
                switchTab(hash);
                 setTimeout(() => scrollToSection(hash), 100);
            } else {
                switchTab('panoramica');
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
            document.body.classList.toggle('mobile-menu-active');
        };

        mobileMenuButton.addEventListener('click', toggleMenu);
        mobileMenuOverlay.addEventListener('click', toggleMenu);
    }
});
