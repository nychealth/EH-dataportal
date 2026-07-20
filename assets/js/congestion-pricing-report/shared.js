// ======================================================================= //
// shared.js
// ======================================================================= //

// Shared CP_SITES config and cross-chart helpers for the congestion
// pricing report. Loads first; every other file depends on it.

// ----------------------------------------------------------------------- //
// site config
// ----------------------------------------------------------------------- //

// Per-site metadata driving the map pins, badges, and chart text across
// the EJ, TOD, and CRZ chart blocks — one entry per site, keyed by name.

const CP_SITES = {
    "Deegan": {
        displayName: "Major Deegan",
        preposition: "near the", hasTOD: true, badgeKey: "deegan",
        mapCoords: { lat: 40.80911, lng: -73.928824, zoom: 16 },
        badgeInfo: "The Major Deegan Expressway (Major Deegan) and connecting links in the Mott Haven neighborhood.",
        text: "<p>No. In Mott Haven, the measured pollution levels were not significantly different than they would have been if the program had never happened. From the traffic count analysis, total traffic decreased by 4% from 2024 to 2025 and truck traffic remained the same.</p>"
    },
    "Cross Bronx": {
        preposition: "near the", hasTOD: true, badgeKey: "cross-bronx",
        mapCoords: { lat: 40.844967, lng: -73.906263, zoom: 16 },
        badgeInfo: "The Cross-Bronx Expressway (Cross Bronx) in the Highbridge-Tremont neighborhood.",
        text: "<p>No. In neighborhoods along the Cross Bronx, the measured pollution levels were not significantly different than they would have been if the program had never happened. From the traffic count analysis, total traffic decreased by 6% from 2024 to 2025 and truck traffic decreased by 2%. </p>"
    },
    "BQE": {
        preposition: "near the", hasTOD: true, badgeKey: "bqe",
        mapCoords: { lat: 40.705511, lng: -73.958846, zoom: 16 },
        badgeInfo: "The Brooklyn-Queens Expressway (BQE) between Metropolitan Ave and DUMBO in the South Williamsburg neighborhood.",
        text: "<p>No. In South Williamsburg near the BQE, the measured levels of NO2, PM2.5 and BC were not significantly different than they would have been if the program had never happened. From the traffic count analysis total traffic decreased by 2% from 2024 to 2025 and truck traffic decreased by 3%. </p><p>Nitric Oxide (NO) levels decreased but were significantly higher than we would have expected. If we only looked at the statistics, we'd say congestion pricing prevented NO from decreasing as much as it would have without the tolling program, but the decrease in traffic volume suggests there may be some other pollution source that coincided with the start of congestion pricing.  We are continuing to collect data throughout 2026 and will be able to more closely examine these patterns over time.</p>"
    },
    "SI Expwy": {
        preposition: "near the", hasTOD: true, badgeKey: "si-exwy",
        mapCoords: { lat: 40.609209, lng: -74.151182, zoom: 14 },
        badgeInfo: "The Staten Island Expressway (SI Expy) and connections to the Bayonne Bridge in the Port Richmond and Bulls Head neighborhoods.",
        text: "<p>No. In Port Richmond, the measured pollution levels were not significantly different than they would have been if the program had never happened. From the traffic count analysis, total traffic increased by 4% from 2024 to 2025 and truck traffic increased by 10%. </p>"
    },
    "FDR": {
        preposition: "near the", hasTOD: true, badgeKey: "fdr",
        mapCoords: { lat: 40.722282, lng: -73.974417, zoom: 14 },
        badgeInfo: "The FDR Drive between E. 10 St. and the Manhattan Bridge (FDR) in the Lower East Side neighborhood.",
        text: "<p>No. On the Lower East Side, the measured pollution levels were not significantly different than they would have been if the program had never happened. From the traffic count analysis at the three sites along the FDR, total traffic increased by 0.2%, 4% and 9% from 2024 to 2025.  For more information see Appendix A. </p>"
    },
    "Trans-Manhattan": {
        preposition: "near the", hasTOD: true, badgeKey: "trans-manhattan",
        mapCoords: { lat: 40.847353, lng: -73.934027, zoom: 16 },
        badgeInfo: "The Trans-Manhattan Expressway (Trans-Manhattan) between the George Washington Bridge and the Alexander Hamilton Bridge in the Washington Heights neighborhood.",
        text: "<p>No.  In Washington Heights near the Trans-Manhattan Expressway, the measured pollution levels were not significantly different than they would have been if the program had never happened. From the traffic count analysis, total traffic increased by 3% from 2024 to 2025 and truck traffic remained the same. </p>"
    },
    "Van Wyck": {
        preposition: "near the", hasTOD: true, badgeKey: "van-wyck", showCI: false,
        mapCoords: { lat: 40.690155, lng: -73.80908, zoom: 16 },
        badgeInfo: "The Van Wyck Expressway (Van Wyck) connects Queens to Jamaica and serves the airport area, handling significant traffic volumes that are not expected to be affected by congestion pricing. <strong>This is our control site.</strong>",
        text: "<p>This site is our control site. Here, the observed value is the same as the hypothetical value because the measured values are used to make the hypothetical values at other sites.<ul><li>Total traffic increased 4% from 2024 to 2025 and truck traffic increased 5%. This change reflects a general trend of increasing traffic volume throughout New York State. <li>In nearby neighborhoods, PM2.5 and NO2 changed very little while NO and BC decreased, reflecting the general trends in air quality throughout NYC and the region.</ul></p> "
    },
    "CRZ": {
        preposition: "in the", hasTOD: false,
        text: "<p>No.  When we look at the 11 NYCCAS sites inside the CRZ as a group, the measured pollution levels were not significantly different than they would have been if the program had never happened.</p>"
    },
    "Rest of the City": {
        preposition: "in the", hasTOD: false,
        text: "<p>No.  When we look at the 73 NYCCAS sites outside of the CRZ and analyze them as a group, we see that  the measured pollution levels were not significantly different than they would have been if the program had never happened. </p>"
    }
};

