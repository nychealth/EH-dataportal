// ─────────────────────────────────────────────────────────────────
// DOM REFERENCES
// Top-level references shared across functions.
// mapEl is required by both the map setup and the GT bridge below.
// mapComponent and mapView are populated once the ArcGIS view fires.
// ─────────────────────────────────────────────────────────────────
const mapEl = document.getElementById('arcmap');
let mapComponent;
let mapView;


// ─────────────────────────────────────────────────────────────────
// TAB SWITCHING
// Hides all tab panels and buttons, then activates the chosen one.
// If the map tab is selected for the first time, initialises the
// ArcGIS map component.
// ─────────────────────────────────────────────────────────────────
async function openTab(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
    } else {
        console.error(`Tab element with id "${tabName}" not found`);
        return;
    }

    evt.currentTarget.classList.add('active');

    if (tabName === 'mapView' && !mapView) {
        await initializeMapComponent();
    }
}


// ─────────────────────────────────────────────────────────────────
// MAP INITIALISATION
// Waits for the <arcgis-map> web component to signal its view is
// ready, then sets up all map features in sequence: search widget,
// community district zoom/filter, popup link interception, and
// property history tab management.
// setupPopupLinkInterception() must run LAST — it attaches to the
// map container which must exist before it can be referenced.
// ─────────────────────────────────────────────────────────────────
async function initializeMapComponent() {
    mapComponent = mapEl;

    if (!mapComponent) {
        console.error('arcgis-map element not found');
        return;
    }

    return new Promise((resolve) => {
        mapComponent.addEventListener('arcgisViewReadyChange', async () => {
            mapView = mapComponent.view;
            const webmap = mapView.map;

            // Remove double-click zoom delay so popups open on single click
            // without lag. ArcGIS waits after every click to detect a
            // double-click — this intercepts it and handles zoom manually,
            // eliminating that wait for normal single-click popup behaviour.
            mapView.on('double-click', (e) => {
                e.stopPropagation();
                mapView.goTo({ zoom: mapView.zoom + 1, center: e.mapPoint });
            });

            // GT bridge — watch shadow DOM for popup content changes
            const sr = mapEl.shadowRoot;
            if (sr) {
                let translateTimer = null;
                let lastContent = '';

                const popupObserver = new MutationObserver(() => {
                    const container = sr.querySelector('.esri-feature__main-container');
                    if (!container) return;
                    const currentContent = container.textContent;
                    if (currentContent === lastContent) return;
                    lastContent = currentContent;
                    clearTimeout(translateTimer);
                    translateTimer = setTimeout(translateOpenPopup, 400);
                });

                popupObserver.observe(sr, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
            }

            await setupSearchWidget(webmap);
            await setupCommunityDistrictZoom(mapView, webmap);

            // Must run last — depends on mapView.container being available
            setupPopupLinkInterception();

            await setupPropertyHistoryTab();

            resolve();
        });
    });
}


// ─────────────────────────────────────────────────────────────────
// SEARCH WIDGET
// Adds the NYC Health Department Inspections layer as a search
// source so users can search by BBL in addition to address.
// The existing geocoder source is preserved alongside it.
// ─────────────────────────────────────────────────────────────────
async function setupSearchWidget(webmap) {
    const searchEl = document.getElementById('arcsearch');

    const inspectionLayer = webmap.allLayers.find(
        l => l.title === 'NYC Health Department Inspections'
    );

    if (!inspectionLayer) {
        console.warn('[Search] Inspection layer not found in webmap');
        return;
    }

    searchEl.sources = [
        ...searchEl.sources,
        {
            layer: inspectionLayer,
            searchFields: ['BBL'],
            displayField: 'BBL',
            exactMatch: false,
            outFields: ['*'],
            name: 'Inspection BBL',
            placeholder: 'Search BBL',
            maxResults: 6,
            maxSuggestions: 6,
        }
    ];
}


// ─────────────────────────────────────────────────────────────────
// COMMUNITY DISTRICT ZOOM & FILTER
// Adds a dropdown to the map UI listing all community districts.
// Selecting one filters both the Inspections and Action layers to
// that district and zooms the map to its centroid.
// Selecting "All" clears both filters.
// ─────────────────────────────────────────────────────────────────
async function setupCommunityDistrictZoom(view, webmap) {
    const CDLayer = webmap.allLayers.find(l => l.title === 'Community Districts');
    const inspectionLayer = webmap.allLayers.find(l => l.title === 'NYC Health Department Inspections');
    const actionLayer = webmap.allLayers.find(l => l.title === 'NYC Health Department Action');

    if (!CDLayer) {
        console.warn('[CD Zoom] Community Districts layer not found in webmap');
        return;
    }

    // Build and inject dropdown into the map UI
    const selectDiv = document.createElement('div');
    selectDiv.style.backgroundColor = 'white';
    selectDiv.style.padding = '5px';
    selectDiv.innerHTML = `<select id="CDSelect"><option value="">Community Board (All)</option></select>`;
    view.ui.add(selectDiv, 'bottom-left');

    // Populate dropdown from layer query
    const query = CDLayer.createQuery();
    query.outFields = ['BoroLabel'];
    query.returnGeometry = false;
    query.where = '1=1';
    query.orderByFields = ['BoroLabel'];

    const results = await CDLayer.queryFeatures(query);
    const select = selectDiv.querySelector('#CDSelect');

    results.features.forEach(feature => {
        const opt = document.createElement('option');
        opt.value = feature.attributes.BoroLabel;
        opt.textContent = feature.attributes.BoroLabel;
        select.appendChild(opt);
    });

    // Filter layers and zoom on selection
    select.addEventListener('change', async () => {
        const selectedCD = select.value;

        if (!selectedCD) {
            // Reset — clear all definition expressions
            if (inspectionLayer) inspectionLayer.definitionExpression = null;
            if (actionLayer) actionLayer.definitionExpression = null;
            return;
        }

        if (inspectionLayer) inspectionLayer.definitionExpression = `NewCD = '${selectedCD}'`;
        if (actionLayer) actionLayer.definitionExpression = `NewCD = '${selectedCD}'`;

        // Zoom map to selected district centroid
        const zoomQuery = CDLayer.createQuery();
        zoomQuery.where = `BoroLabel = '${selectedCD}'`;
        zoomQuery.returnGeometry = true;

        const CDResult = await CDLayer.queryFeatures(zoomQuery);

        if (CDResult.features.length > 0) {
            const geometry = CDResult.features[0].geometry;
            const centerPoint = geometry.extent?.center ?? geometry.centroid;

            if (centerPoint) {
                await view.goTo({ target: centerPoint, scale: 10000 });
            }
        }
    });
}


// ─────────────────────────────────────────────────────────────────
// POPUP LINK INTERCEPTION
// Listens for clicks on links inside the popup. Attached to the
// stable map container rather than popup.container, which gets
// rebuilt every time a new feature is selected.
//
// Handles two cases:
// 1. Google Translate may rewrite href values through its proxy
//    (translate.google...) — we unwrap the original URL first.
// 2. If the link points to the property history page (tabulator.html),
//    we intercept it, prevent the default navigation, and instead
//    open the Property History tab inline with the correct BBL.
//
// Runs in capture phase so it fires before target="_blank" opens
// a new window.
// ─────────────────────────────────────────────────────────────────
function setupPopupLinkInterception() {
    const mapContainer = mapView.container;

    if (!mapContainer) {
        console.error('[Popup Links] mapView.container not found');
        return;
    }

    mapContainer.addEventListener('click', function (evt) {
        // Only act if the popup is currently visible
        if (!mapView.popup?.visible) return;

        // Walk up the DOM to find an <a> tag
        const link = evt.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        let targetUrl = href;

        try {
            // Resolve relative URLs and unwrap Google Translate proxy URLs
            const urlObj = new URL(href, window.location.href);

            if (urlObj.hostname.includes('translate.google')) {
                const originalUrl = urlObj.searchParams.get('u');
                if (originalUrl) targetUrl = originalUrl;
            } else {
                targetUrl = urlObj.href;
            }
        } catch (err) {
            console.warn('[Popup Links] Invalid link href:', href);
            return;
        }

        // Intercept property history links and open inline
        if (targetUrl.includes('tabulator.html')) {
            evt.preventDefault();
            evt.stopPropagation();

            const urlParams = new URL(targetUrl).searchParams;
            const bbl = urlParams.get('bbl');
            const address = urlParams.get('addr');

            setPropertyHistoryTabEnabled(true);
            viewPropertyHistory(bbl, address);
        }

    }, true); // Capture phase
}


// ─────────────────────────────────────────────────────────────────
// PROPERTY HISTORY TAB MANAGEMENT
// The Property History tab is disabled on page load and only
// enabled when a popup link triggers viewPropertyHistory().
// It is disabled again when the popup is closed.
// Uses reactiveUtils (SDK 4.29+) to watch popup visibility.
// ─────────────────────────────────────────────────────────────────
async function setupPropertyHistoryTab() {
    setPropertyHistoryTabEnabled(false);

    const [reactiveUtils] = await $arcgis.import([
        '@arcgis/core/core/reactiveUtils.js'
    ]);

    reactiveUtils.watch(
        () => mapView.popup.visible,
        (visible) => {
            if (!visible) setPropertyHistoryTabEnabled(false);
        }
    );
}

// Enables or disables the Property History tab button.
function setPropertyHistoryTabEnabled(enabled) {
    const tabButton = Array.from(document.getElementsByClassName('tab-btn'))
        .find(btn => btn.textContent.trim() === 'Property History');
    if (!tabButton) return;

    if (enabled) {
        tabButton.classList.remove('disabled');
        tabButton.removeAttribute('disabled');
    } else {
        tabButton.classList.add('disabled');
        tabButton.setAttribute('disabled', true);
    }
}


// ─────────────────────────────────────────────────────────────────
// VIEW PROPERTY HISTORY
// Populates the Property History tab header with the selected
// property's address and BBL, switches to that tab, then fetches
// inspection records from NYC Open Data.
// Called by setupPopupLinkInterception() when a history link is
// clicked in the popup.
// ─────────────────────────────────────────────────────────────────
function viewPropertyHistory(bbl, address) {
    document.getElementById('propertyBBL').textContent = bbl || '[no BBL]';
    document.getElementById('propertyAddress').textContent = address || '[no address]';
    openTabFromMap('propHis');
    fetchPropertyHistory(bbl);
}


// ─────────────────────────────────────────────────────────────────
// TAB SWITCH FROM MAP
// Variant of openTab() for programmatic tab switches (e.g. from a
// popup link) rather than from a user button click. Activates the
// target panel and highlights the matching tab button.
// ─────────────────────────────────────────────────────────────────
function openTabFromMap(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const tabElement = document.getElementById(tabName);
    if (tabElement) tabElement.classList.add('active');

    const tabButton = Array.from(document.getElementsByClassName('tab-btn'))
        .find(btn => btn.textContent.trim() === 'Property History');
    if (tabButton) tabButton.classList.add('active');
}


// ─────────────────────────────────────────────────────────────────
// FETCH PROPERTY HISTORY
// Queries the NYC Open Data rat inspection API for all records
// for the given BBL in the last 5 years. Results are sorted
// newest-first and rendered as an HTML table in the Property
// History tab panel.
// ─────────────────────────────────────────────────────────────────
async function fetchPropertyHistory(bbl) {
    const loading = document.getElementById('loadingIndicator');
    const historyDiv = document.getElementById('property-history');

    loading.style.display = 'block';
    historyDiv.innerHTML = '';

    try {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        const cutoffDate = fiveYearsAgo.toISOString().split('T')[0];

        const url = `https://data.cityofnewyork.us/resource/p937-wjvj.json`
            + `?$select=inspection_date,inspection_type,result,letter_type,observations`
            + `&$where=bbl=${bbl} AND inspection_date >= '${cutoffDate}'`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch property history');

        const data = await response.json();

        if (!data || data.length === 0) {
            historyDiv.innerHTML = '<p>No inspection records found.</p>';
            return;
        }

        // Sort newest first
        data.sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date));

        // Build results table
        let table = `
            <div class="scroll-hint">
                <span>&larr; Swipe left/right to view all columns &rarr;</span>
            </div>    
            <div class="table-container">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Inspection Date</th>
                            <th>Inspection Type</th>
                            <th>Result</th>
                            <th>Letter Type</th>
                            <th>Observations</th>
                        </tr>
                    </thead>
                    <tbody>`;

                    data.forEach(item => {
                        const date = item.inspection_date
                            ? new Date(item.inspection_date).toLocaleDateString()
                            : '';
                        table += `<tr>
                            <td>${date}</td>
                            <td>${item.inspection_type || ''}</td>
                            <td>${item.result || ''}</td>
                            <td>${item.letter_type || ''}</td>
                            <td>${item.observations || ''}</td>
                        </tr>`;
                    });
                    
                    table += '</tbody></table></div>';
                    historyDiv.innerHTML = table;

    } catch (err) {
        console.error('[Property History] Fetch failed:', err);
        historyDiv.innerHTML = '<p>Error loading inspection history.</p>';
    } finally {
        loading.style.display = 'none';
    }
}


