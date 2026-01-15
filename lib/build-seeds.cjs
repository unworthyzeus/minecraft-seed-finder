// Build script to convert SSG CSV to JSON
const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '..', 'data', 'ssg-seeds.csv');
const outputPath = path.join(__dirname, 'seeds-data.json');

const csvData = fs.readFileSync(csvPath, 'utf8');
const lines = csvData.trim().split('\n');

console.log(`Processing ${lines.length - 1} seeds from CSV...`);

const seeds = [];

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
        discoveredBy: 'funkyface/ssg-seeds',
        discoveredDate: '2020-09-14',
        description: `Verified 12-eye End Portal ${portalDistance} blocks from spawn. ${villageBiome.charAt(0).toUpperCase() + villageBiome.slice(1)} village ${villageDist} blocks from spawn with ruined portal nearby.`,
        source: 'github.com/funkyface/ssg-seeds',
        isGenerated: false
    });
}

console.log(`Parsed ${seeds.length} valid seeds`);

// Write to JSON file
fs.writeFileSync(outputPath, JSON.stringify(seeds, null, 2));
console.log(`Wrote seeds to ${outputPath}`);
console.log('Done!');
