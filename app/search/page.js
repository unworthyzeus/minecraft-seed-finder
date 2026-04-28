'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/Header';
import SubmitModal from '@/components/SubmitModal';
import { BedrockBiomeGenerator } from '@/lib/cubiomes/bedrock';
import { Generator } from '@/lib/cubiomes/generator';
import { LegacyBiomeGenerator } from '@/lib/cubiomes/layers';
import {
  generateStructureCandidates,
  STRUCTURE_INFO,
  toCubiomesMcVersion,
} from '@/lib/cubiomes/structures';
import { BiomeID } from '@/lib/cubiomes/core';
import {
  CURRENT_MINECRAFT_VERSIONS,
  formatEditionVersion,
  getDefaultVersionForEdition,
  getSupportedGeneratorMinor,
  getVersionSelectOptions,
  normalizeSelectableVersion,
} from '@/lib/version-utils';

const DEFAULT_QUERY = {
  edition: 'java',
  version: CURRENT_MINECRAFT_VERSIONS.java.version,
  startSeed: 'smart',
  maxSeeds: 750,
  radius: 768,
  biome: 'any',
  structures: [],
  maxStructureDistance: 0,
  maxBiomeStructureDistance: 0,
};

const BIOME_OPTIONS = [
  { id: 'any', label: 'Any biome', value: null },
  { id: 'plains', label: 'Plains', value: BiomeID.plains },
  { id: 'desert', label: 'Desert', value: BiomeID.desert },
  { id: 'forest', label: 'Forest', value: BiomeID.forest },
  { id: 'flower_forest', label: 'Flower Forest', value: BiomeID.flower_forest },
  { id: 'dark_forest', label: 'Dark Forest', value: BiomeID.dark_forest },
  { id: 'birch_forest', label: 'Birch Forest', value: BiomeID.birch_forest },
  { id: 'taiga', label: 'Taiga', value: BiomeID.taiga },
  { id: 'giant_tree_taiga', label: 'Old Growth Pine Taiga', value: BiomeID.giant_tree_taiga },
  { id: 'snowy_tundra', label: 'Snowy Plains', value: BiomeID.snowy_tundra },
  { id: 'snowy_taiga', label: 'Snowy Taiga', value: BiomeID.snowy_taiga },
  { id: 'ice_spikes', label: 'Ice Spikes', value: BiomeID.ice_spikes },
  { id: 'savanna', label: 'Savanna', value: BiomeID.savanna },
  { id: 'swamp', label: 'Swamp', value: BiomeID.swamp },
  { id: 'jungle', label: 'Jungle', value: BiomeID.jungle },
  { id: 'bamboo_jungle', label: 'Bamboo Jungle', value: BiomeID.bamboo_jungle },
  { id: 'badlands', label: 'Badlands', value: BiomeID.badlands },
  { id: 'eroded_badlands', label: 'Eroded Badlands', value: BiomeID.eroded_badlands },
  { id: 'mushroom_fields', label: 'Mushroom Fields', value: BiomeID.mushroom_fields },
  { id: 'ocean', label: 'Ocean', value: BiomeID.ocean },
  { id: 'deep_ocean', label: 'Deep Ocean', value: BiomeID.deep_ocean },
  { id: 'warm_ocean', label: 'Warm Ocean', value: BiomeID.warm_ocean },
  { id: 'lukewarm_ocean', label: 'Lukewarm Ocean', value: BiomeID.lukewarm_ocean },
  { id: 'beach', label: 'Beach', value: BiomeID.beach },
  { id: 'meadow', label: 'Meadow', value: BiomeID.meadow },
  { id: 'grove', label: 'Grove', value: BiomeID.grove },
  { id: 'snowy_slopes', label: 'Snowy Slopes', value: BiomeID.snowy_slopes },
  { id: 'jagged_peaks', label: 'Jagged Peaks', value: BiomeID.jagged_peaks },
  { id: 'frozen_peaks', label: 'Frozen Peaks', value: BiomeID.frozen_peaks },
  { id: 'stony_peaks', label: 'Stony Peaks', value: BiomeID.stony_peaks },
  { id: 'lush_caves', label: 'Lush Caves', value: BiomeID.lush_caves, y: 24 },
  { id: 'dripstone_caves', label: 'Dripstone Caves', value: BiomeID.dripstone_caves, y: 24 },
  { id: 'cherry_grove', label: 'Cherry Grove', value: BiomeID.cherry_grove },
  { id: 'deep_dark', label: 'Deep Dark', value: BiomeID.deep_dark, y: -40 },
  { id: 'mangrove_swamp', label: 'Mangrove Swamp', value: BiomeID.mangrove_swamp },
  { id: 'pale_garden', label: 'Pale Garden', value: BiomeID.pale_garden },
];