// ─────────────────────────────────────────────────────────────────
// PAGE LOAD ENTRY POINT
// Initialises the map component on DOMContentLoaded if the map
// tab is the active panel on page load (which it is by default).
// ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const mapTab = document.getElementById('mapView');
    if (mapTab?.classList.contains('active')) {
        await initializeMapComponent();
    }
});


// ═══════════════════════════════════════════════════════════════════
// GOOGLE TRANSLATE POPUP BRIDGE
//
// BACKGROUND
// Google Translate works by scanning the page DOM when a language is
// selected and replacing text nodes with translated versions. It has
// two limitations relevant here:
//   1. It does not re-translate content injected into the DOM after
//      the initial translation pass.
//   2. It cannot see inside Shadow DOM — the internal tree of web
//      components like <arcgis-map> is completely invisible to it.
//
// APPROACH
// A small set of hidden <div> elements in the normal page HTML hold
// every static string that appears in the popup. Google Translate
// can see and translate those divs normally. When a popup opens,
// this code compares the original (untranslated) divs against the
// translated ones, builds a substitution map, and applies those
// translations directly into the popup content inside the shadow DOM.
//
// Google Translate does all the translation work. This code ferries
// the results across the Shadow DOM boundary.
//
// To add new translatable strings, update translate-keys.js only.
// See google-translate-shadow-dom-bridge.md for full documentation.
// ═══════════════════════════════════════════════════════════════════


