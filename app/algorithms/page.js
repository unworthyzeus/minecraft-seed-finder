'use client';

import Link from 'next/link';
import Header from '../../components/Header';

export default function AlgorithmsPage() {
    return (
        <>
            <Header />
            <main className="algorithms-page">
                <div className="container">
                    <Link href="/" className="back-link">
                        ← Back to Seeds
                    </Link>

                    <h1>Seed Discovery Algorithms</h1>
                    <p className="intro">
                        How are rare Minecraft seeds discovered? This page explains the math,
                        algorithms, and code behind finding phenomena like 12-eye End Portals,
                        tall cacti, and impossible structure combinations.
                    </p>

                    <section className="algo-section">
                        <h2>🎯 12-Eye End Portal</h2>
                        <div className="probability-box">
                            <span className="prob-label">Probability:</span>
                            <span className="prob-value">1 in 10¹² (1 trillion)</span>
                        </div>

                        <h3>The Math</h3>
                        <p>
                            Each End Portal frame has a <strong>10% chance</strong> (1/10) of generating
                            with an Eye of Ender already placed. A complete portal has 12 frames.
                        </p>

                        <div className="code-block">
                            <pre>{`// Probability calculation
P(12 eyes) = (1/10)^12 
           = 1/1,000,000,000,000
           = 0.0000000001%

// In code terms:
for each frame in portal.frames:
    if random() < 0.1:  // 10% chance
        frame.hasEye = true`}</pre>
                        </div>

                        <h3>How They're Found</h3>
                        <p>
                            Projects like <strong>Minecraft@Home</strong> use distributed computing to
                            check billions of seeds. The process:
                        </p>
                        <ol>
                            <li>Generate world seed</li>
                            <li>Locate stronghold position using structure seed algorithm</li>
                            <li>Check End Portal frames using the decoration RNG</li>
                            <li>If 12 eyes found, record and verify</li>
                        </ol>

                        <div className="code-block">
                            <pre>{`// Cubiomes approach (C pseudocode)
uint64_t seed;
for (seed = 0; seed < (1ULL << 48); seed++) {
    // Get stronghold position
    StrongholdIter sh;
    initFirstStronghold(&sh, mc, seed);
    
    // Check portal eyes
    int eyes = getEndPortalEyes(mc, seed, sh.pos);
    if (eyes == 12) {
        printf("Found 12-eye: %lld\\n", seed);
    }
}`}</pre>
                        </div>
                    </section>

                    <section className="algo-section">
                        <h2>🌵 Tall Cacti (Kaktwoos Project)</h2>
                        <div className="probability-box">
                            <span className="prob-label">22-Block Cactus:</span>
                            <span className="prob-value">~1 in 10¹⁸ (quintillion)</span>
                        </div>

                        <h3>The Math</h3>
                        <p>
                            Cacti generate in deserts with a base height of 1-3 blocks. However, the
                            world generator can stack cacti due to chunk decoration order. Each additional
                            block has roughly a 1/4096 chance of generating.
                        </p>

                        <div className="code-block">
                            <pre>{`// Cactus height probability
P(height = n) ≈ (1/4096)^(n-3) for n > 3

// 22-block cactus:
P(22) ≈ (1/4096)^19
      ≈ 1 in 10^68 (per location)

// But with billions of desert chunks...
Expected_seeds_checked ≈ 10^18 for one discovery`}</pre>
                        </div>

                        <h3>How They're Found</h3>
                        <p>
                            The <strong>Kaktwoos Project</strong> uses GPU-accelerated search across trillions
                            of seeds, checking desert biomes for tall cacti formations.
                        </p>
                    </section>

                    <section className="algo-section">
                        <h2>🏗️ Structure Placement Algorithm</h2>

                        <h3>The Math</h3>
                        <p>
                            Minecraft divides the world into regions (typically 32x32 chunks). Each structure
                            type has one generation attempt per region, with the position determined by the
                            <strong>structure seed</strong>.
                        </p>

                        <div className="code-block">
                            <pre>{`// Structure position calculation
function getStructurePos(structType, seed, regionX, regionZ) {
    // Structure seed = lower 48 bits of world seed
    structSeed = seed & 0xFFFFFFFFFFFF;
    
    // Mix with region coordinates
    positionSeed = structSeed ^ (regionX * SALT_X);
    positionSeed ^= (regionZ * SALT_Z);
    
    // Get position within region
    x = nextInt(positionSeed, REGION_SIZE);
    z = nextInt(positionSeed, REGION_SIZE);
    
    return {
        x: regionX * REGION_SIZE * 16 + x * 16,
        z: regionZ * REGION_SIZE * 16 + z * 16
    };
}`}</pre>
                        </div>

                        <h3>Quad-Witch Huts</h3>
                        <p>
                            Four witch huts can spawn close enough for a single AFK spot. This requires
                            specific lower 20 bits of the seed, limiting the search space to 2^28 seeds.
                        </p>

                        <div className="code-block">
                            <pre>{`// Quad-hut constellation detection
KNOWN_LOWER_20_BITS = [0x1a2b3, 0x4c5d6, ...]; // Precalculated

for lower20 in KNOWN_LOWER_20_BITS:
    for upper28 in range(2^28):
        seed = (upper28 << 20) | lower20;
        if isQuadHut(seed):
            recordSeed(seed);`}</pre>
                        </div>
                    </section>

                    <section className="algo-section">
                        <h2>🌍 World Generation RNG</h2>

                        <h3>Linear Congruential Generator (LCG)</h3>
                        <p>
                            Minecraft uses a 48-bit LCG for random number generation. This is deterministic
                            and reversible, which is key to seed cracking.
                        </p>

                        <div className="code-block">
                            <pre>{`// Java's Random implementation (simplified)
class JavaRandom {
    seed: int64;
    
    // LCG constants
    MULTIPLIER = 0x5DEECE66D;
    ADDEND = 0xB;
    MASK = (1 << 48) - 1;
    
    next(bits) {
        this.seed = (this.seed * MULTIPLIER + ADDEND) & MASK;
        return this.seed >> (48 - bits);
    }
    
    nextInt(bound) {
        return this.next(31) % bound;
    }
    
    nextFloat() {
        return this.next(24) / (1 << 24);
    }
}`}</pre>
                        </div>

                        <h3>Cracking Seeds from Features</h3>
                        <p>
                            Given enough world information (structures, biomes, decorations), it's possible
                            to reverse-engineer the world seed. Tools like <strong>SeedCracker</strong> do this
                            automatically by collecting data as you explore.
                        </p>
                    </section>

                    <section className="algo-section">
                        <h2>📚 Resources & Tools</h2>

                        <div className="resource-grid">
                            <a href="https://github.com/Cubitect/cubiomes" target="_blank" rel="noopener" className="resource-card">
                                <h4>Cubiomes</h4>
                                <p>C library for Minecraft biome generation. Used by most seed-finding tools.</p>
                            </a>

                            <a href="https://github.com/Cubitect/cubiomes-viewer" target="_blank" rel="noopener" className="resource-card">
                                <h4>Cubiomes Viewer</h4>
                                <p>GUI for seed finding with customizable structure conditions.</p>
                            </a>

                            <a href="https://github.com/KaptainWutax" target="_blank" rel="noopener" className="resource-card">
                                <h4>KaptainWutax Libraries</h4>
                                <p>Java libraries for advanced seed manipulation and structure finding.</p>
                            </a>

                            <a href="https://minecraftathome.com/" target="_blank" rel="noopener" className="resource-card">
                                <h4>Minecraft@Home</h4>
                                <p>Distributed computing project that discovered Pack.PNG and many rare seeds.</p>
                            </a>
                        </div>
                    </section>

                    <section className="algo-section">
                        <h2>🧮 Try It Yourself</h2>
                        <p>
                            Want to find rare seeds? Here's how to get started:
                        </p>

                        <ol className="steps-list">
                            <li>
                                <strong>Download Cubiomes Viewer</strong> - Available for Windows, Linux, and macOS
                            </li>
                            <li>
                                <strong>Set up conditions</strong> - Define what structures/biomes you want near spawn
                            </li>
                            <li>
                                <strong>Start searching</strong> - The tool will generate and test seeds automatically
                            </li>
                            <li>
                                <strong>Verify in-game</strong> - Always test promising seeds in actual Minecraft
                            </li>
                        </ol>

                        <div className="warning-box">
                            <strong>Note:</strong> Finding extremely rare phenomena (12-eye portals, 22+ cacti)
                            requires massive computational resources. These discoveries typically come from
                            distributed projects running on thousands of computers.
                        </div>
                    </section>
                </div>
            </main>

            <style jsx>{`
        .algorithms-page {
          padding: 32px 16px 80px;
        }
        
        .intro {
          font-size: 1.2rem;
          color: var(--text-secondary);
          margin-bottom: 32px;
          max-width: 700px;
        }
        
        h1 {
          font-family: 'Press Start 2P', cursive;
          font-size: 1.2rem;
          color: var(--gold-yellow);
          margin-bottom: 16px;
          line-height: 1.6;
        }
        
        .algo-section {
          background: var(--bg-card);
          border: 4px solid var(--border-color);
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .algo-section h2 {
          font-family: 'Press Start 2P', cursive;
          font-size: 0.9rem;
          color: var(--emerald-green);
          margin-bottom: 16px;
        }
        
        .algo-section h3 {
          color: var(--gold-yellow);
          margin: 20px 0 12px;
          font-size: 1.1rem;
        }
        
        .probability-box {
          background: var(--obsidian);
          border: 2px solid var(--emerald-green);
          padding: 12px 16px;
          display: inline-flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .prob-label {
          color: var(--text-secondary);
        }
        
        .prob-value {
          color: var(--emerald-green);
          font-weight: bold;
        }
        
        .code-block {
          background: var(--obsidian);
          border: 2px solid var(--border-color);
          padding: 16px;
          overflow-x: auto;
          margin: 16px 0;
        }
        
        .code-block pre {
          margin: 0;
          font-family: 'VT323', monospace;
          font-size: 1rem;
          color: var(--diamond-blue);
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        ol, ul {
          margin: 16px 0;
          padding-left: 24px;
        }
        
        li {
          margin: 8px 0;
          color: var(--text-secondary);
        }
        
        .resource-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        
        .resource-card {
          background: var(--obsidian);
          border: 3px solid var(--border-color);
          padding: 16px;
          transition: all 0.15s;
          color: var(--text-primary);
        }
        
        .resource-card:hover {
          border-color: var(--emerald-green);
          transform: translateY(-2px);
        }
        
        .resource-card h4 {
          color: var(--gold-yellow);
          margin-bottom: 8px;
        }
        
        .resource-card p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin: 0;
        }
        
        .steps-list li {
          margin: 12px 0;
        }
        
        .warning-box {
          background: rgba(252, 219, 74, 0.1);
          border: 2px solid var(--gold-yellow);
          padding: 16px;
          margin-top: 20px;
          color: var(--text-secondary);
        }
        
        .warning-box strong {
          color: var(--gold-yellow);
        }
        
        @media (max-width: 600px) {
          h1 {
            font-size: 0.9rem;
          }
          
          .algo-section h2 {
            font-size: 0.75rem;
          }
          
          .code-block pre {
            font-size: 0.85rem;
          }
        }
      `}</style>
        </>
    );
}