const STRUCTURE_OPTIONS = [
  'village',
  'ruined_portal',
  'desert_pyramid',
  'jungle_temple',
  'witch_hut',
  'igloo',
  'monument',
  'mansion',
  'outpost',
  'shipwreck',
  'ocean_ruin',
  'buried_treasure',
  'ancient_city',
  'trail_ruins',
  'trial_chambers',
].filter(key => STRUCTURE_INFO[key]);

const PRESETS = [
  {
    id: 'mushroom-spawn',
    label: 'Mushroom Spawn',
    description: 'Biome scan near origin.',
    query: { biome: 'mushroom_fields', structures: [], radius: 1024, maxSeeds: 900 },
  },
  {
    id: 'village-portal',
    label: 'Village + Portal',
    description: 'Two practical overworld starts clustered together.',
    query: { biome: 'plains', structures: ['village', 'ruined_portal'], radius: 1600, maxStructureDistance: 360, maxBiomeStructureDistance: 420, maxSeeds: 900 },
  },
  {
    id: 'desert-start',
    label: 'Desert Combo',
    description: 'Desert biome with village, pyramid, and portal.',
    query: { biome: 'desert', structures: ['village', 'desert_pyramid', 'ruined_portal'], radius: 1800, maxStructureDistance: 650, maxBiomeStructureDistance: 500, maxSeeds: 1200 },
  },
  {
    id: 'jungle-relics',
    label: 'Jungle Relics',
    description: 'Jungle biome near temple and trail ruins.',
    query: { biome: 'jungle', structures: ['jungle_temple', 'trail_ruins'], radius: 2200, maxStructureDistance: 850, maxBiomeStructureDistance: 650, maxSeeds: 1300 },
  },
  {
    id: 'ancient-city',
    label: 'Ancient City',
    description: 'Deep dark biome combined with an ancient city.',
    query: { version: '1.19.2', biome: 'deep_dark', structures: ['ancient_city'], radius: 2000, maxBiomeStructureDistance: 520, maxSeeds: 1000 },
  },
  {
    id: 'quad-cluster',
    label: 'Structure Cluster',
    description: 'Four surface structure families.',
    query: { biome: 'plains', structures: ['village', 'ruined_portal', 'outpost', 'desert_pyramid'], radius: 2200, maxStructureDistance: 760, maxBiomeStructureDistance: 760, maxSeeds: 1100 },
  },
  {
    id: 'dark-forest-mansion',
    label: 'Mansion Biome Lock',
    description: 'Dark forest close to mansion and portal.',
    query: { biome: 'dark_forest', structures: ['mansion', 'ruined_portal'], radius: 4200, maxStructureDistance: 1200, maxBiomeStructureDistance: 900, maxSeeds: 1500 },
  },
  {
    id: 'ocean-loot',
    label: 'Ocean Loot',
    description: 'Warm ocean near shipwreck, ruin, and treasure.',
    query: { biome: 'warm_ocean', structures: ['shipwreck', 'ocean_ruin', 'buried_treasure'], radius: 2200, maxStructureDistance: 700, maxBiomeStructureDistance: 650, maxSeeds: 1200 },
  },
  {
    id: 'bedrock-safe',
    label: 'Bedrock Current',
    description: 'Current Bedrock parity renderer.',
    query: { edition: 'bedrock', version: CURRENT_MINECRAFT_VERSIONS.bedrock.version, biome: 'plains', structures: ['village', 'ruined_portal'], radius: 1600, maxStructureDistance: 420, maxBiomeStructureDistance: 480, maxSeeds: 900 },
  },
];

