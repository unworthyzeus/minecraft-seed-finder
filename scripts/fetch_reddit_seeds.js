
const fs = require('fs');
const https = require('https');
const path = require('path');

// CLI Args
const args = process.argv.slice(2);
const groupArg = args.find(a => a.startsWith('--group='))?.split('=')[1] || 'all';
const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1] || 'reddit-seeds-raw.json';
const OUTPUT_FILE = path.join(__dirname, `../data/${outputArg}`);
const TARGET_COUNT = 6000; // High target

// Content Groups
const ENDPOINT_GROUPS = {
    'top': [
        'https://www.reddit.com/r/minecraftseeds/top.json?t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/top.json?t=year&limit=100',
        'https://www.reddit.com/r/minecraftseeds/top.json?t=month&limit=100',
        'https://www.reddit.com/r/minecraftseeds/hot.json?limit=100',
        'https://www.reddit.com/r/minecraftseeds/new.json?limit=100'
    ],
    'versions': [
        'https://www.reddit.com/r/minecraftseeds/search.json?q=1.21&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=1.20&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=1.19&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=1.18&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=bedrock&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=java&restrict_sr=1&sort=top&t=all&limit=100'
    ],
    'biomes': [
        'https://www.reddit.com/r/minecraftseeds/search.json?q=mushroom&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=island&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=mountain&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=lush&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=dripstone&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=cherry&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=badlands&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=jungle&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=ice&restrict_sr=1&sort=top&t=all&limit=100'
    ],
    'structures': [
        'https://www.reddit.com/r/minecraftseeds/search.json?q=mansion&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=village&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=stronghold&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=portal&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=ancient&restrict_sr=1&sort=top&t=all&limit=100',
        // Specific anomaly queries added as requested
        'https://www.reddit.com/r/minecraftseeds/search.json?q=mineshaft&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=fossil&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=geode&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=sinkhole&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=glitch&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=exposed&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=shipwreck&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=temple&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=monument&restrict_sr=1&sort=top&t=all&limit=100'
    ],
    'rare': [
        // Top Sort (Best quality)
        'https://www.reddit.com/r/minecraftseeds/search.json?q=tall%20cactus&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=tallest%20cactus&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=big%20cactus&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=cactus%20height&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=tall%20sugar&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=tallest%20sugar&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=quad%20witch&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=4%20witch%20huts&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=fossil&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=exposed%20fossil&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=diamond%20fossil&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=broken%20portal&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=half%20bed&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=glitched&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=pink%20sheep&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=blue%20axolotl&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=brown%20panda&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=repeating&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=bamboo%20jungle&restrict_sr=1&sort=top&t=all&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=modified%20jungle&restrict_sr=1&sort=top&t=all&limit=100',

        // New Sort (Recent finds, potentially less verified but fills count)
        'https://www.reddit.com/r/minecraftseeds/search.json?q=tall%20cactus&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=tallest%20sugar&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=4%20high%20sugar&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=5%20high%20sugar&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=tall%20reeds&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=tallest%20reeds&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=fossil&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=glitched&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=rare&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=glitched%20mineshaft&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=surface%20mineshaft&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=exposed%20mineshaft&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=pig%20spawner&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=badlands%20mineshaft&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=mega%20fossil&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=skeleton%20fossil&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=end%20anomaly&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=glitched%20end&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=nether%20anomaly&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=fortress%20anomaly&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=bastion%20glitch&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=end%20city%20glitch&restrict_sr=1&sort=new&limit=100',
        'https://www.reddit.com/r/minecraftseeds/search.json?q=floating%20end%20city&restrict_sr=1&sort=new&limit=100'
    ],
    'brute': [
        'forest', 'desert', 'plains', 'savanna', 'taiga', 'snow', 'ice', 'jungle', 'swamp', 'badlands',
        'mountain', 'cave', 'cliff', 'river', 'ocean', 'lake', 'lava', 'water', 'gold', 'diamond',
        'iron', 'emerald', 'copper', 'coal', 'obsidian', 'bedrock', 'stone', 'dirt', 'grass', 'sand',
        'gravel', 'clay', 'mud', 'wood', 'tree', 'flower', 'bamboo', 'cactus', 'sugar', 'kelp', 'coral',
        'fish', 'squid', 'dolphin', 'turtle', 'panda', 'fox', 'wolf', 'cat', 'horse', 'donkey', 'mule',
        'llama', 'parrot', 'bee', 'goat', 'frog', 'axolotl', 'allay', 'warden', 'wither', 'dragon',
        'steve', 'alex', 'seed', 'spawn', 'map', 'world', 'base', 'build', 'house', 'city', 'town'
    ].map(k => `https://www.reddit.com/r/minecraftseeds/search.json?q=${k}&restrict_sr=1&sort=top&t=all&limit=100`)
};

const ENDPOINTS = groupArg === 'all'
    ? Object.values(ENDPOINT_GROUPS).flat()
    : (ENDPOINT_GROUPS[groupArg] || []);

