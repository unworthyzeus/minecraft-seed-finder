'use client';

import { useState } from 'react';
import DeferredSeedVisualizer from '@/components/DeferredSeedVisualizer';

export default function SeedDetailMapSection({
    seedValue,
    seedVersion = {},
    editions = [],
    preferredEdition = null,
    coordinates = null,
}) {
    const [selectedEditionKey, setSelectedEditionKey] = useState(null);
    const selectedEdition = editions.find(entry => entry.edition === selectedEditionKey)
        || preferredEdition
        || { edition: 'java', version: '26.1.2' };

    return (
        <>
            <section className="seed-detail-section">
                <h2>Version Compatibility</h2>
                <div className="version-tags" style={{ fontSize: '1rem' }}>
                    {seedVersion.java && (
                        <span className="version-tag version-java" style={{ padding: '6px 12px' }}>
                            Java Edition {seedVersion.java}
                        </span>
                    )}
                    {seedVersion.bedrock && (
                        <span className="version-tag version-bedrock" style={{ padding: '6px 12px' }}>
                            Bedrock Edition {seedVersion.bedrock}
                        </span>
                    )}
                    {!seedVersion.java && !seedVersion.bedrock && (
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

            <DeferredSeedVisualizer
                seed={seedValue}
                version={selectedEdition?.version || '26.1.2'}
                edition={selectedEdition?.edition || 'java'}
                coordinates={coordinates}
            />
        </>
    );
}
