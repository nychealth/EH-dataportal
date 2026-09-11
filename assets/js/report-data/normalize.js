// ======================================================================= //
// report-data/normalize.js
// ======================================================================= //

// Builds report rows in the browser from EHDP-data's own indicator files, in the
// shape the Neighborhood Reports renderers already consume.
//
// WHY THIS EXISTS. NR renders from precomputed payloads EHDP-data publishes at
// neighborhood-reports/data/report/<report> <topic>.json, one file per topic, all
// of them UHF42. NDHR needs the same rows at CD, CDTA2020 and PUMA2020, and asking
// the data team for 3 more geographies x N topics of precomputed files is the thing
// this replaces (plan DECIDED-4, "route A"). So the compute moves here and is
// parameterized on geography from the start; the output field names are deliberately
// the precomputed payload's field names, so the forked renderers need no rewriting.
//
// WHAT IT IS NOT. It is not a reimplementation from a spec — there is no spec. Every
// rule below was recovered by diffing computed output against the precomputed
// payloads and is checked by `npm run report-data:parity`, which is the only thing
// that keeps this file honest. Changing a rule here without running that harness
// silently forks NDHR's numbers away from the ones NR has published for years.
//
// A classic script sharing one global scope with whatever page loads it, like
// assets/js/nr-report/ and assets/js/data-explorer/. Helpers are prefixed
// `reportData` for that reason: `assets/js/nr-report/map.js` and
// partials/nr-leaflet.html already demonstrate what two same-named top-level
// declarations do to a page (a SyntaxError that kills every script on it, which
// `no-undef` cannot see). `buildRows` is the one deliberately unprefixed name —
// it is the module's whole public surface.


// ----------------------------------------------------------------------- //
// fetching
// ----------------------------------------------------------------------- //

// One in-flight promise per URL. The three lookup files are static per session and
// every indicator is asked for once per category page, so without this a five-row
// category refetches metadata.json (1.1 MB) five times.
const reportDataFetchCache = {};

const reportDataFetchJSON = (url, fetchImpl) => {

    if (reportDataFetchCache[url]) return reportDataFetchCache[url];

    const doFetch = fetchImpl || fetch;

    reportDataFetchCache[url] = doFetch(url)
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status + ' from ' + url);
            return res.json();
        });

    return reportDataFetchCache[url];

};


// EHDP-data publishes indicator data and GeoLookup COLUMNAR — one object whose values
// are parallel arrays — rather than as an array of records. Expanded once on arrival so
// nothing downstream has to carry an index around.
const reportDataExpandColumns = (columns) => {

    const keys = Object.keys(columns);
    if (!keys.length) return [];

    const length = columns[keys[0]].length;
    const out = new Array(length);

    for (let i = 0; i < length; i++) {
        const row = {};
        for (const key of keys) row[key] = columns[key][i];
        out[i] = row;
    }

    return out;

};


// ----------------------------------------------------------------------- //
// value and period selection
// ----------------------------------------------------------------------- //

// The number a row is worth: `Value` rounded to ONE decimal place.
//
// Neither raw column reproduces the published payloads, and the differences only show up
// at the third decimal or at an exact half-way case — which is why they survive a spot
// check of a few rows.
//
//   - `Value` is the unrounded internal figure (46.9313) and every published number is
//     rounded (46.9), for the area, its borough and the city alike. Ranking the unrounded
//     column also produces ranks the published ones do not have, because rounding merges
//     distinct figures into ties
//   - `DisplayValue` is rounded but is not the published number either. It rounds half to
//     even where the published payloads round half up in floating point — measure 221's
//     Bronx figure is 26.95, published as 26.9, with DisplayValue "27.0"; Queens is 12.25,
//     published as 12.3, with DisplayValue "12.2", so the two disagree in OPPOSITE
//     directions on one measure — and its precision varies per row, showing measure 45 as
//     "38" where the payload carries 38.3 `[both verified 2026-09-11]`
//
// One decimal is the payload's own ceiling, not a guess: across 2,850 published values in
// the 22 report sections, 2,378 carry one decimal, 472 carry none, and none carries two
// `[2026-09-11]`. A measure needing finer precision would be flattened here, which the
// parity harness would show as a value mismatch rather than pass silently.
// toFixed, not Math.round(v * 10) / 10. The two differ on every value whose decimal
// form ends in 5, because multiplying by 10 first rounds 26.95 up to exactly 269.5 and
// loses the information that the stored double is 26.9499999999999993 — where toFixed
// rounds the stored value itself. The published payloads round the stored value: 26.95
// is published as 26.9 and 12.25, which IS exactly representable, as 12.3. Math.round
// gives 27 and 12.3, so it is wrong on one and right on the other `[2026-09-11]`.
const reportDataRoundToPublished = value => Number(Number(value).toFixed(1));

