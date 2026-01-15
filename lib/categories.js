// Expanded Minecraft Seed Categories
// Based on research from Minecraft At Home and rare anomaly documentation

export const CATEGORIES = {
    // Portal anomalies
    end_portal_12eye: {
        id: 'end_portal_12eye',
        name: '12-Eye End Portals',
        icon: '🌀',
        description: 'Fully activated End Portals with all 12 eyes filled naturally',
        probability: '1 in 10¹² (~1 in a trillion)',
        color: '#8b5cf6',
        rarity: 12
    },
    end_portal_missing: {
        id: 'end_portal_missing',
        name: 'Broken End Portals',
        icon: '💔',
        description: 'End Portals with missing frames but still somehow activated',
        probability: '~1 in 10¹⁵',
        color: '#a855f7',
        rarity: 15
    },
    ruined_portal: {
        id: 'ruined_portal',
        name: 'Ruined Portals',
        icon: '🏚️',
        description: 'Unusual ruined nether portal generation: floating, in structures, or massive',
        probability: 'Varies by anomaly',
        color: '#4c1d95',
        rarity: 4
    },

    // Structure combinations
    structure_combo: {
        id: 'structure_combo',
        name: 'Structure Combos',
        icon: '🏛️',
        description: 'Multiple rare structures overlapping or generating together',
        probability: 'Varies (~1 in 100M+)',
        color: '#f59e0b',
        rarity: 8
    },
    spawner_anomaly: {
        id: 'spawner_anomaly',
        name: 'Spawner Anomalies',
        icon: '🔥',
        description: 'Unusual spawner configurations including exposed, double, or floating spawners',
        probability: 'Exposed: Rare | Double: ~1 in 1000',
        color: '#ef4444',
        rarity: 3
    },
    desert_mansion: {
        id: 'desert_mansion',
        name: 'Desert Mansions',
        icon: '🏜️',
        description: 'Woodland mansions spawned in or adjacent to desert biomes',
        probability: '~1 in 10¹¹',
        color: '#d97706',
        rarity: 11
    },

    // Natural formations
    tall_cactus: {
        id: 'tall_cactus',
        name: 'Tall Cacti',
        icon: '🌵',
        description: 'Exceptionally tall cactus formations (20+ blocks)',
        probability: '~1 in 10¹⁸ (Quintillion)',
        color: '#22c55e',
        rarity: 18
    },
    tall_sugarcane: {
        id: 'tall_sugarcane',
        name: 'Tall Sugarcane',
        icon: '🎋',
        description: 'Sugarcane taller than the normal 3 block maximum (4 blocks)',
        probability: '4-block: Rare',
        color: '#84cc16',
        rarity: 8
    },
    fossil_diamonds: {
        id: 'fossil_diamonds',
        name: 'Diamond Fossils',
        icon: '💎',
        description: 'Fossils with diamond ore embedded in them',
        probability: '~1 in 500 fossils',
        color: '#06b6d4',
        rarity: 5
    },

    // Biome oddities
    rare_biome: {
        id: 'rare_biome',
        name: 'Rare Biomes',
        icon: '🗺️',
        description: 'Modified Jungle Edge (0.0001%), Mushroom Island spawns, etc.',
        probability: 'Mod. Jungle Edge: ~1 in 1,000,000',
        color: '#10b981',
        rarity: 7
    },
    mushroom_spawn: {
        id: 'mushroom_spawn',
        name: 'Mushroom Island Spawns',
        icon: '🍄',
        description: 'Direct spawn on mushroom islands',
        probability: 'Biome coverage: 0.56% (Rare Spawn)',
        color: '#ec4899',
        rarity: 10
    },

    // Spawn anomalies
    spawn_oddity: {
        id: 'spawn_oddity',
        name: 'Spawn Oddities',
        icon: '🎯',
        description: 'Unusual spawn locations: Shipwrecks, tiny islands, buried spawns',
        probability: 'Varies by type',
        color: '#06b6d4',
        rarity: 4
    },
    stronghold_spawn: {
        id: 'stronghold_spawn',
        name: 'Stronghold Spawns',
        icon: '🏰',
        description: 'Spawning directly above or inside a stronghold',
        probability: '~1 in 10¹¹',
        color: '#6366f1',
        rarity: 11
    },

    // Village anomalies
    village_anomaly: {
        id: 'village_anomaly',
        name: 'Village Anomalies',
        icon: '🏘️',
        description: 'Zombie villages, double villages, or weird generation',
        probability: 'Zombie Village: ~2% of villages',
        color: '#78716c',
        rarity: 4
    },
    quad_witch_hut: {
        id: 'quad_witch_hut',
        name: 'Quad Witch Huts',
        icon: '🧙‍♀️',
        description: 'Four witch huts in a single spawn chunk area',
        probability: '~1 in 1.6×10⁸',
        color: '#7c3aed',
        rarity: 8
    },

    // Historic seeds
    historic: {
        id: 'historic',
        name: 'Historic Seeds',
        icon: '📜',
        description: 'Lost or iconic seeds from Minecraft history',
        probability: 'Unique (1 in 2⁶⁴)',
        color: '#dc2626',
        rarity: 25
    },

    // Speedrun
    speedrun: {
        id: 'speedrun',
        name: 'Speedrun Seeds',
        icon: '⚡',
        description: 'Optimized seeds for speedrunning categories',
        probability: 'Filtered (Top 0.0001%)',
        color: '#f97316',
        rarity: 9
    },



    // End anomalies
    end_anomaly: {
        id: 'end_anomaly',
        name: 'End Anomalies',
        icon: '🌌',
        description: 'Missing End islands, Elder Guardians in the End, and other End dimension oddities',
        probability: '~1 in 10¹⁵',
        color: '#1e1b4b',
        rarity: 16
    },

    // Mineshaft anomalies
    mineshaft_anomaly: {
        id: 'mineshaft_anomaly',
        name: 'Mineshaft Anomalies',
        icon: '⛏️',
        description: 'Exposed, surface, or glitched mineshaft generation',
        probability: 'Varies',
        color: '#854d0e',
        rarity: 6
    },

    // Nether structures
    nether_anomaly: {
        id: 'nether_anomaly',
        name: 'Nether Anomalies',
        icon: '🔶',
        description: 'Shroomlight-covered fungi, bastion overlaps, and fortress anomalies',
        probability: 'Varies',
        color: '#ea580c',
        rarity: 10
    },

    // Ocean anomalies
    monument_anomaly: {
        id: 'monument_anomaly',
        name: 'Monument Anomalies',
        icon: '🏯',
        description: 'Ocean Monuments generated in inland lakes, aquifers, or intersecting strongholds',
        probability: '~1 in 10⁹',
        color: '#0ea5e9',
        rarity: 12
    },
    shipwreck_anomaly: {
        id: 'shipwreck_anomaly',
        name: 'Shipwreck Anomalies',
        icon: '⚓',
        description: 'Shipwrecks generating completely on land, inside icebergs, or in the sky',
        probability: 'Varies (Land: Rare)',
        color: '#713f12',
        rarity: 8
    },

    // Geological anomalies
    geode_anomaly: {
        id: 'geode_anomaly',
        name: 'Geode Anomalies',
        icon: '💎',
        description: 'Amethyst Geodes breaking bedrock, generating in the sky, or interrupting structures',
        probability: '~1 in 10¹⁰',
        color: '#a855f7',
        rarity: 10
    },

    // Shape anomalies (User request)
    shape_anomaly: {
        id: 'shape_anomaly',
        name: 'Shape Anomalies',
        icon: '🍆', // Suggestive but relevant icon
        description: 'Terrain generation forming unusual, recognizable, or suggestive shapes',
        probability: 'Subjective',
        color: '#be185d',
        rarity: 5
    },

    // Mob spawns (for seeds with guaranteed rare mobs)
    mob_spawn: {
        id: 'mob_spawn',
        name: 'Rare Mob Seeds',
        icon: '🐑',
        description: 'Seeds with guaranteed rare mob spawns like pink sheep, brown mooshrooms',
        probability: 'Pink Sheep: ~0.164% per sheep',
        color: '#f472b6',
        rarity: 4
    }
};

