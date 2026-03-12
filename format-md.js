const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const mdDir = path.join(__dirname, 'public', 'articoli', 'md');
const files = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));

// Date parsing helper
function parseToIso(dateStr) {
    if (!dateStr) return "2025-08-01"; // Default fallback
    
    // Already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // "YYYY-MM-D" (missing leading zero)
    let parts = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (parts) {
        let y = parts[1];
        let m = parts[2].padStart(2, '0');
        let d = parts[3].padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    
    // Italian textual dates (e.g. "11 Marzo 2026", "1 Febbraio 2026")
    const mesi = {
        "gennaio": "01", "febbraio": "02", "marzo": "03", "aprile": "04",
        "maggio": "05", "giugno": "06", "luglio": "07", "agosto": "08",
        "settembre": "09", "ottobre": "10", "novembre": "11", "dicembre": "12"
    };

    const textMatch = dateStr.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
    if (textMatch) {
        let d = textMatch[1].padStart(2, '0');
        let m = mesi[textMatch[2]];
        let y = textMatch[3];
        if (m) return `${y}-${m}-${d}`;
    }

    return "2025-08-01"; // Fallback
}

files.forEach(file => {
    const filePath = path.join(mdDir, file);
    let rawContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the frontmatter and content
    let parsed = matter(rawContent);
    let data = parsed.data;
    let content = parsed.content;

    // 1. Format date
    if (data.date) {
        data.date = parseToIso(data.date);
    }

    // 2. Clean content: remove leading H1s and Images
    // Remove all H1s at the very beginning (e.g. "# Titolo dell'articolo")
    // Remove all image tags at the beginning (e.g. "![Alt](url)" or HTML "<img...>")
    // We'll clean up the start of the body multiple times until no matches are found
    
    let isCleaned = false;
    do {
        isCleaned = false;
        let originalContent = content;

        // Strip leading whitespace
        content = content.trimStart();

        // Strip leading markdown images
        content = content.replace(/^!\[.*?\]\(.*?\)\s*/i, '');
        // Strip leading markdown headers (H1 specifically, `# Title`)
        content = content.replace(/^#\s+[^\n]*\n+/i, '');
        // Strip leading HTML images
        content = content.replace(/^<img[^>]+>\s*/i, '');
        
        // Sometimes the H1 can also be `Title \n =====` format, though less common.
        content = content.replace(/^[^\n]+\n(?:=+)\n+/i, '');
        
        // Also strip any other generic `#` titles if they are exactly matching the title metadata
        if (data.title) {
             const titleRegex = new RegExp(`^#+\\s*${data.title.replace(/[.*+?^$\{()|[\\]\\\\]/g, '\\\\$&')}\\s*\\n+`, 'i');
             content = content.replace(titleRegex, '');
        }

        if (content !== originalContent) {
             isCleaned = true; // Loop again just in case there's another image/title behind it
        }
    } while (isCleaned);


    // Rewrite the file
    let newData = matter.stringify(content.trim(), data);
    fs.writeFileSync(filePath, newData);
    console.log(`Processed ${file}: date -> ${data.date}`);
});
