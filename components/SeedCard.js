'use client';

import Link from 'next/link';
import { CATEGORIES, getConfidenceLevel } from '@/lib/categories';

export default function SeedCard({ seed, onCopySuccess }) {
    const category = CATEGORIES[seed.category] || {
        name: seed.category,
        icon: '🌍',
        color: '#6b7280'
    };
    const confidence = getConfidenceLevel(seed.confidence);

    const handleCopy = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(seed.seed);
            onCopySuccess?.();
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Link href={`/seeds/${seed.id}`} className="seed-card" style={{ '--card-accent': category.color }}>
            <div className="seed-card-header">
                <span
                    className="seed-category-badge"
                    style={{
                        background: `${category.color}20`,
                        '--badge-color': category.color
                    }}
                >
                    {category.icon} {category.name.split(' ')[0]}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {seed.isGenerated && (
                        <span className="generated-badge" title="Algorithmically generated">
                            ⚙️
                        </span>
                    )}
                    <span
                        className={`confidence-badge confidence-${confidence.label.toLowerCase()}`}
                        title={`${Math.round(seed.confidence * 100)}% confidence`}
                    >
                        {confidence.icon} {Math.round(seed.confidence * 100)}%
                    </span>
                </div>
            </div>

            <h3 className="seed-title">{seed.title}</h3>

            <div className="seed-value">
                <span>{seed.seed.length > 20 ? seed.seed.slice(0, 20) + '...' : seed.seed}</span>
                <button
                    className="seed-copy-btn"
                    onClick={handleCopy}
                    title="Copy seed"
                >
                    📋
                </button>
            </div>

            <div className="seed-meta">
                <div className="seed-meta-item">
                    <span>📊</span>
                    <span>{seed.probability}</span>
                </div>
                <div className="version-tags">
                    {seed.version.java && (
                        <span className="version-tag version-java">Java</span>
                    )}
                    {seed.version.bedrock && (
                        <span className="version-tag version-bedrock">Bedrock</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
