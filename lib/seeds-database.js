// Real Seed Database - Built from SSG-seeds and curated sources
// Contains actual verified Minecraft seeds with real data

import { CATEGORIES } from './categories.js';
import ssgSeeds from './seeds-data.json';

// Consolidate everything into one list
// The JSON now contains ALL verified seeds (Manual, Speedrun, SSG, Sister)
export const SEEDS_DATABASE = ssgSeeds.map(seed => {
    // Ensure runtime computed fields if missing
    if (!seed.chunkbaseUrl && seed.seed) {
        return {
            ...seed,
            chunkbaseUrl: `https://www.chunkbase.com/apps/seed-map#${seed.seed}`
        };
    }
    return seed;
});

// Utility functions
export function getSeedById(id) {
    return SEEDS_DATABASE.find(seed => seed.id === id);
}

export function getSeedsByCategory(categoryId) {
    return SEEDS_DATABASE.filter(seed => seed.category === categoryId);
}

export function searchSeeds(query) {
    const lowerQuery = query.toLowerCase();
    return SEEDS_DATABASE.filter(seed =>
        seed.title.toLowerCase().includes(lowerQuery) ||
        seed.seed.includes(query) ||
        seed.description.toLowerCase().includes(lowerQuery) ||
        seed.discoveredBy.toLowerCase().includes(lowerQuery) ||
        seed.category.toLowerCase().includes(lowerQuery)
    );
}

export function filterSeeds({ category, version, minConfidence, showGenerated = true }) {
    return SEEDS_DATABASE.filter(seed => {
        if (category && seed.category !== category) return false;
        if (version === 'java' && !seed.version.java) return false;
        if (version === 'bedrock' && !seed.version.bedrock) return false;
        if (minConfidence !== undefined && seed.confidence < minConfidence) return false;
        if (!showGenerated && seed.isGenerated) return false;
        return true;
    });
}

// Get stats about the database
export function getDatabaseStats() {
    const verified = SEEDS_DATABASE.filter(s => !s.isGenerated).length;
    const generated = SEEDS_DATABASE.filter(s => s.isGenerated).length;
    const byCategory = {};

    Object.keys(CATEGORIES).forEach(cat => {
        byCategory[cat] = SEEDS_DATABASE.filter(s => s.category === cat).length;
    });

    return {
        total: SEEDS_DATABASE.length,
        verified,
        generated,
        byCategory,
        categories: Object.keys(CATEGORIES).length
    };
}
