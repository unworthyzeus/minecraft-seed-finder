'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getSeedById } from '@/lib/seeds-database';
import { CATEGORIES, getConfidenceLevel } from '@/lib/categories';
import { getPreferredSeedEdition, getSeedEditions } from '@/lib/version-utils';
import SeedVisualizer from '@/components/SeedVisualizer';

export default function SeedDetailPage() {
    const params = useParams();
    const seed = getSeedById(params.id);
    const editions = useMemo(() => seed ? getSeedEditions(seed) : [], [seed]);
    const preferredEdition = seed ? getPreferredSeedEdition(seed) : null;
    const [selectedEditionKey, setSelectedEditionKey] = useState(null);
    const selectedEdition = editions.find(e => e.edition === selectedEditionKey) || preferredEdition;

    if (!seed) {
        return (
            <div className="seed-detail">
                <Link href="/" className="back-link">← Back to Seeds</Link>
                <div className="empty-state">
                    <div className="empty-icon">❓</div>
                    <h3>Seed not found</h3>
                    <p>This seed doesn&apos;t exist in our database.</p>
                </div>
            </div>
        );
    }

    const category = CATEGORIES[seed.category] || {
        name: seed.category,
        icon: '🌍',
        color: '#6b7280',
        description: 'Unknown category',
        probability: 'Unknown'
    };
    const confidence = getConfidenceLevel(seed.confidence);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(seed.seed);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };
    const searchHref = `/search?edition=${selectedEdition?.edition || 'java'}&version=${encodeURIComponent(selectedEdition?.version || '26.1.2')}&start=${encodeURIComponent(seed.seed)}&count=900`;

    return (
        <div className="seed-detail">
            <Link href="/" className="back-link">
                ← Back to Seeds
            </Link>

            <div className="seed-detail-header">
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span
                        className="seed-category-badge"
                        style={{
                            background: `${category.color}20`,
                            '--badge-color': category.color
                        }}
                    >
                        {category.icon} {category.name}
                    </span>
                    <span className={`confidence-badge confidence-${confidence.label.toLowerCase()}`}>
                        {confidence.icon} {confidence.label} ({Math.round(seed.confidence * 100)}%)
                    </span>
                    {seed.isGenerated && (
                        <span className="generated-indicator">
                            ⚙️ Algorithmically Generated - Verify Before Use
                        </span>
                    )}
                </div>

                <h1>{seed.title}</h1>

                <div className="seed-detail-seed">
                    <span style={{ fontWeight: 600 }}>Seed:</span>
                    <span style={{ wordBreak: 'break-all' }}>{seed.seed}</span>
                    <button
                        onClick={handleCopy}
                        className="submit-btn"
                        style={{ padding: '8px 16px', fontSize: '0.9rem', marginLeft: 'auto', whiteSpace: 'nowrap' }}
                    >
                        📋 Copy
                    </button>
                    <Link href={searchHref} className="search-inline-btn seed-search-link">
                        Search Similar
                    </Link>
                </div>
            </div>

            {/* Version Compatibility */}
            <section className="seed-detail-section">
                <h2>Version Compatibility</h2>
                <div className="version-tags" style={{ fontSize: '1rem' }}>
                    {seed.version.java && (
                        <span className="version-tag version-java" style={{ padding: '6px 12px' }}>
                            ☕ Java Edition {seed.version.java}
                        </span>
                    )}
                    {seed.version.bedrock && (
                        <span className="version-tag version-bedrock" style={{ padding: '6px 12px' }}>
                            🪨 Bedrock Edition {seed.version.bedrock}
                        </span>
                    )}
                    {!seed.version.java && !seed.version.bedrock && (
                        <span style={{ color: 'var(--text-muted)' }}>Version information not available</span>
                    )}
                </div>
                {editions.length > 1 && (
                    <div className="edition-switcher" aria-label="Map edition">
                        <span>Render map as:</span>
                        {editions.map(entry => (
                            <button
                                key={entry.edition}
                                type="button"
                                className={`edition-switch ${selectedEdition?.edition === entry.edition ? 'active' : ''}`}
                                onClick={() => setSelectedEditionKey(entry.edition)}
                            >
                                {entry.edition === 'java' ? 'Java' : 'Bedrock'} {entry.version}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Seed Visualizer - Interactive Map */}
            <SeedVisualizer
                seed={seed.seed}
                version={selectedEdition?.version || '26.1.2'}
                edition={selectedEdition?.edition || 'java'}
                coordinates={seed.coordinates}
            />

            {/* Description */}
            <section className="seed-detail-section">
                <h2>Description</h2>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.8 }}>
                    {seed.description}
                </p>
            </section>

            {/* Coordinates */}
            {seed.coordinates && (
                <section className="seed-detail-section">
                    <h2>Coordinates</h2>
                    <div className="coordinates">
                        <div className="coordinate">
                            <div className="coordinate-label">X</div>
                            <div className="coordinate-value">{seed.coordinates.x}</div>
                        </div>
                        <div className="coordinate">
                            <div className="coordinate-label">Y</div>
                            <div className="coordinate-value">{seed.coordinates.y}</div>
                        </div>
                        <div className="coordinate">
                            <div className="coordinate-label">Z</div>
                            <div className="coordinate-value">{seed.coordinates.z}</div>
                        </div>
                    </div>
                </section>
            )}

            {/* Statistics */}
            <section className="seed-detail-section">
                <h2>Statistics</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Probability</div>
                        <div style={{ color: 'var(--accent-amber)', fontSize: '1.2rem', fontWeight: 600 }}>{seed.probability}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Discovered By</div>
                        <div style={{ fontSize: '1.1rem' }}>{seed.discoveredBy}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Discovery Date</div>
                        <div style={{ fontSize: '1.1rem' }}>{(() => {
                            if (!seed.discoveredDate || seed.discoveredDate === 'Unknown') return 'Unknown';
                            const date = new Date(seed.discoveredDate);
                            return isNaN(date.getTime()) ? seed.discoveredDate : date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            });
                        })()}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Confidence Level</div>
                        <div style={{ fontSize: '1.1rem' }}>
                            <span className={`confidence-badge confidence-${confidence.label.toLowerCase()}`}>
                                {confidence.icon} {confidence.label}
                            </span>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {confidence.description}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* External Links */}
            <section className="seed-detail-section">
                <h2>Explore This Seed</h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {seed.sourceUrl && (
                        <a
                            href={seed.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                            style={{
                                borderColor: 'var(--accent-primary)',
                                color: 'var(--accent-primary)',
                                background: 'rgba(var(--accent-primary-rgb), 0.05)'
                            }}
                        >
                            🔗 View Original Source
                        </a>
                    )}
                    {seed.chunkbaseUrl && (
                        <a
                            href={seed.chunkbaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                        >
                            🗺️ View on Chunkbase
                        </a>
                    )}
                    <a
                        href={`https://www.google.com/search?q=minecraft+seed+${seed.seed}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                    >
                        🔍 Search Online
                    </a>
                    <Link href={searchHref} className="external-link">
                        Search Lab Nearby
                    </Link>
                    {seed.version.java && (
                        <a
                            href={`https://mcseedmap.net/?seed=${seed.seed}&version=java`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                        >
                            🌍 MCSeedMap
                        </a>
                    )}
                </div>
            </section>

            {/* About Category */}
            <section className="seed-detail-section" style={{ borderLeft: `4px solid ${category.color}` }}>
                <h2>About {category.name}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {category.description}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Typical probability: {category.probability}
                </p>
            </section>

            {/* Warning for generated seeds */}
            {seed.isGenerated && (
                <section className="seed-detail-section" style={{ borderLeft: '4px solid var(--accent-amber)', background: 'rgba(249, 115, 22, 0.1)' }}>
                    <h2>⚠️ Generated Seed Notice</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        This seed was algorithmically generated based on probability patterns and has not been individually verified.
                        The described features may not exist at the specified coordinates or may vary depending on your Minecraft version.
                        <strong> Always test generated seeds yourself before relying on them.</strong>
                    </p>
                </section>
            )}
        </div>
    );
}
