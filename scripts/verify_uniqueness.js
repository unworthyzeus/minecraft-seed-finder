
const fs = require('fs');
const path = require('path');

const SEEDS_PATH = path.join(__dirname, '../lib/seeds-data.json');

function verifyUniqueness() {
    if (!fs.existsSync(SEEDS_PATH)) {
        console.error('Error: seeds-data.json not found. Run build-seeds.cjs first.');
        process.exit(1);
    }

    console.log('Loading seeds database...');
    const seeds = JSON.parse(fs.readFileSync(SEEDS_PATH, 'utf8'));
    console.log(`Total seeds in database: ${seeds.length}`);

    const seenSeeds = new Map();
    const duplicates = [];
    const seedIds = new Set();
    const duplicateIds = [];

    seeds.forEach((seed, index) => {
        // Check for duplicate seed values
        // Note: Different versions/platforms might have same seed but different content? 
        // User asked to "verify that the seed for all of them is different".
        const seedValue = String(seed.seed).trim();

        if (seenSeeds.has(seedValue)) {
            duplicates.push({
                original: seenSeeds.get(seedValue),
                duplicate: seed,
                index: index
            });
        } else {
            seenSeeds.set(seedValue, seed);
        }

        // Check for duplicate IDs which would break React lists
        if (seedIds.has(seed.id)) {
            duplicateIds.push(seed.id);
        } else {
            seedIds.add(seed.id);
        }
    });

    if (duplicates.length > 0) {
        console.log(`\n❌ Found ${duplicates.length} duplicate SEED VALUES!`);
        duplicates.forEach(d => {
            console.log(`   - Seed: ${d.duplicate.seed}`);
            console.log(`     Original: [${d.original.id}] ${d.original.title}`);
            console.log(`     Duplicate: [${d.duplicate.id}] ${d.duplicate.title}`);
        });

        // Suggest fix
        console.log('\nRecommendation: The build script should have handled this. Check deduplication logic.');
    } else {
        console.log('\n✅ No duplicate seed values found.');
    }

    if (duplicateIds.length > 0) {
        console.log(`\n❌ Found ${duplicateIds.length} duplicate IDs!`);
        console.log(duplicateIds.join(', '));
    } else {
        console.log('✅ No duplicate IDs found.');
    }

    if (duplicates.length === 0 && duplicateIds.length === 0) {
        console.log(`\n✨ SUCCESS! Database verified unique for ${seeds.length} entries.`);
    } else {
        process.exit(1);
    }
}

verifyUniqueness();
