// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // --- PARTE 1: CARICAMENTO HEADER ---
    const headerPlaceholder = document.querySelector('div[data-include-header]');
    if (headerPlaceholder) {
        fetch('/components/_header.html')
            .then(response => {
                if (!response.ok) throw new Error('Header component not found');
                return response.text();
            })
            .then(data => {
                headerPlaceholder.innerHTML = data;
                initializeHeaderLogic();
                setActiveNavlink();
            })
            .catch(error => console.error('Error loading header:', error));
    }

    // --- PARTE 2: LOGICA INTERATTIVA DELL'HEADER (MENU MOBILE, ETC.) ---
    function initializeHeaderLogic() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (!hamburgerBtn || !mobileMenu) return;

        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            document.getElementById('hamburger-open')?.classList.toggle('hidden');
            document.getElementById('hamburger-close')?.classList.toggle('hidden');
        });

        const desktopNav = document.querySelector('header nav');
        if (desktopNav) {
            mobileMenu.innerHTML = `<div class="container mx-auto p-4 flex flex-col items-center gap-4">${desktopNav.innerHTML}</div>`;
        }
    }

    // --- PARTE 3: GESTIONE LINK ATTIVO ---
    function setActiveNavlink() {
        const currentPage = window.location.pathname;
        document.querySelectorAll('#main-header a.nav-button').forEach(link => {
            const linkPath = new URL(link.href).pathname;
            if (linkPath === currentPage && currentPage !== '/' && currentPage !== '/index.html') {
                link.classList.add('active');
            }
        });
    }

    // --- PARTE 4: LOGICA PER LE SEZIONI DELLA HOMEPAGE ---
    function setupHomepageTabs() {
        const contentSections = document.querySelectorAll('.content-section');
        if (contentSections.length === 0) return;

        function switchTab(targetId) {
            if (!targetId) targetId = 'panoramica';

            contentSections.forEach(section => {
                section.style.display = section.id === targetId ? 'block' : 'none';
            });

            // Aggiorna lo stato "active" dei bottoni originali della homepage
            document.querySelectorAll('a.nav-button[href*="#"]').forEach(button => {
                 const linkHash = new URL(button.href).hash.substring(1);
                 button.classList.toggle('active', linkHash === targetId);
            });
        }

        // Gestisce l'arrivo da un'altra pagina con un #link
        const hash = window.location.hash.substring(1);
        if (hash) {
            setTimeout(() => {
                switchTab(hash);
                document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            // Mostra la sezione di default
            switchTab('panoramica');
        }

        // Aggiungi event listener per i click sui link di navigazione della homepage
        document.querySelectorAll('a.nav-button[href*="#"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = new URL(e.currentTarget.href).hash.substring(1);
                 if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                   e.preventDefault();
                   switchTab(targetId);
                   history.pushState(null, null, `#${targetId}`);
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    // Esegui la logica delle sezioni SOLO se siamo sulla homepage
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        setupHomepageTabs();
    }
});