// Minecraft version database
export const VERSIONS = {
    java: [
        { id: 'java_1.21', name: 'Java 1.21+', released: '2024-06-13' },
        { id: 'java_1.20', name: 'Java 1.20.x', released: '2023-06-07' },
        { id: 'java_1.19', name: 'Java 1.19.x', released: '2022-06-07' },
        { id: 'java_1.18', name: 'Java 1.18.x', released: '2021-11-30' },
        { id: 'java_1.17', name: 'Java 1.17.x', released: '2021-06-08' },
        { id: 'java_1.16', name: 'Java 1.16.x', released: '2020-06-23' },
        { id: 'java_1.15', name: 'Java 1.15.x', released: '2019-12-10' },
        { id: 'java_1.14', name: 'Java 1.14.x', released: '2019-04-23' },
        { id: 'java_1.13', name: 'Java 1.13.x', released: '2018-07-18' },
        { id: 'java_1.12', name: 'Java 1.12.x', released: '2017-06-07' },
        { id: 'java_legacy', name: 'Java Legacy', released: null }
    ],
    bedrock: [
        { id: 'bedrock_1.21', name: 'Bedrock 1.21+', released: '2024-06-13' },
        { id: 'bedrock_1.20', name: 'Bedrock 1.20.x', released: '2023-06-07' },
        { id: 'bedrock_1.19', name: 'Bedrock 1.19.x', released: '2022-06-07' },
        { id: 'bedrock_1.18', name: 'Bedrock 1.18.x', released: '2021-11-30' },
        { id: 'bedrock_legacy', name: 'Bedrock Legacy', released: null }
    ]
};

