// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.querySelector('div[data-include-header]');
    if (headerPlaceholder) {
        fetch('/components/_header.html')
            .then(response => response.text())
            .then(data => {
                headerPlaceholder.innerHTML = data;
                initializeHeaderLogic();
                setActiveNavlink();
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
        const navLinks = document.querySelectorAll('nav a.nav-link');

        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            if (linkPath === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
});
