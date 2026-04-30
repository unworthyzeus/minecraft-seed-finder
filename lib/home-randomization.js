export const PINNED_HOME_SEED_ID = 'man-3257840388504953787-historic';

export function createHomeShuffleSeed() {
    const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : null;

    if (cryptoApi?.getRandomValues) {
        const values = new Uint32Array(1);
        cryptoApi.getRandomValues(values);
        return values[0] >>> 0;
    }

    return Math.floor(Math.random() * 0x100000000) >>> 0;
}

export function isDefaultHomeSeedView({
    searchQuery = '',
    activeCategory = null,
    editionFilter = 'all',
    versionFilter = 'all',
    confidenceFilter = 'all',
    coordinatesFilter = 'all',
    sourceFilter = 'all',
    sortBy = 'confidence',
} = {}) {
    return !searchQuery
        && !activeCategory
        && editionFilter === 'all'
        && versionFilter === 'all'
        && confidenceFilter === 'all'
        && coordinatesFilter === 'all'
        && sourceFilter === 'all'
        && sortBy === 'confidence';
}

function stableShuffleValue(seed, shuffleSeed) {
    const key = `${shuffleSeed}:${seed?.id || seed?.seed || seed?.title || ''}`;
    let hash = (2166136261 ^ (shuffleSeed >>> 0)) >>> 0;

    for (let i = 0; i < key.length; i++) {
        hash ^= key.charCodeAt(i);
        hash = Math.imul(hash, 16777619) >>> 0;
    }

    hash ^= hash >>> 16;
    hash = Math.imul(hash, 2246822507) >>> 0;
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 3266489909) >>> 0;
    hash ^= hash >>> 16;

    return hash >>> 0;
}

export function randomizeHomeSeeds(seeds, shuffleSeed = 0) {
    const pinned = [];
    const rest = [];

    seeds.forEach(seed => {
        if (seed.id === PINNED_HOME_SEED_ID) {
            pinned.push(seed);
        } else {
            rest.push(seed);
        }
    });

    const shuffled = [...rest].sort((a, b) => {
        const delta = stableShuffleValue(a, shuffleSeed) - stableShuffleValue(b, shuffleSeed);
        if (delta !== 0) return delta;
        return String(a.id || a.seed || '').localeCompare(String(b.id || b.seed || ''));
    });

    return [...pinned, ...shuffled];
}
