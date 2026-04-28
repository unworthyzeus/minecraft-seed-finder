export const WEBSITE_SUBMISSION_SOURCE = 'website_submission';

export function isWebsiteSubmission(seed) {
    return seed?.submittedToWebsite === true || seed?.sourceType === WEBSITE_SUBMISSION_SOURCE;
}

export function seedMatchesSourceFilter(seed, sourceFilter = 'all') {
    if (sourceFilter === 'generated') return Boolean(seed?.isGenerated);
    if (sourceFilter === 'human') return !seed?.isGenerated && !isWebsiteSubmission(seed);
    if (sourceFilter === WEBSITE_SUBMISSION_SOURCE) return isWebsiteSubmission(seed);
    return true;
}

export function normalizeFiltersForSource(sourceFilter, filters = {}) {
    if (sourceFilter !== WEBSITE_SUBMISSION_SOURCE) {
        return { ...filters };
    }

    return {
        ...filters,
        editionFilter: 'all',
        versionFilter: 'all',
    };
}
