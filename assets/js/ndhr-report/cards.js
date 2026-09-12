// ======================================================================= //
// cards.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// accordion ids and escaping
// ----------------------------------------------------------------------- //

// Cards are numbered in one sequence, in render order. The only cross-file write that
// does NOT route through global.js: renderAll() in report.js resets this to 0 before
// rebuilding the page, so ids restart at ndhr-acc-1 for each district instead of climbing
// forever. The write is deliberate and is what the shared top-level scope buys — making
// this cards.js-local would silently break id stability across district switches.
// WRITE: cards (increment), report (reset)  READ: cards
let accordionCounter = 0;

// Generates the unique id that pairs a collapse control with its panel
const nextAccordionId = () => 'ndhr-acc-' + (++accordionCounter);


// Escapes a value for interpolation into a double-quoted HTML attribute
const escapeAttr = value => {

    if (value == null) return '';
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

};


// ----------------------------------------------------------------------- //
// geography labelling
// ----------------------------------------------------------------------- //

// The short tag shown beside a value read at a geography other than this page's.
// Empty for a CD row, which is the ordinary case and needs no tag
const GEOTYPE_TAGS = {
    CDTA2020: 'CDTA area',
    PUMA2020: 'PUMA area'
};

// The sentence the expanded panel carries for the same rows.
//
// Three of the eighteen measures are read at PUMA2020 and two at CDTA2020 (plan
// DECIDED-10), and DECIDED-2 records that those polygons are not identical to the
// community district. A number presented with no qualifier on a page titled with one
// district's name asserts it is that district's, which for these five rows it is not
const GEOTYPE_SENTENCES = {
    CDTA2020: 'This value is reported for the Community District Tabulation Area that ' +
        'approximates this community district, not for the district itself.',
    PUMA2020: 'This value is reported for the Public Use Microdata Area covering this ' +
        'community district. A PUMA can span more than one district, so neighboring ' +
        'districts may show the same number.'
};


// The tag for a row's geography, or '' when it is read at the page's own
const geotypeTag = row => (row.geotype && row.geotype !== 'CD') ? (GEOTYPE_TAGS[row.geotype] || row.geotype) : '';


// The sentence for a row's geography, naming the area where GeoLookup gave one
const geotypeSentence = row => {

    if (!row.geotype || row.geotype === 'CD') return '';

    const sentence = GEOTYPE_SENTENCES[row.geotype];

    if (!sentence) return '';

    return row.geo_entity_name
        ? sentence.replace('.', ' (' + row.geo_entity_name + ').')
        : sentence;

};


// ----------------------------------------------------------------------- //
// data explorer link
// ----------------------------------------------------------------------- //

// Returns the data-explorer URL for an indicator, or '' when it has no topic there
const getDataExplorerUrl = indicatorID => {

    if (!indicatorTopicSlugs || indicatorID == null) return '';

    // Guard the interpolation into ?id=: the ids arrive from EHDP-data metadata
    const id = Number(indicatorID);
    if (!Number.isFinite(id)) return '';

    const slug = indicatorTopicSlugs[id];

    return slug ? reportConfig.dataExplorerUrl + slug + '/?id=' + id : '';

};


// ----------------------------------------------------------------------- //
// indicator card rendering
// ----------------------------------------------------------------------- //

