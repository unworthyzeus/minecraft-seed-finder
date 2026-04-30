'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const SeedVisualizer = dynamic(() => import('@/components/SeedVisualizer'), {
    ssr: false,
    loading: () => <SeedVisualizerShell detail="Loading map renderer..." />,
});

function scheduleAfterFirstPaint(callback) {
    let frameId = null;
    let idleId = null;
    let timeoutId = null;

    frameId = window.requestAnimationFrame(() => {
        if ('requestIdleCallback' in window) {
            idleId = window.requestIdleCallback(callback, { timeout: 800 });
        } else {
            timeoutId = window.setTimeout(callback, 120);
        }
    });

    return () => {
        if (frameId != null) window.cancelAnimationFrame(frameId);
        if (idleId != null && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
        if (timeoutId != null) window.clearTimeout(timeoutId);
    };
}

function SeedVisualizerShell({ detail = 'Preparing seed map...' }) {
    return (
        <section className="seed-visualizer-shell" aria-live="polite">
            <div className="seed-visualizer-shell-header">
                <span className="seed-visualizer-shell-icon">Map</span>
                <div>
                    <h3>Seed Map</h3>
                    <p>{detail}</p>
                </div>
            </div>
            <div className="seed-visualizer-shell-canvas">
                <span className="loading">Rendering biome preview</span>
            </div>
        </section>
    );
}

export default function DeferredSeedVisualizer(props) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setReady(false);
        return scheduleAfterFirstPaint(() => setReady(true));
    }, [props.seed, props.version, props.edition]);

    if (!ready) {
        return <SeedVisualizerShell />;
    }

    return <SeedVisualizer {...props} />;
}
