/**
 * Cubiomes-JS: Biome Decision Tree Converter
 * 
 * This script extracts the biome tree data from Cubiomes C headers
 * and converts them to JavaScript format for accurate biome lookup.
 * 
 * Based on Cubiomes by Cubitect (MIT License)
 */

const fs = require('fs');
const path = require('path');

// Source directory containing btree*.h files
const SOURCE_DIR = path.join(__dirname, '..', 'cubiomes-src', 'tables');
const OUTPUT_DIR = path.join(__dirname, 'cubiomes');

// Biome ID mapping from biomes.h
const BIOME_IDS = {
    0x00: 'ocean',
    0x01: 'plains',
    0x02: 'desert',
    0x03: 'mountains',
    0x04: 'forest',
    0x05: 'taiga',
    0x06: 'swamp',
    0x07: 'river',
    0x08: 'nether_wastes',
    0x09: 'the_end',
    0x0A: 'frozen_ocean',
    0x0B: 'frozen_river',
    0x0C: 'snowy_tundra',
    0x0D: 'snowy_mountains',
    0x0E: 'mushroom_fields',
    0x0F: 'mushroom_field_shore',
    0x10: 'beach',
    0x11: 'desert_hills',
    0x12: 'wooded_hills',
    0x13: 'taiga_hills',
    0x14: 'mountain_edge',
    0x15: 'jungle',
    0x16: 'jungle_hills',
    0x17: 'jungle_edge',
    0x18: 'deep_ocean',
    0x19: 'stone_shore',
    0x1A: 'snowy_beach',
    0x1B: 'birch_forest',
    0x1C: 'birch_forest_hills',
    0x1D: 'dark_forest',
    0x1E: 'snowy_taiga',
    0x1F: 'snowy_taiga_hills',
    0x20: 'giant_tree_taiga',
    0x21: 'giant_tree_taiga_hills',
    0x22: 'wooded_mountains',
    0x23: 'savanna',
    0x24: 'savanna_plateau',
    0x25: 'badlands',
    0x26: 'wooded_badlands_plateau',
    0x27: 'badlands_plateau',
    0x28: 'small_end_islands',
    0x29: 'end_midlands',
    0x2A: 'end_highlands',
    0x2B: 'end_barrens',
    0x2C: 'warm_ocean',
    0x2D: 'lukewarm_ocean',
    0x2E: 'cold_ocean',
    0x2F: 'deep_warm_ocean',
    0x30: 'deep_lukewarm_ocean',
    0x31: 'deep_cold_ocean',
    0x32: 'deep_frozen_ocean',
    // Mutated biomes (base + 128)
    0x81: 'sunflower_plains',
    0x82: 'desert_lakes',
    0x83: 'gravelly_mountains',
    0x84: 'flower_forest',
    0x85: 'taiga_mountains',
    0x86: 'swamp_hills',
    0x8c: 'ice_spikes',
    0x95: 'modified_jungle',
    0x97: 'modified_jungle_edge',
    0x9b: 'tall_birch_forest',
    0x9c: 'tall_birch_hills',
    0x9d: 'dark_forest_hills',
    0x9e: 'snowy_taiga_mountains',
    0xa0: 'giant_spruce_taiga',
    0xa1: 'giant_spruce_taiga_hills',
    0xa2: 'modified_gravelly_mountains',
    0xa3: 'shattered_savanna',
    0xa4: 'shattered_savanna_plateau',
    0xa5: 'eroded_badlands',
    0xa6: 'modified_wooded_badlands_plateau',
    0xa7: 'modified_badlands_plateau',
    // 1.14+
    0xa8: 'bamboo_jungle',
    0xa9: 'bamboo_jungle_hills',
    // 1.16+
    0xaa: 'soul_sand_valley',
    0xab: 'crimson_forest',
    0xac: 'warped_forest',
    0xad: 'basalt_deltas',
    // 1.17+
    0xae: 'dripstone_caves',
    0xaf: 'lush_caves',
    // 1.18+
    0xb1: 'meadow',
    0xb2: 'grove',
    0xb3: 'snowy_slopes',
    0xb4: 'jagged_peaks',
    0xb5: 'frozen_peaks',
    0xb6: 'stony_peaks',
    // 1.19+
    0xb7: 'deep_dark',
    0xb8: 'mangrove_swamp',
    // 1.20+
    0xb9: 'cherry_grove',
    // 1.21+
    0xba: 'pale_garden',
};

