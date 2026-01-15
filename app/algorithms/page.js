'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import VisualSeedCracker from '../../components/VisualSeedCracker';
import SubmitModal from '../../components/SubmitModal';

export default function AlgorithmsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Header onSubmitClick={() => setIsModalOpen(true)} />
      <SubmitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <main className="algorithms-page">
        <div className="container">
          <Link href="/" className="back-link">
            ← Back to Seeds
          </Link>

          <h1 className="page-title">Seed Discovery Algorithms</h1>
          <p className="intro">
            A deep dive into the mathematics, RNG implementations, and reverse-engineering
            techniques used to discover the rarest Minecraft seeds in existence.
          </p>

          <section className="algo-section">
            <div className="section-header">
              <h2>🌌 12-Eye End Portal</h2>
              <span className="tag rare">1 in 1 trillion</span>
            </div>

            <p>
              An End Portal frame consists of 12 blocks. Each block has a <strong>10% independent chance</strong>
              of generating with an Eye of Ender already filled. A "12-eye" portal is one where
              all 12 frames generate with eyes, activating the portal instantly.
            </p>

            <h3>The Mathematics</h3>
            <div className="math-box">
              <p>
                The probability $P$ of a specific frame having an eye is $0.1$.
                Since all 12 frames are determined independently by the chunk RNG:
              </p>
              <code className="math-formula">
                P(12 eyes) = (1/10)¹² = 10⁻¹²
              </code>
              <p>
                This means <strong>1 in 1,000,000,000,000</strong> portals (one trillion) will be fully lit.
                With roughly 128 strongholds per world (in modern versions), you'd need to generate
                about <strong>7.8 billion worlds</strong> to find just one.
              </p>
            </div>

            <h3>RNG Implementation (Java)</h3>
            <p>
              The game uses the chunk's random seed to determine decoration placement.
              Here is the decompiled logic responsible for eye generation:
            </p>

            <div className="code-block">
              <div className="code-header">EndPortalFrameBlock.java</div>
              <pre>{`public BlockState getStateForPlacement(BlockPlaceContext context) {
    // ...
    boolean hasEye = false;
    if (Config.configuredStructures) {
        // Use the Chunk RNG, initialized with world seed + chunk coords
        Random random = new Random();
        random.setSeed(chunkX * 341873128712L + chunkZ * 132897987541L + worldSeed + 10387312L);
        
        // precise 10% chance check
        if (random.nextFloat() < 0.1F) {
            hasEye = true;
        }
    }
    return this.getDefaultState().with(HAS_EYE, hasEye);
}`}</pre>
            </div>
          </section>

          <section className="algo-section">
            <div className="section-header">
              <h2>🌵 Infinite Cactus Stacking</h2>
              <span className="tag legendary">~1 in 10¹⁸</span>
            </div>

            <p>
              Cacti normally grow 1-3 blocks high. However, during world generation,
              if a new cactus block attempts to generate on top of an existing one,
              it simply adds to the height. This can chain recursively due to
              <span className="highlight">chunk population order</span>.
            </p>

            <h3>The recursive formula</h3>
            <p>
              Each extra block of height requires a successful RNG roll <strong>and</strong>
              a specific chunk generation order. The probability drops exponentially.
            </p>

            <div className="code-block">
              <pre>{`// Simplified probability model per block above 3
P(h) ≈ P(h-1) * (1 / 4096)

// For a 22-block cactus (World Record):
P(22) ≈ (1/4096)¹⁹ ≈ 1.8 × 10⁻⁶⁹`}</pre>
            </div>

            <p>
              The <strong>Kaktwoos Project</strong> utilized distributed GPU brute-forcing
              to check trillions of seeds specifically optimizing for this rare recursive call.
            </p>
          </section>



          <section className="algo-section">
            <div className="section-header">
              <h2>🎲 The Linear Congruential Generator</h2>
              <span className="tag tech">Core Mechanic</span>
            </div>

            <p>
              At the heart of Minecraft's seed generation is Java's `java.util.Random`.
              It is not "truly" random, but a deterministic mathematical sequence.
              If you know the internal state (seed), you know every future number.
            </p>

            <div className="code-block">
              <div className="code-header">Standard Java LCG Formula</div>
              <pre>{`next_seed = (current_seed * 0x5DEECE66DL + 0xBL) & ((1L << 48) - 1)`}</pre>
            </div>

            <p>
              <strong>Reverse Engineering Demo:</strong> Try our interactive visualizer below to understand
              how tools brute-force the lower 48 bits of a seed based on structure coordinates.
            </p>

            <VisualSeedCracker />

            <p>
              <strong>Real-World Tools:</strong> Because this formula is reversible, tools like 
              <a href="https://github.com/19MisterX98/SeedcrackerX" target="_blank" className="text-link">SeedCrackerX</a> can
              take a sequence of observed events (dungeon floor patterns, emerald ore locations)
              and mathematically solve for the `world_seed`.
            </p>
          </section>

          <section className="algo-section">
            <div className="section-header">
              <h2>⚡ Speedrun Verification</h2>
              <span className="tag rare">High Optimization</span>
            </div>

            <p>
              Speedrunners use "Filtered Seeds" (FSG) to practice specific strategies.
              These seeds are pre-generated to ensure a specific subset of conditions:
            </p>
            <ul>
              <li><strong>Bastion + Fortress:</strong> Within 128 blocks in Nether.</li>
              <li><strong>Blind Travel:</strong> Stronghold located exactly at calculated angles.</li>
              <li><strong>Village Entry:</strong> Starting with beds and food.</li>
            </ul>

            <p style={{ marginTop: '16px' }}>
              We have now integrated verified seeds from the <strong>Minecraft Speedrunning Community</strong>
              into our database, allowing you to browse optimal practice worlds.
            </p>
          </section>

          <section className="algo-section">
            <div className="section-header">
              <h2>🏯 Structure Seeding & finding Quad-Huts</h2>
            </div>

            <p>
              Structures don't use the full 64-bit world seed. They often rely on the lower
              48 bits or even fewer. This generates "Shadow Seeds" - different worlds
              with identical structure placements.
            </p>

            <div className="code-block">
              <div className="code-header">Structure placement logic</div>
              <pre>{`// Step 1: Divide world into regions (e.g., 16x16 chunks)
int regionX = chunkX / spacing;
int regionZ = chunkZ / spacing;

// Step 2: Initialize RNG with only the lower 48 bits
long structSeed = worldSeed & 0xFFFFFFFFFFFFL;

// Step 3: Mix region coordinates to get unique seed per region
long seed = regionX * 341873128712L + regionZ * 132897987541L + structSeed + uniqueSalt;

// Step 4: Pick random chunk in region
int xOffset = (seed & 0xF); // random 0-15
int zOffset = (seed >> 8) & 0xF; // random 0-15`}</pre>
            </div>

            <p>
              <strong>Quad-Witch Huts:</strong> To find 4 witch huts close enough to farm,
              seed hunters limit the search to the lower 20 bits of the seed (checking only
              1 million possibilities instead of quintillions) to find the perfect region layout,
              then brute-force the upper bits to find a biome match (Swamp).
            </p>
          </section>

          <section className="algo-section">
            <div className="section-header">
              <h2>🤝 Credits & Research</h2>
            </div>
            <p>
              Much of the data and research presented here is powered by the incredible work of the
              <a href="https://github.com/minecrafthome" target="_blank" className="text-link"> Minecraft@Home </a>
              team and the <strong>Minecraft Speedrunning Community</strong>.
            </p>
            <p>
              Their distributed computing projects have discovered the tallest cactus, the Pack.png seed,
              the Title Screen seed, and many other historic worlds. Support their research on GitHub!
            </p>
          </section>
        </div>
      </main>

      <style jsx>{`
        .algorithms-page {
          padding: 40px 16px 80px;
          max-width: 800px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-block;
          margin-bottom: 24px;
          color: var(--text-secondary);
          text-decoration: none;
          font-family: 'Press Start 2P', cursive;
          font-size: 0.8rem;
        }
        
        .back-link:hover {
          color: var(--gold-yellow);
        }
        
        .page-title {
          font-family: 'Press Start 2P', cursive;
          color: var(--gold-yellow);
          font-size: clamp(1.2rem, 4vw, 1.8rem);
          line-height: 1.4;
          margin-bottom: 16px;
          text-shadow: 2px 2px 0 var(--obsidian);
        }
        
        .intro {
          font-size: 1.1rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 48px;
          border-left: 4px solid var(--emerald-green);
          padding-left: 16px;
        }
        
        .algo-section {
          background: rgba(0,0,0,0.2);
          border: 2px solid var(--dark-grass);
          border-radius: 4px;
          padding: 32px;
          margin-bottom: 40px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .algo-section h2 {
          font-family: 'Press Start 2P', cursive;
          font-size: 1.1rem;
          color: var(--diamond-blue);
          margin: 0;
          line-height: 1.4;
        }
        
        .tag {
          font-size: 0.8rem;
          padding: 4px 8px;
          border: 2px solid;
          font-family: 'Press Start 2P', cursive;
        }
        
        .tag.rare { color: #FFAA00; border-color: #FFAA00; background: rgba(255,170,0,0.1); }
        .tag.legendary { color: #FF5555; border-color: #FF5555; background: rgba(255,85,85,0.1); }
        .tag.tech { color: #AAAAAA; border-color: #AAAAAA; background: rgba(170,170,170,0.1); }
        
        .algo-section h3 {
          color: var(--gold-yellow);
          font-size: 1rem;
          margin: 32px 0 16px;
          font-family: 'Press Start 2P', cursive;
        }
        
        p {
          color: var(--text-primary);
          line-height: 1.7;
          margin-bottom: 16px;
        }
        
        .highlight {
          color: var(--emerald-green);
          font-weight: bold;
        }
        
        .math-box {
          background: var(--obsidian);
          padding: 20px;
          border-left: 3px solid var(--gold-yellow);
          margin: 16px 0;
        }
        
        .math-formula {
          display: block;
          font-family: 'VT323', monospace;
          font-size: 1.4rem;
          color: var(--gold-yellow);
          margin: 16px 0;
          text-align: center;
          background: rgba(255,255,255,0.05);
          padding: 8px;
        }
        
        .code-block {
          background: #111;
          border: 1px solid #333;
          border-radius: 4px;
          overflow: hidden;
          margin: 24px 0;
        }
        
        .code-header {
          background: #222;
          padding: 8px 16px;
          font-size: 0.85rem;
          color: #888;
          font-family: monospace;
          border-bottom: 1px solid #333;
        }
        
        .code-block pre {
          margin: 0;
          padding: 16px;
          overflow-x: auto;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          color: #d4d4d4;
        }

        .text-link {
          color: var(--diamond-blue);
          text-decoration: underline;
        }
        
        @media (max-width: 600px) {
          .algo-section {
            padding: 20px;
          }
          
          .section-header {
            flex-direction: column;
            gap: 12px;
          }
          
          .code-block pre {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </>
  );
}
