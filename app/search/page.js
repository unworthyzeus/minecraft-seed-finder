'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/Header';
import { BedrockBiomeGenerator } from '@/lib/cubiomes/bedrock';
import { Generator } from '@/lib/cubiomes/generator';
import { LegacyBiomeGenerator } from '@/lib/cubiomes/layers';
import {
  generateStructureCandidates,
  STRUCTURE_INFO,
  toCubiomesMcVersion,
} from '@/lib/cubiomes/structures';
import { BiomeID } from '@/lib/cubiomes/core';
import { CURRENT_MINECRAFT_VERSIONS, getSupportedGeneratorMinor } from '@/lib/version-utils';

const DEFAULT_QUERY = {
  edition: 'java',
  version: CURRENT_MINECRAFT_VERSIONS.java.version,
  startSeed: '0',
  maxSeeds: 250,
  radius: 768,
  biome: 'any',
  structures: [],
  maxStructureDistance: 0,
};

const BIOME_OPTIONS = [
  { id: 'any', label: 'Any biome', value: null },
  { id: 'mushroom_fields', label: 'Mushroom Fields', value: BiomeID.mushroom_fields },
  { id: 'plains', label: 'Plains', value: BiomeID.plains },
  { id: 'desert', label: 'Desert', value: BiomeID.desert },
  { id: 'jungle', label: 'Jungle', value: BiomeID.jungle },
  { id: 'badlands', label: 'Badlands', value: BiomeID.badlands },
  { id: 'cherry_grove', label: 'Cherry Grove', value: BiomeID.cherry_grove },
  { id: 'deep_dark', label: 'Deep Dark', value: BiomeID.deep_dark, y: -40 },
  { id: 'mangrove_swamp', label: 'Mangrove Swamp', value: BiomeID.mangrove_swamp },
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
  'ancient_city',
  'trail_ruins',
  'trial_chambers',
].filter(key => STRUCTURE_INFO[key]);

const PRESETS = [
  {
    id: 'mushroom-spawn',
    label: 'Mushroom Spawn',
    description: 'Biome scan near origin.',
    query: { biome: 'mushroom_fields', structures: [], radius: 1024, maxSeeds: 400 },
  },
  {
    id: 'village-portal',
    label: 'Village + Portal',
    description: 'Two practical overworld starts.',
    query: { biome: 'any', structures: ['village', 'ruined_portal'], radius: 1280, maxStructureDistance: 320, maxSeeds: 300 },
  },
  {
    id: 'ancient-city',
    label: 'Ancient City',
    description: 'Deep dark generation candidate.',
    query: { version: '1.19.2', biome: 'deep_dark', structures: ['ancient_city'], radius: 1600, maxSeeds: 350 },
  },
  {
    id: 'quad-cluster',
    label: 'Structure Cluster',
    description: 'Four surface structure families.',
    query: { biome: 'any', structures: ['village', 'ruined_portal', 'outpost', 'desert_pyramid'], radius: 1800, maxStructureDistance: 700, maxSeeds: 300 },
  },
  {
    id: 'bedrock-safe',
    label: 'Bedrock Current',
    description: 'Current Bedrock parity renderer.',
    query: { edition: 'bedrock', version: CURRENT_MINECRAFT_VERSIONS.bedrock.version, biome: 'any', structures: ['village', 'ruined_portal'], radius: 1280, maxStructureDistance: 360, maxSeeds: 250 },
  },
];

const STATUS_IDLE = {
  running: false,
  scanned: 0,
  biomeMatches: 0,
  structureMatches: 0,
  stage: 'Idle',
};

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

function getBiomeOption(id) {
  return BIOME_OPTIONS.find(option => option.id === id) || BIOME_OPTIONS[0];
}

function sampleBiomeNear(generator, biomeOption, radius) {
  if (!biomeOption.value) return { matched: true, point: null };

  const step = biomeOption.id === 'deep_dark' ? 64 : 96;
  let best = null;
  for (let z = -radius; z <= radius; z += step) {
    for (let x = -radius; x <= radius; x += step) {
      if ((x * x + z * z) > radius * radius) continue;
      const biome = typeof generator.getBiomeAtY === 'function'
        ? generator.getBiomeAtY(x, biomeOption.y ?? 64, z)
        : generator.getBiome(x, z);
      if (biome === biomeOption.value) {
        const dist = Math.round(Math.sqrt(x * x + z * z));
        if (!best || dist < best.distance) best = { x, z, distance: dist, biome };
      }
    }
  }

  return { matched: Boolean(best), point: best };
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function findStructureCluster(groups, keys, maxDistance) {
  if (keys.length < 2 || maxDistance <= 0) return true;
  const choices = keys.map(key => (groups.get(key) || []).slice(0, 8));
  if (choices.some(group => group.length === 0)) return false;

  const pick = (index, selected) => {
    if (index === choices.length) return true;
    for (const candidate of choices[index]) {
      if (selected.every(item => distance(item, candidate) <= maxDistance) && pick(index + 1, [...selected, candidate])) {
        return true;
      }
    }
    return false;
  };

  return pick(0, []);
}

function analyzeStructures(query, generator, seed) {
  if (query.structures.length === 0) {
    return { matched: true, structures: [], statuses: [] };
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
  }).sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));

  const groups = new Map();
  for (const structure of structures) {
    if (!groups.has(structure.key)) groups.set(structure.key, []);
    groups.get(structure.key).push(structure);
  }

  const hasAll = query.structures.every(key => groups.has(key));
  if (!hasAll) return { matched: false, structures, statuses: [] };

  const clustered = findStructureCluster(groups, query.structures, Number(query.maxStructureDistance));
  if (!clustered) return { matched: false, structures, statuses: [] };

  const picked = query.structures.flatMap(key => (groups.get(key) || []).slice(0, 2));
  return {
    matched: true,
    structures: picked,
    statuses: picked.map(item => item.status),
  };
}

