const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/masterData.json');

const readDb = () => {
    try {
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (err) {
        return { tickets: [], keywords: [] };
    }
};

const writeDb = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

module.exports = { readDb };