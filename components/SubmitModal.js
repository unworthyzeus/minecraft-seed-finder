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

    const generateBody = () => {
        const categoryName = CATEGORIES[formData.category]?.name || formData.category || 'Unknown';

        return `
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
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const body = generateBody();
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

                    <div className="button-group">
                        <button type="submit" className="submit-action-btn github-btn">
                            <span>🐙</span> Open GitHub Issue
                        </button>
                        <a
                            href={`mailto:unworthyzeus543@gmail.com?subject=${encodeURIComponent(`Seed: ${formData.seed}`)}&body=${encodeURIComponent(generateBody())}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="submit-action-btn email-btn"
                            style={{ textDecoration: 'none' }}
                            onClick={(e) => {
                                // Fallback/Feedback
                                setTimeout(() => alert('If your email client didn\'t open, please use the "Copy Text" button instead.'), 500);
                            }}
                        >
                            <span>📧</span> via Email
                        </a>
                        <button
                            type="button"
                            className="submit-action-btn copy-btn"
                            onClick={() => {
                                const body = generateBody();
                                navigator.clipboard.writeText(body);
                                alert('Submission copied! Please send it to: unworthyzeus543@gmail.com');
                            }}
                        >
                            <span>📋</span> Copy Text
                        </button>
                    </div>

                    <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <p>Or send manually to:</p>
                        <p style={{ color: 'var(--gold-yellow)', userSelect: 'all' }}>unworthyzeus543@gmail.com</p>
                    </div>
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
        
        .button-group {
          display: grid;
          gap: 12px;
          margin-top: 20px;
        }

        .submit-action-btn {
          width: 100%;
          padding: 12px;
          border: 3px solid rgba(0,0,0,0.2);
          color: white;
          font-family: 'Press Start 2P', cursive;
          cursor: pointer;
          box-shadow: 0 4px 0 rgba(0,0,0,0.4);
          transition: all 0.1s;
          text-shadow: 1px 1px 0 #000;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 0.8rem;
        }
        
        .submit-action-btn:active {
          transform: translateY(4px);
          box-shadow: none;
        }
        
        .github-btn { background: #2b3137; border-color: #24292e; }
        .email-btn { background: #3b82f6; border-color: #2563eb; }
        .copy-btn { background: #10b981; border-color: #059669; }
        
        .submit-action-btn:hover { filter: brightness(1.1); }

        @media (max-width: 600px) {
          .modal-content {
            padding: 16px;
          }
        }
      `}</style>
        </div>
    );
}
