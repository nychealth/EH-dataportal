// ======================================================================= //
// demographics.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// demographics sidebar
// ----------------------------------------------------------------------- //

// Renders a rate the way every sidebar metric except population is presented
const percent = value => Number(value).toFixed(1) + '%';


// The sidebar's metrics in display order; `format` receives the raw uhflist value.
// One table so the clear pass and the fill pass cannot drift out of agreement
const DEMOGRAPHIC_FIELDS = [
    { id: 'nr-pop',   field: 'TotalPopulation',            format: value => Number(value).toLocaleString() },
    { id: 'nr-old',   field: 'PercentOver65',              format: percent },
    { id: 'nr-young', field: 'PercentUnder18',             format: percent },
    { id: 'nr-pov',   field: 'PovertyPercent',             format: percent },
    { id: 'nr-grad',  field: 'PercentGraduatedHighSchool', format: percent },
    { id: 'nr-eng',   field: 'PercentLimitedEnglish',      format: percent },
    { id: 'nr-own',   field: 'PercentOwnerOccupied',       format: percent },
    { id: 'nr-rent',  field: 'PercentRentBurdened',        format: percent }
];


// Blanks every sidebar metric and hides both panels, for when no neighborhood resolves
const clearDemographicsSidebar = () => {

    // Clear each field explicitly so stale values do not persist between selections
    DEMOGRAPHIC_FIELDS.forEach(metric => {
        const node = nrById(metric.id);
        if (node) node.innerHTML = '';
    });

    const zipList = nrById('nr-zip-list');
    if (zipList) zipList.textContent = '';

    const demoPanel = nrById('nr-demographics');
    if (demoPanel) demoPanel.style.display = 'none';

    const zipPanel = nrById('nr-zip-codes');
    if (zipPanel) zipPanel.style.display = 'none';

};


// Fills the sidebar from the uhflist row matching geocode, clearing it if there is none
const renderDemographics = geocode => {

    debugLog('renderDemographics: enter:', geocode);

    if (typeof neighborhoods === 'undefined' || isBlank(geocode)) {
        debugLog('renderDemographics: branch-clear-missing-neighborhoods-or-geocode');
        clearDemographicsSidebar();
        return;
    }

    const here = neighborhoods.filter(n => n.UHF_id == geocode);

    if (!here.length) {
        debugLog('renderDemographics: branch-clear-no-match:', geocode);
        clearDemographicsSidebar();
        return;
    }

    const d = here[0];

    // Each target node is optional: the sidebar markup varies by layout width
    DEMOGRAPHIC_FIELDS.forEach(metric => {
        const node = nrById(metric.id);
        if (node) node.innerHTML = metric.format(d[metric.field]);
    });

    const demoPanel = nrById('nr-demographics');
    if (demoPanel) demoPanel.style.display = '';

    const zipList = nrById('nr-zip-list');
    if (zipList) zipList.textContent = d.Zipcodes || '';

    const zipPanel = nrById('nr-zip-codes');
    if (zipPanel && d.Zipcodes) zipPanel.style.display = '';

};
