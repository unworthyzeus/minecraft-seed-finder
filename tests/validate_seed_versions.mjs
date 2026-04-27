import data from '../lib/seeds-data.json' with { type: 'json' };
import { CURRENT_MINECRAFT_VERSIONS, getSeedEditions, getSeedVersionIssues } from '../lib/version-utils.js';

const failures = [];

if (CURRENT_MINECRAFT_VERSIONS.java.version !== '26.1.2') {
    failures.push({ id: 'current-java', issues: ['expected current Java version 26.1.2'] });
}

if (CURRENT_MINECRAFT_VERSIONS.bedrock.version !== '26.13') {
    failures.push({ id: 'current-bedrock', issues: ['expected current Bedrock version 26.13'] });
}

for (const seed of data) {
    const issues = getSeedVersionIssues(seed);
    const editions = getSeedEditions(seed);
    if (editions.length === 0) {
        issues.push('seed must have at least one edition');
    }
    if (issues.length) {
        failures.push({ id: seed.id, seed: seed.seed, version: seed.version, issues });
    }
}

if (failures.length) {
    console.error(JSON.stringify(failures.slice(0, 50), null, 2));
    console.error(`Seed version audit failed with ${failures.length} issue(s).`);
    process.exit(1);
}

console.log(`Seed version audit: ${data.length} seeds have edition + numeric version metadata`);
