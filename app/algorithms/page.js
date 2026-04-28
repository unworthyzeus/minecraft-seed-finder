'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import VisualSeedCracker from '../../components/VisualSeedCracker';
import SubmitModal from '../../components/SubmitModal';

const pipeline = [
  ['Seed input', '64-bit world seed, 48-bit Java RNG state, and chunk coordinates.'],
  ['Legacy layers', 'Ocean, land, climate, rivers, shores, and biome zooms from Beta 1.8 through 1.17.'],
  ['Beta climate', 'Beta 1.7 samples climate and sea-level noise directly instead of using the layer stack.'],
  ['Modern noise', '1.18+ resolves biomes from temperature, humidity, continentalness, erosion, weirdness, and depth.'],
  ['Structure RNG', 'Many structures use region seeds and salts, so lower-bit searches can prune huge seed spaces.']
];

const versionRows = [
  ['Beta 1.7', 'Climate table + interpolated sea-level noise', 'Block and scale-4 parity'],
  ['Beta 1.8', 'Early layer stack with Beta land rules', 'Scale-4 parity'],
  ['1.0 - 1.17', 'Layer stack, rivers, shores, hills, oceans', 'Scale-4 parity'],
  ['1.18+', 'Multi-noise biome source', 'Origin and far-field parity'],
  ['Bedrock', 'Edition-aware biome renderer', 'Parity-era terrain with Bedrock seed normalization']
];

