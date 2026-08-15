// ======================================================================= //
// data.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// data loading
// ----------------------------------------------------------------------- //

// Renders the URL-selected neighborhood once both map and data are ready
const tryInitialRender = () => {

    debugLog('tryInitialRender: enter:', { dataReady, mapReady });

    // Guard initial render until both data payloads and map geometry are ready
    if (!dataReady || !mapReady) {
        debugLog('tryInitialRender: branch-waiting');
        return;
    }

    // If a neighborhood is already in the URL, honor it after both data sources are ready
    const fromURL = getNeighborhoodFromURL();

    if (fromURL) {

        debugLog('tryInitialRender: branch-from-url:', fromURL);

        const layer = findLayerByName(fromURL);
        if (layer) {
            debugLog('tryInitialRender: branch-select-layer-from-url');
            selectLayer(layer, true);
        }

        renderAll(fromURL);

    }

};


// Counts a completed fetch and triggers the initial render once all are in
const checkAllLoaded = () => {

    debugLog('checkAllLoaded: enter:', { fetchesCompleteBefore: fetchesComplete, totalFetches });

    fetchesComplete++;

    // Trigger initial render once all sections and viz data have loaded
    if (fetchesComplete >= totalFetches) {
        debugLog('checkAllLoaded: branch-ready');
        dataReady = true;
        tryInitialRender();
    }

};


// Encodes the last path segment of a report URL so it is safe to fetch
const normalizeReportUrl = url => {

    debugLog('normalizeReportUrl: enter:', url);

    // GitHub raw URLs must not contain literal spaces in the path; some
    // clients reject them or fail inconsistently. Skip already-safe URLs
    if (!url || url.indexOf(' ') === -1) return url;

    try {

        // Parse via URL API so we can safely target only the path segment
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);

        if (!parts.length) return url;

        let last = parts[parts.length - 1];

        // Re-encode defensively for names that may already be partially encoded
        try {
            last = encodeURIComponent(decodeURIComponent(last));
        } catch (e) {
            last = encodeURIComponent(last);
        }

        parts[parts.length - 1] = last;
        u.pathname = '/' + parts.join('/');

        debugLog('normalizeReportUrl: branch-encoded:', u.href);
        return u.href;

    } catch (err) {
        debugLog('normalizeReportUrl: branch-parse-failed:', err);
        return url;
    }

};


// Fetches one report section's rows and buckets/sorts them by neighborhood
const loadSection = section => {

    debugLog('loadSection: enter:', { sectionId: section.id, reportUrl: section.reportUrl });

    // ----- fetch ----- //

    fetch(normalizeReportUrl(section.reportUrl))
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {

            // Non-array responses are treated as empty to keep rendering resilient
            const rows = Array.isArray(data) ? data : [];

            debugLog('loadSection: branch-data-loaded:', { sectionId: section.id, rowCount: rows.length });

            // ----- bucket by neighborhood ----- //

            // Build neighborhood buckets once during load for faster rerenders
            const byNeighborhood = {};

            rows.forEach(row => {

                const n = row.neighborhood;
                if (!n) return;

                if (!byNeighborhood[n]) byNeighborhood[n] = [];
                byNeighborhood[n].push(row);

            });

            // ----- sort by rank ----- //

            // Sort each neighborhood's rows by rank descending so higher-ranked
            // indicators appear at the top of the accordion
            Object.keys(byNeighborhood).forEach(n => {

                byNeighborhood[n].sort((a, b) => {
                    const ra = Number(a.data_value_rank);
                    const rb = Number(b.data_value_rank);
                    if (isNaN(ra) || isNaN(rb)) return 0;
                    return rb - ra;
                });

            });

            sectionData[section.id] = byNeighborhood;

        })
        .catch(error => {
            console.error('Error loading section "' + section.id + '":', error);
            debugLog('loadSection: branch-load-failed:', { sectionId: section.id, error });
            sectionData[section.id] = {};
        })
        .then(checkAllLoaded);

};


// Loads the topic → IndicatorID map and reverses it into IndicatorID → topic slug
const loadTopicIndicators = () => {

    debugLog('loadTopicIndicators: enter:', reportConfig.topicIndicatorsUrl);

    // Without the map no card can resolve a topic, so the link is simply omitted
    if (!reportConfig.topicIndicatorsUrl || !reportConfig.dataExplorerUrl) {
        debugLog('loadTopicIndicators: branch-not-configured');
        checkAllLoaded();
        return;
    }

    fetch(reportConfig.topicIndicatorsUrl)
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {

            const slugs = {};

            // First topic wins, matching the retired getURL, which returned on its first
            // hit: 42 of the 263 ids sit in more than one data-explorer topic
            Object.keys(data).forEach(slug => {

                const ids = data[slug] && data[slug].IndicatorID;
                if (!Array.isArray(ids)) return;

                ids.forEach(id => {
                    if (slugs[id] === undefined) slugs[id] = slug;
                });

            });

            indicatorTopicSlugs = slugs;

            debugLog('loadTopicIndicators: branch-data-loaded:', Object.keys(slugs).length);

        })
        .catch(error => {
            console.error('Error loading topic indicators:', error);
            debugLog('loadTopicIndicators: branch-load-failed:', error);
            indicatorTopicSlugs = null;
        })
        .then(checkAllLoaded);

};


// Loads the shared viz table used by all per-indicator Vega charts
const loadVizData = () => {

    debugLog('loadVizData: enter:', reportConfig.vizUrl);

    // If no viz URL is configured, continue with section-only rendering
    if (!reportConfig.vizUrl) {
        debugLog('loadVizData: branch-no-viz-url');
        checkAllLoaded();
        return;
    }

    aq.loadJSON(reportConfig.vizUrl, { autoMax: 10000, parse: { time: String } })
        .then(table => {
            debugLog('loadVizData: branch-data-loaded:', table && table.numRows && table.numRows());
            vizTable = table;
        })
        .catch(error => {
            console.error('Error loading viz data:', error);
            debugLog('loadVizData: branch-load-failed:', error);
            vizTable = null;
        })
        .then(checkAllLoaded);

};
