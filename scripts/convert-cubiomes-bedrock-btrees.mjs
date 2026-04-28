import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const sourceRoot = process.argv[2] || path.join(process.env.TEMP || '', 'cubiomes-bedrock-head', 'tables');
const outputRoot = path.join(repoRoot, 'lib', 'cubiomes');

const TREES = [
    {
        input: 'btree21wd.h',
        output: 'btree_bedrock_1_21_wd.js',
        exportName: 'BTREE_BEDROCK_1_21_WD',
        label: 'Bedrock 1.21.50/1.21.60',
        sourceName: 'btree21wd.h',
    },
    {
        input: 'btree262.h',
        output: 'btree_bedrock_26_20.js',
        exportName: 'BTREE_BEDROCK_26_20',
        label: 'Bedrock 26.2/26.20 family',
        sourceName: 'btree262.h',
    },
];

function parseHeader(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const stem = path.basename(filePath, '.h');

    const orderMatch = content.match(new RegExp(`${stem}_order\\s*=\\s*(\\d+)`));
    const stepsMatch = content.match(new RegExp(`${stem}_steps\\[\\]\\s*=\\s*\\{([^}]+)\\}`));
    const paramBlock = content.match(new RegExp(`${stem}_param\\[\\]\\[2\\]\\s*=\\s*\\{([\\s\\S]*?)\\};`));
    const nodesBlock = content.match(new RegExp(`${stem}_nodes\\[\\]\\s*=\\s*\\{([\\s\\S]*?)\\};`));

    if (!orderMatch || !stepsMatch || !paramBlock || !nodesBlock) {
        throw new Error(`Could not parse ${filePath}`);
    }

    const order = Number(orderMatch[1]);
    const steps = stepsMatch[1]
        .split(',')
        .map(item => Number(item.trim()))
        .filter(Number.isFinite);
    const params = [...paramBlock[1].matchAll(/\{\s*(-?\d+)\s*,\s*(-?\d+)\s*\}/g)]
        .map(match => [Number(match[1]), Number(match[2])]);
    const nodes = [...nodesBlock[1].matchAll(/0x([0-9A-Fa-f]+)/g)]
        .map(match => BigInt(`0x${match[1]}`));

    return { order, steps, params, nodes };
}

function formatArrayRows(items, formatter, perRow = 4) {
    const rows = [];
    for (let i = 0; i < items.length; i += perRow) {
        rows.push(`        ${items.slice(i, i + perRow).map(formatter).join(',        ')},`);
    }
    return rows.join('\n');
}

function renderTree(tree, data) {
    return `/**
 * Biome Decision Tree for ${tree.label}
 *
 * Auto-generated from FragrantResult186/cubiomes-bedrock ${tree.sourceName}.
 * Original project: https://github.com/FragrantResult186/cubiomes-bedrock
 * MIT License - Copyright (c) 2020 Cubitect
 */

export const ${tree.exportName} = {
    order: ${data.order},
    steps: [${data.steps.join(', ')}],
    params: [
${formatArrayRows(data.params, item => `[${item[0]}, ${item[1]}]`)}
    ],
    nodes: [
${formatArrayRows(data.nodes, item => `0x${item.toString(16).padStart(16, '0')}n`)}
    ],
};
`;
}

fs.mkdirSync(outputRoot, { recursive: true });

for (const tree of TREES) {
    const inputPath = path.join(sourceRoot, tree.input);
    const outputPath = path.join(outputRoot, tree.output);
    const data = parseHeader(inputPath);
    fs.writeFileSync(outputPath, renderTree(tree, data), 'utf8');
    console.log(`Generated ${path.relative(repoRoot, outputPath)} from ${inputPath}`);
}