// ── 1. Load phrases ───────────────────────────────────────────────
// Reads all key/text pairs from one of the hidden div groups
// (#popup-original or #popup-translated) into a plain object.
function loadTranslatePhrases(container) {
    const result = {};
    if (!container) return result;
    container.querySelectorAll('[key]').forEach(el => {
        result[el.getAttribute('key')] = el.textContent;
    });
    return result;
}


// ── 2. Build substitution map ─────────────────────────────────────
// Compares the original and translated div groups. Returns only the
// strings that Google Translate actually changed, as a plain object
// mapping original text → translated text.
// Sorted longest-first to prevent substring collisions — for example
// "Failed for Rat Activity" must not be substituted before
// "Failed for Rat Activity and Other Reason".
function buildSubstitutionMap() {
    const original = loadTranslatePhrases(document.getElementById('popup-original'));
    const translated = loadTranslatePhrases(document.getElementById('popup-translated'));
    const map = {};

    Object.keys(original).forEach(key => {
        const orig = original[key]?.trim();
        const trans = translated[key]?.trim();
        if (orig && trans && orig !== trans) {
            map[orig] = trans;
        }
    });

    // Longest strings first — prevents partial substring replacement
    return Object.fromEntries(
        Object.entries(map).sort((a, b) => b[0].length - a[0].length)
    );
}


