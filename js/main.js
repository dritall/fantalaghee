// js/main.js (CORRETTO)
document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.querySelector('div[data-include-header]');

    if (headerPlaceholder) {
        fetch('/components/_header.html')
            .then(response => response.text())
            .then(data => {
                headerPlaceholder.innerHTML = data;
                initializeHeaderLogic();
                setActiveNavlink();
                handleInitialScroll();
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
            if (linkPath === currentPage && currentPage !== '/index.html') {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function handleInitialScroll() {
        const hash = window.location.hash;
        if (hash) {
            const targetId = hash.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                    // Se l'elemento target usa un sistema a tab, aprilo
                    const tabButton = document.querySelector(`button[data-target='${targetId}']`);
                    if(tabButton) tabButton.click();
                }, 100);
            }
        }
    }
});
