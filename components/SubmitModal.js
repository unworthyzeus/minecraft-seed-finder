'use client';

import { useState } from 'react';
import { CATEGORIES } from '../lib/categories';

export default function SubmitModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        seed: '',
        category: '',
        edition: 'java',
        versionNumber: '',
        coordinates: { x: '', y: '', z: '' },
        description: ''
    });

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

        // Create the issue body
        const categoryName = CATEGORIES[formData.category]?.name || formData.category;

        const body = `
### New Seed Submission

**Seed:** \`${formData.seed}\`
**Category:** ${categoryName}
**Edition:** ${formData.edition === 'java' ? 'Java' : formData.edition === 'bedrock' ? 'Bedrock' : 'Both'}
**Version:** ${formData.versionNumber}
**Coordinates:** X:${formData.coordinates.x || '?'} Y:${formData.coordinates.y || '?'} Z:${formData.coordinates.z || '?'}

**Description:**
${formData.description}

*Submitted via SeedFinder Web*
    `.trim();

        // Open GitHub new issue page (GitHub's URL limit is ~2000 chars, usually fine)
        const url = `https://github.com/unworthyzeus/minecraft-seed-finder/issues/new?title=Seed: ${encodeURIComponent(formData.seed)}&body=${encodeURIComponent(body)}`;
        window.open(url, '_blank');

        onClose();
    };

    // Sort categories for the dropdown
    const sortedCategories = Object.entries(CATEGORIES)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose} aria-label="Close">×</button>

                <h2>Submit a Discovery</h2>
                <p>Found something rare? Submit it for review!</p>
                <p className="subtext">This will draft a GitHub Issue for the community to verify.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Seed ID *</label>
                        <input
                            type="text"
                            name="seed"
                            className="form-input"
                            required
                            placeholder="-123456789"
                            value={formData.seed}
                            onChange={handleChange}
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
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label className="form-label">Edition *</label>
                            <select
                                name="edition"
                                className="form-select"
                                value={formData.edition}
                                onChange={handleChange}
                            >
                                <option value="java">Java Edition</option>
                                <option value="bedrock">Bedrock</option>
                                <option value="both">Both</option>
                            </select>
                        </div>

                        <div className="form-group half">
                            <label className="form-label">Version *</label>
                            <input
                                type="text"
                                name="versionNumber"
                                className="form-input"
                                placeholder="e.g. 1.21"
                                required
                                value={formData.versionNumber}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Coordinates (Optional)</label>
                        <div className="coord-row">
                            <input type="number" name="coord_x" placeholder="X" className="form-input" value={formData.coordinates.x} onChange={handleChange} />
                            <input type="number" name="coord_y" placeholder="Y" className="form-input" value={formData.coordinates.y} onChange={handleChange} />
                            <input type="number" name="coord_z" placeholder="Z" className="form-input" value={formData.coordinates.z} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description (Why is it rare?)</label>
                        <textarea
                            name="description"
                            className="form-textarea"
                            rows="3"
                            required
                            placeholder="Desribe the find..."
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <button type="submit" className="submit-action-btn">
                        Compose GitHub Issue
                    </button>
                </form>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
        .modal-content {
          background: var(--obsidian);
          border: 4px solid var(--border-color);
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        
        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 2rem;
          line-height: 0.5;
          cursor: pointer;
          padding: 8px;
        }
        
        .close-btn:hover {
          color: #FF5555;
        }
        
        h2 {
          color: var(--gold-yellow);
          font-family: 'Press Start 2P', cursive;
          font-size: 1.1rem;
          margin-bottom: 8px;
          padding-right: 32px;
        }
        
        p {
          color: var(--text-primary);
          margin-bottom: 4px;
          font-size: 0.9rem;
        }

        .subtext {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 20px;
          font-style: italic;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-row {
          display: flex;
          gap: 16px;
        }
        
        .half {
          width: 50%;
        }

        .coord-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 8px;
          color: var(--emerald-green);
          font-family: 'Press Start 2P', cursive;
          font-size: 0.7rem;
        }
        
        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 10px;
          background: #111;
          border: 2px solid var(--dark-grass);
          color: white;
          font-family: 'VT323', monospace;
          font-size: 1.1rem;
          border-radius: 0;
        }
        
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: var(--earth-brown);
        }
        
        .submit-action-btn {
          width: 100%;
          padding: 12px;
          background: var(--grass-green);
          border: 2px solid var(--dark-grass);
          color: white;
          font-family: 'Press Start 2P', cursive;
          cursor: pointer;
          margin-top: 8px;
          box-shadow: 0 4px 0 var(--dark-grass); /* 3D effect */
          transition: all 0.1s;
          text-shadow: 1px 1px 0 #000;
        }
        
        .submit-action-btn:active {
          transform: translateY(4px);
          box-shadow: none;
        }

        @media (max-width: 600px) {
          .modal-content {
            padding: 16px;
          }
        }
      `}</style>
        </div>
    );
}