const reportDataNumericValue = (row) => {

    if (row.Value !== null && row.Value !== undefined && row.Value !== '' && isFinite(Number(row.Value))) {
        return reportDataRoundToPublished(row.Value);
    }

    // DisplayValue is the fallback when Value is absent. Separators are stripped because
    // it is formatted ("523,000").
    if (row.DisplayValue !== null && row.DisplayValue !== undefined && row.DisplayValue !== '') {
        const displayed = Number(String(row.DisplayValue).replace(/,/g, ''));
        if (isFinite(displayed)) return reportDataRoundToPublished(displayed);
    }

    return null;

};


// The string a cell shows. `DisplayValue` already carries the footnote marker — it reads
// "43.7*" where the estimate is based on small numbers — so the marker is never appended
// here; doing so doubles it. A SUPPRESSED row is the one case that needs work: its
// DisplayValue is the bare marker "**", and the published payloads prefix "N/A" to it.
const reportDataDisplayString = (row) => {

    if (!row) return null;

    return reportDataIsUsable(row) ? String(row.DisplayValue) : 'N/A' + String(row.DisplayValue ?? '');

};


// Suppressed estimates arrive as null and empty cells as '', and both must be excluded
// from ranking rather than coerced — Number(null) and Number('') are both 0, which would
// rank a suppressed area as the lowest in the city.
const reportDataIsUsable = row => reportDataNumericValue(row) !== null;


// The latest period is the one whose coverage ENDS last, never the highest
// TimePeriodID: EHDP-data's ids are assignment order, not chronology, and
// scripts/ndhr-build-cdlist.mjs records a case where the highest id is "2007-11"
// against a true latest of "2015-19".
//
// "with at least one usable value" is load-bearing and not obvious. Measure 1128
// (evictions, court-ordered) publishes a complete 59-row CD set for 2022 in which
// every Value is null; taking the latest period merely PRESENT at the geotype hands
// back a period at which the indicator renders empty on all 59 pages, with no error
// anywhere `[verified 2026-09-11 against the production data branch]`.
const reportDataLatestPeriod = (rows, timePeriodsById) => {

    const usable = rows.filter(row => reportDataIsUsable(row));
    if (!usable.length) return null;

    const periods = [...new Set(usable.map(row => row.TimePeriodID))];

    periods.sort((a, b) => {
        const ea = (timePeriodsById[a] || {}).end_period || 0;
        const eb = (timePeriodsById[b] || {}).end_period || 0;
        return ea - eb;
    });

    return periods[periods.length - 1];

};


// ----------------------------------------------------------------------- //
// ranking
// ----------------------------------------------------------------------- //

// rankReverse marks indicators where a HIGHER value is the better outcome — park
// access, bike lanes, air conditioning. It comes from the measure's VisOptions.Map
// entry for the geography being rendered, and two fallbacks are needed because that
// entry is frequently missing:
//
//   - the requested geotype may have no Map entry even though the measure publishes
//     data there. Measure 690 (grass and tree cover) has Map entries for Borough and
//     NTA2010 only, and NDHR reads it at CD. Falling back to any non-null entry is
//     safe by measurement, not by assumption: across all 731 measures in the
//     production metadata, RankReverse is constant within a measure — zero measures
//     carry two different values `[verified 2026-09-11]`
//   - 223 of those 731 measures carry no non-null RankReverse anywhere, measure 537
//     (heat-stress ED visits, an NDHR row) among them. There is nothing to fall back
//     to, so the content YAML may state `rank_reverse` itself and 0 is the default —
//     which is the common case, higher being worse for most health indicators
const reportDataRankReverse = (measure, geoType, declared) => {

    const mapOptions = ((measure.VisOptions || [])[0] || {}).Map || [];

    const forGeo = mapOptions.find(entry => entry.GeoType === geoType);
    if (forGeo && forGeo.RankReverse !== null && forGeo.RankReverse !== undefined) {
        return forGeo.RankReverse === 1 || forGeo.RankReverse === true;
    }

    const anyEntry = mapOptions.find(entry => entry.RankReverse !== null && entry.RankReverse !== undefined);
    if (anyEntry) {
        return anyEntry.RankReverse === 1 || anyEntry.RankReverse === true;
    }

    return declared === true || declared === 'true' || declared === 1 || declared === '1';

};


