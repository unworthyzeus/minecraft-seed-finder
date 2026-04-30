import Link from 'next/link';
import { getSeedById } from '@/lib/seeds-database';
import { CATEGORIES, getConfidenceLevel } from '@/lib/categories';
import { isWebsiteSubmission } from '@/lib/source-utils';
import { getPreferredSeedEdition, getSeedEditions } from '@/lib/version-utils';
import CopySeedButton from '@/components/CopySeedButton';
import SeedDetailMapSection from '@/components/SeedDetailMapSection';

export default function SeedDetailPage({ params }) {
    const seed = getSeedById(decodeURIComponent(params.id));

    if (!seed) {
        return (
            <div className="seed-detail">
                <Link href="/" className="back-link">Back to Seeds</Link>
                <div className="empty-state">
                    <div className="empty-icon">?</div>
                    <h3>Seed not found</h3>
                    <p>This seed doesn&apos;t exist in our database.</p>
                </div>
            </div>
        );
    }

    const editions = getSeedEditions(seed);
    const preferredEdition = getPreferredSeedEdition(seed);
    const selectedEdition = preferredEdition || { edition: 'java', version: '26.1.2' };
    const category = CATEGORIES[seed.category] || {
        name: seed.category,
        icon: '',
        color: '#6b7280',
        description: 'Unknown category',
        probability: 'Unknown',
    };
    const confidence = getConfidenceLevel(seed.confidence);
    const submittedToWebsite = isWebsiteSubmission(seed);
    const searchHref = `/search?edition=${selectedEdition.edition}&version=${encodeURIComponent(selectedEdition.version)}&start=${encodeURIComponent(seed.seed)}&count=900`;

    return (
        <div className="seed-detail">
            <Link href="/" className="back-link">
                Back to Seeds
            </Link>

            <div className="seed-detail-header">
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span
                        className="seed-category-badge"
                        style={{
                            background: `${category.color}20`,
                            '--badge-color': category.color,
                        }}
                    >
                        {category.icon} {category.name}
                    </span>
                    <span className={`confidence-badge confidence-${confidence.label.toLowerCase()}`}>
                        {confidence.icon} {confidence.label} ({Math.round(seed.confidence * 100)}%)
                    </span>
                    {submittedToWebsite && (
                        <span className="submitted-badge" title="Submitted to this website">
                            Submitted
                        </span>
                    )}
                    {seed.isGenerated && (
                        <span className="generated-indicator">
                            Algorithmically Generated - Verify Before Use
                        </span>
                    )}
                </div>

                <h1>{seed.title}</h1>

                <div className="seed-detail-seed">
                    <span style={{ fontWeight: 600 }}>Seed:</span>
                    <span style={{ wordBreak: 'break-all' }}>{seed.seed}</span>
                    <CopySeedButton
                        seed={seed.seed}
                        className="submit-btn"
                        style={{ padding: '8px 16px', fontSize: '0.9rem', marginLeft: 'auto', whiteSpace: 'nowrap' }}
                    />
                    <Link href={searchHref} className="search-inline-btn seed-search-link">
                        Search Similar
                    </Link>
                </div>
            </div>

            <SeedDetailMapSection
                seedValue={seed.seed}
                seedVersion={seed.version}
                editions={editions}
                preferredEdition={preferredEdition}
                coordinates={seed.coordinates}
            />

            <section className="seed-detail-section">
                <h2>Description</h2>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.8 }}>
                    {seed.description}
                </p>
            </section>

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
                    {seed.source && (
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Source</div>
                            <div style={{ fontSize: '1.1rem' }}>
                                {seed.sourceUrl ? (
                                    <a href={seed.sourceUrl} target="_blank" rel="noopener noreferrer">
                                        {seed.source}
                                    </a>
                                ) : seed.source}
                            </div>
                        </div>
                    )}
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Discovery Date</div>
                        <div style={{ fontSize: '1.1rem' }}>{(() => {
                            if (!seed.discoveredDate || seed.discoveredDate === 'Unknown') return 'Unknown';
                            const date = new Date(seed.discoveredDate);
                            return isNaN(date.getTime()) ? seed.discoveredDate : date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
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

            <section className="seed-detail-section" style={{ borderLeft: `4px solid ${category.color}` }}>
                <h2>About {category.name}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {category.description}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Typical probability: {category.probability}
                </p>
            </section>

            {submittedToWebsite && (
                <section className="seed-detail-section" style={{ borderLeft: '4px solid var(--diamond-blue)', background: 'rgba(96, 165, 250, 0.08)' }}>
                    <h2>Website Submission Notice</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        This seed was submitted directly to this website by the community. The app keeps the submitted coordinates and runs the checks available for the reported edition, but it is not treated as a fully verified seed unless the exact in-game feature has been manually confirmed.
                    </p>
                </section>
            )}

            {seed.isGenerated && (
                <section className="seed-detail-section" style={{ borderLeft: '4px solid var(--accent-amber)', background: 'rgba(249, 115, 22, 0.1)' }}>
                    <h2>Generated Seed Notice</h2>
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
