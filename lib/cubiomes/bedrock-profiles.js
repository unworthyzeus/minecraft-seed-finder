import { BEDROCK_WORLDGEN_VERSION_OPTIONS, parseMinecraftVersion } from '../version-utils.js';

export const BEDROCK_PROFILE_ORDER = {
    MC_UNDEF: 0,
    MC_B1_7: 1,
    MC_B1_8: 2,
    MC_1_0: 3,
    MC_1_1: 4,
    MC_1_2: 5,
    MC_1_4: 6,
    MC_1_5: 7,
    MC_1_6: 8,
    MC_1_7: 9,
    MC_1_8: 10,
    MC_1_9: 11,
    MC_1_10: 12,
    MC_1_11: 13,
    MC_1_12: 14,
    MC_1_13: 15,
    MC_1_14: 16,
    MC_1_16: 17,
    MC_1_17: 18,
    MC_1_17_30: 19,
    MC_1_18: 20,
    MC_1_19: 21,
    MC_1_20: 22,
    MC_1_21: 23,
    MC_1_21_50: 24,
    MC_1_21_60: 25,
    MC_26_20: 26,
};

function profile({
    version,
    cubiomesVersion,
    generatorMinor,
    biomeTreeKey,
    exactVersionProfile,
    label,
}) {
    const exact = Boolean(exactVersionProfile);
    return {
        source: 'cubiomes-bedrock',
        version,
        cubiomesVersion,
        generatorMinor,
        biomeTreeKey,
        exactVersionProfile: exact,
        label,
        disclaimer: exact
            ? 'Exact cubiomes-bedrock version profile is available for this Bedrock version.'
            : `Mapped to nearest cubiomes-bedrock profile (${label}); verify with BDS for 100% Bedrock proof.`,
    };
}

function releaseProfile(parsed, version) {
    const patch = parsed.patch ?? 0;

    if (parsed.minor < 18) {
        return profile({
            version,
            cubiomesVersion: parsed.minor >= 17 && patch >= 30 ? 'MC_1_17_30' : `MC_1_${parsed.minor}`,
            generatorMinor: parsed.minor,
            biomeTreeKey: 'legacy',
            exactVersionProfile: ['1.2.13', '1.11.4', '1.12.1', '1.14.60', '1.16.221', '1.17.41'].includes(version),
            label: 'legacy Bedrock layer profile',
        });
    }

    if (parsed.minor === 18) {
        return profile({
            version,
            cubiomesVersion: 'MC_1_18',
            generatorMinor: 18,
            biomeTreeKey: 'btree18',
            exactVersionProfile: version === '1.18' || version === '1.18.0',
            label: 'Bedrock 1.18 family',
        });
    }

    if (parsed.minor === 19) {
        return profile({
            version,
            cubiomesVersion: 'MC_1_19',
            generatorMinor: 19,
            biomeTreeKey: 'btree19',
            exactVersionProfile: version === '1.19' || version === '1.19.0',
            label: 'Bedrock 1.19 family',
        });
    }

    if (parsed.minor === 20) {
        return profile({
            version,
            cubiomesVersion: 'MC_1_20',
            generatorMinor: 20,
            biomeTreeKey: 'btree20',
            exactVersionProfile: version === '1.20' || version === '1.20.0',
            label: 'Bedrock 1.20 family',
        });
    }

    if (parsed.minor === 21 && patch >= 60) {
        return profile({
            version,
            cubiomesVersion: patch === 60 ? 'MC_1_21_60' : 'MC_1_21_60',
            generatorMinor: 21,
            biomeTreeKey: 'btree21wd',
            exactVersionProfile: version === '1.21.60',
            label: 'Bedrock 1.21.60 Wild Drop profile',
        });
    }

    if (parsed.minor === 21 && patch >= 50) {
        return profile({
            version,
            cubiomesVersion: 'MC_1_21_50',
            generatorMinor: 21,
            biomeTreeKey: 'btree21wd',
            exactVersionProfile: version === '1.21.50',
            label: 'Bedrock 1.21.50 pale garden preview profile',
        });
    }

    if (parsed.minor === 21) {
        return profile({
            version,
            cubiomesVersion: 'MC_1_21',
            generatorMinor: 21,
            biomeTreeKey: 'btree20',
            exactVersionProfile: version === '1.21' || version === '1.21.0',
            label: 'Bedrock 1.21 pre-1.21.50 profile',
        });
    }

    return profile({
        version,
        cubiomesVersion: 'MC_26_20',
        generatorMinor: 21,
        biomeTreeKey: 'btree262',
        exactVersionProfile: false,
        label: 'Bedrock 26.2/26.20 family',
    });
}

export function getBedrockVersionProfile(version = '26.13') {
    const raw = String(version || '26.13');
    const parsed = parseMinecraftVersion(raw);

    if (!parsed) {
        return profile({
            version: raw,
            cubiomesVersion: 'MC_26_20',
            generatorMinor: 21,
            biomeTreeKey: 'btree262',
            exactVersionProfile: false,
            label: 'Bedrock latest known profile',
        });
    }

    if (parsed.type === 'calendar') {
        return profile({
            version: raw,
            cubiomesVersion: 'MC_26_20',
            generatorMinor: 21,
            biomeTreeKey: 'btree262',
            exactVersionProfile: raw === '26.2' || raw === '26.20',
            label: 'Bedrock 26.2/26.20 family',
        });
    }

    if (parsed.type === 'alpha' || parsed.type === 'beta') {
        return profile({
            version: raw,
            cubiomesVersion: parsed.type === 'beta' && parsed.minor >= 8 ? 'MC_B1_8' : 'MC_B1_7',
            generatorMinor: parsed.type === 'beta' && parsed.minor >= 8 ? 8 : 7,
            biomeTreeKey: 'legacy',
            exactVersionProfile: false,
            label: 'legacy Bedrock-compatible fallback',
        });
    }

    return releaseProfile(parsed, raw);
}

export function bedrockProfileAtLeast(versionOrProfile, target) {
    const source = typeof versionOrProfile === 'string'
        ? getBedrockVersionProfile(versionOrProfile)
        : versionOrProfile;
    return (BEDROCK_PROFILE_ORDER[source.cubiomesVersion] ?? 0) >= (BEDROCK_PROFILE_ORDER[target] ?? Infinity);
}

export function getBedrockUnsupportedExactVersions(versions = BEDROCK_WORLDGEN_VERSION_OPTIONS.map(option => option.value)) {
    return versions
        .map(version => getBedrockVersionProfile(version))
        .filter(item => !item.exactVersionProfile);
}
