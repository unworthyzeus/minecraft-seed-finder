// Build script to convert SSG CSV to JSON
const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '..', 'data', 'ssg-seeds.csv');
const outputPath = path.join(__dirname, 'seeds-data.json');

const seeds = [];

function determineCategory(title, flair) {
    const t = (title + ' ' + (flair || '')).toLowerCase();

    if (t.includes('mushroom') && (t.includes('spawn') || t.includes('island'))) return 'mushroom_spawn';
    if (t.includes('island') && (t.includes('survival') || t.includes('small'))) return 'spawn_oddity';
    if (t.includes('badlands') && t.includes('spawn')) return 'rare_biome';
    if (t.includes('jungle') && t.includes('spawn')) return 'rare_biome';
    if (t.includes('ice') && t.includes('spikes')) return 'rare_biome';
    if (t.includes('cherry')) return 'rare_biome';

    if (t.includes('mansion') && (t.includes('desert') || t.includes('mesa') || t.includes('sand') || t.includes('beach'))) return 'desert_mansion';
    if (t.includes('mansion')) return 'rare_biome';

    // New Anomalies logic
    if (t.includes('monument') && (t.includes('land') || t.includes('underground') || t.includes('lake') || t.includes('mountain'))) return 'monument_anomaly';
    if (t.includes('shipwreck') && (t.includes('land') || t.includes('sky') || t.includes('ice') || t.includes('floating'))) return 'shipwreck_anomaly';
    if (t.includes('geode') && (t.includes('surface') || t.includes('sky') || t.includes('bedrock'))) return 'geode_anomaly';

    if (t.includes('stronghold')) return 'stronghold_spawn';
    if (t.includes('fortress')) return 'nether_anomaly';
    if (t.includes('ancient')) return 'rare_biome';
    if (t.includes('village')) return 'village_anomaly';
    if (t.includes('outpost')) return 'village_anomaly';

    if (t.includes('portal') && (t.includes('12') || t.includes('pre completed') || t.includes('activated') || t.includes('filled'))) return 'end_portal_12eye';
    if (t.includes('ruined') && t.includes('portal')) return 'ruined_portal';
    if (t.includes('portal') && (t.includes('end') || t.includes('missing') || t.includes('stronghold') || t.includes('frame') || t.includes('broken'))) return 'end_portal_missing';
    if (t.includes('broken') && !t.includes('end')) return 'end_portal_missing';

    if (t.includes('end') && (t.includes('anomaly') || t.includes('weird') || t.includes('glitch') || t.includes('island') || t.includes('city'))) return 'end_anomaly';
    if (!t.includes('end') && (t.includes('anomaly') || t.includes('weird') || t.includes('glitch'))) return 'rare_biome';

    if (t.includes('nether') && (t.includes('anomaly') || t.includes('weird') || t.includes('glitch') || t.includes('overlap'))) return 'nether_anomaly';
    if (t.includes('portal')) return 'ruined_portal'; // Default to ruined if just "portal"
    if (t.includes('sinkhole')) return 'rare_biome';
    if (t.includes('repeating')) return 'rare_biome';

    if (t.includes('speedrun')) return 'speedrun';
    if (t.includes('spawner')) return 'spawner_anomaly';

    // Fallback classification
    if (t.includes('monument')) return 'monument_anomaly';
    if (t.includes('shipwreck')) return 'shipwreck_anomaly';
    if (t.includes('geode')) return 'geode_anomaly';

    // Rare specific logic
    if (t.includes('cactus') && (t.includes('tall') || t.includes('block') || t.includes('high') || t.includes('height') || t.includes('giant') || t.includes('big'))) return 'tall_cactus';
    if ((t.includes('sugar') || t.includes('cane') || t.includes('reeds')) && (t.includes('tall') || t.includes('high') || t.includes('block') || t.includes('5') || t.includes('4'))) return 'tall_sugarcane';
    if ((t.includes('fossil') || t.includes('spine') || t.includes('rib cage'))) return 'fossil_diamonds';
    if (t.includes('witch') && t.includes('hut') && (t.includes('quad') || t.includes('4') || t.includes('four') || t.includes('multi'))) return 'quad_witch_hut';
    if (t.includes('sheep') && t.includes('pink')) return 'mob_spawn';
    if (t.includes('panda') && t.includes('brown')) return 'mob_spawn';
    if (t.includes('axolotl') && t.includes('blue')) return 'mob_spawn';
    if (t.includes('spawner') && (t.includes('exposed') || t.includes('surface'))) return 'spawner_anomaly';
    if (t.includes('mineshaft') && (t.includes('surface') || t.includes('exposed') || t.includes('glitch') || t.includes('high'))) return 'mineshaft_anomaly';
    if (t.includes('mineshaft') && (t.includes('badlands') || t.includes('mesa'))) return 'mineshaft_anomaly';

    // Shape/Sus/Meme detection (User request)
    if (t.includes('penis') || t.includes('dick') || t.includes('cock') || t.includes('pp') || t.includes('phallic')) return 'shape_anomaly';
    if (t.includes('sus') || t.includes('shape') || t.includes('looks like')) return 'shape_anomaly';

    return 'rare_biome';
}

