// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.querySelector('div[data-include-header]');
    if (headerPlaceholder) {
        fetch('/components/_header.html')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(data => {
                headerPlaceholder.innerHTML = data;
                initializeHeaderLogic();
                setActiveNavlink();
            })
            .catch(error => {
                console.error('Failed to fetch header:', error);
                headerPlaceholder.innerHTML = '<p class="text-red-500 text-center">Error loading header.</p>';
            });
    }

    function initializeHeaderLogic() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const hamburgerOpenIcon = document.getElementById('hamburger-open');
        const hamburgerCloseIcon = document.getElementById('hamburger-close');

        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                hamburgerOpenIcon.classList.toggle('hidden');
                hamburgerCloseIcon.classList.toggle('hidden');
            });
        }

        // Popola il menu mobile con i link del menu desktop per coerenza
        const desktopNav = document.querySelector('header nav');
        if (desktopNav && mobileMenu) {
            mobileMenu.innerHTML = `<div class="container mx-auto p-4 flex flex-col gap-4">${desktopNav.innerHTML}</div>`;
        }

        document.querySelectorAll('.dropdown').forEach(dropdown => {
            dropdown.addEventListener('click', (e) => {
                e.stopPropagation();
                closeAllDropdowns(dropdown);
                dropdown.querySelector('.dropdown-menu')?.classList.toggle('hidden');
            });
        });

        document.addEventListener('click', () => closeAllDropdowns());
    }

    function closeAllDropdowns(exceptThisOne = null) {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            if (dropdown !== exceptThisOne) {
                dropdown.querySelector('.dropdown-menu')?.classList.add('hidden');
            }
        });
    }

    function setActiveNavlink() {
        const currentPage = window.location.pathname;
        const navLinks = document.querySelectorAll('#main-header .nav-link, #main-header .dropdown a');

        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            if (linkPath === currentPage && currentPage !== '/' && currentPage !== '/index.html') {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function setupHomepageTabs() {
        const tabButtons = document.querySelectorAll('a.nav-link[href^="/index.html#"], button[data-target]');
        const contentSections = document.querySelectorAll('.content-section');

        function switchTab(targetId) {
            if (!targetId) targetId = 'panoramica'; // Default
            contentSections.forEach(section => {
                section.style.display = section.id === targetId ? 'block' : 'none';
            });
            document.querySelectorAll('button[data-target]').forEach(button => {
                 button.classList.toggle('active', button.dataset.target === targetId);
            });
        }

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = button.dataset.target || new URL(button.href).hash.substring(1);
                if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                   e.preventDefault();
                   switchTab(targetId);
                   history.pushState(null, null, `#${targetId}`);
                }
            });
        });

        const hash = window.location.hash.substring(1);
        setTimeout(() => {
            switchTab(hash);
            if(hash) document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        setupHomepageTabs();
    }
});