export const CONFIDENCE_LEVELS = {
    verified: { min: 1.0, label: 'Verified', color: '#22c55e', icon: '🟢', description: 'Confirmed by experts or official speedrun sources' },
    community: { min: 0.9, label: 'Community Reported', color: '#eab308', icon: '🟡', description: 'Reported by the community (e.g. Reddit) but not fully expert-verified' },
    likely: { min: 0.7, label: 'Likely', color: '#f97316', icon: '🟠', description: 'Reported with evidence but may have inconsistencies' },
    plausible: { min: 0.5, label: 'Plausible', color: '#f97316', icon: '🟠', description: 'Community submitted with some evidence' },
    unverified: { min: 0.3, label: 'Unverified', color: '#ef4444', icon: '🔴', description: 'Needs confirmation' },
    generated: { min: 0, label: 'Generated', color: '#6b7280', icon: '⚫', description: 'Algorithmically generated, unconfirmed' }
};

export function getConfidenceLevel(confidence) {
    if (confidence >= 1.0) return CONFIDENCE_LEVELS.verified;
    if (confidence >= 0.9) return CONFIDENCE_LEVELS.community;
    if (confidence >= 0.7) return CONFIDENCE_LEVELS.likely;
    if (confidence >= 0.5) return CONFIDENCE_LEVELS.plausible;
    if (confidence >= 0.3) return CONFIDENCE_LEVELS.unverified;
    return CONFIDENCE_LEVELS.generated;
}

// Probability parser for sorting/filtering
export function parseProbability(probString) {
    if (!probString) return 0;

    const lower = probString.toLowerCase();

    // Handle special cases
    if (lower.includes('unique')) return Infinity;
    if (lower.includes('hand-picked')) return 0; // Not ranked by rarity
    if (lower.includes('varies') || lower.includes('unknown')) return 0; // Push to bottom

    // Normalize string:
    // 1. Replace unicode superscripts
    let clean = probString.replace(/,/g, ''); // Remove commas

    // Convert unicode superscripts to ^digits (e.g., 10¹² -> 10^12)
    clean = clean.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (match) => {
        const map = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
        return '^' + match.split('').map(c => map[c]).join('');
    });

    // Parse "1 in X" where X can be 10^Y, 10eY, or just Number
    // Captures: 1: Base, 2: Separator, 3: Exponent
    const oneInMatch = clean.match(/1\s*(?:in|\/)\s*([\d.]+)(?:\s*(\^|e|\*10\^?|x10\^?|\*10\*\*|x10\*\*|×10\^?)\s*(\-?\d+))?/i);

    if (oneInMatch) {
        const base = parseFloat(oneInMatch[1]);
        const separator = oneInMatch[2] ? oneInMatch[2].toLowerCase() : null;
        const exp = oneInMatch[3] ? parseFloat(oneInMatch[3]) : 0;

        if (separator) {
            // If separator is strictly '^', treat as power function (10^12)
            if (separator === '^') {
                return Math.pow(base, exp);
            }
            // Scientific notation (e, *10^, etc) -> Base * 10^Exp
            return base * Math.pow(10, exp);
        }

        // No separator, just a base number
        return base;
    }

    // Parse percentage
    const percentMatch = clean.match(/([\d.]+)%/);
    if (percentMatch) {
        return 100 / parseFloat(percentMatch[1]);
    }

    return 0;
}