function confidenceBadges(query, structureReport) {
  const badges = [];
  if (query.edition === 'bedrock') {
    badges.push({ label: 'Bedrock parity', level: 'approx' });
  } else {
    badges.push({ label: 'Exact placement', level: 'exact' });
  }
  if (query.biome !== 'any') badges.push({ label: 'Biome-confirmed', level: 'biome' });
  if (structureReport.statuses.includes('terrain-candidate')) {
    badges.push({ label: 'Terrain-candidate', level: 'candidate' });
  }
  if (structureReport.statuses.includes('confirmed')) {
    badges.push({ label: 'Structure-confirmed', level: 'exact' });
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
  };
}

function normalizeQuery(query) {
  return {
    ...query,
    maxSeeds: Math.max(1, Math.min(5000, Number(query.maxSeeds) || DEFAULT_QUERY.maxSeeds)),
    radius: Math.max(128, Math.min(5000, Number(query.radius) || DEFAULT_QUERY.radius)),
    maxStructureDistance: Math.max(0, Math.min(5000, Number(query.maxStructureDistance) || 0)),
  };
}

export default function SearchPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [status, setStatus] = useState(STATUS_IDLE);
  const [results, setResults] = useState([]);
  const [saved, setSaved] = useState([]);
  const [shareState, setShareState] = useState('Copy URL');
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

  const selectedBiome = useMemo(() => getBiomeOption(query.biome), [query.biome]);
  const selectedStructures = useMemo(() => new Set(query.structures), [query.structures]);

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
    const maxSeeds = Number(activeQuery.maxSeeds);
    const batch = 25;
    let scanned = 0;
    let biomeMatches = 0;
    let structureMatches = 0;
    const found = [];

    for (let i = 0; i < maxSeeds; i++) {
      if (cancelRef.current) break;
      scanned = i + 1;
      const seed = start + BigInt(i);
      const generator = createGenerator(activeQuery.edition, activeQuery.version, seed);

      const biomeReport = sampleBiomeNear(generator, selectedBiome, Number(activeQuery.radius));
      if (!biomeReport.matched) {
        if (i % batch === 0) {
          setStatus({ running: true, scanned, biomeMatches, structureMatches, stage: 'Biome gate' });
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        continue;
      }
      biomeMatches++;

      const structureReport = analyzeStructures(activeQuery, generator, seed);
      if (!structureReport.matched) {
        if (i % batch === 0) {
          setStatus({ running: true, scanned, biomeMatches, structureMatches, stage: 'Structure gate' });
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        continue;
      }
      structureMatches++;

      found.push({
        seed: seed.toString(),
        biomePoint: biomeReport.point,
        structures: structureReport.structures,
        badges: confidenceBadges(activeQuery, structureReport),
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
      name: `${query.edition} ${query.version} - ${selectedBiome.label}`,
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

  return (
    <>
      <Header onSubmitClick={() => {}} />
      <main className="search-lab">
        <section className="search-lab-header">
          <div>
            <span className="section-kicker">Procedural Search</span>
            <h1>Find seeds by constraints</h1>
            <p>
              Stream numeric seeds through biome and structure gates, then keep the candidates
              that survive the version-specific checks.
            </p>
          </div>
          <div className="search-lab-actions">
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
                version: e.target.value === 'bedrock' ? CURRENT_MINECRAFT_VERSIONS.bedrock.version : CURRENT_MINECRAFT_VERSIONS.java.version,
              })}>
                <option value="java">Java</option>
                <option value="bedrock">Bedrock</option>
              </select>
            </label>

            <label>
              Version
              <input className="search-input compact" value={query.version} onChange={e => updateQuery({ version: e.target.value })} />
            </label>

            <label>
              Start seed
              <input className="search-input compact" value={query.startSeed} onChange={e => updateQuery({ startSeed: e.target.value })} />
            </label>

            <div className="control-row">
              <label>
                Seeds
                <input className="search-input compact" type="number" min="1" max="5000" value={query.maxSeeds} onChange={e => updateQuery({ maxSeeds: e.target.value })} />
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
              <button className="submit-btn" onClick={runSearch} disabled={status.running}>
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
                        ? `${selectedBiome.label} near ${result.biomePoint.x}, ${result.biomePoint.z}`
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
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="result-actions">
                    <button className="submit-btn secondary" onClick={() => navigator.clipboard.writeText(result.seed)}>Copy Seed</button>
                    <Link className="external-link" href={`/?q=${encodeURIComponent(result.seed)}`}>Find in Catalog</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