// Returns one indicator's accordion HTML — header button plus its collapse panel
const buildIndicatorCard = (row, districtName) => {

    // ----- resolve ids, value, and units ----- //

    const accId = nextAccordionId();
    const headingId = accId + '-h';
    const collapseId = accId + '-c';

    // Preserve dash placeholder when the row has no direct district value. buildRows
    // returns a row with a null value rather than dropping it when a measure publishes
    // nothing at this area, so this is an ordinary state and not an error path
    const value =
        row.data_value_geo_entity !== null && row.data_value_geo_entity !== undefined
            ? row.data_value_geo_entity
            : '–';

    // Build a compact units label from optional type and unit fields. `units` comes from
    // metadata's DisplayType, which is empty for every Percent measure
    const unitParts = [];
    if (row.measurement_type) unitParts.push(row.measurement_type);
    if (row.units) unitParts.push(row.units);
    const units = unitParts.join(' ').trim();

    const geoTag = geotypeTag(row);
    const geoSentence = geotypeSentence(row);

    // ----- tertile pill ----- //

    const pillLabel = getTertileLabel(row.data_value_rank, row.rankReverse);
    const pillClass = getTertilePillClass(row.data_value_rank);
    const pillSentence = getTertileSentence(row.data_value_rank, row.rankReverse);
    let pillHTML = '';

    // The pill reads the same two words whichever way the comparison went — only its
    // background colour separates a good "Higher" from a bad one. So the pixels get a glyph
    // (theme.scss) and the tree gets the sentence, and the pill itself goes aria-hidden so
    // the two do not both land in the accordion button's name.
    // Rank 2 emits no pill and still gets the sentence — showing nothing was the third state,
    // and the print rendition already spells that one out
    if (pillLabel && pillClass) {
        pillHTML = '<span class="' + pillClass + '" aria-hidden="true">' + pillLabel + '</span>';
    }

    if (pillSentence) {
        pillHTML += '<span class="sr-only">' + pillSentence + '</span>';
    }

    // The geography tag goes in the accessible name too, not only in the panel: a reader
    // who never expands the row would otherwise get the number with no qualifier
    const geoTagHTML = geoTag
        ? '<br><span class="fs-xs font-weight-normal text-muted">' + geoTag + '</span>'
        : '';

    // ----- print rendition of the header row ----- //

    // The screen row is d-print-none, so print needs its own copy of the same three facts.
    // It is a second rendition rather than a print stylesheet over the first because the
    // content genuinely differs: the pill is blank for rank 2 and shows a bare
    // "Higher"/"Lower" otherwise, where print carries a full sentence. Both are built from
    // the locals above, so the two cannot drift.
    // Plain divs at 50/25/25, not grid columns: .print-only resolves to display:flex
    const printRowHTML =
        '<div class="col-12 print-only" style="flex-direction:row; width:100%;">' +
            '<div style="width:50%;" class="border-right pl-1">' +
                '<span class="font-weight-bold fs-md">' + (row.indicator_short_name || '') + '</span><br>' +
                '<span class="fs-sm font-weight-normal">' + (row.indicator_long_name || '') + '</span>' +
            '</div>' +
            '<div style="width:25%;" class="border-right pl-1">' +
                '<span class="font-weight-bold fs-md">' + value + '</span><br>' +
                '<span class="fs-xs font-weight-normal">' + units + '</span>' +
                geoTagHTML +
            '</div>' +
            // font-weight-normal because the accordion button is bold and the column
            // inherits it, which would leave nothing for the .comp-* bold to pick out
            '<div style="width:25%;" class="pl-1 fs-sm font-weight-normal">' +
                getTertileInlineLabel(row.data_value_rank, row.rankReverse) +
            '</div>' +
        '</div>';

    // ----- header HTML ----- //

    // Every id and data-* interpolation below goes through escapeAttr. The generated ids
    // cannot contain a quote, but routing them all one way keeps the rule checkable by eye
    const headerHTML =
        '<div class="card-header border-top" id="' + escapeAttr(headingId) + '">' +
            // h3: one level below the section h2 in ndhr-report.html. As an h2 every
            // indicator read as closing its section and opening a sibling of the page title
            '<h3 class="mb-0">' +
                '<button class="btn btn-block btn-sm text-left" type="button" ' +
                    'data-toggle="collapse" data-target="#' + escapeAttr(collapseId) + '" ' +
                    'aria-expanded="false" aria-controls="' + escapeAttr(collapseId) + '">' +
                    '<div class="row no-gutters d-print-none" style="width:100%">' +
                        '<div class="col-7">' +
                            '<span class="font-weight-bold fs-md">' + (row.indicator_short_name || '') + '</span><br>' +
                            '<span class="fs-sm font-weight-normal">' + (row.indicator_long_name || '') + '</span>' +
                        '</div>' +
                        '<div class="col-3 pl-1">' +
                            '<span class="font-weight-bold fs-md">' + value + '</span><br>' +
                            '<span class="fs-sm font-weight-normal">' + units + '</span>' +
                            geoTagHTML +
                        '</div>' +
                        '<div class="col-2">' +
                            '<div class="float-right mt-1">' + pillHTML + '</div>' +
                        '</div>' +
                    '</div>' +
                    printRowHTML +
                '</button>' +
            '</h3>' +
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

    // The borough comes from the page's own config, not from the row: buildRows emits no
    // borough_name field — it resolves the borough to read a comparison value, and returns
    // that value rather than the name. Every district on a page belongs to one borough and
    // the layout already knows which
    const boroName = reportConfig.borough || 'Borough';
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

    // ----- data explorer link ----- //

    // Omitted entirely when the indicator is in no data-explorer topic. The visible text
    // stays "Full dataset" on every card, so the destination is carried by an .sr-only
    // suffix — 18-odd links reading the same two words is 2.4.4, and putting the name after
    // rather than inside keeps the visible label a prefix of the accessible one (2.5.3).
    // No d-print-none: @media print hides the panel this sits in
    const deUrl = getDataExplorerUrl(row.IndicatorID);

    const dataExplorerLinkHTML = deUrl
        ? '<div class="col-5">' +
              '<p class="float-right">' +
                  '<a href="' + escapeAttr(deUrl) + '" class="ml-1">' +
                      '<i class="fas fa-chart-line mr-1" aria-hidden="true"></i>Full dataset' +
                      '<span class="sr-only"> for ' + (row.indicator_short_name || '') + '</span>' +
                  '</a>' +
              '</p>' +
          '</div>'
        : '';

    // Hide comparison copy when rank-derived context is unavailable
    const hideClass = hasRank ? '' : ' d-none';

    const comparisonsHTML =
        '<div class="col-md-5 h-100 p-1' + hideClass + '">' +
            '<p class="fs-rg">' + (row.indicator_short_name || '') + ' in <strong>' + districtName + '</strong>:</p>' +
            '<div class="fs-md">' +
                (tertileInlineHTML
                    ? '<p>' + tertileInlineHTML + '</p>'
                    : '') +
                (boroComp.word
                    ? '<p><span class="' + boroComp.cssClass + '">' + boroComp.word + '</span> ' + boroComp.preposition + ' the <strong>' + boroName + ' average</strong>' +
                    '<br><span class="fs-sm pl-3">(' + boroVal + unitSuffix + ')</span></p>'
                    : '') +
                (cityComp.word
                    ? '<p><span class="' + cityComp.cssClass + '">' + cityComp.word + '</span> ' + cityComp.preposition + ' the <strong>Citywide average</strong>' +
                    '<br><span class="fs-sm pl-3">(' + cityVal + unitSuffix + ')</span></p>'
                    : '') +
            '</div>' +
        '</div>';

    // The geography sentence sits with the description rather than with the value, because
    // it qualifies the whole row — the rank and both comparisons are computed among areas
    // of that same geography, not among the 59 community districts
    const geoNoteHTML = geoSentence
        ? '<p class="fs-sm text-muted mb-2"><em>' + geoSentence + '</em></p>'
        : '';

    // ----- detail panel HTML ----- //

    // Keep data-* attributes on the collapse panel for lazy chart rendering.
    // data-measure-id rather than NR's data-indicator-name: the chart series here is keyed
    // by MeasureID, which is what buildRows and the content YAML both key on.
    // role="region" so the panels are reachable by landmark navigation, and aria-label
    // rather than aria-labelledby because the header it would point at is the whole row —
    // name, value, units and pill run together into one sentence. A region wants a name.
    const detailHTML =
        '<div id="' + escapeAttr(collapseId) + '" class="collapse border-bottom" ' +
            'role="region" ' +
            'aria-label="' + escapeAttr(row.indicator_short_name || 'Indicator detail') + '" ' +
            'data-measure-id="' + escapeAttr(row.MeasureID) + '" ' +
            'data-indicator-label="' + escapeAttr(row.indicator_short_name || '') + '" ' +
            'data-legend-label="' + escapeAttr(units) + '" ' +
            'data-geotype="' + escapeAttr(row.geotype || '') + '" ' +
            'data-geocode="' + escapeAttr(row.geo_entity_id || '') + '">' +
            '<div class="card-body card-body-no-top">' +
                '<div class="row no-gutters fs-sm">' +
                    '<div class="col-12">' +
                        '<p class="fs-md mt-1 mb-2">' + (row.indicator_description || '') + '</p>' +
                        geoNoteHTML +
                    '</div>' +
                    '<div class="col-md-7 border-right h-100">' +
                        '<div class="ndhr-map-container" id="map-' + escapeAttr(accId) + '" style="width:100%;min-height:350px;">' +
                            '<p class="text-muted small">Loading...</p>' +
                        '</div>' +
                    '</div>' +
                    comparisonsHTML +
                '</div>' +
                '<div class="row no-gutters">' +
                    '<div class="col-7">' +
                        '<p class="fs-xs"><strong>Source:</strong> ' + (row.data_source_list || '') + '</p>' +
                    '</div>' +
                    dataExplorerLinkHTML +
                '</div>' +
            '</div>' +
        '</div>';

    return headerHTML + detailHTML;

};
