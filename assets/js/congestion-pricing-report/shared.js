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
        preposition: "near the", hasTOD: true, badgeKey: "deegan",
        mapCoords: { lat: 40.80911, lng: -73.928824, zoom: 16 },
        badgeInfo: "The Major Deegan Expressway and connecting links in the South Bronx – Mott Haven (Hunts Point-Mott Haven community).",
        text: "<p>In Mott Haven, congestion pricing did not cause the measured pollution levels to be significantly different than they would have been if the program had never happened. After controlling for seasonality:</p><ul><li>Total traffic decreased by 4% from 2024 to 2025 and truck traffic remained the same</li><li>BC and NO decreased slightly, while NO2 and PM2.5 remained unchanged</li></ul>"
    },
    "Cross Bronx": {
        preposition: "near the", hasTOD: true, badgeKey: "cross-bronx",
        mapCoords: { lat: 40.844967, lng: -73.906263, zoom: 16 },
        badgeInfo: "The Cross-Bronx Expressway in the Highbridge-Tremont neighborhood (High Bridge – Morrisania and Crotona Tremont communities).",
        text: "<p>In neighborhoods along the Cross Bronx, congestion pricing did not cause the measured pollution levels to be significantly different than they would have been if the program had never happened. After controlling for seasonality:</p><ul><li>Total traffic decreased by 6% from 2024 to 2025 and truck traffic decreased by 2%</li><li>BC and NO decreased slightly and NO2 and PM2.5 increased slightly</li></ul>"
    },
    "BQE": {
        preposition: "near the", hasTOD: true, badgeKey: "bqe",
        mapCoords: { lat: 40.705511, lng: -73.958846, zoom: 16 },
        badgeInfo: "The Brooklyn-Queens Expressway between Metropolitan Ave. and DUMBO (BQE) in the South Williamsburg neighborhood (Greenpoint community).",
        text: "<p>In South Williamsburg near the BQE, congestion pricing did not cause the measured PM2.5, NO2, or BC levels to be significantly different than they would have been if the program had never happened.</p><p><strong>NO levels decreased, but were significantly higher than they would have been without congestion pricing</strong>. However, total traffic decreased by 2%, and truck traffic decreased by 3%. If we only looked at the statistics, we'd say congestion pricing caused higher NO here. But the lower traffic volume makes this is a logically uncertain finding.</p>"
    },
    "SI Expwy": {
        preposition: "near the", hasTOD: true, badgeKey: "si-exwy",
        mapCoords: { lat: 40.609209, lng: -74.151182, zoom: 14 },
        badgeInfo: "The Staten Island Expressway and connections to the Bayonne Bridge (SI Expwy) in the Port Richmond and Bulls Head neighborhoods (Port Richmond and Willowbrook communities).",
        text: "<p>In Port Richmond, congestion pricing did not cause the measured pollution levels to be significantly different than they would have been if the program had never happened. After controlling for seasonality:</p><ul><li>Total traffic increased by 4% from 2024 to 2025 and truck traffic increased by 10%</li><li>BC, NO, and NO2 decreased slightly and PM2.5 increased slightly</li></ul>"
    },
    "FDR": {
        preposition: "near the", hasTOD: true, badgeKey: "fdr",
        mapCoords: { lat: 40.722282, lng: -73.974417, zoom: 14 },
        badgeInfo: "The FDR Drive between E. 10 St. and the Manhattan Bridge (FDR) on the Lower East Side (Union Square -Lower East Side community).",
        text: "<p>In the Lower East Side, congestion pricing did not cause the measured pollution levels to be significantly different than they would have been if the program had never happened. After controlling for seasonality:</p><ul><li>Total traffic increased by 9% from 2024 to 2025</li><li>BC and NO decreased slightly and NO2 and PM2.5 remained unchanged</li></ul>"
    },
    "Trans-Manhattan": {
        preposition: "near the", hasTOD: true, badgeKey: "trans-manhattan",
        mapCoords: { lat: 40.847353, lng: -73.934027, zoom: 16 },
        badgeInfo: "The Trans-Manhattan Expressway between the George Washington Bridge and the Alexander Hamilton Bridge (Hamilton Bridge) in the Washington Heights neighborhood (Washington Heights – Inwood community).",
        text: "<p>In Washington Heights near the Trans-Manhattan Expressway, congestion pricing did not cause the measured pollution levels to be significantly different than they would have been if the program had never happened. After controlling for seasonality:</p><ul><li>Total traffic increased by 3% from 2024 to 2025 and truck traffic remained the same</li><li>BC and NO decreased slightly and NO2 and PM2.5 remained unchanged</li></ul>"
    },
    "Van Wyck": {
        preposition: "near the", hasTOD: true, badgeKey: "van-wyck", showCI: false,
        mapCoords: { lat: 40.690155, lng: -73.80908, zoom: 16 },
        badgeInfo: "The Van Wyck Expressway connects Queens to Jamaica and serves the airport area, handling significant traffic volumes. This is our control site.",
        text: "<p>This site is our control site. Here, the observed value is the same as the hypothetical value. The traffic modeling in the Environmental Assessment predicted little change along this highway caused by tolling. After controlling for seasonality:</p><ul><li>Total traffic increased 4% from 2024 to 2025 and truck traffic increased 5%. This change reflects general trends in traffic volumes throughout NY State.</li><li>In nearby neighborhoods, PM2.5 and NO2 changed very little while NO and BC decreased, reflecting general trends in improving air quality.</li></ul>"
    },
    "CRZ": {
        preposition: "in the", hasTOD: false,
        text: "<p>Inside the CRZ, congestion pricing did not cause the measured air pollution levels to be significantly different than they would have been if the program had never happened.</p><ul><li>BC and NO decreased</li><li>NO2 and PM2.5 remained the same</li></ul>"
    },
    "Rest of the City": {
        preposition: "in the", hasTOD: false,
        text: "<p>In NYC neighborhoods outside of the CRZ, congestion pricing did not cause the measured air pollution levels to be significantly different than they would have been if the program had never happened.</p><ul><li>BC and NO decreased</li><li>NO2 and PM2.5 remained the same.</li></ul>"
    }
};

// Derived once from CP_SITES (replace the former scattered literals)

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
            opt.textContent = site;

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
            btn.textContent = site;

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
