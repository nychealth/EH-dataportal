// ======================================================================= //
// url.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// neighborhood persistence
// ----------------------------------------------------------------------- //

// Shared with 404.html, neighborhood-reports/section.html, nr-output/section.html,
// partials/nr-leaflet.html, and scripts/nr-characterization.mjs, which each write the
// key directly — renaming it here alone breaks the bridge
const PENDING_NEIGHBORHOOD_KEY = 'nr_pending_neighborhood';


// Reverses spaConfig.neighborhoodMap, which is keyed slug -> display name
const slugForNeighborhood = name =>
    Object.keys(spaConfig.neighborhoodMap).find(k => spaConfig.neighborhoodMap[k] === name);


// Resolves the neighborhood for this page load: the server's answer first, then the path,
// then the bridge
const getNeighborhoodFromURL = () => {

    // ----- step 0: the neighborhood the page was generated for ----- //

    // Every report page is now generated for one neighborhood and says so in its config,
    // so this answers on a first load without parsing anything. Steps 1 and 2 are kept as
    // the fallback for a page load that reaches this layout without one — they are what
    // still reads the sessionStorage hand-offs in 404.html and the landing page
    if (spaConfig.neighborhood) {
        debugLog('getNeighborhoodFromURL: branch-server-supplied:', spaConfig.neighborhood);
        return spaConfig.neighborhood;
    }

    // ----- step 1: neighborhood slug in the path ----- //

    // Covers externally shared and bookmarked URLs like
    //   /neighborhood-reports/asthma_and_the_environment/east_new_york
    // On production IIS rewrites those to serve the topic page, leaving the slug
    // visible in the path for this lookup to read.
    // The slug is found by membership in neighborhoodMap rather than by position, so this
    // reads either segment order — the topic-first form above, and the neighborhood-first
    // /neighborhood-reports/east_new_york/asthma_and_the_environment/ that generated report
    // pages will serve. Site path prefixes (/dev-stage/) are skipped for the same reason:
    // they are not neighborhood slugs
    const pathParts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    const slug = pathParts.find(p => spaConfig.neighborhoodMap[p]);

    debugLog('getNeighborhoodFromURL: enter:', { pathname: window.location.pathname, slug });

    if (slug) {
        return spaConfig.neighborhoodMap[slug];
    }

    // ----- step 2: the sessionStorage bridge ----- //

    // Covers internal navigation from the landing page, topic tabs, neighborhood
    // cards, and the 404 fallback. Each of those stores the slug before navigating
    // to the clean topic URL, so the page load never reaches the server with a
    // neighborhood in the path
    const pending = sessionStorage.getItem(PENDING_NEIGHBORHOOD_KEY);

    // Consumed on read so it cannot bleed into a later page load in the same tab
    if (pending && spaConfig.neighborhoodMap[pending]) {
        sessionStorage.removeItem(PENDING_NEIGHBORHOOD_KEY);
        return spaConfig.neighborhoodMap[pending];
    }

    return '';

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
