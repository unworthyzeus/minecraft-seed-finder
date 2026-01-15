const fs = require('fs');
const path = require('path');

const dataDir = 'c:/antigravity-projects/minecraft-seed-finder/data';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
    const filePath = path.join(dataDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const seeds = content.seeds || [];

    seeds.forEach((item, index) => {
        const seedValue = item.seed;
        const description = item.description || '';
        const title = item.title || '';

        // If seed is positive, check if description or title contains -seedValue
        if (!seedValue.startsWith('-')) {
            const negativeSeed = '-' + seedValue;
            if (description.includes(negativeSeed) || title.includes(negativeSeed)) {
                console.log(`Found mismatch in ${file} at index ${index}:`);
                console.log(`  Seed: ${seedValue}`);
                console.log(`  Title: ${title}`);
                console.log(`  Description: ${description}`);
            }
        }
    });
});