if (ENDPOINTS.length === 0) {
    console.error(`Invalid group: ${groupArg}. Available: top, versions, biomes, structures, brute`);
    process.exit(1);
}

async function fetchUrl(url) {
    return new Promise((resolve) => {
        setTimeout(() => {
            https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode !== 200) { resolve(null); return; }
                    try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
                });
            }).on('error', () => resolve(null));
        }, 300);
    });
}

function extractSeed(title, selftext) {
    const text = (title + ' ' + (selftext || '')).replace(/\n/g, ' ');
    const explicitMatch = text.match(/Seed\s*[:=]\s*([a-zA-Z0-9-]+)/i);
    if (explicitMatch) {
        const val = explicitMatch[1];
        if (val.length > 3 && !['is', 'the', 'for', 'are', 'was', 'and', 'wit', 'look', 'java', 'seed'].includes(val.toLowerCase())) return val;
    }
    const numericMatch = text.match(/(?<!v)(?<!\.)\b(-?\d{8,30})\b(?!\.)/);
    if (numericMatch) return numericMatch[1];
    const shortNegMatch = text.match(/\b(-?\d{4,15})\b/);
    if (shortNegMatch && text.includes(shortNegMatch[0])) return shortNegMatch[1];
    return null;
}

function extractVersion(title, flair) {
    const t = (title + ' ' + (flair || '')).toLowerCase();
    const version = { java: null, bedrock: null };

    const isJava = t.includes('java');
    const isBedrock = t.includes('bedrock') || t.includes('pe') || t.includes('pocket') || t.includes('mcpe') || t.includes('console');

    // Look for more specific version first
    const specificMatch = t.match(/1\.(2[01]|[0-9]{1,2})(\.[0-9]{1,2})?/);
    const v = specificMatch ? specificMatch[0] : "1.18+";

    if (isJava) version.java = v;
    else if (isBedrock) version.bedrock = v;
    else { version.java = v; version.bedrock = v; }
    return version;
}

function determineCategory(title, flair) {
    const t = (title + ' ' + (flair || '')).toLowerCase();

    if (t.includes('mushroom') && (t.includes('spawn') || t.includes('island'))) return 'mushroom_spawn';
    if (t.includes('island') && (t.includes('survival') || t.includes('small'))) return 'spawn_oddity';
    if (t.includes('badlands') && t.includes('spawn')) return 'rare_biome';
    if (t.includes('jungle') && t.includes('spawn')) return 'rare_biome';
    if (t.includes('ice') && t.includes('spikes')) return 'rare_biome';
    if (t.includes('cherry')) return 'rare_biome';

    if (t.includes('mansion') && (t.includes('desert') || t.includes('mesa') || t.includes('sand') || t.includes('beach'))) return 'desert_mansion';
    if (t.includes('mansion')) return 'rare_biome'; // Default to rare biome if not a desert mansion anomaly

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
    if (t.includes('broken') && !t.includes('end')) return 'end_portal_missing'; // Generic "Broken" often refers to portals

    if (t.includes('end') && (t.includes('anomaly') || t.includes('weird') || t.includes('glitch') || t.includes('island') || t.includes('city'))) return 'end_anomaly';
    if (!t.includes('end') && (t.includes('anomaly') || t.includes('weird') || t.includes('glitch'))) return 'rare_biome'; // Move non-end anomalies to biomes

    if (t.includes('nether') && (t.includes('anomaly') || t.includes('weird') || t.includes('glitch') || t.includes('overlap'))) return 'nether_anomaly';
    if (t.includes('portal')) return 'ruined_portal'; // Default to ruined if just "portal"
    if (t.includes('sinkhole')) return 'rare_biome';
    if (t.includes('repeating')) return 'rare_biome';

    if (t.includes('speedrun')) return 'speedrun';
    if (t.includes('spawner')) return 'spawner_anomaly';

    // Fallback classification for specific anomaly queries
    if (t.includes('monument')) return 'monument_anomaly';
    if (t.includes('shipwreck')) return 'shipwreck_anomaly';
    if (t.includes('geode')) return 'geode_anomaly';

    // Rare specific logic
    if (t.includes('cactus') && (t.includes('tall') || t.includes('block') || t.includes('high') || t.includes('height') || t.includes('giant') || t.includes('big'))) return 'tall_cactus';
    if ((t.includes('sugar') || t.includes('cane') || t.includes('reeds')) && (t.includes('tall') || t.includes('high') || t.includes('block') || t.includes('5') || t.includes('4'))) return 'tall_sugarcane';
    if ((t.includes('fossil') || t.includes('spine') || t.includes('rib cage'))) return 'fossil_diamonds'; // Corrected ID
    if (t.includes('witch') && t.includes('hut') && (t.includes('quad') || t.includes('4') || t.includes('four') || t.includes('multi'))) return 'quad_witch_hut';
    if (t.includes('sheep') && t.includes('pink')) return 'mob_spawn';
    if (t.includes('panda') && t.includes('brown')) return 'mob_spawn';
    if (t.includes('axolotl') && t.includes('blue')) return 'mob_spawn';
    if (t.includes('spawner') && (t.includes('exposed') || t.includes('surface'))) return 'spawner_anomaly';
    if (t.includes('mineshaft') && (t.includes('surface') || t.includes('exposed') || t.includes('glitch') || t.includes('high'))) return 'mineshaft_anomaly';
    // Catch-all for mineshafts in 'rare' context (if scraper group is rare) - simplified logic:
    if (t.includes('mineshaft') && (t.includes('badlands') || t.includes('mesa'))) return 'mineshaft_anomaly'; // Common surface start

    // Shape/Sus/Meme detection (User request)
    if (t.includes('penis') || t.includes('dick') || t.includes('cock') || t.includes('pp') || t.includes('phallic')) return 'shape_anomaly';
    if (t.includes('sus') || t.includes('shape') || t.includes('looks like')) return 'shape_anomaly';

    return 'rare_biome';
}