function parseHeader(filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    let order = 0;
    let steps = [];
    let params = [];
    let nodes = [];

    let inParams = false;
    let inNodes = false;

    for (const line of lines) {
        // Parse order
        const orderMatch = line.match(/btree\w+_order\s*=\s*(\d+)/);
        if (orderMatch) {
            order = parseInt(orderMatch[1]);
        }

        // Parse steps
        const stepsMatch = line.match(/btree\w+_steps\[\]\s*=\s*\{\s*([\d,\s]+)\s*\}/);
        if (stepsMatch) {
            steps = stepsMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        }

        // Detect param section
        if (line.includes('btree') && line.includes('_param[][2]')) {
            inParams = true;
            continue;
        }

        // Detect nodes section
        if (line.includes('btree') && line.includes('_nodes[]')) {
            inParams = false;
            inNodes = true;
            continue;
        }

        // Parse params
        if (inParams) {
            const paramMatches = line.matchAll(/\{\s*(-?\d+)\s*,\s*(-?\d+)\s*\}/g);
            for (const match of paramMatches) {
                params.push([parseInt(match[1]), parseInt(match[2])]);
            }
            if (line.includes('};')) inParams = false;
        }

        // Parse nodes
        if (inNodes) {
            const nodeMatches = line.matchAll(/0x([0-9A-Fa-f]+)/g);
            for (const match of nodeMatches) {
                nodes.push(BigInt('0x' + match[1]));
            }
            if (line.includes('};')) inNodes = false;
        }
    }

    return { order, steps, params, nodes };
}

function convertToJS(data, version) {
    const { order, steps, params, nodes } = data;

    let js = `/**
 * Biome Decision Tree for Minecraft ${version}
 * 
 * Auto-generated from Cubiomes btree${version}.h
 * Original: https://github.com/Cubitect/cubiomes
 * MIT License - Copyright (c) 2020 Cubitect
 */

export const BTREE_${version.toUpperCase().replace('.', '_')} = {
    order: ${order},
    steps: [${steps.join(', ')}],
    params: [
`;

    // Output params
    for (let i = 0; i < params.length; i++) {
        js += `        [${params[i][0]}, ${params[i][1]}],`;
        if ((i + 1) % 4 === 0) js += '\n';
    }

    js += `
    ],
    nodes: [
`;

    // Output nodes as BigInt strings
    for (let i = 0; i < nodes.length; i++) {
        js += `        0x${nodes[i].toString(16).padStart(16, '0')}n,`;
        if ((i + 1) % 4 === 0) js += '\n';
    }

    js += `
    ],
};

/**
 * Lookup biome from climate parameters using the decision tree
 * 
 * @param {number[]} np - Noise parameters: [temp, humid, cont, erosion, depth, weirdness]
 * @returns {number} Biome ID
 */
export function lookupBiome_${version.replace('.', '_')}(np) {
    const tree = BTREE_${version.toUpperCase().replace('.', '_')};
    const params = tree.params;
    const nodes = tree.nodes;
    const steps = tree.steps;
    
    // Scale noise parameters to match tree format (multiply by 10000)
    const scaledNp = np.map(n => Math.round(n * 10000));
    
    let idx = 0;
    
    while (true) {
        const node = nodes[idx];
        
        // Check if leaf node (top byte is 0xFF)
        if ((node >> 56n) === 0xFFn) {
            // Extract biome ID from second byte
            return Number((node >> 48n) & 0xFFn);
        }
        
        // Internal node - extract child index
        const childBase = Number(node >> 48n);
        
        // Determine which child to visit based on parameters
        let childOffset = 0;
        for (let i = 0; i < 6; i++) {
            const paramIdx = Number((node >> BigInt(i * 8)) & 0xFFn);
            if (paramIdx > 0 && paramIdx < params.length) {
                const [min, max] = params[paramIdx];
                if (scaledNp[i] >= min && scaledNp[i] <= max) {
                    // Parameter is in range
                } else if (scaledNp[i] < min) {
                    childOffset |= (1 << i);
                }
            }
        }
        
        idx = childBase + childOffset;
        
        // Safety check
        if (idx >= nodes.length) {
            console.warn('Biome tree lookup out of bounds');
            return 1; // Plains fallback
        }
    }
}
`;

    return js;
}

// Main conversion
function main() {
    const files = [
        { file: 'btree18.h', version: '1.18' },
        { file: 'btree19.h', version: '1.19' },
        { file: 'btree192.h', version: '1.19.2' },
        { file: 'btree20.h', version: '1.20' },
        { file: 'btree21wd.h', version: '1.21' },
    ];

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const { file, version } of files) {
        const inputPath = path.join(SOURCE_DIR, file);
        if (!fs.existsSync(inputPath)) {
            console.log(`Skipping ${file} - not found`);
            continue;
        }

        console.log(`Converting ${file}...`);
        const data = parseHeader(inputPath);
        console.log(`  Order: ${data.order}`);
        console.log(`  Steps: ${data.steps.length}`);
        console.log(`  Params: ${data.params.length}`);
        console.log(`  Nodes: ${data.nodes.length}`);

        const js = convertToJS(data, version);
        const outputPath = path.join(OUTPUT_DIR, `btree_${version.replace('.', '_')}.js`);
        fs.writeFileSync(outputPath, js);
        console.log(`  Written to ${outputPath}`);
    }

    console.log('\nDone!');
}

main();
