// ======================================================================= //
// cards.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// accordion ids and escaping
// ----------------------------------------------------------------------- //

// Cards are numbered in one sequence across all sections, in render order
let accordionCounter = 0;

// Generates the unique id that pairs a collapse control with its panel
const nextAccordionId = () => 'nr-acc-' + (++accordionCounter);


// Escapes a value for interpolation into a double-quoted HTML attribute
const escapeAttr = value => {

    if (value == null) return '';
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

};


// ----------------------------------------------------------------------- //
// indicator card rendering
// ----------------------------------------------------------------------- //

// Returns one indicator's accordion HTML — header button plus its collapse panel
const buildIndicatorCard = (row, neighborhoodName, accordionParentId) => {

    // ----- resolve ids, value, and units ----- //

    const accId = nextAccordionId();
    const headingId = accId + '-h';
    const collapseId = accId + '-c';

    // Preserve dash placeholder when the row has no direct neighborhood value
    const value =
        row.data_value_geo_entity !== null && row.data_value_geo_entity !== undefined
            ? row.data_value_geo_entity
            : '–';

    // Build a compact units label from optional type and unit fields
    const unitParts = [];
    if (row.measurement_type) unitParts.push(row.measurement_type);
    if (row.units) unitParts.push(row.units);
    const units = unitParts.join(' ').trim();

    // ----- tertile pill ----- //

    // Tertile pill for the header row (production uses .worse/.better/.middle classes)
    const pillLabel = getTertileLabel(row.data_value_rank, row.rankReverse);
    const pillClass = getTertilePillClass(row.data_value_rank, row.rankReverse);
    let pillHTML = '';

    if (pillLabel && pillClass) {
        pillHTML = '<span class="' + pillClass + '">' + pillLabel + '</span>';
    }

    // ----- header HTML ----- //

    // Every id and data-* interpolation below goes through escapeAttr. The generated
    // ids cannot contain a quote, but routing them all one way keeps the rule
    // checkable by eye rather than per-value
    const headerHTML =
        '<div class="card-header border-top" id="' + escapeAttr(headingId) + '">' +
            '<h2 class="mb-0">' +
                '<button class="btn btn-block btn-sm text-left" type="button" ' +
                    'data-toggle="collapse" data-target="#' + escapeAttr(collapseId) + '" ' +
                    'aria-expanded="false" aria-controls="' + escapeAttr(collapseId) + '">' +
                    '<div class="row no-gutters d-print-none" style="width:100%">' +
                        '<div class="col-7">' +
                            '<span class="font-weight-bold fs-md">' + (row.indicator_short_name || '') + '</span><br>' +
                            '<span class="fs-sm font-weight-normal">' + (row.indicator_long_name || '') + '</span>' +
                        '</div>' +
                        '<div class="col-3 pl-1">' +
                            '<span class="font-weight-bold fs-lg">' + value + '</span><br>' +
                            '<span class="fs-xs font-weight-normal">' + units + '</span>' +
                        '</div>' +
                        '<div class="col-2">' +
                            '<div class="float-right mt-1">' + pillHTML + '</div>' +
                        '</div>' +
                    '</div>' +
                '</button>' +
            '</h2>' +
        '</div>';

    // ----- comparison blocks ----- //

    // Some indicators do not have comparative rank metadata
    const hasRank = row.data_value_rank != null;

    // Comparison blocks rely on the unmodified values for direction and text
    const boroComp = getComparison(
        row.unmodified_data_value_geo_entity,
        row.data_value_boro,
        row.rankReverse
    );

    const cityComp = getComparison(
        row.unmodified_data_value_geo_entity,
        row.data_value_nyc,
        row.rankReverse
    );

    const boroName = row.borough_name || 'Borough';
    const boroVal = row.data_value_boro != null ? row.data_value_boro : '';
    const cityVal = row.data_value_nyc != null ? row.data_value_nyc : '';

    let unitSuffix = '';

    // Use percent suffix for percentage-like metrics, otherwise append units
    if (row.measurement_type && row.measurement_type.toLowerCase().indexOf('ercent') !== -1) {
        unitSuffix = '%';
    } else if (row.units) {
        unitSuffix = ' ' + row.units;
    }

    const tertileInlineHTML = getTertileInlineLabel(row.data_value_rank, row.rankReverse);

    // Hide comparison copy when rank-derived context is unavailable
    const hideClass = hasRank ? '' : ' d-none';

    const comparisonsHTML =
        '<div class="col-md-5 h-100 p-1' + hideClass + '">' +
            '<p class="fs-rg">' + (row.indicator_short_name || '') + ' in <strong>' + neighborhoodName + '</strong>:</p>' +
            '<div class="fs-md">' +
                (tertileInlineHTML
                    ? '<p>' + tertileInlineHTML + '</p>'
                    : '') +
                (boroComp.text
                    ? '<p><span class="' + boroComp.cssClass + '">' + boroComp.text + '</span> the <strong>' + boroName + ' average</strong>' +
                    '<br><span class="fs-sm pl-3">(' + boroVal + unitSuffix + ')</span></p>'
                    : '') +
                (cityComp.text
                    ? '<p><span class="' + cityComp.cssClass + '">' + cityComp.text + '</span> the <strong>Citywide average</strong>' +
                    '<br><span class="fs-sm pl-3">(' + cityVal + unitSuffix + ')</span></p>'
                    : '') +
            '</div>' +
        '</div>';

    // ----- detail panel HTML ----- //

    // Keep data-* attributes on the collapse panel for lazy chart rendering.
    // The trailing `|| ''` on the two row-derived values is load-bearing: escapeAttr
    // only blanks null and undefined, so without it a falsy-but-present value would
    // render as "0" or "false" and defeat onAccordionExpand's `|| currentGeocode`
    // fallback and its !indicatorName guard
    const detailHTML =
        '<div id="' + escapeAttr(collapseId) + '" class="collapse border-bottom" ' +
            'aria-labelledby="' + escapeAttr(headingId) + '" ' +
            'data-parent="#' + escapeAttr(accordionParentId) + '" ' +
            'data-indicator-name="' + escapeAttr(row.indicator_data_name || '') + '" ' +
            'data-legend-label="' + escapeAttr(units) + '" ' +
            'data-geocode="' + escapeAttr(row.geo_join_id || row.geo_entity_id || '') + '">' +
            '<div class="card-body card-body-no-top">' +
                '<div class="row no-gutters fs-sm">' +
                    '<div class="col-12">' +
                        '<p class="fs-md mt-1 mb-2">' + (row.indicator_description || '') + '</p>' +
                    '</div>' +
                    '<div class="col-md-7 border-right h-100">' +
                        '<div class="nr-map-container" id="map-' + escapeAttr(accId) + '" style="width:100%;min-height:350px;">' +
                            '<p class="text-muted small">Loading...</p>' +
                        '</div>' +
                    '</div>' +
                    comparisonsHTML +
                '</div>' +
                '<div class="row no-gutters">' +
                    '<div class="col-7">' +
                        '<p class="fs-xs"><strong>Source:</strong> ' + (row.data_source_list || '') + '</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    return headerHTML + detailHTML;

};