// Process Speedrun Seeds (JSON)
const speedrunPath = path.join(__dirname, '../data/speedrun-seeds.json');
if (fs.existsSync(speedrunPath)) {
    const speedrunData = JSON.parse(fs.readFileSync(speedrunPath, 'utf8'));
    if (speedrunData.seeds && Array.isArray(speedrunData.seeds)) {
        console.log(`Found ${speedrunData.seeds.length} speedrun seeds`);

        speedrunData.seeds.forEach(item => {
            const seed = item.seed;
            // Generate a unique ID based on seed and name
            const id = `sr-${seed}-${item.seed_name || 'unknown'}`.replace(/[^a-z0-9-]/gi, '');

            seeds.push({
                id: id,
                seed: String(seed),
                title: `Speedrun: ${item.seed_name ? item.seed_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown'}`,
                description: `Verified speedrunning practice seed '${item.seed_name}'. Optimized for specific categories or splitting. Coordinates: X=${item.x}, Z=${item.z}.`,
                category: 'speedrun', // Ensure this category exists in lib/categories.js
                discoveredBy: 'pengyllis (UltimateSpawnList)',
                discoveredDate: '2023-01-01', // Fallback
                version: {
                    java: '1.16+',
                    bedrock: null
                },
                rating: 4.5,
                confidence: 1.0,
                isGenerated: false,
                coordinates: {
                    x: item.x,
                    y: 70, // Estimate
                    z: item.z
                },
                imageUrl: '/images/seeds/placeholder_speedrun.jpg', // Placeholder
                chunkbaseUrl: `https://www.chunkbase.com/apps/seed-map#${seed}`
            });
        });
    }
}

// Process Manual Verified Seeds (Historic, Rare)
const manualPath = path.join(__dirname, '../data/manual-seeds.json');
if (fs.existsSync(manualPath)) {
    const manualData = JSON.parse(fs.readFileSync(manualPath, 'utf8'));
    if (manualData.seeds && Array.isArray(manualData.seeds)) {
        console.log(`Found ${manualData.seeds.length} manual verified seeds`);

        manualData.seeds.forEach(item => {
            seeds.push({
                id: `man-${item.seed}-${item.category}`.replace(/[^a-z0-9-]/gi, ''),
                ...item, // Use item directly as it matches schema
                isGenerated: false
            });
        });
    }
}

// Process Reddit Scraped Seeds (Multiple Files)
const dataDir = path.join(__dirname, '../data');
if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('reddit-seeds-') && f.endsWith('.json'));

    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        try {
            const redditData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (Array.isArray(redditData)) {
                console.log(`Found ${redditData.length} seeds in ${file}`);
                redditData.forEach(item => {
                    // Re-classify based on newest logic during build
                    const newCategory = determineCategory(item.title, "");

                    seeds.push({
                        ...item,
                        category: newCategory, // Override category with corrected logic
                        isGenerated: false
                    });
                });
            }
        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
    });
}



const csvData = fs.readFileSync(csvPath, 'utf8');
const lines = csvData.trim().split('\n');

console.log(`Processing ${lines.length - 1} seeds from CSV...`);



// Parse CSV (skip header)
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].trim().split(',');
    if (parts.length < 11) continue;

    const worldSeed = parts[0];
    const spawnX = parseInt(parts[2]);
    const spawnZ = parseInt(parts[3]);
    const portalX = parseInt(parts[4]);
    const portalZ = parseInt(parts[5]);
    const portalDistance = parseInt(parts[6]);
    const villageX = parseInt(parts[7]);
    const villageZ = parseInt(parts[8]);
    const villageDist = parseInt(parts[9]);
    const villageBiome = parts[10];
    const ruinedPortalX = parseInt(parts[11]) || 0;
    const ruinedPortalZ = parseInt(parts[12]) || 0;

    seeds.push({
        id: `ssg-${i}`,
        seed: worldSeed,
        title: `12-Eye Portal (${portalDistance}m) + ${villageBiome.charAt(0).toUpperCase() + villageBiome.slice(1)} Village`,
        category: 'end_portal_12eye',
        version: { java: '1.16.1', bedrock: null },
        probability: '1 in 10¹²',
        confidence: 0.95,
        coordinates: { x: portalX, y: -35, z: portalZ },
        spawnPoint: { x: spawnX, z: spawnZ },
        village: { x: villageX, z: villageZ, biome: villageBiome, distance: villageDist },
        ruinedPortal: { x: ruinedPortalX, z: ruinedPortalZ },
        discoveredBy: 'funkyface (SSG Tool)',
        discoveredDate: '2020-09-14',
        description: `Verified 12-eye End Portal ${portalDistance} blocks from spawn. ${villageBiome.charAt(0).toUpperCase() + villageBiome.slice(1)} village ${villageDist} blocks from spawn with ruined portal nearby.`,
        source: 'github.com/funkyface/ssg-seeds',
        isGenerated: false
    });
}

console.log(`Parsed ${seeds.length} base seeds`);

// Expansion: Sister Seeds removed per user request for genuine seeds
// Future: Implement real biome-finding algorithm here
const baseSeeds = [...seeds];

console.log(`Expanded database to ${seeds.length} total seeds`);

// Deduplication (Strict)
console.log('Deduplicating seeds...');
const uniqueMap = new Map();
seeds.forEach(s => {
    // Generate Strict Key
    const key = String(s.seed).trim();

    if (!uniqueMap.has(key)) {
        uniqueMap.set(key, s);
    } else {
        // Optional: Keep better metadata if duplicate?
        // Prioritize Manual/Historic over speedrun/ssg/sister
        const existing = uniqueMap.get(key);
        // Manual usually has better titles
        if ((s.category === 'historic' || s.category === 'manual') && existing.category !== 'historic') {
            uniqueMap.set(key, s);
        }
    }
});
const finalSeeds = Array.from(uniqueMap.values());
console.log(`Final count after deduplication: ${finalSeeds.length}`);

// Write to JSON file
fs.writeFileSync(outputPath, JSON.stringify(finalSeeds, null, 2));
console.log(`Wrote seeds to ${outputPath}`);
console.log('Done!');