// ── 3. Apply substitutions ────────────────────────────────────────
// Applies the substitution map to a single DOM text node in-place.
// Only modifies the node if at least one match is found.
function applySubstitutions(textNode, subMap) {
    let text = textNode.textContent;
    let changed = false;
    Object.entries(subMap).forEach(([orig, trans]) => {
        if (text.includes(orig)) {
            text = text.replaceAll(orig, trans);
            changed = true;
        }
    });
    if (changed) textNode.textContent = text;
}


// ── 4. Translate open popup ───────────────────────────────────────
// Queries the ArcGIS shadow root for the popup heading and content
// containers, walks all text nodes inside them, and applies the
// substitution map. Exits silently if the page is in English
// (empty substitution map) or if no popup is currently open.
// Selectors are correct for ArcGIS Maps SDK 4.29 and above.
function translateOpenPopup() {
    const shadowRoot = mapEl?.shadowRoot;
    if (!shadowRoot) return;

    const subMap = buildSubstitutionMap();
    if (Object.keys(subMap).length === 0) return; // English — nothing to do

    const containers = [
        shadowRoot.querySelector('.esri-features__heading'),
        shadowRoot.querySelector('.esri-feature__main-container'),
    ].filter(Boolean);

    if (!containers.length) return;

    containers.forEach(container => {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: n => n.textContent.trim()
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT
            }
        );
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => applySubstitutions(node, subMap));
    });
}



// ── 5. Re-translate on language change ───────────────────────────
// Watches the #popup-translated div for mutations caused by Google
// Translate updating the hidden divs when the user switches language.
// If a popup is already open at that moment, re-runs translation
// immediately so the open popup updates without needing to be closed
// and reopened.
const translatedContainer = document.getElementById('popup-translated');
if (translatedContainer) {
    const langObserver = new MutationObserver(() => {
        if (mapEl?.view?.popup?.visible) {
            setTimeout(translateOpenPopup, 200);
        }
    });
    langObserver.observe(translatedContainer, {
        childList: true, characterData: true, subtree: true
    });
}