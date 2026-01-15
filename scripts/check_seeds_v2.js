const fs = require('fs');
const path = require('path');

const dataDir = 'c:/antigravity-projects/minecraft-seed-finder/data';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
    let content;
    try {
        content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    } catch (e) {
        return;
    }
    const seeds = content.seeds || content; // Some might be arrays directly
    if (!Array.isArray(seeds)) return;

    seeds.forEach((item, index) => {
        const seedValue = item.seed ? String(item.seed) : '';
        const description = (item.description || '') + ' ' + (item.title || '');

        if (seedValue && !seedValue.startsWith('-')) {
            // Find if description contains - followed by the seed value
            if (description.includes('-' + seedValue)) {
                console.log(`MATCH FOUND in ${file} index ${index}:`);
                console.log(`  Seed in JSON: ${seedValue}`);
                console.log(`  Description snippet: ...${description.substring(description.indexOf('-' + seedValue), description.indexOf('-' + seedValue) + seedValue.length + 10)}...`);
            }
        }
    });
});
