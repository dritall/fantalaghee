#!/bin/bash

# --- Rebuild js/main.js ---
mkdir -p js
cat > js/main.js << 'EOF'
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
EOF

# --- Rebuild style.css ---
cat > style.css << 'EOF'
:root {
    --background-color: #010409;
    --primary-text: #c9d1d9;
    --card-bg: #161B22;
    --border-color: #30363d;
    --accent-blue: #4f46e5;
    --accent-orange: #f59e0b;
}
body {
    font-family: 'Inter', sans-serif;
    background-color: var(--background-color);
    color: var(--primary-text);
}
.background-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -2; background-image: url('/image/stadium-bg.jpg'); background-size: cover; background-position: center; }
.background-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background-color: rgba(1, 4, 9, 0.75); }
#main-header { background-color: rgba(1, 4, 9, 0.8); }
.nav-button { transition: all 0.3s ease; color: #9ca3af; background-color: rgba(31, 41, 59, 0.5); border: 1px solid #374151; }
.nav-button.active, .nav-button:not(.active):hover, .nav-button-mobile:hover { background-color: #374151; color: #f9fafb; }
.nav-button-mobile.active-link { background-color: var(--accent-blue); color: white; }
.btn-secondary { color: #9ca3af; background-color: transparent; border: 1px solid #4b5563; transition: all 0.3s ease; }
.btn-secondary:hover { background-color: #374151; color: #f9fafb; }
.btn-iscriviti { background-color: var(--accent-orange); color: #111827; font-weight: 700; transition: all 0.3s ease; }
.btn-iscriviti:hover { background-color: #fbbf24; transform: scale(1.05); }

/* Mobile Menu */
.mobile-menu-panel { position: fixed; top: 0; left: 0; width: 80%; max-width: 300px; height: 100%; background-color: #111827; transform: translateX(-100%); transition: transform 0.3s ease-in-out; border-right: 1px solid #374151; padding-top: 4rem; z-index: 100; }
body.mobile-menu-active .mobile-menu-panel { transform: translateX(0); }
#mobile-menu-overlay { transition: opacity 0.3s ease-in-out; }
body.mobile-menu-active #mobile-menu-overlay { opacity: 1; pointer-events: auto; }
.nav-button-mobile { display: block; padding: 12px 16px; color: #d1d5db; font-size: 1rem; font-weight: 500; border-radius: 6px; transition: background-color 0.2s; text-decoration: none; }
.nav-button-mobile-primary { display: block; padding: 12px 16px; margin: 1rem; font-size: 1rem; font-weight: 600; text-align: center; border-radius: 9999px; background-color: var(--accent-orange); color: #111827; transition: background-color 0.2s; text-decoration: none; }
.nav-button-mobile-primary:hover { background-color: #fbbf24; }

/* DataTables Styles */
#classifica-table_wrapper { background-color: var(--card-bg); padding: 1rem; border-radius: 0.5rem; }
#classifica-table { color: #d6d3d1; border-collapse: collapse; table-layout: fixed; width: 100%; }
#classifica-table th, #classifica-table td { padding: 0.75rem 1rem; text-align: left; border: 1px solid #374151; }
#classifica-table thead { background-color: #1f2937; color: #ffffff; }
#classifica-table tbody tr:hover { background-color: #374151; }
#classifica-table tbody tr:nth-child(odd) { background-color: #1f2937; }
#classifica-table .team-column { width: 250px !important; min-width: 250px !important; }
#classifica-table th.dt-fixed-left, #classifica-table td.dt-fixed-left { background-color: #111827 !important; }
.dt-input { background-color: #374151; border: 1px solid #4b5563; color: white; border-radius: 0.25rem; margin-left: 0.5rem; }
EOF

# --- Rebuild api/getClassificaV2.js ---
cat > api/getClassificaV2.js << 'EOF'
import Papa from 'papaparse';

const fetchAndParseCSV = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch CSV from ${url}`);
    const csvText = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => results.errors.length ? reject(results.errors) : resolve(results.data),
            error: (error) => reject(error),
        });
    });
};

export default async function handler(req, res) {
    const CLASSIFICA_URL = process.env.CLASSIFICA_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeH6kU2nBf5h4s4p_z4a7b0zD_l-5dG3bOaJ2c-d-A9aN-u-s_s0bA-fR_cI-e_kXzJgV/pub?gid=0&single=true&output=csv';
    try {
        const classificaData = await fetchAndParseCSV(CLASSIFICA_URL);
        const validData = classificaData.filter(row => row.Team && row.Team.trim() !== '');
        const processedData = validData.map(row => {
            const keysToDelete = Object.keys(row).filter(k => k.toLowerCase() === 'mister' || k.toLowerCase() === 'nickname');
            keysToDelete.forEach(key => delete row[key]);
            return row;
        });
        res.status(200).json({ classifica: processedData.slice(0, 49) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load or process data.', details: error.message });
    }
}
EOF

# --- Rebuild homepage-v2.html ---
# (This is the most complex one)
cat > homepage-v2.html << 'EOF'
<!DOCTYPE html>
<html lang="it" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Classifica - Fanta Laghèe</title>
    <link rel="icon" href="/image/logo-compact.png">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/2.0.8/css/dataTables.dataTables.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/fixedcolumns/5.0.1/css/fixedColumns.dataTables.css">
</head>
<body class="antialiased">
    <div class="background-container"></div>
    <div class="background-overlay"></div>
    <header id="main-header" class="sticky top-0 z-50 backdrop-blur-lg border-b border-gray-700">
        <div class="container mx-auto px-4 flex justify-between items-center h-16">
            <a href="/index.html"><img src="/image/logo-header.jpg" alt="Fanta Laghèe Logo" class="h-12"></a>
            <nav class="hidden md:flex items-center gap-1">
                <a href="/homepage-v2.html" class="nav-button rounded-md px-4 py-2 text-sm font-medium">Classifica</a>
                <a href="/info-complete.html" class="nav-button rounded-md px-4 py-2 text-sm font-medium">Regolamento</a>
                <a href="/gazzetta-del-laghee.html" class="nav-button nav-gazzetta rounded-md px-4 py-2 text-sm font-medium">La Gazzetta</a>
                <a href="/verdetto.html" class="nav-button nav-verdetto rounded-md px-4 py-2 text-sm font-medium">Il Verdetto</a>
            </nav>
            <button id="mobile-menu-button" class="md:hidden p-2 cursor-pointer">
                <svg class="w-6 h-6" id="hamburger-open-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                <svg class="w-6 h-6 hidden" id="hamburger-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    </header>
    <div id="mobile-menu-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden"></div>
    <div id="mobile-menu-panel" class="mobile-menu-panel hidden">
        <nav class="flex flex-col p-4 gap-2">
            <a href="/homepage-v2.html" class="nav-button-mobile">Classifica</a>
            <a href="/info-complete.html" class="nav-button-mobile">Regolamento</a>
            <a href="/gazzetta-del-laghee.html" class="nav-button-mobile">La Gazzetta</a>
            <a href="/verdetto.html" class="nav-button-mobile">Il Verdetto</a>
            <hr class="border-gray-700 my-2"/>
            <a href="https://forms.gle/HRBX3hvc351Y2Mai7" target="_blank" class="nav-button-mobile-primary">Iscriviti Ora</a>
        </nav>
    </div>
    <main class="container mx-auto p-4 md:p-8 relative z-10">
        <section id="classifica-section">
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-indigo-400 mb-4 text-center" style="font-family: 'Oswald', sans-serif;">CLASSIFICA GENERALE</h2>
            <div id="standings-container" class="overflow-x-auto rounded-lg border border-gray-700 p-4 bg-gray-900/50">
                <div class="text-center py-16"><div class="text-4xl sm:text-6xl mb-4 animate-spin">⏳</div><h3 class="text-xl sm:text-2xl font-semibold text-stone-300">Caricamento classifica...</h3></div>
            </div>
        </section>
    </main>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.datatables.net/2.0.8/js/dataTables.js"></script>
    <script src="https://cdn.datatables.net/fixedcolumns/5.0.1/js/dataTables.fixedColumns.js"></script>
    <script src="/js/main.js" defer></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            async function fetchData() {
                const container = document.getElementById('standings-container');
                try {
                    const response = await fetch('/api/getClassificaV2');
                    if (!response.ok) throw new Error('Network response was not ok');
                    const data = await response.json();
                    if (data.error) throw new Error(data.details);

                    const { classifica } = data;
                    if (classifica && classifica.length > 0) {
                        const headers = Object.keys(classifica[0]);
                        const tableHTML = '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>' + classifica.map(row => '<tr>' + headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>').join('') + '</tbody>';
                        container.innerHTML = '<table id="classifica-table" class="display w-full" style="width:100%">' + tableHTML + '</table>';

                        const teamIndex = headers.map(h => h.toLowerCase()).indexOf('team');
                        const columnDefs = teamIndex !== -1 ? [{ targets: teamIndex, className: 'team-column' }] : [];

                        const table = new DataTable('#classifica-table', {
                            language: { url: '//cdn.datatables.net/plug-ins/2.0.8/i18n/it-IT.json' },
                            paging: false,
                            scrollX: true,
                            fixedColumns: { left: 1 },
                            columnDefs: columnDefs
                        });

                        table.on('draw', () => $('#classifica-table th.dt-fixed-left, #classifica-table td.dt-fixed-left').css('background-color', '#111827'));
                    } else {
                        container.innerHTML = '<p class="text-center text-amber-400">Nessun dato disponibile.</p>';
                    }
                } catch (error) {
                    container.innerHTML = '<p class="text-center text-red-400">Impossibile caricare la classifica.</p>';
                }
            }
            fetchData();
        });
    </script>
</body>
</html>
EOF

echo "All files have been rebuilt."