// Orders areas worst-first, so position 1 is always the unfavourable end whichever way
// the indicator runs. GeoID ascending is the tie-break.
//
// The tie-break is OURS, and nothing upstream constrains it: the precomputed payloads
// order tied values inconsistently — measure 502 puts GeoID 406 ahead of 404 at one
// tertile boundary while measure 674 puts 207 ahead of 501 at another, so no field in
// the data predicts it. A deterministic one at least makes our own output reproducible.
const reportDataSortWorstFirst = (rows, rankReverse) =>
    [...rows].sort((a, b) => {
        const av = reportDataNumericValue(a);
        const bv = reportDataNumericValue(b);
        return (rankReverse ? av - bv : bv - av) || a.GeoID - b.GeoID;
    });


// NOT COMPUTED: the published payloads carry an `nbr_rank` — the area's ordinal
// position among its peers — and nothing renders it. `assets/js/nr-report/cards.js`
// reads `data_value_rank` only, and a grep of the NR templates and modules finds no
// other consumer `[verified 2026-09-11]`. Its published tie convention was not
// recovered: it is neither competition nor dense ranking in either direction, and on
// measure 1227 a five-area tie takes rank 1 while every later two-area tie skips a
// rank. Left out rather than approximated, so nothing downstream can read a field
// this file would be guessing at.


// The tertile the card's pill and sentence read: 1 unfavourable, 2 middle, 3 favourable.
//
// NTILE(3) over POSITION, not over value: the first n%3 buckets take the extra area, so
// 41 areas split 14/14/13. That exact convention is what the precomputed payloads carry
// — a floor(n/3) cut leaves 8 rows unexplained across NR's corpus and a ceil(n/3) cut
// leaves 2, where NTILE leaves 0 `[2026-09-11: 2,898 rows over 22 report sections]`.
//
// Because the split is positional, a run of tied values can straddle a boundary and
// come out in two different tertiles — 48 of those 2,898 rows do. That is NR's shipped
// behaviour and is reproduced deliberately (decided 2026-09-11), not overlooked; it is
// also why the parity harness scores such rows separately instead of as failures.
const reportDataTertile = (position, count) => {

    const base = Math.floor(count / 3);
    const remainder = count % 3;

    const firstSize = base + (remainder > 0 ? 1 : 0);
    const secondSize = base + (remainder > 1 ? 1 : 0);

    if (position <= firstSize) return 1;
    if (position <= firstSize + secondSize) return 2;

    return 3;

};


// ----------------------------------------------------------------------- //
// the public entry point
// ----------------------------------------------------------------------- //

