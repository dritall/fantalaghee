const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching browser...');
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            headless: 'new'
        });
        const page = await browser.newPage();

        // Capture Regolamento
        await page.setViewport({ width: 1920, height: 1080 });
        console.log('Navigating to Regolamento...');
        await page.goto('http://127.0.0.1:3010/regolamento', { waitUntil: 'load', timeout: 60000 });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '/home/brianza_boy/.gemini/antigravity/brain/7fa77159-02b3-4b62-9750-9d42eff8f878/regolamento_preview.png', fullPage: true });

        // Capture Gazzetta
        console.log('Navigating to Gazzetta...');
        await page.goto('http://127.0.0.1:3010/gazzetta', { waitUntil: 'load', timeout: 60000 });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '/home/brianza_boy/.gemini/antigravity/brain/7fa77159-02b3-4b62-9750-9d42eff8f878/gazzetta_preview.png', fullPage: true });

        // Capture Verdetto
        console.log('Navigating to Verdetto...');
        await page.goto('http://127.0.0.1:3010/verdetto', { waitUntil: 'load', timeout: 60000 });
        await new Promise(r => setTimeout(r, 3000)); // Wait for charts
        await page.screenshot({ path: '/home/brianza_boy/.gemini/antigravity/brain/7fa77159-02b3-4b62-9750-9d42eff8f878/verdetto_preview.png', fullPage: true });


        await browser.close();
        console.log('Done.');
    } catch (e) {
        console.error('Error taking screenshot:', e);
        process.exit(1);
    }
})();
