// ======================================================================= //
// url.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// district persistence
// ----------------------------------------------------------------------- //

// Reverses reportConfig.districtMap, which is keyed slug -> display name
const slugForDistrict = name =>
    Object.keys(reportConfig.districtMap).find(k => reportConfig.districtMap[k] === name);


// Resolves the community district for this page load
const getDistrictFromURL = () => {

    // Every report page is generated for one district and says so in its config, so this
    // answers without parsing the path. The NR original records two fallbacks it had
    // already retired for the same reason — a path scan and a sessionStorage hand-off —
    // and neither was ever built here
    debugLog('getDistrictFromURL: enter:', reportConfig.communityDistrict);

    return reportConfig.communityDistrict;

};


// Rewrites the address bar to carry the district, making the current view shareable
const setDistrictInURL = name => {

    debugLog('setDistrictInURL: enter:', name);

    // ----- resolve the slug for this district ----- //

    const slug = slugForDistrict(name);

    if (!slug) {
        return;
    }

    // ----- rewrite the segment before the category ----- //

    // The URL this produces has to be a page that exists, because the user can reload it:
    // /ndhr/<district>/<category>/, the shape the content adapter generates.
    // Rebuilding from the category segment rather than appending preserves any site path
    // prefix (e.g. /dev-prod/) and is idempotent when a slug is already in place
    const pathParts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    const categoryIdx = pathParts.findIndex(p => p === reportConfig.categorySlug);

    // Index 2 is the shallowest a report page can sit at — ndhr/<district>/<category>
    // with no site path prefix. Anything shallower is not a path this should be rewriting
    if (categoryIdx < 2) {
        return;
    }

    const newPath = '/' + pathParts.slice(0, categoryIdx - 1).concat(slug, reportConfig.categorySlug).join('/') + '/';

    // replaceState rather than a navigation: the report page has already rendered this
    // district, so the path change is cosmetic — it makes the URL shareable and
    // bookmarkable without a reload or a server request
    history.replaceState(null, '', newPath);

};


// Repoints every category tab at the current district's copy of that category
const updateCategoryLinks = districtName => {

    debugLog('updateCategoryLinks: enter:', districtName);

    // The template renders these hrefs for the district the page was generated for.
    // An in-place switch leaves them pointing at the old one, so each href's district
    // segment is rewritten here — the same swap setDistrictInURL makes to the address bar,
    // applied to the five links
    const slug = slugForDistrict(districtName);

    if (!slug) {
        return;
    }

    document.querySelectorAll('.ndhr-category-link').forEach(a => {

        const parts = new URL(a.href, window.location.origin).pathname
            .replace(/\/$/, '').split('/').filter(Boolean);

        // Last segment is the destination category, the one before it the district
        if (parts.length < 2) {
            return;
        }

        parts[parts.length - 2] = slug;
        a.href = '/' + parts.join('/') + '/';

    });

};
