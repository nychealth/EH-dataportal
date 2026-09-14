// ======================================================================= //
// data.js
// ======================================================================= //

// The one file that is not a rename of its NR counterpart. NR fetches a precomputed
// payload per report section and buckets the rows by neighborhood; NDHR calls buildRows
// (assets/js/report-data/normalize.js) and gets the same row shape back, computed in the
// browser from EHDP-data's own indicator files (plan DECIDED-4).
//
// Two consequences worth stating, because neither is visible from the call:
//   - buildRows is per-AREA, so an in-place district switch re-runs it. Every fetch it
//     makes goes through normalize.js's own by-URL cache, so the second run costs no
//     network — which is what makes re-running it the simple option rather than a false
//     economy.
//   - buildRows returns the current district's row and its rank, not the other 58 areas'
//     values. The Vega choropleth needs those, so buildIndicatorSeries below re-derives
//     them from the same cached files.

// ----------------------------------------------------------------------- //
// area names
// ----------------------------------------------------------------------- //

// GeoType|GeoID -> display name, from the same GeoLookup buildRows reads.
// Null until the first load resolves it
let geoNameIndex = null;


// Builds the GeoType|GeoID -> name index once, from the cached GeoLookup fetch
const loadGeoNames = async () => {

    if (geoNameIndex) return geoNameIndex;

    const base = reportConfig.dataRepo + reportConfig.dataBranch + '/';
    const columns = await reportDataFetchJSON(base + 'geography/GeoLookup.json');

    geoNameIndex = {};

    for (const row of reportDataExpandColumns(columns)) {
        geoNameIndex[row.GeoType + '|' + row.GeoID] = row.Name;
    }

    debugLog('loadGeoNames: branch-index-built:', Object.keys(geoNameIndex).length);

    return geoNameIndex;

};


// ----------------------------------------------------------------------- //
// chart series
// ----------------------------------------------------------------------- //

// Every area's value for one measure, at that measure's own geotype and its own latest
// period — the dataset the Vega choropleth and bar strip plot.
//
// Derived here rather than added to buildRows because buildRows is pinned by
// scripts/report-data-parity.mjs against the published NR payloads: widening its return
// shape would mean widening that comparison to fields the payloads do not carry. The
// per-row work is a filter over a file normalize.js has already fetched and cached
const buildIndicatorSeries = async row => {

    // A row that could not be computed has no series either. The error string is
    // buildRows' own, and the card renders the gap
    if (row.error || row.year_id == null) {
        debugLog('buildIndicatorSeries: branch-no-data:', { measureId: row.MeasureID, error: row.error });
        return [];
    }

    const base = reportConfig.dataRepo + reportConfig.dataBranch + '/';
    const names = await loadGeoNames();

    const columns = await reportDataFetchJSON(base + 'indicators/data/' + row.IndicatorID + '.json');

    return reportDataExpandColumns(columns)
        .filter(r => r.MeasureID === row.MeasureID
            && r.GeoType === row.geotype
            && r.TimePeriodID === row.year_id
            && reportDataIsUsable(r))
        .map(r => ({
            // geo_join_id is the name the Vega spec looks up against the topojson's
            // properties.GEOCODE, kept from the NR spec so the two specs stay comparable
            geo_join_id: r.GeoID,
            area_name: names[row.geotype + '|' + r.GeoID] || String(r.GeoID),
            unmodified_data_value_geo_entity: reportDataNumericValue(r)
        }));

};


// ----------------------------------------------------------------------- //
// data loading
// ----------------------------------------------------------------------- //

// Renders the URL-selected district once both map and data are ready
const tryInitialRender = () => {

    debugLog('tryInitialRender: enter:', { dataReady, mapReady });

    // Guard initial render until both the rows and the map geometry are ready
    if (!dataReady || !mapReady) {
        debugLog('tryInitialRender: branch-waiting');
        return;
    }

    const fromURL = getDistrictFromURL();

    if (fromURL) {

        debugLog('tryInitialRender: branch-from-url:', fromURL);

        const layer = findLayerByName(fromURL);
        if (layer) {
            debugLog('tryInitialRender: branch-select-layer-from-url');
            selectLayer(layer);
        }

        renderAll(fromURL);

    }

};


// Marks the load gate complete once both the rows and the topic map are in
const checkAllLoaded = () => {

    debugLog('checkAllLoaded: enter:', { rowsLoaded, topicsLoaded });

    if (rowsLoaded && topicsLoaded) {
        debugLog('checkAllLoaded: branch-ready');
        dataReady = true;
        tryInitialRender();
    }

};


// Builds one district's rows and their chart series and returns them as
// `{ rows, series }`. It does not touch the shared state and does not re-render —
// renderAll (report.js) owns both, including the staleness guard described there.
//
// Never rejects: a build failure is caught below and reported as empty rows, so the
// caller's `.then` is the only path out
const loadDistrictRows = async districtName => {

    debugLog('loadDistrictRows: enter:', districtName);

    // A category with no measures has nothing to build and no file to fetch. This is the
    // right place for that check rather than in bootstrap(), because it is a property of
    // the category and so holds for every district switch as well as for first load —
    // otherwise each switch on the empty-state page fires a metadata request that could
    // only ever resolve to an empty list
    if (!reportConfig.measures || !reportConfig.measures.length) {
        debugLog('loadDistrictRows: branch-no-measures:', districtName);
        return { rows: [], series: {} };
    }

    const geoIds = geoIdsForDistrict(districtName);

    // `{ rows, series }`, not a bare array: both callers read `.rows` and `.series` off
    // the result, and a bare [] only survived because `[].rows` is undefined and each
    // read is `|| `-defaulted. Returning the shape the callers destructure removes the
    // accident rather than relying on it
    if (!geoIds) {
        debugLog('loadDistrictRows: branch-no-geoids:', districtName);
        return { rows: [], series: {} };
    }

    try {

        const rows = await buildRows({
            measures: reportConfig.measures,
            geoIds: geoIds,
            dataRepo: reportConfig.dataRepo,
            dataBranch: reportConfig.dataBranch
        });

        const series = {};

        for (const row of rows) {
            series[row.MeasureID] = await buildIndicatorSeries(row);
        }

        debugLog('loadDistrictRows: branch-rows-built:', {
            districtName,
            rowCount: rows.length,
            errored: rows.filter(r => r.error).length
        });

        return { rows, series };

    } catch (error) {
        console.error('Error building rows for "' + districtName + '":', error);
        debugLog('loadDistrictRows: branch-build-failed:', { districtName, error });
        return { rows: [], series: {} };
    }

};


// First load: builds the rows for the district this page was generated for
const loadInitialRows = () => {

    const districtName = getDistrictFromURL();

    loadDistrictRows(districtName).then(result => {

        indicatorRows = result.rows || [];
        indicatorSeries = result.series || {};
        rowsDistrict = districtName;

        rowsLoaded = true;
        checkAllLoaded();

    });

};


// Loads the topic → IndicatorID map and reverses it into IndicatorID → topic slug
const loadTopicIndicators = () => {

    debugLog('loadTopicIndicators: enter:', reportConfig.topicIndicatorsUrl);

    // Without the map no card can resolve a topic, so the link is simply omitted
    if (!reportConfig.topicIndicatorsUrl || !reportConfig.dataExplorerUrl) {
        debugLog('loadTopicIndicators: branch-not-configured');
        topicsLoaded = true;
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

            // First topic wins, matching NR: 42 of the 263 ids sit in more than one
            // data-explorer topic
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
        .then(() => {
            topicsLoaded = true;
            checkAllLoaded();
        });

};
