'use client';

import { useEffect, useRef, useState } from 'react';
import { Generator } from '@/lib/cubiomes/generator';
import { LegacyBiomeGenerator } from '@/lib/cubiomes/layers';
import { generateStructureCandidates, parseWorldSeed, STRUCTURE_INFO, toCubiomesMcVersion } from '@/lib/cubiomes/structures';
import { getSupportedGeneratorMinor } from '@/lib/version-utils';

const PRESETS = [
    { value: 'ancient_trials', label: 'Ancient City + Trials', types: ['ancient_city', 'trial_chambers'], version: '26.1.2', radius: 1200 },
    { value: 'village_portal', label: 'Village + Portal', types: ['village', 'ruined_portal'], version: '1.21', radius: 1200 },
    { value: 'mansion_village', label: 'Mansion + Village', types: ['mansion', 'village'], version: '1.20', radius: 1280 },
    { value: 'ocean_loot', label: 'Ocean Loot', types: ['shipwreck', 'ocean_ruin', 'buried_treasure'], version: '1.21', radius: 1400 },
    { value: 'witch_hut', label: 'Witch Hut', types: ['witch_hut'], version: '1.12', radius: 512 }
];

const VERSION_OPTIONS = ['26.1.2', '26.1.1', '26.1', '1.21', '1.20', '1.19.2', '1.18', '1.16.1', '1.12', 'Beta 1.8'];
const STRUCTURE_NAMES = Object.fromEntries(Object.entries(STRUCTURE_INFO).map(([key, info]) => [key, info.name]));