const STATUS_IDLE = {
  running: false,
  scanned: 0,
  biomeMatches: 0,
  structureMatches: 0,
  stage: 'Idle',
};

const MASK64 = (1n << 64n) - 1n;
const GOLDEN_GAMMA = 0x9e3779b97f4a7c15n;
const JAVA_STREAM_SALT = 0x4f1bbcdc67625d45n;
const BEDROCK_STREAM_SALT = 0x632be59bd9b4e019n;

function parseSeed(value) {
  const raw = String(value || '0').trim();
  if (/^-?\d+$/.test(raw)) return BigInt(raw);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = Math.imul(31, hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return BigInt(hash);
}

function mixSeed64(value) {
  let z = (BigInt.asUintN(64, value) + GOLDEN_GAMMA) & MASK64;
  z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
  z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
  return (z ^ (z >> 31n)) & MASK64;
}

function candidateSeedAt(anchor, index, edition) {
  const salt = edition === 'bedrock' ? BEDROCK_STREAM_SALT : JAVA_STREAM_SALT;
  const mixed = mixSeed64(anchor + BigInt(index + 1) * GOLDEN_GAMMA + salt);
  const signed = BigInt.asIntN(64, mixed);
  return signed === 0n ? 1n : signed;
}

function formatDistance(value) {
  if (value == null || !Number.isFinite(value)) return 'off';
  return `${Math.round(value).toLocaleString()} blocks`;
}

function createGenerator(edition, version, seed) {
  if (edition === 'bedrock') {
    return new BedrockBiomeGenerator(seed, version);
  }

  const minor = getSupportedGeneratorMinor(version);
  if (minor >= 18) {
    const gen = new Generator();
    gen.setupGenerator(minor);
    gen.applySeed(seed);
    return {
      seed,
      getBiome(x, z) {
        return gen.getBiomeAt(1, Math.floor(x), 64, Math.floor(z));
      },
      getBiomeAtY(x, y, z) {
        return gen.getBiomeAt(1, Math.floor(x), Math.floor(y), Math.floor(z));
      },
    };
  }

  return new LegacyBiomeGenerator(seed, toCubiomesMcVersion(version));
}

function getEditionRuns(query) {
  return [{
    edition: query.edition,
    version: query.version,
    label: query.edition === 'bedrock' ? 'Bedrock' : 'Java',
  }];
}

function displayStructuresForEdition(structures, label, includePrefix) {
  if (!includePrefix) return structures;
  return structures.map(structure => ({
    ...structure,
    name: `${label} ${structure.name}`,
  }));
}

function getBiomeOption(id) {
  return BIOME_OPTIONS.find(option => option.id === id) || BIOME_OPTIONS[0];
}

function sampleBiomeNear(generator, biomeOption, radius) {
  if (biomeOption.value == null) return { matched: true, point: null, points: [] };

  const step = biomeOption.id === 'deep_dark' || biomeOption.id.includes('caves') ? 48 : 80;
  const points = [];
  for (let z = -radius; z <= radius; z += step) {
    for (let x = -radius; x <= radius; x += step) {
      if ((x * x + z * z) > radius * radius) continue;
      const biome = typeof generator.getBiomeAtY === 'function'
        ? generator.getBiomeAtY(x, biomeOption.y ?? 64, z)
        : generator.getBiome(x, z);
      if (biome === biomeOption.value) {
        const dist = Math.round(Math.sqrt(x * x + z * z));
        points.push({ x, z, distance: dist, biome });
      }
    }
  }

  points.sort((a, b) => a.distance - b.distance);
  return { matched: points.length > 0, point: points[0] || null, points: points.slice(0, 32) };
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function clusterDiameter(items) {
  let max = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      max = Math.max(max, distance(items[i], items[j]));
    }
  }
  return max;
}

function biomeStructureDistance(items, biomePoint) {
  if (!biomePoint || items.length === 0) return null;
  return Math.max(...items.map(item => distance(item, biomePoint)));
}