// Builds one row per requested measure for one area.
//
//   measures    the content YAML's rows: { MeasureID, IndicatorID, geotype, … }.
//               Keyed on MeasureID, not IndicatorID: an IndicatorID names a family
//               ("Number", "Percent", "Age-adjusted rate") whose values are not
//               interchangeable, and IndicatorID rides along only because it is what
//               locates the data file
//   geoIds      the area's id in each geography it may be read at, e.g.
//               { CD: 101, CDTA2020: 101, PUMA2020: 3701 }. Per-row rather than one
//               id because an NDHR page is a CD that reads three of its rows at
//               PUMA2020 and two at CDTA2020 (plan DECIDED-10)
//
// Rows whose measure has no usable data at the requested geography are returned with
// a null value rather than dropped, so a caller can render the gap deliberately. Two
// NDHR measures are published at only 35 of 55 PUMA2020 areas, covering 38 of 59
// community districts `[verified 2026-09-11]`, so this is the ordinary case, not an
// error path.
const buildRows = async ({
    measures,
    geoIds,
    dataRepo,
    dataBranch,
    fetchImpl
}) => {

    const repo = dataRepo || (typeof data_repo !== 'undefined' ? data_repo : null);
    const branch = dataBranch || (typeof data_branch !== 'undefined' ? data_branch : null);

    if (!repo || !branch) throw new Error('buildRows needs dataRepo and dataBranch');

    const base = repo + branch + '/';

    // ----- shared lookups ----- //

    const [metadata, timePeriods, geoColumns] = await Promise.all([
        reportDataFetchJSON(base + 'indicators/metadata/metadata.json', fetchImpl),
        reportDataFetchJSON(base + 'indicators/metadata/TimePeriods.json', fetchImpl),
        reportDataFetchJSON(base + 'geography/GeoLookup.json', fetchImpl)
    ]);

    const timePeriodsById = {};
    for (const period of timePeriods) timePeriodsById[period.TimePeriodID] = period;

    const geoRows = reportDataExpandColumns(geoColumns);
    const geoByTypeAndId = {};
    for (const row of geoRows) geoByTypeAndId[row.GeoType + '|' + row.GeoID] = row;

    // MeasureID is unique across the whole of EHDP-data — zero duplicates across the
    // 731 measures in the production metadata `[verified 2026-09-11]` — so one flat
    // index resolves a row to both its measure and its indicator.
    const byMeasure = {};
    for (const indicator of metadata) {
        for (const measure of indicator.Measures || []) {
            byMeasure[measure.MeasureID] = { indicator, measure };
        }
    }

    // ----- one row per requested measure ----- //

    const built = [];

    for (const spec of measures) {

        const found = byMeasure[spec.MeasureID];

        // A MeasureID metadata does not carry cannot be computed at all — its data file
        // 404s too. Seven of the measures NR's own precomputed payloads ship are in this
        // state, because the database holds data that is exported into those payloads but
        // not exported as indicators `[per Chris 2026-09-11; the 404 alone cannot tell
        // "never exported" from "withdrawn", so do not read it as a retirement]`. Reported
        // rather than thrown: one unexported measure must not blank a whole category page.
        if (!found) {
            built.push({ MeasureID: spec.MeasureID, IndicatorID: spec.IndicatorID || null, error: 'not in metadata' });
            continue;
        }

        const { indicator, measure } = found;
        const geoType = spec.geotype;
        const geoId = geoIds[geoType];

        const dataColumns = await reportDataFetchJSON(
            base + 'indicators/data/' + indicator.IndicatorID + '.json',
            fetchImpl
        );

        const measureRows = reportDataExpandColumns(dataColumns)
            .filter(row => row.MeasureID === spec.MeasureID);

        const atGeo = measureRows.filter(row => row.GeoType === geoType);
        const period = reportDataLatestPeriod(atGeo, timePeriodsById);

        if (period === null) {
            built.push({ MeasureID: spec.MeasureID, IndicatorID: indicator.IndicatorID, error: 'no usable data at ' + geoType });
            continue;
        }

        const areas = atGeo.filter(row => row.TimePeriodID === period && reportDataIsUsable(row));

        const rankReverse = reportDataRankReverse(measure, geoType, spec.rank_reverse);
        const sorted = reportDataSortWorstFirst(areas, rankReverse);

        const positions = new Map();
        sorted.forEach((row, index) => positions.set(row.GeoID, index + 1));

        // Two lookups, not one. `myRow` is the area's row whether or not its value is
        // usable, because a SUPPRESSED area still has a row, a footnote marker and a
        // cell to render; `mine` is that row only when there is a number in it. Reading
        // one variable for both is how a suppressed area silently loses its footnote.
        const myRow = atGeo.find(row => row.TimePeriodID === period && String(row.GeoID) === String(geoId)) || null;
        const mine = myRow && reportDataIsUsable(myRow) ? myRow : null;
        const geoRow = geoByTypeAndId[geoType + '|' + geoId] || {};

        // Borough and citywide comparisons come from the same file at the same period,
        // so they move with the value rather than being read from a separate payload.
        const sameperiod = measureRows.filter(row => row.TimePeriodID === period);
        const boroughRow = sameperiod.find(row => row.GeoType === 'Borough' && String(row.GeoID) === String(geoRow.BoroID));
        const cityRow = sameperiod.find(row => row.GeoType === 'Citywide');

        built.push({

            MeasureID: spec.MeasureID,
            IndicatorID: indicator.IndicatorID,
            geotype: geoType,
            geo_entity_id: geoId,
            geo_entity_name: geoRow.Name || null,

            indicator_name: indicator.IndicatorName,

            // Site-owned: EHDP-data carries only the long form, and neither the metadata
            // nor the curated nr_indicator_names.json has a short-name column. Supplied
            // by data/globals/NDHR_content/<category>.yml.
            indicator_short_name: spec.indicator_short_name || null,

            indicator_long_name: indicator.IndicatorName + ', ' + ((timePeriodsById[period] || {}).TimePeriod || ''),
            indicator_description: indicator.IndicatorDescription,

            // Also site-owned, and for the same reason: `units` is populated in the
            // precomputed payloads ("per 100,000", "of land area") and appears nowhere in
            // metadata — two measures sharing MeasurementType "Percent" carry different
            // units, so it cannot be derived from one either `[verified 2026-09-11]`.
            units: spec.units || '',

            measurement_type: measure.MeasurementType,
            data_source_list: measure.Sources,

            data_value_geo_entity: reportDataDisplayString(myRow),
            unmodified_data_value_geo_entity: mine ? reportDataNumericValue(mine) : null,
            data_value_boro: boroughRow ? reportDataNumericValue(boroughRow) : null,
            data_value_nyc: cityRow ? reportDataNumericValue(cityRow) : null,

            nbr_data_note: myRow ? myRow.Note : '',

            rankReverse: rankReverse,
            data_value_rank: mine ? reportDataTertile(positions.get(mine.GeoID), sorted.length) : null,

            year_id: period,
            time_period: (timePeriodsById[period] || {}).TimePeriod || null,
            area_count: sorted.length

        });

    }

    return built;

};
