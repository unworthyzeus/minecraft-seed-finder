'use client';

import { useState, useMemo, useCallback } from 'react';
import { SEEDS_DATABASE, searchSeeds, filterSeeds, getDatabaseStats } from '@/lib/seeds-database';
import { CATEGORIES, VERSIONS, getConfidenceLevel, CONFIDENCE_LEVELS, parseProbability } from '@/lib/categories';
import Header from '@/components/Header';
import SeedCard from '@/components/SeedCard';
import SubmitModal from '@/components/SubmitModal';

const SEEDS_PER_PAGE = 24;

// Available editions for filtering
const EDITION_OPTIONS = [
  { value: 'all', label: 'All Editions' },
  { value: 'java', label: 'Java Edition' },
  { value: 'bedrock', label: 'Bedrock Edition' }
];

// Available versions for filtering
const VERSION_OPTIONS = [
  { value: 'all', label: 'All Versions' },
  { value: '1.21', label: '1.21+' },
  { value: '1.20', label: '1.20' },
  { value: '1.19', label: '1.19' },
  { value: '1.18', label: '1.18' },
  { value: '1.17', label: '1.17' },
  { value: '1.16', label: '1.16' },
  { value: '1.15', label: '1.15' },
  { value: '1.14', label: '1.14' },
  { value: '1.13', label: '1.13' },
  { value: '1.12', label: '1.12' },
  { value: '1.8', label: '1.8 - 1.11' },
  { value: '1.0', label: '1.0 - 1.7' },
  { value: 'beta', label: 'Beta' },
  { value: 'alpha', label: 'Alpha' }
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [editionFilter, setEditionFilter] = useState('all');
  const [versionFilter, setVersionFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [showGeneratedOnly, setShowGeneratedOnly] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('confidence');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const stats = useMemo(() => getDatabaseStats(), []);

  // Pre-filter seeds (before category) - used for dynamic category counts
  const preCategoryFilteredSeeds = useMemo(() => {
    let results = [...SEEDS_DATABASE];

    // Apply search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(seed =>
        seed.title.toLowerCase().includes(lowerQuery) ||
        seed.seed.includes(searchQuery) ||
        seed.description.toLowerCase().includes(lowerQuery) ||
        seed.discoveredBy.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply edition filter
    if (editionFilter !== 'all') {
      if (editionFilter === 'java') {
        results = results.filter(seed => seed.version.java);
      } else if (editionFilter === 'bedrock') {
        results = results.filter(seed => seed.version.bedrock);
      }
    }

    // Apply version filter
    if (versionFilter !== 'all') {
      results = results.filter(seed => {
        const jv = (seed.version.java || '').toLowerCase();
        const bv = (seed.version.bedrock || '').toLowerCase();
        const combined = jv + ' ' + bv;

        // Helper to check range
        const checkRange = (min, max) => {
          const matches = combined.match(/1\.(\d+)/g);
          if (!matches) return false;
          return matches.some(v => {
            const minor = parseInt(v.split('.')[1]);
            return minor >= min && minor <= max;
          });
        };

        if (versionFilter === '1.8') {
          // Matches 1.8 - 1.11
          return checkRange(8, 11);
        }

        if (versionFilter === '1.0') {
          // Matches 1.0 - 1.7
          return checkRange(0, 7);
        }

        if (versionFilter === 'beta') return jv.includes('beta');
        if (versionFilter === 'alpha') return jv.includes('alpha');

        return jv.includes(versionFilter) || bv.includes(versionFilter);
      });
    }

    // Apply confidence filter
    if (confidenceFilter > 0) {
      results = results.filter(seed => seed.confidence >= confidenceFilter);
    }

    // Apply generated/verified filter
    if (showGeneratedOnly === true) {
      results = results.filter(seed => seed.isGenerated);
    } else if (showGeneratedOnly === false) {
      results = results.filter(seed => !seed.isGenerated);
    }

    return results;
  }, [searchQuery, editionFilter, versionFilter, confidenceFilter, showGeneratedOnly]);

  // Calculate category counts based on pre-filtered seeds
  const categoryCounts = useMemo(() => {
    const counts = {};
    preCategoryFilteredSeeds.forEach(seed => {
      counts[seed.category] = (counts[seed.category] || 0) + 1;
    });
    return counts;
  }, [preCategoryFilteredSeeds]);

  const filteredSeeds = useMemo(() => {
    let results = [...preCategoryFilteredSeeds];

    // Apply category filter
    if (activeCategory) {
      results = results.filter(seed => seed.category === activeCategory);
    }

    // Sort
    if (sortBy === 'confidence') {
      results.sort((a, b) => b.confidence - a.confidence);
    } else if (sortBy === 'date') {
      results.sort((a, b) => new Date(b.discoveredDate) - new Date(a.discoveredDate));
    } else if (sortBy === 'rarity') {
      results.sort((a, b) => {
        const rarityA = CATEGORIES[a.category]?.rarity || 0;
        const rarityB = CATEGORIES[b.category]?.rarity || 0;

        if (rarityA !== rarityB) return rarityB - rarityA;

        // Secondary sort by specific probability if rarity is same
        // Larger probability value (X in 1 in X) means rarer, so it should be first
        return parseProbability(b.probability) - parseProbability(a.probability);
      });
    }

    // "Smart Mix" Interleaving - Apply to the "All" view to ensure diversity
    // Only apply when the default sort (confidence) is active
    if (!activeCategory && sortBy === 'confidence' && results.length > 0) {
      const grouped = {};
      results.forEach(s => {
        if (!grouped[s.category]) grouped[s.category] = [];
        grouped[s.category].push(s);
      });

      const mixed = [];
      const keys = Object.keys(grouped).sort((a, b) =>
        (CATEGORIES[b]?.rarity || 0) - (CATEGORIES[a]?.rarity || 0)
      );

      let maxLen = 0;
      keys.forEach(k => maxLen = Math.max(maxLen, grouped[k].length));

      for (let i = 0; i < maxLen; i++) {
        keys.forEach(k => {
          if (grouped[k][i]) mixed.push(grouped[k][i]);
        });
      }
      results = mixed;
    }

    return results;
  }, [preCategoryFilteredSeeds, activeCategory, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredSeeds.length / SEEDS_PER_PAGE);
  const paginatedSeeds = useMemo(() => {
    const start = (currentPage - 1) * SEEDS_PER_PAGE;
    return filteredSeeds.slice(start, start + SEEDS_PER_PAGE);
  }, [filteredSeeds, currentPage]);

  // Reset page when filters change
  const handleFilterChange = useCallback((setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopySuccess = () => {
    showToast('✓ Seed copied to clipboard!');
  };

  // Categories to display
  const allCategories = Object.values(CATEGORIES);
  const displayedCategories = showAllCategories ? allCategories : allCategories.slice(0, 10);
  const hiddenCount = allCategories.length - 10;

  return (
    <>
      <Header onSubmitClick={() => setShowSubmitModal(true)} />

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <h1>Minecraft Seed Finder</h1>
            <p>
              Discover {stats.total.toLocaleString()}+ rare and legendary seeds from the Minecraft community.
              Find 12-eye portals, record-breaking cacti, structure anomalies, and lost historic worlds.
            </p>

            {/* Search */}
            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search seeds, titles, or discoveries..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
              {/* Edition Filter */}
              <div className="filter-group">
                <label>Edition:</label>
                <select
                  value={editionFilter}
                  onChange={(e) => handleFilterChange(setEditionFilter)(e.target.value)}
                  className="filter-select"
                >
                  {EDITION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Version Filter */}
              <div className="filter-group">
                <label>Version:</label>
                <select
                  value={versionFilter}
                  onChange={(e) => handleFilterChange(setVersionFilter)(e.target.value)}
                  className="filter-select"
                >
                  {VERSION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Confidence Filter */}
              <div className="filter-group">
                <label>Confidence:</label>
                <select
                  value={confidenceFilter}
                  onChange={(e) => handleFilterChange(setConfidenceFilter)(parseFloat(e.target.value))}
                  className="filter-select"
                >
                  <option value="0">Any Confidence</option>
                  <option value="1.0">Verified (100% Expert)</option>
                  <option value="0.9">Community Reported (90%)</option>
                  <option value="0.7">Likely (70%+)</option>
                  <option value="0.5">Plausible (50%+)</option>
                  <option value="0.3">Unverified (30%+)</option>
                </select>
              </div>

              {/* Source Filter */}
              <div className="filter-group">
                <label>Source:</label>
                <select
                  value={showGeneratedOnly === null ? 'all' : showGeneratedOnly ? 'generated' : 'verified'}
                  onChange={(e) => {
                    const v = e.target.value;
                    handleFilterChange(setShowGeneratedOnly)(v === 'all' ? null : v === 'generated');
                  }}
                  className="filter-select"
                >
                  <option value="all">All Sources</option>
                  <option value="verified">Human Verified</option>
                  <option value="generated">Generated</option>
                </select>
              </div>

              {/* Sort */}
              <div className="filter-group">
                <label>Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="confidence">By Confidence</option>
                  <option value="date">By Date</option>
                  <option value="rarity">By Rarity</option>
                </select>
              </div>
            </div>

            {/* Categories */}
            <div className="categories">
              <button
                className={`category-pill ${!activeCategory ? 'active' : ''}`}
                onClick={() => handleFilterChange(setActiveCategory)(null)}
              >
                <span className="category-icon">✨</span>
                All ({preCategoryFilteredSeeds.length.toLocaleString()})
              </button>
              {displayedCategories.map(category => {
                const count = categoryCounts[category.id] || 0;
                return (
                  <button
                    key={category.id}
                    className={`category-pill ${activeCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleFilterChange(setActiveCategory)(activeCategory === category.id ? null : category.id)}
                    style={activeCategory === category.id ? { background: category.color, borderColor: category.color } : {}}
                  >
                    <span className="category-icon">{category.icon}</span>
                    {category.name} ({count})
                  </button>
                );
              })}
              {hiddenCount > 0 && (
                <button
                  className="category-pill category-more"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                >
                  {showAllCategories ? '← Show Less' : `+${hiddenCount} more`}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="container">
          <div className="stats">
            <div className="stat-item">
              <div className="stat-value">{stats.total.toLocaleString()}</div>
              <div className="stat-label">Total Seeds</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.verified}</div>
              <div className="stat-label">Expert Verified</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.community.toLocaleString()}</div>
              <div className="stat-label">Community Seeds</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{filteredSeeds.length.toLocaleString()}</div>
              <div className="stat-label">Matching Filters</div>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="container">
          <div className="results-info">
            <span className="results-count">
              Showing {((currentPage - 1) * SEEDS_PER_PAGE) + 1}-{Math.min(currentPage * SEEDS_PER_PAGE, filteredSeeds.length)} of {filteredSeeds.length.toLocaleString()} seeds
            </span>
          </div>
        </div>

        {/* Seeds Grid */}
        <section className="container">
          {paginatedSeeds.length > 0 ? (
            <div className="seeds-grid">
              {paginatedSeeds.map(seed => (
                <SeedCard
                  key={seed.id}
                  seed={seed}
                  onCopySuccess={handleCopySuccess}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No seeds found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                ««
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                ‹ Prev
              </button>

              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next ›
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                »»
              </button>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>
            Inspired by <a href="https://minecraftathome.com" target="_blank" rel="noopener noreferrer">Minecraft At Home</a>
            {' '}• {stats.verified} expert-verified seeds + {stats.community.toLocaleString()} community-reported discoveries
          </p>
          <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Community seeds are scraped from public forums and may not be fully verified. Always test seeds yourself.
          </p>
          <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>
            Built with ❤️ for the Minecraft community
          </p>
        </footer>
      </main>

      {/* Submit Modal */}
      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