function parseTarget(value) {
    const parts = String(value || '').match(/-?\d+/g);
    if (!parts || parts.length < 2) return null;
    const x = Number(parts[0]);
    const z = Number(parts.length >= 3 ? parts[2] : parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
    return { x, z };
}

function formatStructures(structures) {
    return structures
        .map(s => `${s.name || STRUCTURE_NAMES[s.key] || s.key} @ ${s.x}, ${s.z} (${s.statusLabel || 'Candidate'})`)
        .join(' | ');
}

function createJavaGenerator(seed, version) {
    const minor = getSupportedGeneratorMinor(version);
    if (minor >= 18) {
        const gen = new Generator();
        gen.setupGenerator(minor);
        gen.applySeed(seed);
        return {
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

function pickNearestByType(structures, target, types) {
    return types.map(type => structures
        .filter(structure => structure.key === type)
        .sort((a, b) => Math.hypot(a.x - target.x, a.z - target.z) - Math.hypot(b.x - target.x, b.z - target.z))[0]
    ).filter(Boolean);
}

function findStructuresNear(seedInput, version, target, radius, types) {
    const seed = parseWorldSeed(seedInput);
    const generator = createJavaGenerator(seed, version);
    const structures = generateStructureCandidates({
        seed,
        version,
        edition: 'java',
        centerX: target.x,
        centerZ: target.z,
        range: radius,
        generator,
        includeUnconfirmed: false,
        structureKeys: types,
    });
    const matches = types.every(type => structures.some(structure => structure.key === type));
    return {
        matches,
        structures: matches ? pickNearestByType(structures, target, types) : structures.slice(0, 8),
    };
}

export default function VisualSeedCracker() {
    const [presetValue, setPresetValue] = useState(PRESETS[0].value);
    const activePreset = PRESETS.find(p => p.value === presetValue) || PRESETS[0];
    const [target, setTarget] = useState('0, 0');
    const [version, setVersion] = useState(activePreset.version);
    const [radius, setRadius] = useState(activePreset.radius);
    const [scanLimit, setScanLimit] = useState(250);
    const [startSeed, setStartSeed] = useState('');
    const [cracking, setCracking] = useState(false);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);

    const logContainerRef = useRef(null);
    const cancelRef = useRef(false);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        const requestedPreset = new URLSearchParams(window.location.search).get('preset');
        if (requestedPreset && PRESETS.some(preset => preset.value === requestedPreset)) {
            setPresetValue(requestedPreset);
        }
    }, []);

    useEffect(() => {
        const preset = PRESETS.find(p => p.value === presetValue) || PRESETS[0];
        setVersion(preset.version);
        setRadius(preset.radius);
    }, [presetValue]);

    const pushLog = (line) => {
        setLogs(prev => [...prev.slice(-8), line]);
    };

    const stopSearch = () => {
        cancelRef.current = true;
        setCracking(false);
        pushLog('Search stopped.');
    };

    const startSearch = () => {
        const parsedTarget = parseTarget(target);
        if (!parsedTarget) {
            setLogs(['Enter target coordinates as X, Z or X, Y, Z.']);
            return;
        }

        const preset = PRESETS.find(p => p.value === presetValue) || PRESETS[0];
        const maxSeeds = Math.max(1, Math.min(5000, Number(scanLimit) || 250));
        const searchRadius = Math.max(32, Math.min(4096, Number(radius) || preset.radius));
        const baseSeed = startSeed && /^-?\d+$/.test(startSeed)
            ? BigInt(startSeed)
            : BigInt(Math.floor(Math.random() * 2147483647));

        cancelRef.current = false;
        setCracking(true);
        setResults([]);
        setProgress(0);
        setLogs([
            `Using Java ${version} placement salts and biome checks.`,
            `Target: X ${parsedTarget.x}, Z ${parsedTarget.z} within ${searchRadius} blocks.`,
            `Scanning ${maxSeeds.toLocaleString()} seeds from ${baseSeed.toString()}...`
        ]);

        let scanned = 0;
        const found = [];
        const batchSize = 10;

        const runBatch = () => {
            if (cancelRef.current) return;

            for (let i = 0; i < batchSize && scanned < maxSeeds && found.length < 5; i++) {
                const candidate = baseSeed + BigInt(scanned);
                scanned++;

                try {
                    const check = findStructuresNear(candidate, version, parsedTarget, searchRadius, preset.types);
                    if (check.matches) {
                        const match = {
                            seed: candidate.toString(),
                            structures: check.structures
                        };
                        found.push(match);
                        setResults([...found]);
                        pushLog(`Candidate: ${candidate.toString()} -> ${formatStructures(check.structures)}`);
                    } else if (scanned === 1 || scanned % 50 === 0) {
                        pushLog(`Checked ${scanned.toLocaleString()} seeds. Latest: ${candidate.toString()}`);
                    }
                } catch (error) {
                    pushLog(`Skipped ${candidate.toString()}: ${error.message || 'simulation failed'}`);
                }
            }

            setProgress(Math.floor((scanned / maxSeeds) * 100));

            if (scanned >= maxSeeds || found.length >= 5) {
                setCracking(false);
                pushLog(found.length
                    ? `Search complete. ${found.length} matched candidate${found.length === 1 ? '' : 's'} found.`
                    : 'Search complete. No matched candidates in this scan window.');
                return;
            }

            window.setTimeout(runBatch, 0);
        };

        window.setTimeout(runBatch, 0);
    };

    return (
        <div className="cracker-panel">
            <div className="cracker-header">
                <span className="blink">⚡</span> STRUCTURE SEED SEARCHER <span className="blink">⚡</span>
            </div>

            <div className="edition-note">
                Java Edition only. Results are structure candidates: placement and biome checks can pass before terrain/start or official 26.x fixture verification.
            </div>

            <div className="cracker-grid">
                <label>
                    Target
                    <input
                        type="text"
                        placeholder="e.g. 150, -200"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        disabled={cracking}
                    />
                </label>

                <label>
                    Goal
                    <select value={presetValue} onChange={(e) => setPresetValue(e.target.value)} disabled={cracking}>
                        {PRESETS.map(preset => (
                            <option key={preset.value} value={preset.value}>{preset.label}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Version
                    <select value={version} onChange={(e) => setVersion(e.target.value)} disabled={cracking}>
                        {VERSION_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </label>

                <label>
                    Radius
                    <input
                        type="number"
                        min="32"
                        max="4096"
                        step="32"
                        value={radius}
                        onChange={(e) => setRadius(e.target.value)}
                        disabled={cracking}
                    />
                </label>

                <label>
                    Seeds to scan
                    <input
                        type="number"
                        min="1"
                        max="5000"
                        value={scanLimit}
                        onChange={(e) => setScanLimit(e.target.value)}
                        disabled={cracking}
                    />
                </label>

                <label>
                    Start seed
                    <input
                        type="text"
                        placeholder="random"
                        value={startSeed}
                        onChange={(e) => setStartSeed(e.target.value)}
                        disabled={cracking}
                    />
                </label>
            </div>

            <div className="cracker-actions">
                <button
                    onClick={startSearch}
                    disabled={cracking}
                    className={cracking ? 'active' : ''}
                >
                    {cracking ? 'SEARCHING...' : 'START STRUCTURE SEARCH'}
                </button>
                {cracking && (
                    <button type="button" onClick={stopSearch} className="secondary">
                        STOP
                    </button>
                )}
            </div>

            <div className="monitor" ref={logContainerRef}>
                <div className="scan-line"></div>
                {logs.map((log, i) => (
                    <div key={`${log}-${i}`} className="log-line">
                        <span className="timestamp">[{new Date().toLocaleTimeString().split(' ')[0]}]</span> {log}
                    </div>
                ))}
                {!cracking && logs.length === 0 && (
                    <div className="placeholder-text">Waiting for target coordinates...</div>
                )}
            </div>

            <div className="progress-bar">
                <div className="fill" style={{ width: `${progress}%` }}></div>
            </div>

            {results.length > 0 && (
                <div className="results">
                    {results.map(result => (
                        <div className="result-box" key={result.seed}>
                            <div className="result-label">MATCHED CANDIDATE</div>
                            <div className="seed-value">{result.seed}</div>
                            <div className="seed-bits">{formatStructures(result.structures)}</div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
        .cracker-panel {
          font-family: 'VT323', monospace;
          background: #0a0a0a;
          border: 4px solid var(--emerald-green);
          padding: 20px;
          margin: 32px 0;
          box-shadow: 0 0 20px rgba(23, 221, 98, 0.2);
          position: relative;
        }

        .cracker-header {
          text-align: center;
          color: var(--emerald-green);
          font-size: 1.5rem;
          margin-bottom: 20px;
          border-bottom: 2px solid var(--dark-grass);
          padding-bottom: 10px;
          text-shadow: 0 0 5px var(--emerald-green);
        }

        .edition-note {
          color: var(--text-secondary);
          background: rgba(74, 237, 217, 0.08);
          border: 2px solid rgba(74, 237, 217, 0.35);
          padding: 10px 12px;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .cracker-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }

        label {
          color: var(--text-secondary);
          font-size: 1.05rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        input,
        select {
          width: 100%;
          padding: 8px 10px;
          background: #111;
          border: 2px solid var(--dark-grass);
          color: white;
          font-family: 'VT323', monospace;
          font-size: 1.15rem;
        }
        
        input:focus,
        select:focus {
          border-color: var(--emerald-green);
          outline: none;
        }

        .cracker-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        button {
          background: var(--dark-grass);
          color: white;
          border: 2px solid var(--emerald-green);
          padding: 8px 20px;
          font-family: 'VT323', monospace;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        button.secondary {
          border-color: var(--accent-amber);
          background: rgba(249, 115, 22, 0.2);
        }

        button:hover:not(:disabled) {
          background: var(--emerald-green);
          color: black;
          box-shadow: 0 0 10px var(--emerald-green);
        }
        
        button:disabled,
        input:disabled,
        select:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        button.active {
          background: var(--emerald-green);
          color: black;
        }

        .monitor {
          background: #000;
          border: 2px solid #333;
          height: 180px;
          padding: 10px;
          overflow-y: auto;
          position: relative;
          color: #00ff00;
          font-size: 1rem;
          margin-bottom: 16px;
        }

        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: rgba(0, 255, 0, 0.5);
          animation: scan 2s linear infinite;
          opacity: 0.3;
          pointer-events: none;
        }

        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }

        .log-line {
          margin-bottom: 4px;
        }

        .timestamp {
          color: #008800;
        }

        .placeholder-text {
          color: #444;
          text-align: center;
          margin-top: 72px;
          animation: blink 2s infinite;
        }

        .progress-bar {
          height: 10px;
          background: #222;
          width: 100%;
          margin-bottom: 16px;
        }

        .fill {
          height: 100%;
          background: var(--emerald-green);
          transition: width 0.15s linear;
          box-shadow: 0 0 10px var(--emerald-green);
        }

        .results {
          display: grid;
          gap: 12px;
        }

        .result-box {
          background: rgba(23, 221, 98, 0.1);
          border: 2px dashed var(--emerald-green);
          padding: 16px;
          text-align: center;
          animation: flash 0.5s;
        }

        .result-label {
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .seed-value {
          color: var(--gold-yellow);
          font-size: 1.5rem;
          word-break: break-all;
          margin-bottom: 8px;
          text-shadow: 0 0 5px var(--gold-yellow);
        }

        .seed-bits {
          color: #888;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        @keyframes flash {
          from { background: var(--emerald-green); color: black; }
          to { background: rgba(23, 221, 98, 0.1); color: inherit; }
        }

        @media (max-width: 640px) {
          .cracker-panel {
            padding: 14px;
          }

          .cracker-header {
            font-size: 1.2rem;
          }
        }
      `}</style>
        </div>
    );
}
