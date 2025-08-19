// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // Carica l'header in tutte le pagine tranne la index
    const headerPlaceholder = document.querySelector('div[data-include-header]');
    if (headerPlaceholder) {
        fetch('/components/_header.html')
            .then(response => response.ok ? response.text() : Promise.reject('Header not found'))
            .then(data => {
                headerPlaceholder.innerHTML = data;
                initializeHeaderLogic();
                setActiveNavlink();
            })
            .catch(error => console.error('Error loading header:', error));
    } else {
        // Se siamo sulla index, inizializza comunque la logica dell'header e dei tab
        initializeHeaderLogic();
        setActiveNavlink();
        if (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html')) {
            setupHomepageTabs();
        }
    }

    function initializeHeaderLogic() {
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
    }

    function setActiveNavlink() {
        const currentPage = window.location.pathname;
        document.querySelectorAll('#main-header a.nav-button').forEach(link => {
            const linkUrl = new URL(link.href);
            if (linkUrl.pathname === currentPage && !linkUrl.hash) {
                link.classList.add('active');
            }
        });
    }

    function setupHomepageTabs() {
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
            switchTab('panoramica');
        }
    }
});
