'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { SEEDS_DATABASE, getDatabaseStats } from '@/lib/seeds-database';
import { normalizeFiltersForSource, seedMatchesSourceFilter, WEBSITE_SUBMISSION_SOURCE } from '@/lib/source-utils';
import { CATEGORIES, getConfidenceLevel, CONFIDENCE_LEVELS, parseProbability } from '@/lib/categories';
import { getVersionFilterOptions, seedMatchesVersionFilter } from '@/lib/version-utils';
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
const ALL_EDITION_VERSION_OPTIONS = [
  { value: 'all', label: 'All Versions' }
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [editionFilter, setEditionFilter] = useState('java');
  const [versionFilter, setVersionFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [coordinatesFilter, setCoordinatesFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('confidence');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const stats = useMemo(() => getDatabaseStats(), []);
  const versionOptions = useMemo(() => (
    editionFilter === 'all' ? ALL_EDITION_VERSION_OPTIONS : getVersionFilterOptions(editionFilter)
  ), [editionFilter]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('q');
    if (query) {
      setSearchQuery(query);
      setCurrentPage(1);
    }
  }, []);

  useEffect(() => {
    if (!versionOptions.some(option => option.value === versionFilter)) {
      setVersionFilter('all');
    }
  }, [versionOptions, versionFilter]);

  // Pre-filter seeds (before category) - used for dynamic category counts
  const preCategoryFilteredSeeds = useMemo(() => {
    let results = [...SEEDS_DATABASE];

    // Adjust confidence for seeds without coordinates (Cap at 0.7)
    // "put anything without coordinates to 70% confidence"
    results = results.map(s => {
      if (!s.coordinates && s.confidence > 0.7) {
        return { ...s, confidence: 0.7 };
      }
      return s;
    });

    // Apply search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(seed =>
        (seed.title || '').toLowerCase().includes(lowerQuery) ||
        (seed.seed || '').includes(searchQuery) ||
        (seed.description || '').toLowerCase().includes(lowerQuery) ||
        (seed.discoveredBy || '').toLowerCase().includes(lowerQuery) ||
        (seed.source || '').toLowerCase().includes(lowerQuery)
      );
    }

    // Apply edition filter
    if (editionFilter === 'java') {
      results = results.filter(seed => seed.version.java);
    } else if (editionFilter === 'bedrock') {
      results = results.filter(seed => seed.version.bedrock);
    }

    // Apply version filter
    if (versionFilter !== 'all') {
      results = results.filter(seed => seedMatchesVersionFilter(seed, editionFilter, versionFilter));
    }

    // Apply confidence filter with exact matching
    if (confidenceFilter !== 'all') {
      results = results.filter(seed => {
        const c = seed.confidence;
        switch (confidenceFilter) {
          case 'verified': return c >= 1.0;
          case 'community': return c >= 0.9 && c < 1.0;
          case 'verified_or_community': return c >= 0.9;
          case 'likely': return c >= 0.7 && c < 0.9;
          case 'plausible': return c >= 0.5 && c < 0.7;
          case 'unverified': return c >= 0.3 && c < 0.5;
          case 'low': return c < 0.3;
          default: return true;
        }
      });
    }

    // Apply source filter
    results = results.filter(seed => seedMatchesSourceFilter(seed, sourceFilter));

    // Apply coordinates filter
    if (coordinatesFilter !== 'all') {
      if (coordinatesFilter === 'yes') {
        results = results.filter(seed => seed.coordinates);
      } else if (coordinatesFilter === 'no') {
        results = results.filter(seed => !seed.coordinates);
      }
    }

    return results;
  }, [searchQuery, editionFilter, versionFilter, confidenceFilter, sourceFilter, coordinatesFilter]);

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
      const getSeedRarityValue = (seed) => {
        // 1. Try specific probability first
        const p = parseProbability(seed.probability);
        // If we have a valid specific probability > 100 (1 in 100+), use it. 
        // We ignore low probabilities to let category defaults handle "common" things if they are better defined.
        if (p && p > 100 && p !== Infinity) return p;

        // 2. Fallback to category rarity (treated as log10 scale)
        const catRarity = CATEGORIES[seed.category]?.rarity || 0;
        return Math.pow(10, catRarity);
      };

      results.sort((a, b) => getSeedRarityValue(b) - getSeedRarityValue(a));
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

  const handleSourceFilterChange = useCallback((nextSource) => {
    const normalizedFilters = normalizeFiltersForSource(nextSource, {
      editionFilter,
      versionFilter,
    });

    setSourceFilter(nextSource);
    setEditionFilter(normalizedFilters.editionFilter);
    setVersionFilter(normalizedFilters.versionFilter);
    setCurrentPage(1);
  }, [editionFilter, versionFilter]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopySuccess = () => {
    showToast('Seed copied to clipboard!');
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
            <div className="hero-actions">
              <Link href="/search" className="search-hero-btn">
                Open Search Lab
              </Link>
              <Link href="/search?biome=deep_dark&structures=ancient_city,trial_chambers&cluster=900&biomeCluster=700&count=1500" className="search-hero-btn secondary">
                Find Ancient City + Trials
              </Link>
            </div>

            {/* Search */}
            <div className="search-container">
              <span className="search-icon">&gt;</span>
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

            <div className="search-promo">
              <div>
                <strong>Need a seed that does not exist in the catalog yet?</strong>
                <span>Use procedural search to combine biomes, structures, and cluster distances.</span>
              </div>
              <Link href="/search" className="search-inline-btn">Search new seeds</Link>
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
                  {versionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Confidence Filter */}
              <div className="filter-group">
                <label>Confidence:</label>
                <select
                  value={confidenceFilter}
                  onChange={(e) => handleFilterChange(setConfidenceFilter)(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Any Confidence</option>
                  <option value="verified">Verified Only (100%)</option>
                  <option value="community">Community Only (90%)</option>
                  <option value="verified_or_community">Verified + Community (90%+)</option>
                  <option value="likely">Likely (70-89%)</option>
                  <option value="plausible">Plausible (50-69%)</option>
                  <option value="unverified">Unverified (30-49%)</option>
                  <option value="low">Low Confidence (&lt;30%)</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Source:</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => handleSourceFilterChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Sources</option>
                  <option value="human">Human Verified</option>
                  <option value="generated">Generated</option>
                  <option value={WEBSITE_SUBMISSION_SOURCE}>Submitted to this website ({stats.websiteSubmissions} total)</option>
                </select>
              </div>

              {/* Coordinates Filter */}
              <div className="filter-group">
                <label>Coords:</label>
                <select
                  value={coordinatesFilter}
                  onChange={(e) => handleFilterChange(setCoordinatesFilter)(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All</option>
                  <option value="yes">Has Coordinates</option>
                  <option value="no">No Coordinates</option>
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
                <span className="category-icon">*</span>
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
                  {showAllCategories ? 'Show Less' : `+${hiddenCount} more`}
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
          <div className="search-wide-cta">
            <div>
              <span className="section-kicker">Procedural Search</span>
              <h2>Build a seed from biome + structure requirements.</h2>
              <p>Search smarter candidates across the seed space, then keep worlds where structures and biomes cluster together.</p>
            </div>
            <Link href="/search" className="search-hero-btn">Launch Search Lab</Link>
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
              <div className="empty-icon">*</div>
              <h3>No seeds found</h3>
              <p>Try adjusting your search or filters</p>
              <Link href="/search" className="search-inline-btn">Search procedurally instead</Link>
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
                &lt;&lt;
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                &lt; Prev
              </button>

              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next &gt;
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                &gt;&gt;
              </button>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="footer">
          <p style={{ marginBottom: '10px' }}>
            <Link href="/search" className="search-inline-btn">Open Search Lab</Link>
          </p>
          <p>
            Mildly inspired by the wider Minecraft seed-hunting and mapping community
            {' '} - {stats.verified} expert-verified seeds + {stats.community.toLocaleString()} community-reported discoveries
          </p>
          <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Community seeds are scraped from public forums and may not be fully verified. Always test seeds yourself.
          </p>
          <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            World-generation algorithms are ported or adapted from <a href="https://github.com/Cubitect/cubiomes" target="_blank" rel="noopener noreferrer">Cubiomes</a> by Cubitect (MIT License)
          </p>
          <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>
            Built for the Minecraft community
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