function findBestStructureCluster(groups, keys, structureDistance, biomePoints, biomeDistance) {
  if (keys.length === 0) {
    return { matched: true, selected: [], structureClusterDiameter: null, biomeStructureDistance: null, biomePoint: null };
  }

  const baseChoices = keys.map(key => groups.get(key) || []);
  if (baseChoices.some(group => group.length === 0)) {
    return { matched: false, selected: [], structureClusterDiameter: null, biomeStructureDistance: null, biomePoint: null };
  }

  const pointChoices = biomeDistance > 0 && biomePoints.length > 0 ? biomePoints : [null];
  const limit = keys.length >= 4 ? 10 : 16;
  let best = null;

  for (const biomePoint of pointChoices) {
    const choices = baseChoices.map(group => group
      .slice()
      .sort((a, b) => {
        const aScore = biomePoint ? distance(a, biomePoint) : Math.hypot(a.x, a.z);
        const bScore = biomePoint ? distance(b, biomePoint) : Math.hypot(b.x, b.z);
        return aScore - bScore;
      })
      .slice(0, limit));

    const pick = (index, selected) => {
      if (index === choices.length) {
        const structureClusterDiameter = clusterDiameter(selected);
        const biomeClusterDistance = biomeStructureDistance(selected, biomePoint);
        const score = structureClusterDiameter + (biomeClusterDistance || 0) +
          selected.reduce((sum, item) => sum + Math.hypot(item.x, item.z), 0) * 0.01;
        if (!best || score < best.score) {
          best = {
            matched: true,
            selected,
            structureClusterDiameter,
            biomeStructureDistance: biomeClusterDistance,
            biomePoint,
            score,
          };
        }
        return;
      }

      for (const candidate of choices[index]) {
        if (structureDistance > 0 && selected.some(item => distance(item, candidate) > structureDistance)) {
          continue;
        }
        if (biomePoint && biomeDistance > 0 && distance(candidate, biomePoint) > biomeDistance) {
          continue;
        }
        pick(index + 1, [...selected, candidate]);
      }
    };

    pick(0, []);
  }

  return best || { matched: false, selected: [], structureClusterDiameter: null, biomeStructureDistance: null, biomePoint: null };
}

function analyzeStructures(query, generator, seed, biomeReport) {
  if (query.structures.length === 0) {
    return { matched: true, structures: [], statuses: [], cluster: null };
  }

  const structures = generateStructureCandidates({
    seed,
    version: query.version,
    edition: query.edition,
    centerX: 0,
    centerZ: 0,
    range: Number(query.radius),
    generator,
    includeUnconfirmed: false,
    structureKeys: query.structures,
  }).sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));

  const groups = new Map();
  for (const structure of structures) {
    if (!groups.has(structure.key)) groups.set(structure.key, []);
    groups.get(structure.key).push(structure);
  }

  const hasAll = query.structures.every(key => groups.has(key));
  if (!hasAll) return { matched: false, structures, statuses: [], cluster: null };

  const cluster = findBestStructureCluster(
    groups,
    query.structures,
    Number(query.maxStructureDistance),
    biomeReport.points || [],
    Number(query.maxBiomeStructureDistance)
  );
  if (!cluster.matched) return { matched: false, structures, statuses: [], cluster: null };

  const picked = cluster.selected;
  return {
    matched: true,
    structures: picked,
    statuses: picked.map(item => item.status),
    cluster,
  };
}

function confidenceBadges(query, structureReport) {
  const badges = [];
  const statuses = new Set(structureReport.statuses || []);
  if (query.structures.length === 0) {
    badges.push({ label: 'Seed candidate', level: 'candidate' });
  } else if (query.edition === 'bedrock') {
    badges.push({ label: 'Bedrock structure candidate', level: 'approx' });
  } else {
    badges.push({ label: 'Java placement candidate', level: 'candidate' });
  }
  if (query.biome !== 'any') badges.push({ label: 'Biome-confirmed', level: 'biome' });
  if (structureReport.cluster?.biomeStructureDistance != null) {
    badges.push({ label: 'Biome-structure cluster', level: 'biome' });
  }
  if (statuses.has('terrain-candidate')) {
    badges.push({ label: 'Terrain-candidate', level: 'candidate' });
  }
  if (statuses.has('bedrock-candidate')) {
    badges.push({ label: 'Bedrock parity candidate', level: 'approx' });
  }
  return badges;
}