function cleanTitle(title, seed, version) {
    let clean = title;
    // Remove the seed value
    if (seed) clean = clean.replace(new RegExp(seed, 'gi'), '');

    // Remove version numbers like [1.19], 1.20, (1.18+)
    clean = clean.replace(/\[?\(?1\.\d+(\.\d+)?\+?\)\]?/g, '');

    // Remove platform tags
    clean = clean.replace(/\[?(bedrock|java|pe|xb1)\]?/gi, '');

    // Remove specific keywords often in titles
    clean = clean.replace(/\b(seed|version)\b/gi, '');

    // Cleanup whitespace and punctuation artifacts
    clean = clean.replace(/[:|\-]/g, ' ') // replace separators with space
        .replace(/\s+/g, ' ')     // collapse spaces
        .replace(/^\s*[\(\[\{]+/, '') // remove leading brackets
        .replace(/[\)\]\}]+\s*$/, '') // remove trailing brackets
        .trim();

    // Capitalize first letter
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

async function scrape() {
    let seeds = [];
    let seenIds = new Set();

    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE));
            existing.forEach(s => { seeds.push(s); seenIds.add(s.id); });
        } catch (e) { }
    }

    console.log(`[${groupArg}] Starting scrape to ${OUTPUT_FILE}...`);

    for (const endpointBase of ENDPOINTS) {
        let after = null;
        let url = endpointBase;
        let pages = 0;
        const PAGES_LIMIT = 50;

        console.log(`[${groupArg}] Endpoint: ${endpointBase.split('?')[0]} query: ${endpointBase.split('q=')[1] || 'ALL'}`);

        while (pages < PAGES_LIMIT && seeds.length < TARGET_COUNT) {
            if (after) {
                const separator = endpointBase.includes('?') ? '&' : '?';
                url = `${endpointBase}${separator}after=${after}`;
            }

            const json = await fetchUrl(url);

            if (!json || !json.data || !json.data.children || json.data.children.length === 0) break;

            const posts = json.data.children;

            for (const post of posts) {
                const p = post.data;

                const id = `reddit_${p.id}`;
                if (seenIds.has(id)) continue;

                if (p.score < 5) continue;

                const seedValue = extractSeed(p.title, p.selftext);
                if (!seedValue) continue;

                seenIds.add(id);

                const extractedVersion = extractVersion(p.link_flair_text, p.title);
                const category = determineCategory(p.title, p.link_flair_text);

                // CLEAN TITLE LOGIC
                let finalTitle = cleanTitle(p.title, seedValue, extractedVersion);
                if (finalTitle.length < 5) finalTitle = p.title; // Fallback

                const newSeed = {
                    id: id,
                    seed: seedValue,
                    title: finalTitle.substring(0, 100).replace(/"/g, ''),
                    description: (p.title + '\n' + (p.selftext || '')).substring(0, 300).trim(),
                    image: p.url_overridden_by_dest && p.url_overridden_by_dest.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? p.url_overridden_by_dest : (p.preview && p.preview.images[0].source.url.replace(/&amp;/g, '&')) || '/images/seeds/placeholder.jpg',
                    category: category,
                    discoveredBy: `u/${p.author}`,
                    discoveredDate: new Date(p.created_utc * 1000).toISOString().split('T')[0],
                    version: extractedVersion,
                    confidence: p.score > 20 ? 0.9 : 0.8,
                    isGenerated: false,
                    sourceUrl: `https://www.reddit.com${p.permalink}`
                };

                seeds.push(newSeed);
            }

            after = json.data.after;
            if (!after) break;
            pages++;

            if (seeds.length >= TARGET_COUNT) break;
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(seeds, null, 2));
        if (seeds.length >= TARGET_COUNT) break;
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(seeds, null, 2));
    console.log(`[${groupArg}] COMPLETE. Saved ${seeds.length} seeds.`);
}

scrape();
