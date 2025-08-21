// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Logic ---
    const menuButton = document.getElementById('mobile-menu-button');
    const menuPanel = document.getElementById('mobile-menu-panel');
    const menuOverlay = document.getElementById('mobile-menu-overlay');
    const openIcon = document.getElementById('hamburger-open-icon');
    const closeIcon = document.getElementById('hamburger-close-icon');

    const toggleMenu = () => {
        const isActive = document.body.classList.toggle('mobile-menu-active');
        if (menuPanel) menuPanel.classList.toggle('hidden', !isActive);
        if (menuOverlay) menuOverlay.classList.toggle('hidden', !isActive);
        if (openIcon) openIcon.classList.toggle('hidden', isActive);
        if (closeIcon) closeIcon.classList.toggle('hidden', !isActive);
    };

    if (menuButton) {
        menuButton.addEventListener('click', toggleMenu);
    }
    if (menuOverlay) {
        menuOverlay.addEventListener('click', toggleMenu);
    }

    // The rest of the original main.js content
    const header = document.getElementById('main-header');
    if (!header) return;

    let currentPage = window.location.pathname.split("/").pop();
    if (currentPage === '' || currentPage === 'index.html') {
        currentPage = 'homepage-v2.html';
    }
    const navLinks = document.querySelectorAll('.nav-menu a, .nav-button-mobile');
    navLinks.forEach(function(link) {
        const linkPage = link.getAttribute('href').split("/").pop();
        if (linkPage === currentPage) {
            link.classList.add('active-link');
            link.parentElement.classList.add('active-link');
            const dropdownParent = link.closest('.drop-down');
            if (dropdownParent) {
                dropdownParent.querySelector('a').classList.add('active-link');
            }
        }
    });
});
