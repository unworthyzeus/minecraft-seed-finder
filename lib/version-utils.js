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

const option = (value, label, description = null) => ({ value, label, description });

export const JAVA_WORLDGEN_VERSION_OPTIONS = [
    option('26.1.2', 'Java 26.1.2 (current)'),
    option('26.1.1', 'Java 26.1.1'),
    option('26.1', 'Java 26.1'),
    option('1.21.11', 'Java 1.21.11'),
    option('1.21.10', 'Java 1.21.10'),
    option('1.21.9', 'Java 1.21.9'),
    option('1.21.8', 'Java 1.21.8'),
    option('1.21.7', 'Java 1.21.7'),
    option('1.21.6', 'Java 1.21.6'),
    option('1.21.5', 'Java 1.21.5'),
    option('1.21.4', 'Java 1.21.4'),
    option('1.21.3', 'Java 1.21.3'),
    option('1.21.2', 'Java 1.21.2'),
    option('1.21.1', 'Java 1.21.1'),
    option('1.21', 'Java 1.21'),
    option('1.20.6', 'Java 1.20.6'),
    option('1.20.4', 'Java 1.20.4'),
    option('1.20.2', 'Java 1.20.2'),
    option('1.20.1', 'Java 1.20.1'),
    option('1.20', 'Java 1.20'),
    option('1.19.4', 'Java 1.19.4'),
    option('1.19.2', 'Java 1.19.2'),
    option('1.19', 'Java 1.19'),
    option('1.18.2', 'Java 1.18.2'),
    option('1.18', 'Java 1.18'),
    option('1.17.1', 'Java 1.17.1'),
    option('1.17', 'Java 1.17'),
    option('1.16.5', 'Java 1.16.5'),
    option('1.16.1', 'Java 1.16.1'),
    option('1.16', 'Java 1.16'),
    option('1.15.2', 'Java 1.15.2'),
    option('1.14.4', 'Java 1.14.4'),
    option('1.13.2', 'Java 1.13.2'),
    option('1.12.2', 'Java 1.12.2'),
    option('1.11.2', 'Java 1.11.2'),
    option('1.10.2', 'Java 1.10.2'),
    option('1.9.4', 'Java 1.9.4'),
    option('1.8.9', 'Java 1.8.9'),
    option('1.7.10', 'Java 1.7.10'),
    option('1.6.4', 'Java 1.6.4'),
    option('1.5.2', 'Java 1.5.2'),
    option('1.4.7', 'Java 1.4.7'),
    option('1.3.2', 'Java 1.3.2'),
    option('1.2.5', 'Java 1.2.5'),
    option('1.1', 'Java 1.1'),
    option('1.0', 'Java 1.0'),
    option('Beta 1.8.1', 'Java Beta 1.8.1'),
    option('Beta 1.7.3', 'Java Beta 1.7.3'),
    option('Alpha 1.2.6', 'Java Alpha 1.2.6'),
    option('Alpha 1.1.2_01', 'Java Alpha 1.1.2_01'),
];

