'use client';

import { useState, useMemo, useCallback } from 'react';
import { SEEDS_DATABASE, searchSeeds, filterSeeds, getDatabaseStats } from '@/lib/seeds-database';
import { CATEGORIES, VERSIONS, getConfidenceLevel, CONFIDENCE_LEVELS } from '@/lib/categories';
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
  { value: '1.20', label: '1.20.x' },
  { value: '1.19', label: '1.19.x' },
  { value: '1.18', label: '1.18.x' },
  { value: '1.17', label: '1.17.x' },
  { value: '1.16', label: '1.16.x' },
  { value: '1.14', label: '1.14.x' },
  { value: 'legacy', label: 'Legacy (Pre-1.14)' }
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

  const filteredSeeds = useMemo(() => {
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

    // Apply category filter
    if (activeCategory) {
      results = results.filter(seed => seed.category === activeCategory);
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
      if (versionFilter === 'legacy') {
        results = results.filter(seed => {
          const jv = seed.version.java?.toLowerCase() || '';
          return jv.includes('alpha') || jv.includes('beta') || jv.includes('1.12') || jv.includes('1.13');
        });
      } else {
        // Specific version like 1.21, 1.20, etc.
        results = results.filter(seed => {
          const jv = seed.version.java || '';
          const bv = seed.version.bedrock || '';
          return jv.includes(versionFilter) || bv.includes(versionFilter);
        });
      }
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

    // Sort
    if (sortBy === 'confidence') {
      results.sort((a, b) => b.confidence - a.confidence);
    } else if (sortBy === 'date') {
      results.sort((a, b) => new Date(b.discoveredDate) - new Date(a.discoveredDate));
    } else if (sortBy === 'rarity') {
      results.sort((a, b) => {
        const catA = CATEGORIES[a.category];
        const catB = CATEGORIES[b.category];
        return (catB?.rarity || 0) - (catA?.rarity || 0);
      });
    }

    return results;
  }, [searchQuery, activeCategory, editionFilter, versionFilter, confidenceFilter, showGeneratedOnly, sortBy]);

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
                  <option value="0.9">Verified (90%+)</option>
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
                All ({stats.total.toLocaleString()})
              </button>
              {displayedCategories.map(category => {
                const count = stats.byCategory[category.id] || 0;
                return (
                  <button
                    key={category.id}
                    className={`category-pill ${activeCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleFilterChange(setActiveCategory)(activeCategory === category.id ? null : category.id)}
                    style={activeCategory === category.id ? { background: category.color, borderColor: category.color } : {}}
                  >
                    <span className="category-icon">{category.icon}</span>
                    {category.name.split(' ')[0]} ({count})
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
              <div className="stat-label">Human Verified</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.categories}</div>
              <div className="stat-label">Categories</div>
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
            {' '}• {stats.verified} verified seeds + {stats.generated.toLocaleString()} generated discoveries
          </p>
          <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Generated seeds are algorithmically created and may not be verified. Always test seeds yourself.
          </p>
          <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>
            Built with ❤️ for the Minecraft community
          </p>
        </footer>
      </main>

      {/* Submit Modal */}
      {showSubmitModal && (
        <SubmitModal
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => {
            setShowSubmitModal(false);
            showToast('✓ Discovery submitted for review!');
          }}
        />
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