function encodeQuery(query) {
  const params = new URLSearchParams();
  params.set('edition', query.edition);
  params.set('version', query.version);
  params.set('start', query.startSeed);
  params.set('count', String(query.maxSeeds));
  params.set('radius', String(query.radius));
  params.set('biome', query.biome);
  if (query.structures.length) params.set('structures', query.structures.join(','));
  if (Number(query.maxStructureDistance) > 0) params.set('cluster', String(query.maxStructureDistance));
  if (Number(query.maxBiomeStructureDistance) > 0) params.set('biomeCluster', String(query.maxBiomeStructureDistance));
  return params.toString();
}

function decodeQuery(search) {
  const params = new URLSearchParams(search);
  return {
    ...DEFAULT_QUERY,
    edition: params.get('edition') || DEFAULT_QUERY.edition,
    version: params.get('version') || DEFAULT_QUERY.version,
    startSeed: params.get('start') || DEFAULT_QUERY.startSeed,
    maxSeeds: Number(params.get('count') || DEFAULT_QUERY.maxSeeds),
    radius: Number(params.get('radius') || DEFAULT_QUERY.radius),
    biome: params.get('biome') || DEFAULT_QUERY.biome,
    structures: (params.get('structures') || '').split(',').filter(key => STRUCTURE_INFO[key]),
    maxStructureDistance: Number(params.get('cluster') || DEFAULT_QUERY.maxStructureDistance),
    maxBiomeStructureDistance: Number(params.get('biomeCluster') || DEFAULT_QUERY.maxBiomeStructureDistance),
  };
}

function normalizeQuery(query) {
  const edition = ['java', 'bedrock'].includes(query.edition) ? query.edition : DEFAULT_QUERY.edition;
  return {
    ...query,
    edition,
    version: normalizeSelectableVersion(edition, query.version),
    maxSeeds: Math.max(1, Math.min(20000, Number(query.maxSeeds) || DEFAULT_QUERY.maxSeeds)),
    radius: Math.max(128, Math.min(5000, Number(query.radius) || DEFAULT_QUERY.radius)),
    maxStructureDistance: Math.max(0, Math.min(5000, Number(query.maxStructureDistance) || 0)),
    maxBiomeStructureDistance: Math.max(0, Math.min(5000, Number(query.maxBiomeStructureDistance) || 0)),
  };
}