export const BEDROCK_WORLDGEN_VERSION_OPTIONS = [
    option('26.13', 'Bedrock 26.13 (current)'),
    option('26.12', 'Bedrock 26.12'),
    option('26.11', 'Bedrock 26.11'),
    option('26.10', 'Bedrock 26.10'),
    option('26.3', 'Bedrock 26.3'),
    option('26.2', 'Bedrock 26.2'),
    option('26.1', 'Bedrock 26.1'),
    option('26.0', 'Bedrock 26.0'),
    option('1.21', 'Bedrock 1.21 family'),
    option('1.21.132', 'Bedrock 1.21.132'),
    option('1.21.131', 'Bedrock 1.21.131'),
    option('1.21.130', 'Bedrock 1.21.130'),
    option('1.21.124', 'Bedrock 1.21.124'),
    option('1.21.123', 'Bedrock 1.21.123'),
    option('1.21.122', 'Bedrock 1.21.122'),
    option('1.21.121', 'Bedrock 1.21.121'),
    option('1.21.120', 'Bedrock 1.21.120'),
    option('1.21.114', 'Bedrock 1.21.114'),
    option('1.21.113', 'Bedrock 1.21.113'),
    option('1.21.112', 'Bedrock 1.21.112'),
    option('1.21.111', 'Bedrock 1.21.111'),
    option('1.21.101', 'Bedrock 1.21.101'),
    option('1.21.100', 'Bedrock 1.21.100'),
    option('1.21.90', 'Bedrock 1.21.90'),
    option('1.21.80', 'Bedrock 1.21.80'),
    option('1.21.70', 'Bedrock 1.21.70'),
    option('1.21.60', 'Bedrock 1.21.60'),
    option('1.21.50', 'Bedrock 1.21.50'),
    option('1.21.40', 'Bedrock 1.21.40'),
    option('1.21.30', 'Bedrock 1.21.30'),
    option('1.21.20', 'Bedrock 1.21.20'),
    option('1.21.0', 'Bedrock 1.21.0'),
    option('1.20', 'Bedrock 1.20 family'),
    option('1.20.80', 'Bedrock 1.20.80'),
    option('1.20.70', 'Bedrock 1.20.70'),
    option('1.20.60', 'Bedrock 1.20.60'),
    option('1.20.50', 'Bedrock 1.20.50'),
    option('1.20.40', 'Bedrock 1.20.40'),
    option('1.20.30', 'Bedrock 1.20.30'),
    option('1.20.10', 'Bedrock 1.20.10'),
    option('1.20.0', 'Bedrock 1.20.0'),
    option('1.19', 'Bedrock 1.19 family'),
    option('1.19.80', 'Bedrock 1.19.80'),
    option('1.19.70', 'Bedrock 1.19.70'),
    option('1.19.60', 'Bedrock 1.19.60'),
    option('1.19.50', 'Bedrock 1.19.50'),
    option('1.19.40', 'Bedrock 1.19.40'),
    option('1.19.30', 'Bedrock 1.19.30'),
    option('1.19.20', 'Bedrock 1.19.20'),
    option('1.19.10', 'Bedrock 1.19.10'),
    option('1.19.0', 'Bedrock 1.19.0'),
    option('1.18', 'Bedrock 1.18 family'),
    option('1.18.30', 'Bedrock 1.18.30'),
    option('1.18.12', 'Bedrock 1.18.12'),
    option('1.18.0', 'Bedrock 1.18.0'),
    option('1.17', 'Bedrock 1.17 family'),
    option('1.17.41', 'Bedrock 1.17.41'),
    option('1.17.0', 'Bedrock 1.17.0'),
    option('1.16', 'Bedrock 1.16 family'),
    option('1.16.221', 'Bedrock 1.16.221'),
    option('1.16.0', 'Bedrock 1.16.0'),
    option('1.14', 'Bedrock 1.14 family'),
    option('1.14.60', 'Bedrock 1.14.60'),
    option('1.12', 'Bedrock 1.12 family'),
    option('1.12.1', 'Bedrock 1.12.1'),
    option('1.11', 'Bedrock 1.11 family'),
    option('1.11.4', 'Bedrock 1.11.4'),
    option('1.2', 'Bedrock 1.2 family'),
    option('1.2.13', 'Bedrock 1.2.13'),
];

