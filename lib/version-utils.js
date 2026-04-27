export const CURRENT_MINECRAFT_VERSIONS = {
    java: {
        version: '26.1.2',
        source: 'https://www.minecraft.net/en-us/article/minecraft-java-edition-26-1-2',
    },
    bedrock: {
        version: '26.13',
        source: 'https://feedback.minecraft.net/hc/en-us/articles/44799887672973-Minecraft-Bedrock-Edition-26-13-Hotfix-Changelog',
    },
};

export const EDITIONS = {
    java: 'Java Edition',
    bedrock: 'Bedrock Edition',
};

const RELEASE_VERSION_RE = /^(\d+)\.(\d+)(?:\.(\d+))?(\+)?$/;
const BETA_VERSION_RE = /^Beta\s+(\d+)\.(\d+)(?:\.(\d+))?$/i;
const ALPHA_VERSION_RE = /^Alpha\s+(\d+)\.(\d+)(?:\.(\d+))?(?:_(\d+))?$/i;

export function parseMinecraftVersion(value) {
    if (value == null || value === '') return null;

    const raw = String(value).trim();
    let match = raw.match(RELEASE_VERSION_RE);
    if (match) {
        const major = Number(match[1]);
        const minor = Number(match[2]);
        const patch = match[3] == null ? null : Number(match[3]);
        if (major === 1 && (match[2].length > 2 || minor > 21)) return null;
        if (major !== 1 && major < 26) return null;
        return {
            raw,
            type: major >= 26 ? 'calendar' : 'release',
            major,
            minor,
            patch,
            plus: Boolean(match[4]),
            familyMinor: major >= 26 ? 21 : minor,
        };
    }

    match = raw.match(BETA_VERSION_RE);
    if (match) {
        return {
            raw,
            type: 'beta',
            major: Number(match[1]),
            minor: Number(match[2]),
            patch: match[3] == null ? null : Number(match[3]),
            plus: false,
            familyMinor: -1,
        };
    }

    match = raw.match(ALPHA_VERSION_RE);
    if (match) {
        return {
            raw,
            type: 'alpha',
            major: Number(match[1]),
            minor: Number(match[2]),
            patch: match[3] == null ? null : Number(match[3]),
            revision: match[4] == null ? null : Number(match[4]),
            plus: false,
            familyMinor: -2,
        };
    }

    return null;
}

export function isNumericMinecraftVersion(value) {
    return parseMinecraftVersion(value) !== null;
}

export function getSeedEditions(seed) {
    const version = seed?.version || {};
    return /** @type {Array<{edition: 'java'|'bedrock', label: string, version: string}>} */ ([
        version.java ? { edition: 'java', label: EDITIONS.java, version: String(version.java) } : null,
        version.bedrock ? { edition: 'bedrock', label: EDITIONS.bedrock, version: String(version.bedrock) } : null,
    ].filter(Boolean));
}

export function getPreferredSeedEdition(seed) {
    const editions = getSeedEditions(seed);
    return editions.find(e => e.edition === 'java') || editions[0] || null;
}

export function getSupportedGeneratorMinor(version) {
    const parsed = parseMinecraftVersion(version);
    if (!parsed) return 21;
    if (parsed.type === 'alpha' || parsed.type === 'beta') return parsed.minor >= 8 ? 8 : 7;
    return Math.max(0, Math.min(21, parsed.familyMinor));
}

export function getSeedVersionIssues(seed) {
    const issues = [];
    const editions = getSeedEditions(seed);
    if (editions.length === 0) {
        issues.push('missing java/bedrock version');
    }

    for (const entry of editions) {
        if (!isNumericMinecraftVersion(entry.version)) {
            issues.push(`${entry.edition} version is not numeric: ${entry.version}`);
        }
    }

    return issues;
}
