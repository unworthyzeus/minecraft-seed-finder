import { strict as assert } from 'assert';

import { BedrockBiomeGenerator } from '../lib/cubiomes/bedrock.js';
import {
    getBedrockVersionProfile,
    getBedrockUnsupportedExactVersions,
} from '../lib/cubiomes/bedrock-profiles.js';
import {
    STRUCTURE_TYPES,
    getBedrockStructureConfig,
} from '../lib/cubiomes/structures.js';

const currentProfile = getBedrockVersionProfile('26.13');
assert.equal(currentProfile.source, 'cubiomes-bedrock');
assert.equal(currentProfile.biomeTreeKey, 'btree262');
assert.equal(currentProfile.cubiomesVersion, 'MC_26_20');
assert.equal(currentProfile.exactVersionProfile, false);
assert.match(currentProfile.disclaimer, /nearest cubiomes-bedrock profile/i);

const wildDropProfile = getBedrockVersionProfile('1.21.60');
assert.equal(wildDropProfile.biomeTreeKey, 'btree21wd');
assert.equal(wildDropProfile.cubiomesVersion, 'MC_1_21_60');
assert.equal(wildDropProfile.exactVersionProfile, true);

const earlyTwentyOneProfile = getBedrockVersionProfile('1.21.20');
assert.equal(earlyTwentyOneProfile.biomeTreeKey, 'btree20');
assert.equal(earlyTwentyOneProfile.exactVersionProfile, false);

const generator = new BedrockBiomeGenerator('5004260924615097095', '26.13');
assert.equal(generator.profile.source, 'cubiomes-bedrock');
assert.equal(generator.profile.biomeTreeKey, 'btree262');
assert.equal(generator.exactStructures, false);

const trialChambers = getBedrockStructureConfig(STRUCTURE_TYPES.Trial_Chambers, '26.13');
assert.deepEqual(
    { spacing: trialChambers.spacing, spawnRange: trialChambers.spawnRange, salt: trialChambers.salt, source: trialChambers.source },
    { spacing: 34, spawnRange: 22, salt: 94251327, source: 'cubiomes-bedrock' }
);

assert.equal(
    getBedrockStructureConfig(STRUCTURE_TYPES.Trial_Chambers, '1.20'),
    null,
    'Trial Chambers should not be advertised for Bedrock versions before 1.21'
);

const unsupported = getBedrockUnsupportedExactVersions(['26.13', '1.21.60', '1.21.132', '1.20.80']);
assert.deepEqual(
    unsupported.map(item => item.version),
    ['26.13', '1.21.132', '1.20.80'],
    'mapped Bedrock patch versions should be reported as not having exact cubiomes-bedrock profiles'
);

console.log('Bedrock cubiomes-bedrock JS port profile checks passed');