// Derived once from CP_SITES (replace the former scattered literals)

function getSiteDisplayName(site) {
    return CP_SITES[site]?.displayName || site;
}

const site_names = Object.keys(CP_SITES);
const tod_site_names = site_names.filter(s => CP_SITES[s].hasTOD);
const CP_BADGE_TO_SITE = {};
site_names.forEach(s => { if (CP_SITES[s].badgeKey) CP_BADGE_TO_SITE[CP_SITES[s].badgeKey] = s; });


// ----------------------------------------------------------------------- //
// site selector UI
// ----------------------------------------------------------------------- //

// Builds the site picker for a wrap element: a native <select> below 768px,
// a vertical button group above. Re-called on resize to swap across the
// breakpoint, so getCurrent must read the live selection each call.
// Shared by the EJ (#cpSiteButtons) and TOD (#todSiteButtons) charts.

function createSiteSelector({ wrapId, sites, idPrefix, getCurrent, onChange }) {
    const btnWrap = document.getElementById(wrapId);
    if (!btnWrap) return;
    btnWrap.innerHTML = "";
    const current = getCurrent();

    if (window.innerWidth < 768) {

        const sel = document.createElement("select");
        sel.className = "form-control form-control-sm mb-2";
        sel.setAttribute("aria-label", "Choose site");

        sites.forEach((site) => {

            const opt = document.createElement("option");
            opt.value = site;
            opt.textContent = getSiteDisplayName(site);

            if (site === current) opt.selected = true;
            sel.appendChild(opt);

        });

        sel.addEventListener("change", () => onChange(sel.value));
        btnWrap.appendChild(sel);

    } else {

        sites.forEach((site) => {

            const btn = document.createElement("button");
            btn.type = "button";
            btn.id = idPrefix + site.replaceAll(" ", "-");
            btn.className = "btn btn-sm btn-outline-dark fs-xs";
            btn.textContent = getSiteDisplayName(site);

            if (site === current) btn.classList.add("active");

            btn.addEventListener("click", async () => {

                [...btnWrap.querySelectorAll("button")].forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                await onChange(site);

            });

            btnWrap.appendChild(btn);

        });
    }
}


// ----------------------------------------------------------------------- //
// resize handling
// ----------------------------------------------------------------------- //

// Debounced resize handler shared by the chart blocks. Fires onResize (200ms
// after the container's width settles) only when the width actually changes,
// so vertical-only mobile resizes (address-bar show/hide) don't re-render.
// If onBreakpoint is given, it also fires when crossing the 768px mobile
// boundary — used to swap the native <select>/button selector live.

function addResizeHandler(el, onResize, onBreakpoint) {

    if (!el) return;
    let lastW = el.clientWidth, lastMobile = window.innerWidth < 768, timer;

    window.addEventListener("resize", () => {

        const w = el.clientWidth;
        const mobile = window.innerWidth < 768;
        if (w === lastW) return;
        const crossedBreakpoint = mobile !== lastMobile;
        lastW = w;
        lastMobile = mobile;

        clearTimeout(timer);

        timer = setTimeout(() => {
            if (crossedBreakpoint && onBreakpoint) onBreakpoint();
            onResize();
        }, 200);

    });
}


// ----------------------------------------------------------------------- //
// Vega-Lite spec helper
// ----------------------------------------------------------------------- //

// Deep-clone a Vega-Lite spec before mutating it per render. structuredClone
// where available, JSON round-trip as a fallback (specs are plain JSON).

function cloneSpec(spec) {

    return typeof structuredClone === "function"
        ? structuredClone(spec)
        : JSON.parse(JSON.stringify(spec));
}


// ----------------------------------------------------------------------- //
// regional map
// ----------------------------------------------------------------------- //

// NY/NJ/CT colors for the regional comparison — single source for the
// regional Leaflet map and the CRZ chart's six color scales. The derived
// domain/range arrays keep the Vega scale order aligned to this map.

const CP_STATE_COLORS = { "New York": "#2b6cb0", "New Jersey": "#276749", "Connecticut": "#9b2c2c" };
const CP_STATE_DOMAIN = Object.keys(CP_STATE_COLORS);
const CP_STATE_RANGE = Object.values(CP_STATE_COLORS);

// Create a Leaflet map with the shared CARTO Voyager basemap. Called only
// from the map blocks (after Leaflet's L is loaded); markers, legends, and
// handlers stay in each block since the two maps diverge there.

function createCpMap(id, options, center, zoom) {

    const map = L.map(id, options).setView(center, zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    return map;

}
