// Expanded Minecraft Seed Categories
// Based on research from Minecraft At Home and rare anomaly documentation

export const CATEGORIES = {
    // Portal anomalies
    end_portal_12eye: {
        id: 'end_portal_12eye',
        name: '12-Eye End Portals',
        icon: '🌀',
        description: 'Fully activated End Portals with all 12 eyes filled naturally',
        probability: '~1 in 10¹²',
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

    // Structure combinations
    structure_combo: {
        id: 'structure_combo',
        name: 'Structure Combos',
        icon: '🏛️',
        description: 'Multiple rare structures overlapping or generating together',
        probability: '~1 in billions',
        color: '#f59e0b',
        rarity: 9
    },
    spawner_anomaly: {
        id: 'spawner_anomaly',
        name: 'Spawner Anomalies',
        icon: '🔥',
        description: 'Unusual spawner configurations including floating and multiple spawners',
        probability: 'Varies',
        color: '#ef4444',
        rarity: 10
    },
    desert_mansion: {
        id: 'desert_mansion',
        name: 'Desert Mansions',
        icon: '🏜️',
        description: 'Woodland mansions spawned in desert biomes',
        probability: '~1 in 100 billion',
        color: '#d97706',
        rarity: 11
    },

    // Natural formations
    tall_cactus: {
        id: 'tall_cactus',
        name: 'Tall Cacti',
        icon: '🌵',
        description: 'Exceptionally tall cactus formations (4+ blocks)',
        probability: 'Varies by height',
        color: '#22c55e',
        rarity: 6
    },
    tall_sugarcane: {
        id: 'tall_sugarcane',
        name: 'Tall Sugarcane',
        icon: '🎋',
        description: 'Sugarcane taller than the normal 4 block maximum',
        probability: '~1 in 10⁸',
        color: '#84cc16',
        rarity: 8
    },
    fossil_diamonds: {
        id: 'fossil_diamonds',
        name: 'Diamond Fossils',
        icon: '💎',
        description: 'Fossils with diamond ore embedded in them',
        probability: '~0.002%',
        color: '#06b6d4',
        rarity: 5
    },

    // Biome oddities
    rare_biome: {
        id: 'rare_biome',
        name: 'Rare Biomes',
        icon: '🗺️',
        description: 'Modified Jungle Edge, Mushroom Island spawns, and other rare biome configurations',
        probability: '~0.0001%',
        color: '#10b981',
        rarity: 7
    },
    mushroom_spawn: {
        id: 'mushroom_spawn',
        name: 'Mushroom Island Spawns',
        icon: '🍄',
        description: 'Direct spawn on mushroom islands',
        probability: '~1 in 10 billion',
        color: '#ec4899',
        rarity: 10
    },

    // Spawn anomalies
    spawn_oddity: {
        id: 'spawn_oddity',
        name: 'Spawn Oddities',
        icon: '🎯',
        description: 'Unusual spawn locations including far spawns and stronghold spawns',
        probability: '~1 in trillions',
        color: '#06b6d4',
        rarity: 12
    },
    stronghold_spawn: {
        id: 'stronghold_spawn',
        name: 'Stronghold Spawns',
        icon: '🏰',
        description: 'Spawning directly inside a stronghold',
        probability: '~1 in 100 trillion',
        color: '#6366f1',
        rarity: 14
    },

    // Village anomalies
    village_anomaly: {
        id: 'village_anomaly',
        name: 'Village Anomalies',
        icon: '🏘️',
        description: 'Abandoned village clusters, pillager outposts inside villages',
        probability: 'Varies',
        color: '#78716c',
        rarity: 8
    },
    quad_witch_hut: {
        id: 'quad_witch_hut',
        name: 'Quad Witch Huts',
        icon: '🧙‍♀️',
        description: 'Four witch huts in a single spawn chunk area',
        probability: '~1 in 100 million',
        color: '#7c3aed',
        rarity: 8
    },

    // Historic seeds
    historic: {
        id: 'historic',
        name: 'Historic Seeds',
        icon: '📜',
        description: 'Lost or iconic seeds from Minecraft history',
        probability: 'Unique',
        color: '#dc2626',
        rarity: 0 // Special
    },

    // Speedrun
    speedrun: {
        id: 'speedrun',
        name: 'Speedrun Seeds',
        icon: '⚡',
        description: 'Optimized seeds for speedrunning categories',
        probability: 'Hand-picked',
        color: '#f97316',
        rarity: 0 // Special
    },

    // End anomalies
    end_anomaly: {
        id: 'end_anomaly',
        name: 'End Anomalies',
        icon: '🌌',
        description: 'Missing End islands, Elder Guardians in the End, and other End dimension oddities',
        probability: '~1 in quadrillions',
        color: '#1e1b4b',
        rarity: 16
    },

    // Mineshaft anomalies
    mineshaft_anomaly: {
        id: 'mineshaft_anomaly',
        name: 'Mineshaft Anomalies',
        icon: '⛏️',
        description: 'Multiple spawners, stacked chests, and pig spawner glitches',
        probability: '~1 in quintillions',
        color: '#854d0e',
        rarity: 18
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

    // Mob spawns (for seeds with guaranteed rare mobs)
    mob_spawn: {
        id: 'mob_spawn',
        name: 'Rare Mob Seeds',
        icon: '🐑',
        description: 'Seeds with guaranteed rare mob spawns like pink sheep, brown mooshrooms',
        probability: 'Varies',
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
    verified: { min: 0.9, label: 'Verified', color: '#22c55e', icon: '🟢', description: 'Confirmed by multiple independent sources' },
    likely: { min: 0.7, label: 'Likely', color: '#eab308', icon: '🟡', description: 'Reported with evidence but not fully verified' },
    plausible: { min: 0.5, label: 'Plausible', color: '#f97316', icon: '🟠', description: 'Community submitted with some evidence' },
    unverified: { min: 0.3, label: 'Unverified', color: '#ef4444', icon: '🔴', description: 'Needs confirmation' },
    generated: { min: 0, label: 'Generated', color: '#6b7280', icon: '⚫', description: 'Algorithmically generated, unconfirmed' }
};

export function getConfidenceLevel(confidence) {
    if (confidence >= 0.9) return CONFIDENCE_LEVELS.verified;
    if (confidence >= 0.7) return CONFIDENCE_LEVELS.likely;
    if (confidence >= 0.5) return CONFIDENCE_LEVELS.plausible;
    if (confidence >= 0.3) return CONFIDENCE_LEVELS.unverified;
    return CONFIDENCE_LEVELS.generated;
}

// Probability parser for sorting/filtering
export function parseProbability(probString) {
    if (!probString) return Infinity;

    // Handle special cases
    if (probString.toLowerCase().includes('unique')) return 0;
    if (probString.toLowerCase().includes('hand-picked')) return 0;
    if (probString.toLowerCase().includes('varies')) return 1e9;

    // Parse "1 in X" format
    const match = probString.match(/1\s*(?:in|\/)\s*([\d.]+)\s*(?:\*\s*10\^?|×10\^?|e)?(\d+)?/i);
    if (match) {
        const base = parseFloat(match[1]);
        const exp = match[2] ? parseInt(match[2]) : 0;
        return base * Math.pow(10, exp);
    }

    // Parse percentage
    const percentMatch = probString.match(/([\d.]+)%/);
    if (percentMatch) {
        return 100 / parseFloat(percentMatch[1]);
    }

    return 1e9;
}
