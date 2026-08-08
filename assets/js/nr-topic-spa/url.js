// ======================================================================= //
// url.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// neighborhood persistence
// ----------------------------------------------------------------------- //

// Reverses spaConfig.neighborhoodMap, which is keyed slug -> display name
const slugForNeighborhood = name =>
    Object.keys(spaConfig.neighborhoodMap).find(k => spaConfig.neighborhoodMap[k] === name);


// Resolves the neighborhood for this page load
const getNeighborhoodFromURL = () => {

    // Every report page is generated for one neighborhood and says so in its config, so
    // this answers without parsing the path. Two fallbacks used to follow — a path scan
    // for a neighborhood slug, and a sessionStorage hand-off written by 404.html and the
    // landing page. Both existed because the SPA lived at <topic>/ and had to be told
    // which neighborhood to draw; it is now served at <nbhd>/<topic>/, so the server
    // always knows and neither fallback had a writer left
    debugLog('getNeighborhoodFromURL: enter:', spaConfig.neighborhood);

    return spaConfig.neighborhood;

};


// Rewrites the address bar to carry the neighborhood, making the current view shareable
const setNeighborhoodInURL = name => {

    debugLog('setNeighborhoodInURL: enter:', name);

    // ----- resolve the slug for this neighborhood ----- //

    const slug = slugForNeighborhood(name);

    if (!slug) {
        return;
    }

    // ----- rewrite the segment before the topic ----- //

    // The URL this produces has to be a page that exists, because the user can reload it:
    // <nbhd>/<topic>/, the shape the content adapter generates. Writing the neighborhood
    // *after* the topic — which is what this did while the SPA lived at the topic URL —
    // now yields a three-deep path with nothing behind it.
    // Rebuilding from the topic's index rather than appending preserves any site path
    // prefix (e.g. /dev-prod/) and is idempotent when a slug is already in place
    const pathParts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    const topicIdx = pathParts.findIndex(p => p === spaConfig.topicSlug);

    // Index 2 is the shallowest a report page can sit at — neighborhood-reports/<nbhd>/<topic>
    // with no site path prefix. Anything shallower is not a path this should be rewriting
    if (topicIdx < 2) {
        return;
    }

    const newPath = '/' + pathParts.slice(0, topicIdx - 1).concat(slug, spaConfig.topicSlug).join('/') + '/';

    // replaceState rather than a navigation: the SPA has already rendered this
    // neighborhood, so the path change is cosmetic — it makes the URL shareable and
    // bookmarkable without a reload or a server request
    history.replaceState(null, '', newPath);

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
