const fs = require('fs');
const path = require('path');

const dataDir = 'c:/antigravity-projects/minecraft-seed-finder/data';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

let totalFixed = 0;

files.forEach(file => {
    const filePath = path.join(dataDir, file);
    let content;
    try {
        content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.error(`Error parsing ${file}: ${e.message}`);
        return;
    }

    let modified = false;
    const seeds = content.seeds || content;
    if (!Array.isArray(seeds)) return;

    seeds.forEach(item => {
        if (!item.seed) return;
        const seedStr = String(item.seed);
        const description = (item.description || '') + ' ' + (item.title || '');

        if (!seedStr.startsWith('-')) {
            const negativeSeed = '-' + seedStr;
            // More specific check to avoid accidental matches
            // We look for the negative seed with boundaries around it in the description
            const regex = new RegExp(`(?<!\\w)${negativeSeed}\\b`);
            if (regex.test(description)) {
                console.log(`Fixing seed in ${file}: ${seedStr} -> ${negativeSeed}`);
                item.seed = negativeSeed;
                modified = true;
                totalFixed++;
            }
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
        console.log(`Saved changes to ${file}`);
    }
});

console.log(`\nDONE. Fixed ${totalFixed} seeds.`);
