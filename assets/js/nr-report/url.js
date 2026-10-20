// ======================================================================= //
// url.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// neighborhood persistence
// ----------------------------------------------------------------------- //

// The URL slug for a neighborhood's display name. Read off the `neighborhoods` global, which
// lib-uhflist emits from data/globals/uhflist.json, the same rows the content adapter
// generates the report pages from, so the slug is the one the page's own URL carries
const slugForNeighborhood = name => {

    const entry = neighborhoods.find(n => n.UHF_name === name);

    return entry ? entry.page_name : undefined;

};


// Resolves the neighborhood for this page load
const getPageNeighborhood = () => {

    // Every report page is generated for one neighborhood and says so in its config, so
    // this answers without parsing the path. Two fallbacks used to follow — a path scan
    // for a neighborhood slug, and a sessionStorage hand-off written by 404.html and the
    // landing page. Both existed because the report page lived at <topic>/ and had to be told
    // which neighborhood to draw; it is now served at <nbhd>/<topic>/, so the server
    // always knows and neither fallback had a writer left
    debugLog('getPageNeighborhood: enter:', reportConfig.neighborhood);

    return reportConfig.neighborhood;

};


// Rewrites the address bar to carry the neighborhood, making the current view shareable.
// historyMode: 'replace' on first render, 'push' on a switch, 'none' on a popstate re-render

const setNeighborhoodInURL = (name, historyMode) => {

    debugLog('setNeighborhoodInURL: enter:', { name, historyMode });

    // The browser has already moved the address bar to the entry being re-rendered
    if (historyMode === 'none') {
        return;
    }

    // ----- resolve the slug for this neighborhood ----- //

    const slug = slugForNeighborhood(name);

    if (!slug) {
        return;
    }

    // ----- rewrite the segment before the topic ----- //

    // The URL this produces has to be a page that exists, because the user can reload it:
    // <nbhd>/<topic>/, the shape the content adapter generates. Writing the neighborhood
    // *after* the topic — which is what this did while the report page lived at the topic URL —
    // now yields a three-deep path with nothing behind it.
    // Rebuilding from the topic's index rather than appending preserves any site path
    // prefix (e.g. /dev-prod/) and is idempotent when a slug is already in place
    const pathParts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    const topicIdx = pathParts.findIndex(p => p === reportConfig.topicSlug);

    // Index 2 is the shallowest a report page can sit at — neighborhood-reports/<nbhd>/<topic>
    // with no site path prefix. Anything shallower is not a path this should be rewriting
    if (topicIdx < 2) {
        return;
    }

    const newPath = '/' + pathParts.slice(0, topicIdx - 1).concat(slug, reportConfig.topicSlug).join('/') + '/';

    // ----- write the history entry ----- //

    // A history call rather than a navigation: the report page has already rendered this
    // neighborhood, so the path change makes the URL shareable and bookmarkable without a
    // reload or a server request. The query string and hash are carried over, since a switch
    // changes the neighborhood and nothing else. The state is what the popstate handler
    // (app.js) re-renders from, so the first render seeds it on the page's own entry too,
    // or Back to that entry would have nothing to restore

    const state = { neighborhood: name };
    const url = newPath + window.location.search + window.location.hash;

    // Clicking the neighborhood already shown leaves the path unchanged and adds no entry

    if (historyMode === 'push' && newPath !== window.location.pathname) {
        history.pushState(state, '', url);
    } else {
        history.replaceState(state, '', url);
    }

};


// Points the page's head metadata at the neighborhood an in-place switch now shows.
//
// seo.html renders these for the neighborhood the page was generated for. Crawlers read the
// served HTML and are unaffected; what reads them after a switch is a share sheet or a
// bookmarking tool, which would otherwise describe the neighborhood the reader left

const updateHeadMetadata = (neighborhoodName, previousNeighborhood) => {

    debugLog('updateHeadMetadata: enter:', { neighborhoodName, previousNeighborhood });

    // ----- URL-bearing tags ----- //

    // Resolved against the served canonical rather than location.origin, so the host the
    // build wrote (the site's baseURL) is kept

    const canonical = document.querySelector('link[rel="canonical"]');

    if (canonical) {
        const absolute = new URL(window.location.pathname, canonical.href).href;
        canonical.href = absolute;
        document.querySelectorAll('meta[property="og:url"]').forEach(m => { m.content = absolute; });
    }

    // ----- titles ----- //

    document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]')
        .forEach(m => { m.content = document.title; });

    // ----- descriptions ----- //

    // All three read "<report> data profile for the <neighborhood> neighborhood of NYC.", so
    // the old name is swapped for the new one and the rest of the sentence kept
    
    document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]')
        .forEach(m => { m.content = m.content.split(previousNeighborhood).join(neighborhoodName); });

};


// Repoints every topic tab at the current neighborhood's copy of that topic
const updateTopicLinks = neighborhoodName => {

    debugLog('updateTopicLinks: enter:', neighborhoodName);

    // The template renders these hrefs for the neighborhood the page was generated for.
    // An in-place switch leaves them pointing at the old one, so each href's neighborhood
    // segment is rewritten here — the same swap setNeighborhoodInURL makes to the address
    // bar, applied to the five links. No sessionStorage hand-off is involved: every one of
    // these URLs is now a page that exists
    const slug = slugForNeighborhood(neighborhoodName);

    if (!slug) {
        return;
    }

    document.querySelectorAll('.nr-topic-link').forEach(a => {

        const parts = new URL(a.href, window.location.origin).pathname
            .replace(/\/$/, '').split('/').filter(Boolean);

        // Last segment is the destination topic, the one before it the neighborhood
        if (parts.length < 2) {
            return;
        }

        parts[parts.length - 2] = slug;
        a.href = '/' + parts.join('/') + '/';

    });

};


// Repoints the breadcrumb's neighborhood item at the current neighborhood
const updateNeighborhoodCrumb = neighborhoodName => {

    debugLog('updateNeighborhoodCrumb: enter:', neighborhoodName);

    // Same staleness as the topic tabs: the template renders this crumb for the
    // neighborhood the page was generated for, so after an in-place switch it named
    // and linked the old one while the h1 and address bar named the new one
    const slug = slugForNeighborhood(neighborhoodName);
    const crumb = document.querySelector('.nr-breadcrumb-neighborhood');

    if (!slug || !crumb) {
        return;
    }

    // Its href is the neighborhood index, neighborhood-reports/<nbhd>/, so the
    // neighborhood is the last segment. Rewriting that one keeps any site path prefix
    const parts = new URL(crumb.href, window.location.origin).pathname
        .replace(/\/$/, '').split('/').filter(Boolean);

    parts[parts.length - 1] = slug;
    crumb.href = '/' + parts.join('/') + '/';
    crumb.textContent = neighborhoodName;

};
