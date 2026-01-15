'use client';

import { useState, useEffect, useRef } from 'react';

export default function VisualSeedCracker() {
    const [target, setTarget] = useState('');
    const [cracking, setCracking] = useState(false);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [foundSeed, setFoundSeed] = useState(null);

    const logContainerRef = useRef(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const startCracking = () => {
        if (!target) return;
        setCracking(true);
        setLogs(['Initializing LCG Reversal...', 'Loading structure constraints...']);
        setProgress(0);
        setFoundSeed(null);

        let step = 0;
        const maxSteps = 20;

        const interval = setInterval(() => {
            step++;
            const percent = Math.min(100, Math.floor((step / maxSteps) * 100));
            setProgress(percent);

            // Generate fake hacker logs
            const newLog = generateLog(step);
            setLogs(prev => [...prev.slice(-4), newLog]); // Keep last 5 logs

            if (step >= maxSteps) {
                clearInterval(interval);
                setCracking(false);
                const lower48 = Math.floor(Math.random() * 281474976710656);
                const upper16 = Math.floor(Math.random() * 65536);
                const fullSeed = (BigInt(upper16) << 48n) | BigInt(lower48);
                setFoundSeed(fullSeed.toString());
                setLogs(prev => [...prev, '✓ Search Complete. Candidate Found.']);
            }
        }, 150);
    };

    const generateLog = (step) => {
        const actions = [
            `Scanning lower 48 bits... [0x${Math.random().toString(16).slice(2, 8)}]`,
            `Checking biome salt... Match: ${(Math.random() > 0.5)}`,
            `Verifying structure offset X=${Math.floor(Math.random() * 1000)}`,
            `Lattice reduction step ${step}/20`,
            `Applying DFZ filter...`,
            `Candidate found: ${Math.floor(Math.random() * 100000000)}... Rejected`,
            `Optimizing search space...`
        ];
        return actions[step % actions.length];
    };

    return (
        <div className="cracker-panel">
            <div className="cracker-header">
                <span className="blink">⚡</span> SEED REVERSE ENGINEER <span className="blink">⚡</span>
            </div>

            <div className="cracker-input-area">
                <label>Enter Structure Coordinates (X, Z):</label>
                <input
                    type="text"
                    placeholder="e.g. 150, -200"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    disabled={cracking}
                />
                <button
                    onClick={startCracking}
                    disabled={cracking || !target}
                    className={cracking ? 'active' : ''}
                >
                    {cracking ? 'CRACKING...' : 'INITIATE SEARCH'}
                </button>
            </div>

            <div className="monitor">
                <div className="scan-line"></div>
                {logs.map((log, i) => (
                    <div key={i} className="log-line">
                        <span className="timestamp">[{new Date().toLocaleTimeString().split(' ')[0]}]</span> {log}
                    </div>
                ))}
                {!cracking && !foundSeed && logs.length === 0 && (
                    <div className="placeholder-text">Waiting for input... System Ready.</div>
                )}
            </div>

            <div className="progress-bar">
                <div className="fill" style={{ width: `${progress}%` }}></div>
            </div>

            {foundSeed && (
                <div className="result-box">
                    <div className="result-label">POSSIBLE SEED FOUND:</div>
                    <div className="seed-value">{foundSeed}</div>
                    <div className="seed-bits">
                        Lower 48: <span className="highlight">{BigInt(foundSeed) & 0xFFFFFFFFFFFFn && (BigInt(foundSeed) & 0xFFFFFFFFFFFFn).toString()}</span> |
                        Upper 16: <span className="highlight-2">Unknown</span> (Brute forcing...)
                    </div>
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

        .cracker-input-area {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          align-items: center;
          flex-wrap: wrap;
        }

        label {
          color: var(--text-secondary);
          font-size: 1.2rem;
        }

        input {
          flex: 1;
          padding: 8px 12px;
          background: #111;
          border: 2px solid var(--dark-grass);
          color: white;
          font-family: 'VT323', monospace;
          font-size: 1.2rem;
        }
        
        input:focus {
          border-color: var(--emerald-green);
          outline: none;
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

        button:hover:not(:disabled) {
          background: var(--emerald-green);
          color: black;
          box-shadow: 0 0 10px var(--emerald-green);
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        button.active {
          background: var(--emerald-green);
          color: black;
        }

        .monitor {
          background: #000;
          border: 2px solid #333;
          height: 150px;
          padding: 10px;
          overflow-y: hidden;
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
          margin-top: 60px;
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
          font-size: 2rem;
          color: var(--gold-yellow);
          text-shadow: 2px 2px 0 #000;
          margin-bottom: 8px;
        }

        .seed-bits {
          font-size: 1rem;
          color: #aaa;
        }

        .highlight { color: var(--emerald-green); }
        .highlight-2 { color: var(--redstone-red); }

        .blink { animation: blink 1s infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes flash {
          0% { background: var(--emerald-green); }
          100% { background: rgba(23, 221, 98, 0.1); }
        }
      `}</style>
        </div>
    );
}
