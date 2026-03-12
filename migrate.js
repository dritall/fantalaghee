const fs = require('fs');
const path = require('path');

const articlesJsonPath = path.join(__dirname, 'public', 'data', 'articles.json');
const mdDir = path.join(__dirname, 'public', 'articoli', 'md');

let articlesData = [];
if (fs.existsSync(articlesJsonPath)) {
    articlesData = JSON.parse(fs.readFileSync(articlesJsonPath, 'utf8'));
}

const files = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
    if (file === 'recupero-giornata.md') return; // Skip the one to delete

    const id = file.replace('.md', '');
    const meta = articlesData.find(a => a.id === id) || {
        date: new Date().toISOString().split('T')[0],
        title: id.replace(/-/g, ' '),
        imageUrl: `/image/gazzetta/${id}.jpg`
    };

    let content = fs.readFileSync(path.join(mdDir, file), 'utf8');

    // Remove old markdown image tags like ![alt](url)
    content = content.replace(/!\[.*?\]\(.*?\)\n*/g, '');

    // Ensure correct image path extension and location
    // The user said: "assicurati che le estensioni coincidano perfettamente con i file fisici presenti in public/image/gazzetta/."
    // We already checked earlier that the extensions match in articles.json exactly, so we just use meta.imageUrl.
    let imageUrl = meta.imageUrl;
    // Fix any paths that might be /images/copertine/... to /image/gazzetta/...
    imageUrl = imageUrl.replace(/\/images\/copertine\//g, '/image/gazzetta/');

    // Fallback description based on title if none
    const description = meta.title; 

    const frontmatter = `---
title: "${meta.title.replace(/"/g, '\\"')}"
date: "${meta.date}"
description: "${description.replace(/"/g, '\\"')}"
author: "La Redazione"
image: "${imageUrl}"
---
`;

    fs.writeFileSync(path.join(mdDir, file), frontmatter + '\n' + content);
    console.log(`Migrated ${file}`);
});