export default function AlgorithmsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Header onSubmitClick={() => setIsModalOpen(true)} />
      <SubmitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <main className="algorithms-page">
        <section className="algo-hero">
          <div className="hero-copy">
            <Link href="/" className="back-link">Back to Seeds</Link>
            <p className="eyebrow">Cubiomes parity notes</p>
            <h1>Seed Discovery Algorithms</h1>
            <p className="hero-text">
              How Minecraft seeds collapse from impossible search spaces into testable RNG states,
              biome maps, Bedrock parity rendering, and structure filters.
            </p>
          </div>

          <div className="map-rail" aria-hidden="true">
            <div className="map-grid">
              {Array.from({ length: 96 }).map((_, index) => (
                <span key={index} className={`tile tile-${index % 7}`} />
              ))}
            </div>
            <div className="map-caption">
              <span>64-bit seed</span>
              <span>biome oracle</span>
              <span>structure oracle</span>
            </div>
          </div>
        </section>

        <section className="status-band">
          <div>
            <span className="status-label">Current verification</span>
            <strong>Local fixtures cover structure placement, Bedrock rendering, and seed metadata; full Java C-cubiomes parity needs the external ground-truth files.</strong>
          </div>
          <div>
            <span className="status-label">Bedrock scope</span>
            <strong>Bedrock uses edition-specific seed normalization and parity-era biome rendering; structure hits are candidates until checked in-game.</strong>
          </div>
        </section>

        <section className="pipeline-section">
          <div className="section-kicker">Pipeline</div>
          <h2>From seed to biome</h2>
          <div className="pipeline-list">
            {pipeline.map(([title, body], index) => (
              <article className="pipeline-row" key={title}>
                <span className="step">{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="split-section">
          <div>
            <div className="section-kicker">RNG core</div>
            <h2>Java Random is reversible</h2>
            <p>
              Java Edition structure and decoration checks often begin with the same 48-bit
              linear congruential generator. Once enough outputs or placements are known,
              hunters can work backward instead of testing every world seed.
            </p>
            <div className="code-block">
              <div className="code-header">java.util.Random state step</div>
              <pre>{`next = (state * 0x5DEECE66D + 0xB) & ((1L << 48) - 1)`}</pre>
            </div>
          </div>
          <VisualSeedCracker />
        </section>

        <section className="split-section reverse">
          <div>
            <div className="section-kicker">Rare events</div>
            <h2>Some searches are probability filters</h2>
            <p>
              A fully lit End portal has twelve independent 10 percent checks, so a single
              portal lands at 10^-12. Good searchers stack cheap filters first: structure
              position, biome validity, then the expensive decoration or terrain condition.
            </p>
          </div>
          <div className="formula-panel">
            <span>12-eye portal</span>
            <strong>P = (1/10)^12</strong>
            <small>One in one trillion per portal.</small>
          </div>
        </section>

        <section className="version-section">
          <div className="section-kicker">Version behavior</div>
          <h2>Why the implementation has separate paths</h2>
          <div className="version-table">
            {versionRows.map(([version, model, status]) => (
              <div className="version-row" key={version}>
                <strong>{version}</strong>
                <span>{model}</span>
                <em>{status}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="split-section">
          <div>
            <div className="section-kicker">Structures</div>
            <h2>Shadow seeds narrow the search</h2>
            <p>
              Many structure placements use a region coordinate, a salt, and only part of
              the world seed. That means different world seeds can share the same structure
              layout, letting tools search the lower bits first and resolve biome or terrain
              validity later. The visualizer now separates exact region placement from
              biome-confirmed and terrain-candidate markers.
            </p>
          </div>
          <div className="code-block compact">
            <div className="code-header">Region placement sketch</div>
            <pre>{`structSeed = worldSeed & 0xFFFFFFFFFFFFL
regionSeed = regionX * A + regionZ * B + structSeed + salt
candidate = randomChunkInRegion(regionSeed)`}</pre>
          </div>
        </section>

        <section className="credits-section">
          <div>
            <div className="section-kicker">Research</div>
            <h2>Built on public seed hunting work</h2>
            <p>
              The page summarizes ideas from the wider seed-hunting community,
              speedrunning seed filters, SeedCracker-style tools, and
              cubiomes-compatible verification suites.
            </p>
          </div>
          <a
            className="research-link"
            href="https://github.com/Cubitect/cubiomes"
            target="_blank"
            rel="noreferrer"
          >
            Cubiomes reference
          </a>
        </section>
      </main>

      <style jsx>{`
        .algorithms-page {
          --page-accent: var(--diamond-blue);
          max-width: 1180px;
          margin: 0 auto;
          padding: 36px 16px 88px;
          letter-spacing: 0;
        }

        .algo-hero {
          min-height: calc(100svh - var(--header-height) - 48px);
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(300px, 0.8fr);
          align-items: center;
          gap: clamp(28px, 6vw, 72px);
          border-bottom: 4px solid var(--obsidian);
          padding-bottom: 40px;
        }

        .back-link {
          display: inline-flex;
          width: fit-content;
          margin-bottom: 28px;
          color: var(--text-secondary);
          font-family: 'Press Start 2P', cursive;
          font-size: 0.7rem;
        }

        .back-link:hover {
          color: var(--gold-yellow);
        }

        .eyebrow,
        .section-kicker,
        .status-label {
          display: block;
          color: var(--emerald-green);
          font-family: 'Press Start 2P', cursive;
          font-size: 0.7rem;
          line-height: 1.5;
          margin-bottom: 14px;
        }

        h1,
        h2,
        h3,
        p {
          letter-spacing: 0;
        }

        h1 {
          max-width: 760px;
          color: var(--gold-yellow);
          font-family: 'Press Start 2P', cursive;
          font-size: clamp(1.7rem, 6vw, 4.7rem);
          line-height: 1.15;
          text-shadow: 4px 4px 0 var(--obsidian);
          margin-bottom: 24px;
        }

        h2 {
          color: var(--gold-yellow);
          font-family: 'Press Start 2P', cursive;
          font-size: clamp(1.1rem, 3vw, 2rem);
          line-height: 1.35;
          margin-bottom: 18px;
        }

        h3 {
          color: var(--page-accent);
          font-family: 'Press Start 2P', cursive;
          font-size: 0.9rem;
          line-height: 1.45;
        }

        p {
          color: var(--text-primary);
          font-size: 1.2rem;
          line-height: 1.65;
        }

        .hero-text {
          max-width: 660px;
          color: var(--text-secondary);
          font-size: clamp(1.2rem, 2.4vw, 1.65rem);
        }

        .map-rail {
          border: 4px solid var(--obsidian);
          background:
            linear-gradient(180deg, rgba(29, 29, 33, 0.25), rgba(29, 29, 33, 0.88)),
            var(--dark-dirt);
          box-shadow:
            inset -5px -5px 0 var(--dark-stone),
            inset 5px 5px 0 var(--stone-gray);
          padding: clamp(14px, 3vw, 24px);
        }

        .map-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(12px, 1fr));
          gap: 4px;
          aspect-ratio: 1 / 1;
        }

        .tile {
          min-width: 0;
          border: 1px solid rgba(0, 0, 0, 0.4);
          transition: transform 0.18s ease, filter 0.18s ease;
        }

        .map-rail:hover .tile:nth-child(3n) {
          transform: translateY(-2px);
          filter: brightness(1.2);
        }

        .tile-0 { background: var(--grass-green); }
        .tile-1 { background: var(--dark-grass); }
        .tile-2 { background: var(--water-blue); }
        .tile-3 { background: var(--stone-gray); }
        .tile-4 { background: var(--wood-brown); }
        .tile-5 { background: var(--dirt-brown); }
        .tile-6 { background: var(--diamond-blue); }

        .map-caption {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 18px;
          color: var(--text-secondary);
          font-size: 1rem;
        }

        .status-band,
        .credits-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          padding: 28px 0;
          border-bottom: 2px solid var(--dark-grass);
        }

        .status-band strong,
        .version-row strong {
          display: block;
          color: var(--text-primary);
          font-size: 1.25rem;
          line-height: 1.45;
          font-weight: normal;
        }

        .pipeline-section,
        .version-section,
        .split-section,
        .credits-section {
          margin-top: 56px;
        }

        .pipeline-list {
          border-top: 2px solid var(--dark-grass);
        }

        .pipeline-row {
          display: grid;
          grid-template-columns: 72px minmax(150px, 240px) minmax(0, 1fr);
          gap: 20px;
          align-items: baseline;
          padding: 22px 0;
          border-bottom: 2px solid var(--dark-grass);
          transition: padding-left 0.18s ease, border-color 0.18s ease;
        }

        .pipeline-row:hover {
          padding-left: 10px;
          border-color: var(--emerald-green);
        }

        .step {
          color: var(--stone-gray);
          font-family: 'Press Start 2P', cursive;
          font-size: 0.75rem;
        }

        .pipeline-row p {
          margin: 0;
          color: var(--text-secondary);
        }

        .split-section {
          display: grid;
          grid-template-columns: minmax(0, 0.88fr) minmax(280px, 1fr);
          gap: clamp(24px, 5vw, 56px);
          align-items: start;
          padding-top: 8px;
        }

        .split-section.reverse {
          grid-template-columns: minmax(0, 1fr) minmax(260px, 0.65fr);
        }

        .code-block,
        .formula-panel {
          border: 3px solid var(--obsidian);
          background: #111;
          box-shadow:
            inset -4px -4px 0 #050505,
            inset 4px 4px 0 #2a2a2a;
          margin-top: 22px;
        }

        .code-block.compact {
          margin-top: 0;
        }

        .code-header {
          border-bottom: 2px solid #333;
          color: var(--text-muted);
          font-family: Consolas, Monaco, monospace;
          font-size: 0.9rem;
          padding: 10px 14px;
        }

        pre {
          color: #d7ffe9;
          font-family: Consolas, Monaco, monospace;
          font-size: 0.95rem;
          line-height: 1.55;
          margin: 0;
          overflow-x: auto;
          padding: 16px;
          white-space: pre;
        }

        .formula-panel {
          display: grid;
          gap: 12px;
          padding: 28px;
        }

        .formula-panel span,
        .formula-panel small,
        .version-row em {
          color: var(--text-secondary);
          font-style: normal;
        }

        .formula-panel strong {
          color: var(--gold-yellow);
          font-family: 'Press Start 2P', cursive;
          font-size: clamp(1rem, 3vw, 1.7rem);
          line-height: 1.5;
        }

        .version-table {
          border-top: 2px solid var(--dark-grass);
        }

        .version-row {
          display: grid;
          grid-template-columns: minmax(120px, 0.6fr) minmax(220px, 1.2fr) minmax(160px, 0.75fr);
          gap: 18px;
          padding: 18px 0;
          border-bottom: 2px solid var(--dark-grass);
          align-items: center;
        }

        .version-row span {
          color: var(--text-primary);
          line-height: 1.45;
        }

        .research-link {
          align-self: center;
          justify-self: end;
          border: 3px solid var(--obsidian);
          color: var(--obsidian);
          background: var(--gold-yellow);
          box-shadow: 4px 4px 0 var(--obsidian);
          font-family: 'Press Start 2P', cursive;
          font-size: 0.72rem;
          line-height: 1.5;
          padding: 14px 16px;
          transition: transform 0.16s ease, box-shadow 0.16s ease;
        }

        .research-link:hover {
          color: var(--obsidian);
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0 var(--obsidian);
        }

        @media (max-width: 860px) {
          .algo-hero,
          .status-band,
          .split-section,
          .split-section.reverse,
          .credits-section {
            grid-template-columns: 1fr;
          }

          .algo-hero {
            min-height: auto;
          }

          .pipeline-row,
          .version-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .research-link {
            justify-self: start;
          }
        }

        @media (max-width: 560px) {
          .algorithms-page {
            padding: 28px 12px 72px;
          }

          h1 {
            font-size: 1.45rem;
          }

          h2 {
            font-size: 1rem;
          }

          p {
            font-size: 1.1rem;
          }

          .map-caption {
            flex-direction: column;
          }

          pre {
            font-size: 0.82rem;
          }
        }
      `}</style>
    </>
  );
}
