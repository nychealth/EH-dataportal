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


// Resolves the neighborhood for this page load, from the path first and the bridge second
const getNeighborhoodFromURL = () => {

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

    // ----- splice it in after the topic segment ----- //

    // Replacing everything after the topic slug, rather than appending to the current
    // path, preserves any site path prefix (e.g. /dev-prod/) and is idempotent when a
    // neighborhood slug is already present
    const pathParts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    const topicIdx = pathParts.findIndex(p => p === spaConfig.topicSlug);

    if (topicIdx === -1) {
        return;
    }

    const newPath = '/' + pathParts.slice(0, topicIdx + 1).join('/') + '/' + slug;

    // replaceState rather than a navigation: the SPA has already rendered this
    // neighborhood, so the path change is cosmetic — it makes the URL shareable and
    // bookmarkable without a reload or a server request
    history.replaceState(null, '', newPath);

};


// Arms every topic tab to carry the current neighborhood over to the topic it opens
const updateTopicLinks = neighborhoodName => {

    debugLog('updateTopicLinks: enter:', neighborhoodName);

    // The neighborhood travels through sessionStorage rather than the link href: a
    // href carrying the neighborhood 404s in dev and depends on the IIS rewrite in
    // production, so the slug is stored as the navigation fires and read back by
    // getNeighborhoodFromURL on the next page load
    const slug = slugForNeighborhood(neighborhoodName);
    const links = document.querySelectorAll('.nr-topic-link');

    links.forEach(a => {

        a.onclick = () => {
            if (slug) {
                sessionStorage.setItem(PENDING_NEIGHBORHOOD_KEY, slug);
            }
        };

    });

};
