const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

const MAX_SEED = BigInt("9223372036854775807");
const MIN_SEED = BigInt("-9223372036854775808");

files.forEach(file => {
    const filePath = path.join(dataDir, file);
    let content;
    try {
        content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.error(`Error parsing ${file}: ${e.message}`);
        return;
    }

    const isReddit = file.startsWith('reddit-seeds-');
    let seeds = content.seeds || content;
    if (!Array.isArray(seeds)) {
        console.error(`Unexpected format in ${file}`);
        return;
    }

    console.log(`Processing ${file}...`);
    let initialCount = seeds.length;

    // Filter and update
    const cleanedSeeds = seeds.filter(item => {
        if (!item.seed) return false;

        const seedStr = String(item.seed).trim();

        // Check if it's a numeric seed that exceeds 64-bit range
        if (/^-?\d+$/.test(seedStr)) {
            try {
                const b = BigInt(seedStr);
                if (b > MAX_SEED || b < MIN_SEED) {
                    console.log(`  Removing too-large seed: ${seedStr} in ${file}`);
                    return false;
                }
            } catch (e) {
                console.log(`  Removing invalid numeric seed: ${seedStr} in ${file}`);
                return false;
            }
        }

        // Remove obviously fake seeds
        if (seedStr.toLowerCase() === 'placeholder' || seedStr === '0' || seedStr === '') {
            return false;
        }

        // Update confidence
        if (isReddit) {
            item.confidence = 0.9;
        } else {
            item.confidence = 1.0;
        }

        return true;
    });

    if (cleanedSeeds.length !== initialCount || isReddit || !isReddit) { // Always save to normalize
        const newContent = content.seeds ? { ...content, seeds: cleanedSeeds } : cleanedSeeds;
        fs.writeFileSync(filePath, JSON.stringify(newContent, null, 2));
        console.log(`  Saved ${cleanedSeeds.length} seeds (${initialCount - cleanedSeeds.length} removed).`);
    }
});

console.log('Cleanup complete.');