export const VERSION_FILTER_OPTIONS_BY_EDITION = {
    java: [
        option('all', 'All Java Versions'),
        option('26.1.2', 'Java 26.1.2 (current)'),
        option('26.', 'Java 26.x'),
        option('1.21', 'Java 1.21 family'),
        option('1.20', 'Java 1.20 family'),
        option('1.19', 'Java 1.19 family'),
        option('1.18', 'Java 1.18 family'),
        option('1.17', 'Java 1.17 family'),
        option('1.16', 'Java 1.16 family'),
        option('1.15', 'Java 1.15 family'),
        option('1.14', 'Java 1.14 family'),
        option('1.13', 'Java 1.13 family'),
        option('1.12', 'Java 1.12 family'),
        option('1.8-1.11', 'Java 1.8 - 1.11'),
        option('1.0-1.7', 'Java 1.0 - 1.7'),
        option('beta', 'Java Beta'),
        option('alpha', 'Java Alpha'),
    ],
    bedrock: [
        option('all', 'All Bedrock Versions'),
        option('26.13', 'Bedrock 26.13 (current)'),
        option('26.', 'Bedrock 26.x'),
        option('1.21', 'Bedrock 1.21 family'),
        option('1.20', 'Bedrock 1.20 family'),
        option('1.19', 'Bedrock 1.19 family'),
        option('1.18', 'Bedrock 1.18 family'),
        option('1.17', 'Bedrock 1.17 family'),
        option('1.16', 'Bedrock 1.16 family'),
        option('1.14', 'Bedrock 1.14 family'),
        option('1.12', 'Bedrock 1.12 family'),
        option('1.11', 'Bedrock 1.11 family'),
        option('1.2', 'Bedrock 1.2 family'),
    ],
};

export function getVersionSelectOptions(edition = 'java') {
    if (edition === 'bedrock') return BEDROCK_WORLDGEN_VERSION_OPTIONS;
    return JAVA_WORLDGEN_VERSION_OPTIONS;
}

export function getVersionFilterOptions(edition = 'java') {
    return VERSION_FILTER_OPTIONS_BY_EDITION[edition] || VERSION_FILTER_OPTIONS_BY_EDITION.java;
}

export function getDefaultVersionForEdition(edition = 'java') {
    if (edition === 'bedrock') return CURRENT_MINECRAFT_VERSIONS.bedrock.version;
    return CURRENT_MINECRAFT_VERSIONS.java.version;
}

export function normalizeSelectableVersion(edition = 'java', value = '') {
    const options = getVersionSelectOptions(edition);
    const raw = String(value || '');
    if (options.some(option => option.value === raw)) return raw;

    const withoutPlus = raw.replace(/\+$/, '');
    if (withoutPlus !== raw && options.some(option => option.value === withoutPlus)) {
        return withoutPlus;
    }

    return getDefaultVersionForEdition(edition);
}

export function splitEditionVersion(edition, value) {
    return {
        java: value || CURRENT_MINECRAFT_VERSIONS.java.version,
        bedrock: value || CURRENT_MINECRAFT_VERSIONS.bedrock.version,
    };
}

export function formatEditionVersion(edition, value) {
    if (edition === 'java') return `Java ${value}`;
    if (edition === 'bedrock') return `Bedrock ${value}`;
    return String(value || '');
}

function versionTextMatches(rawVersion, filterValue) {
    const raw = String(rawVersion || '').toLowerCase();
    if (!raw) return false;
    if (filterValue === 'all') return true;
    if (filterValue === '26.') return raw.startsWith('26.');
    if (filterValue === 'beta') return raw.includes('beta');
    if (filterValue === 'alpha') return raw.includes('alpha');

    if (filterValue === '1.8-1.11' || filterValue === '1.0-1.7') {
        const [min, max] = filterValue === '1.8-1.11' ? [8, 11] : [0, 7];
        const matches = raw.match(/1\.(\d+)/g);
        if (!matches) return false;
        return matches.some(v => {
            const minor = Number(v.split('.')[1]);
            return minor >= min && minor <= max;
        });
    }

    return raw.includes(String(filterValue).toLowerCase());
}

export function seedMatchesVersionFilter(seed, editionFilter, versionFilter) {
    if (versionFilter === 'all') return true;
    const javaVersion = seed?.version?.java;
    const bedrockVersion = seed?.version?.bedrock;

    if (editionFilter === 'java') return versionTextMatches(javaVersion, versionFilter);
    if (editionFilter === 'bedrock') return versionTextMatches(bedrockVersion, versionFilter);
    return versionTextMatches(javaVersion, versionFilter) || versionTextMatches(bedrockVersion, versionFilter);
}

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
