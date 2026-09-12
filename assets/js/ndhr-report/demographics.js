// ======================================================================= //
// demographics.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// demographics sidebar
// ----------------------------------------------------------------------- //

// Renders a rate the way every sidebar metric is presented here.
//
// NR also formats a raw population with toLocaleString; there is no such row on this
// sidebar, so there is no second formatter. TotalPopulation, PercentOver65 and
// PercentUnder18 are null on all 59 cdlist rows — EHDP-data publishes no such indicator
// at community district geography — and the template omits those three <tr> rather than
// rendering three permanently blank cells
const percent = value => Number(value).toFixed(1) + '%';


// The sidebar's metrics in display order; `format` receives the raw cdlist value.
// One table so the clear pass and the fill pass cannot drift out of agreement
const DEMOGRAPHIC_FIELDS = [
    { id: 'ndhr-pov',   field: 'PovertyPercent',             format: percent },
    { id: 'ndhr-grad',  field: 'PercentGraduatedHighSchool',  format: percent },
    { id: 'ndhr-eng',   field: 'PercentLimitedEnglish',       format: percent },
    { id: 'ndhr-own',   field: 'PercentOwnerOccupied',        format: percent },
    { id: 'ndhr-rent',  field: 'PercentRentBurdened',         format: percent }
];


// Blanks every sidebar metric and hides the panel, for when no district resolves
const clearDemographicsSidebar = () => {

    // Clear each field explicitly so stale values do not persist between selections
    DEMOGRAPHIC_FIELDS.forEach(metric => {
        const node = ndhrById(metric.id);
        if (node) node.innerHTML = '';
    });

    const note = ndhrById('ndhr-demographics-note');
    if (note) note.textContent = '';

    const demoPanel = ndhrById('ndhr-demographics');
    if (demoPanel) demoPanel.style.display = 'none';

};


// ----------------------------------------------------------------------- //
// shared-area labelling
// ----------------------------------------------------------------------- //

// Names the other districts whose ACS values are identical to this one's, or ''.
//
// The sidebar is CD-level ACS, and the survey does not publish every community district
// separately: four groups of two districts share one set of figures, so on those eight
// pages every number in this panel is the pair's, not the district's. The groups are
// exactly the districts sharing a PUMA2010_id, which is why cdlist.json emits that column
// despite the report reading PUMA2020_id for its indicator rows
// `[plan "Task 2 as built": 59 rows carry 55 distinct measurements]`.
//
// Labelling the indicator rows and not this panel would be worse than labelling neither:
// it would tell the reader that shared values are marked, which makes an unmarked shared
// sidebar read as a bug rather than as the same situation
const sharedDemographicsPartners = districtRow => {

    if (!districtRow || isBlank(districtRow.PUMA2010_id)) return '';

    if (typeof communityDistricts === 'undefined') return '';

    const partners = communityDistricts
        .filter(d => d.PUMA2010_id === districtRow.PUMA2010_id && d.CD_id !== districtRow.CD_id)
        .map(d => d.CD_name);

    return partners.join(' and ');

};


// Fills the sidebar from the cdlist row matching cdId, clearing it if there is none
const renderDemographics = cdId => {

    debugLog('renderDemographics: enter:', cdId);

    if (typeof communityDistricts === 'undefined' || isBlank(cdId)) {
        debugLog('renderDemographics: branch-clear-missing-districts-or-id');
        clearDemographicsSidebar();
        return;
    }

    const d = districtRowById(cdId);

    if (!d) {
        debugLog('renderDemographics: branch-clear-no-match:', cdId);
        clearDemographicsSidebar();
        return;
    }

    // Each target node is optional: the sidebar markup varies by layout width
    DEMOGRAPHIC_FIELDS.forEach(metric => {
        const node = ndhrById(metric.id);
        if (node) node.innerHTML = metric.format(d[metric.field]);
    });

    // ----- shared-area note ----- //

    const note = ndhrById('ndhr-demographics-note');
    const partners = sharedDemographicsPartners(d);

    if (note) {
        note.textContent = partners
            ? 'These figures cover ' + d.CD_name + ' together with ' + partners +
              ', which the American Community Survey reports as one area.'
            : '';
    }

    const demoPanel = ndhrById('ndhr-demographics');
    if (demoPanel) demoPanel.style.display = '';

};