export default function SearchPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [status, setStatus] = useState(STATUS_IDLE);
  const [results, setResults] = useState([]);
  const [saved, setSaved] = useState([]);
  const [shareState, setShareState] = useState('Copy URL');
  const [submitSeed, setSubmitSeed] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    setQuery(normalizeQuery(decodeQuery(window.location.search)));
    try {
      setSaved(JSON.parse(localStorage.getItem('seed-searches') || '[]'));
    } catch {
      setSaved([]);
    }
  }, []);

  useEffect(() => {
    const qs = encodeQuery(normalizeQuery(query));
    window.history.replaceState(null, '', `/search?${qs}`);
  }, [query]);

  const updateQuery = useCallback((patch) => {
    setQuery(prev => normalizeQuery({ ...prev, ...patch }));
  }, []);

  const versionOptions = useMemo(() => getVersionSelectOptions(query.edition), [query.edition]);
  const selectedBiome = useMemo(() => getBiomeOption(query.biome), [query.biome]);
  const selectedStructures = useMemo(() => new Set(query.structures), [query.structures]);
  const strategyText = useMemo(() => {
    const seedCount = Number(query.maxSeeds).toLocaleString();
    const versionLabel = formatEditionVersion(query.edition, query.version);
    return `Smart spread: ${seedCount} candidates sampled across the signed 64-bit seed space from key "${query.startSeed || DEFAULT_QUERY.startSeed}" for ${versionLabel}.`;
  }, [query.edition, query.maxSeeds, query.startSeed, query.version]);

  useEffect(() => {
    if (!versionOptions.some(option => option.value === query.version)) {
      updateQuery({ version: getDefaultVersionForEdition(query.edition) });
    }
  }, [query.edition, query.version, updateQuery, versionOptions]);

  const toggleStructure = (key) => {
    const next = selectedStructures.has(key)
      ? query.structures.filter(item => item !== key)
      : [...query.structures, key];
    updateQuery({ structures: next });
  };

  const runSearch = async () => {
    const activeQuery = normalizeQuery(query);
    cancelRef.current = false;
    setResults([]);
    setStatus({ ...STATUS_IDLE, running: true, stage: 'Starting' });

    const start = parseSeed(activeQuery.startSeed);
    const biomeOption = getBiomeOption(activeQuery.biome);
    const maxSeeds = Number(activeQuery.maxSeeds);
    const batch = 25;
    let scanned = 0;
    let biomeMatches = 0;
    let structureMatches = 0;
    const found = [];

    for (let i = 0; i < maxSeeds; i++) {
      if (cancelRef.current) break;
      scanned = i + 1;
      const seed = candidateSeedAt(start, i, activeQuery.edition);
      const editionRuns = getEditionRuns(activeQuery);
      const reports = [];
      let failedStage = null;

      for (const run of editionRuns) {
        const runQuery = { ...activeQuery, edition: run.edition, version: run.version };
        const generator = createGenerator(run.edition, run.version, seed);
        const biomeReport = sampleBiomeNear(generator, biomeOption, Number(activeQuery.radius));
        if (!biomeReport.matched) {
          failedStage = 'Biome gate';
          break;
        }

        const structureReport = analyzeStructures(runQuery, generator, seed, biomeReport);
        if (!structureReport.matched) {
          failedStage = 'Structure gate';
          break;
        }

        reports.push({ ...run, query: runQuery, biomeReport, structureReport });
      }

      if (failedStage) {
        if (i % batch === 0) {
          setStatus({ running: true, scanned, biomeMatches, structureMatches, stage: failedStage });
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        continue;
      }
      biomeMatches++;
      structureMatches++;

      const primaryReport = reports[0];
      const structures = reports.flatMap(report => displayStructuresForEdition(
        report.structureReport.structures,
        report.label,
        false
      ));
      const badges = reports.flatMap(report => confidenceBadges(report.query, report.structureReport));

      found.push({
        seed: seed.toString(),
        biomePoint: primaryReport.structureReport.cluster?.biomePoint || primaryReport.biomeReport.point,
        structures,
        badges,
        cluster: primaryReport.structureReport.cluster,
        query: activeQuery,
        biomeLabel: biomeOption.label,
        biomeY: biomeOption.y,
      });
      setResults([...found]);

      if (found.length >= 24) break;
      if (i % batch === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }

    setStatus({
      running: false,
      scanned,
      biomeMatches,
      structureMatches,
      stage: cancelRef.current ? 'Stopped' : 'Complete',
    });
  };

  const stopSearch = () => {
    cancelRef.current = true;
    setStatus(prev => ({ ...prev, running: false, stage: 'Stopping' }));
  };

  const saveSearch = () => {
    const item = {
      id: Date.now(),
      name: `${formatEditionVersion(query.edition, query.version)} - ${selectedBiome.label}`,
      query: normalizeQuery(query),
    };
    const next = [item, ...saved].slice(0, 8);
    setSaved(next);
    localStorage.setItem('seed-searches', JSON.stringify(next));
  };

  const copyShareUrl = async () => {
    const url = `${window.location.origin}/search?${encodeQuery(normalizeQuery(query))}`;
    await navigator.clipboard.writeText(url);
    setShareState('Copied');
    setTimeout(() => setShareState('Copy URL'), 1200);
  };

  const applyPreset = (preset) => {
    updateQuery(preset.query);
  };

  const openSubmitForResult = (result = null) => {
    if (!result) {
      setSubmitSeed(null);
      setShowSubmitModal(true);
      return;
    }

    const resultQuery = result.query || query;
    const point = result.biomePoint || result.structures[0] || null;
    const structureNames = result.structures.map(item => item.name).join(', ') || 'none selected';
    const category = resultQuery.structures.length > 0
      ? 'structure_combo'
      : resultQuery.biome !== 'any'
        ? 'rare_biome'
        : 'spawn_oddity';

    setSubmitSeed({
      seed: result.seed,
      category,
      edition: resultQuery.edition,
      versionNumber: resultQuery.version,
      coordinates: {
        x: point?.x ?? '',
        y: result.biomeY ?? selectedBiome.y ?? 64,
        z: point?.z ?? '',
      },
      description: [
        `Found with Search Lab using ${formatEditionVersion(resultQuery.edition, resultQuery.version)}.`,
        `Required biome: ${result.biomeLabel || selectedBiome.label}.`,
        `Required structures: ${structureNames}.`,
        `Structure cluster distance: ${formatDistance(result.cluster?.structureClusterDiameter)}.`,
        result.cluster?.biomeStructureDistance != null
          ? `Biome-structure cluster distance: ${formatDistance(result.cluster.biomeStructureDistance)}.`
          : 'Biome-structure cluster distance: off.',
        'Search Lab structures are candidates, not final in-game proof. Verify in Minecraft or with an official/JAR ground-truth run before treating the seed as 100%.',
      ].join('\n'),
    });
    setShowSubmitModal(true);
  };

  return (
    <>
      <Header onSubmitClick={() => openSubmitForResult(null)} />
      <main className="search-lab">
        <div className="search-lab-return">
          <Link href="/" className="search-home-btn">
            Back to Seed Finder Home
          </Link>
        </div>
        <section className="search-lab-header">
          <div>
            <span className="section-kicker">Procedural Search</span>
            <h1>Find seeds by constraints</h1>
            <p>
              Stream smart seed candidates through biome, structure, and cluster gates, then keep
              the worlds that survive the version-specific checks. Results are candidates until
              verified in Minecraft or against a trusted Java/C++ ground-truth generator.
            </p>
          </div>
          <div className="search-lab-actions">
            <button className="submit-btn search-run-top" onClick={runSearch} disabled={status.running}>
              {status.running ? 'Running...' : 'Run Search'}
            </button>
            <button className="submit-btn" onClick={() => openSubmitForResult(null)}>Submit Seed</button>
            <button className="submit-btn" onClick={saveSearch}>Save Search</button>
            <button className="submit-btn secondary" onClick={copyShareUrl}>{shareState}</button>
          </div>
        </section>

        <section className="preset-strip">
          {PRESETS.map(preset => (
            <button key={preset.id} className="preset-chip" onClick={() => applyPreset(preset)}>
              <span>{preset.label}</span>
              <small>{preset.description}</small>
            </button>
          ))}
        </section>

        <section className="search-workspace">
          <aside className="search-controls">
            <label>
              Edition
              <select className="filter-select" value={query.edition} onChange={e => updateQuery({
                edition: e.target.value,
                version: getDefaultVersionForEdition(e.target.value),
              })}>
                <option value="java">Java</option>
                <option value="bedrock">Bedrock</option>
              </select>
            </label>

            <label>
              Version
              <select className="filter-select" value={query.version} onChange={e => updateQuery({ version: e.target.value })}>
                {versionOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              Search key
              <input className="search-input compact" value={query.startSeed} onChange={e => updateQuery({ startSeed: e.target.value })} />
              <small className="control-help">Used as a salt for the smart stream. It does not scan 0, 1, 2...</small>
            </label>

            <div className="control-row">
              <label>
                Candidates
                <input className="search-input compact" type="number" min="1" max="20000" value={query.maxSeeds} onChange={e => updateQuery({ maxSeeds: e.target.value })} />
              </label>
              <label>
                Radius
                <input className="search-input compact" type="number" min="128" max="5000" value={query.radius} onChange={e => updateQuery({ radius: e.target.value })} />
              </label>
            </div>

            <label>
              Required biome
              <select className="filter-select" value={query.biome} onChange={e => updateQuery({ biome: e.target.value })}>
                {BIOME_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              Structure cluster distance
              <input className="search-input compact" type="number" min="0" max="5000" value={query.maxStructureDistance} onChange={e => updateQuery({ maxStructureDistance: e.target.value })} />
              <small className="control-help">Max pairwise distance between the selected structure types. 0 means structures only need to exist inside the radius.</small>
            </label>

            <label>
              Biome-structure distance
              <input className="search-input compact" type="number" min="0" max="5000" value={query.maxBiomeStructureDistance} onChange={e => updateQuery({ maxBiomeStructureDistance: e.target.value })} />
              <small className="control-help">Max distance from the matched biome sample to every selected structure. This combines the biome and structure requirements into one cluster.</small>
            </label>

            <div className="structure-picker">
              <span>Required structures</span>
              {STRUCTURE_OPTIONS.map(key => (
                <button
                  key={key}
                  type="button"
                  className={selectedStructures.has(key) ? 'selected' : ''}
                  onClick={() => toggleStructure(key)}
                >
                  {STRUCTURE_INFO[key].name}
                </button>
              ))}
            </div>

            <div className="run-row">
              <button className="submit-btn search-run-primary" onClick={runSearch} disabled={status.running}>
                {status.running ? 'Running...' : 'Run Search'}
              </button>
              {status.running && <button className="submit-btn secondary" onClick={stopSearch}>Stop</button>}
            </div>
          </aside>

          <section className="search-results">
            <div className="pipeline">
              <div>
                <span>{status.scanned}</span>
                <small>scanned</small>
              </div>
              <div>
                <span>{status.biomeMatches}</span>
                <small>biome pass</small>
              </div>
              <div>
                <span>{status.structureMatches}</span>
                <small>structure pass</small>
              </div>
              <div>
                <span>{status.stage}</span>
                <small>stage</small>
              </div>
            </div>

            <div className="search-explainer">
              <div>
                <strong>Search strategy</strong>
                <p>{strategyText}</p>
              </div>
              <div>
                <strong>Structure cluster</strong>
                <p>When enabled, every selected structure type must have one candidate within that block distance of the others.</p>
              </div>
              <div>
                <strong>Biome-structure cluster</strong>
                <p>When enabled, the selected structures must also sit within that block distance of the required biome sample.</p>
              </div>
              <div>
                <strong>Accuracy status</strong>
                <p>Structure results are candidate hits. Java checks cover region placement and sampled biomes; Bedrock checks use parity rendering and must be verified in-game for final proof.</p>
              </div>
            </div>

            {saved.length > 0 && (
              <div className="saved-searches">
                <span>Saved</span>
                {saved.map(item => (
                  <button key={item.id} onClick={() => setQuery(normalizeQuery(item.query))}>{item.name}</button>
                ))}
              </div>
            )}

            <div className="result-list">
              {results.length === 0 && (
                <div className="empty-state">
                  <h3>No candidates yet</h3>
                  <p>Run a preset or build a query. Results will appear as soon as a seed passes the gates.</p>
                </div>
              )}

              {results.map(result => (
                <article className="search-result" key={result.seed}>
                  <div>
                    <h2>{result.seed}</h2>
                    <p>
                      {result.biomePoint
                        ? `${result.biomeLabel || selectedBiome.label} near ${result.biomePoint.x}, ${result.biomePoint.z}`
                        : 'Biome unrestricted'}
                    </p>
                  </div>
                  <div className="result-badges">
                    {result.badges.map(badge => (
                      <span key={badge.label} className={`result-badge ${badge.level}`}>{badge.label}</span>
                    ))}
                  </div>
                  {result.structures.length > 0 && (
                    <ul className="result-structures">
                      {result.structures.map((structure, index) => (
                        <li key={`${structure.key}-${index}`}>
                          {structure.name}: {structure.x}, {structure.z}
                          <span>{structure.statusLabel || 'Candidate'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {result.structures.length > 0 && (
                    <p className="result-note">
                      Candidate result: placement/biome checks passed for the selected model, but this is not a 100% generated-world confirmation.
                    </p>
                  )}
                  {result.cluster && (
                    <p className="result-cluster">
                      Structure cluster: {formatDistance(result.cluster.structureClusterDiameter)}
                      {result.cluster.biomeStructureDistance != null
                        ? ` | Biome-structure cluster: ${formatDistance(result.cluster.biomeStructureDistance)}`
                        : ''}
                    </p>
                  )}
                  <div className="result-actions">
                    <button className="submit-btn secondary" onClick={() => navigator.clipboard.writeText(result.seed)}>Copy Seed</button>
                    <button className="submit-btn" onClick={() => openSubmitForResult(result)}>Submit Seed</button>
                    <Link className="external-link" href={`/?q=${encodeURIComponent(result.seed)}`}>Find in Catalog</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        initialData={submitSeed}
      />
    </>
  );
}
