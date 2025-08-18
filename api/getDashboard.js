const Papa = require('papaparse');

module.exports = async (req, res) => {
    const csvUrl = process.env.DASHBOARD_CSV_URL;

    if (!csvUrl) {
        return res.status(500).json({ error: 'La variabile d\'ambiente DASHBOARD_CSV_URL non è impostata.' });
    }

    try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error(`Errore nel fetch del CSV: ${response.statusText}`);
        }
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                const structuredData = {};
                let currentBlock = null;
                let headers = [];

                data.forEach(row => {
                    const blockTitle = row[0] ? row[0].trim() : '';

                    if (blockTitle) {
                        currentBlock = blockTitle;
                        headers = row.slice(1).map(h => h.trim());
                        if (headers.length > 0) {
                            structuredData[currentBlock] = [];
                        } else {
                            // Handle case where a block title is on its own row
                            structuredData[currentBlock] = {};
                        }
                    } else if (currentBlock && headers.length > 0) {
                        const rowObject = {};
                        row.slice(1).forEach((value, index) => {
                            const header = headers[index];
                            if (header) {
                                rowObject[header] = value.trim();
                            }
                        });
                        if (Object.keys(rowObject).length > 0) {
                            structuredData[currentBlock].push(rowObject);
                        }
                    }
                });

                // Semplifica la struttura per i blocchi chiave-valore
                for (const block in structuredData) {
                    if (Array.isArray(structuredData[block])) {
                        const isKeyValue = structuredData[block].every(item => {
                            const keys = Object.keys(item);
                            return keys.length === 2 && keys.includes('Proprietà') && keys.includes('Valore');
                        });

                        if (isKeyValue && structuredData[block].length > 0) {
                            const newBlock = {};
                            structuredData[block].forEach(item => {
                                newBlock[item['Proprietà']] = item['Valore'];
                            });
                            structuredData[block] = newBlock;
                        } else if (structuredData[block].length === 1) {
                           // Se c'è un solo elemento, estrailo dall'array
                           structuredData[block] = structuredData[block][0];
                        }
                    }
                }

                res.status(200).json(structuredData);
            },
            error: (error) => {
                console.error('Errore di parsing CSV:', error);
                res.status(500).json({ error: 'Errore durante il parsing del file CSV.', details: error.message });
            }
        });
    } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
        res.status(500).json({ error: 'Impossibile recuperare i dati dalla dashboard.', details: error.message });
    }
};
