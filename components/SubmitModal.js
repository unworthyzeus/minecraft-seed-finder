'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/categories';

export default function SubmitModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        seed: '',
        title: '',
        category: '',
        edition: 'java',
        versionNumber: '',
        coordinates: { x: '', y: '', z: '' },
        description: '',
        discoveredBy: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('coord_')) {
            const coord = name.split('_')[1];
            setFormData(prev => ({
                ...prev,
                coordinates: { ...prev.coordinates, [coord]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call / save to localStorage
        setTimeout(() => {
            const submissions = JSON.parse(localStorage.getItem('seed_submissions') || '[]');

            const category = CATEGORIES[formData.category];

            submissions.push({
                id: `user-${Date.now()}`,
                seed: formData.seed,
                title: formData.title,
                category: formData.category,
                version: {
                    java: formData.edition === 'java' || formData.edition === 'both' ? formData.versionNumber : null,
                    bedrock: formData.edition === 'bedrock' || formData.edition === 'both' ? formData.versionNumber : null
                },
                probability: category?.probability || 'Unknown',
                confidence: 0.25, // User submitted starts low
                coordinates: formData.coordinates.x ? {
                    x: parseInt(formData.coordinates.x),
                    y: parseInt(formData.coordinates.y),
                    z: parseInt(formData.coordinates.z)
                } : null,
                description: formData.description,
                discoveredBy: formData.discoveredBy || 'Anonymous',
                discoveredDate: new Date().toISOString().split('T')[0],
                isGenerated: false,
                isUserSubmitted: true,
                submittedAt: new Date().toISOString()
            });

            localStorage.setItem('seed_submissions', JSON.stringify(submissions));
            setIsSubmitting(false);
            onSuccess?.();
        }, 800);
    };

    // Get categories sorted by name
    const sortedCategories = Object.values(CATEGORIES).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h2>🌟 Submit a Discovery</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Found a rare seed? Share it with the community! Submissions start as &quot;Unverified&quot;
                    until confirmed by others.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Seed Number *</label>
                        <input
                            type="text"
                            name="seed"
                            className="form-input"
                            placeholder="e.g., 2040984539113960933 or -4530634556500121041"
                            value={formData.seed}
                            onChange={handleChange}
                            required
                            pattern="^-?\d+$"
                            title="Enter a valid seed number (positive or negative integer)"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                            type="text"
                            name="title"
                            className="form-input"
                            placeholder="e.g., 12-Eye Portal Near Village"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            maxLength={100}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category *</label>
                        <select
                            name="category"
                            className="form-select"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a category...</option>
                            {sortedCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name} ({cat.probability})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Edition *</label>
                            <select
                                name="edition"
                                className="form-select"
                                value={formData.edition}
                                onChange={handleChange}
                                required
                            >
                                <option value="java">☕ Java Edition</option>
                                <option value="bedrock">🪨 Bedrock Edition</option>
                                <option value="both">Both Editions</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Version *</label>
                            <input
                                type="text"
                                name="versionNumber"
                                className="form-input"
                                placeholder="e.g., 1.21+ or 1.20.4"
                                value={formData.versionNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Coordinates (optional but recommended)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <input
                                type="number"
                                name="coord_x"
                                className="form-input"
                                placeholder="X"
                                value={formData.coordinates.x}
                                onChange={handleChange}
                            />
                            <input
                                type="number"
                                name="coord_y"
                                className="form-input"
                                placeholder="Y"
                                value={formData.coordinates.y}
                                onChange={handleChange}
                            />
                            <input
                                type="number"
                                name="coord_z"
                                className="form-input"
                                placeholder="Z"
                                value={formData.coordinates.z}
                                onChange={handleChange}
                            />
                        </div>
                        <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                            Coordinates of the rare feature (e.g., End Portal, tall cactus)
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description *</label>
                        <textarea
                            name="description"
                            className="form-textarea"
                            placeholder="Describe what makes this seed special. Include details like distance from spawn, nearby structures, etc."
                            value={formData.description}
                            onChange={handleChange}
                            required
                            maxLength={500}
                        />
                        <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                            {formData.description.length}/500 characters
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Your Name / Handle</label>
                        <input
                            type="text"
                            name="discoveredBy"
                            className="form-input"
                            placeholder="Optional - for credit (e.g., your Reddit/Discord username)"
                            value={formData.discoveredBy}
                            onChange={handleChange}
                            maxLength={50}
                        />
                    </div>

                    <div style={{
                        padding: '16px',
                        background: 'rgba(74, 222, 128, 0.1)',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <strong style={{ color: 'var(--accent-emerald)' }}>📋 Submission Guidelines:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            <li>Seeds are reviewed and verified by the community</li>
                            <li>Initial confidence is set to ~25% until verified</li>
                            <li>Provide accurate coordinates for faster verification</li>
                            <li>Include version information for reproducibility</li>
                        </ul>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="button"
                            className="submit-btn"
                            style={{ background: 'var(--bg-secondary)', flex: 1 }}
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            style={{ flex: 1 }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '⏳ Submitting...' : '✓ Submit Discovery'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
