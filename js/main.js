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
        const linkUrl = new URL(link.href);
        if (linkUrl.pathname === currentPage && !linkUrl.hash) {
            link.classList.add('active');
        }
    });

    // --- Logica Specifica per la Homepage ---
    if (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html')) {
        const tabButtons = document.querySelectorAll('button[data-target]');
        const contentSections = document.querySelectorAll('.content-section');

        const switchTab = (targetId) => {
            if (!targetId) targetId = 'panoramica';
            contentSections.forEach(section => {
                section.style.display = section.id === targetId ? 'block' : 'none';
            });
            tabButtons.forEach(button => {
                button.classList.toggle('active', button.dataset.target === targetId);
            });
        };

        tabButtons.forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.target));
        });

        const hash = window.location.hash.substring(1);
        if (hash) {
            setTimeout(() => {
                switchTab(hash);
                document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            switchTab('panoramica'); // Mostra la panoramica di default
        }
    }
});
