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
    "Major Deegan": {
        displayName: "Major Deegan Expressway",
        preposition: "near the", hasTOD: true, badgeKey: "deegan",
        mapCoords: { lat: 40.80911, lng: -73.928824, zoom: 16 },
        badgeInfo: "The Major Deegan Expressway (Major Deegan) and connecting links in the Mott Haven neighborhood.",
        text: "<p>No. In Mott Haven, the measured pollution levels were not significantly different than they would have been without the program. From the traffic count analysis, total traffic decreased by 4% from 2024 to 2025 and truck traffic remained the same.</p>"
    },
    "Cross Bronx": {
        displayName: "Cross-Bronx Expressway",
        preposition: "near the", hasTOD: true, badgeKey: "cross-bronx",
        mapCoords: { lat: 40.844967, lng: -73.906263, zoom: 16 },
        badgeInfo: "The Cross-Bronx Expressway (Cross Bronx) in the Highbridge-Tremont neighborhood.",
        text: "<p>No. In neighborhoods along the Cross Bronx, the measured pollution levels were not significantly different than they would have been without the program. From the traffic count analysis, total traffic decreased by 6% from 2024 to 2025 and truck traffic decreased by 2%.</p>"
    },
    "BQE": {
        displayName: "Brooklyn-Queens Expressway",
        preposition: "near the", hasTOD: true, badgeKey: "bqe",
        mapCoords: { lat: 40.705511, lng: -73.958846, zoom: 16 },
        badgeInfo: "The Brooklyn-Queens Expressway (BQE) between Metropolitan Avenue and DUMBO in the South Williamsburg neighborhood.",
        text: "<p>No. In South Williamsburg near the BQE, the measured levels of NO2, PM2.5 and BC were not significantly different than they would have been without the program. From the traffic count analysis, total traffic decreased by 2% from 2024 to 2025 and truck traffic decreased by 3%.</p><p>Nitric Oxide (NO) levels decreased but were higher than we would have expected in comparison to changes at the control site. This result was statistically significant. If we only looked at the statistics, we'd say congestion pricing prevented NO from decreasing as much as it would have without the tolling program, but the decrease in traffic volume suggests there may be some other pollution source that coincided with the start of congestion pricing.</p><p>We are continuing to collect data throughout 2026 and will be able to more closely examine these patterns over time.</p>"
    },
    "SI Expwy": {
        displayName: "Staten Island Expressway",
        preposition: "near the", hasTOD: true, badgeKey: "si-exwy",
        mapCoords: { lat: 40.609209, lng: -74.151182, zoom: 14 },
        badgeInfo: "The Staten Island Expressway (SI Expwy) and connections to the Bayonne Bridge in the Port Richmond and Bulls Head neighborhoods.",
        text: "<p>No. In Port Richmond, the measured pollution levels were not significantly different than they would have been without the program. From the traffic count analysis, total traffic increased by 4% from 2024 to 2025 and truck traffic increased by 10%. At a nearby location on the Staten Island Expressway, total traffic increased by 5% while truck traffic decreased by 2% from 2024 to 2025.</p>"
    },
    "FDR": {
        displayName: "FDR Drive",
        preposition: "near the", hasTOD: true, badgeKey: "fdr",
        mapCoords: { lat: 40.722282, lng: -73.974417, zoom: 14 },
        badgeInfo: "The FDR Drive between E. 10 St. and the Manhattan Bridge (FDR) in the Lower East Side neighborhood.",
        text: "<p>No. On the Lower East Side, the measured pollution levels were not significantly different than they would have been without the program. From the traffic count analysis at the three sites along the FDR, total traffic increased by 0.2%, 4% and 9% from 2024 to 2025. For more information, see the <a href=\"embeds/CRZ_Report_Appendix.pdf\" target=\"_blank\"> appendix (PDF)</a>.</p>"
    },
    "Trans-Manhattan": {
        displayName: "Trans-Manhattan Expressway",
        preposition: "near the", hasTOD: true, badgeKey: "trans-manhattan",
        mapCoords: { lat: 40.847353, lng: -73.934027, zoom: 16 },
        badgeInfo: "The Trans-Manhattan Expressway (Trans-Manhattan) between the George Washington Bridge and the Alexander Hamilton Bridge in the Washington Heights neighborhood.",
        text: "<p>No. In Washington Heights near the Trans-Manhattan Expressway, the measured pollution levels were not significantly different than they would have been without the program. From the traffic count analysis, total traffic increased by 3% from 2024 to 2025 and truck traffic remained the same.</p>"
    },
    "Van Wyck": {
        displayName: "Control Site: Van Wyck Expressway",
        preposition: "near the", hasTOD: true, badgeKey: "van-wyck", showCI: false, isControlSite: true,
        mapCoords: { lat: 40.690155, lng: -73.80908, zoom: 16 },
        badgeInfo: "The Van Wyck Expressway (Van Wyck) connects Queens to Jamaica and serves the airport area, handling significant traffic volumes that are not expected to be affected by congestion pricing. This is our control site.",
        text: "<p>This site is our control site. Here, there is no projected value because the values measured at this location are used to make the projected values at other sites.<ul><li>Total traffic increased 4% from 2024 to 2025 and truck traffic increased 5%. This change is consistent with increasing traffic volumes throughout New York State.<li>In nearby neighborhoods, PM2.5 and NO2 changed very little while NO and BC decreased, reflecting the general trends in air quality throughout NYC and the region.</ul></p>"
    },
    "CRZ": {
        displayName: "congestion relief zone",
        preposition: "in the", hasTOD: false,
        text: "<p>No. When we average the 12 NYCCAS sites inside the CRZ, the measured pollution levels were not significantly different than they would have been without the program. Entries to the CRZ, the FDR Dr, and the West Side Highway were 11% fewer in 2025 than before tolling began, as reported in the CRZ Tolling First Evaluation Report.</p>"
    },
    "Rest of the city": {
        displayName: "rest of the city",
        preposition: "in the", hasTOD: false,
        text: "<p>No. When we look at the 73 NYCCAS sites outside of the CRZ and analyze them as a group, we see that the measured pollution levels were not significantly different than they would have been without the program.</p>"
    }
};

// Derived once from CP_SITES (replace the former scattered literals)

function getSiteDisplayName(site) {
    return CP_SITES[site]?.displayName || site;
}

// Keep CRZ first in the EJ selector while preserving the existing order for
// the remaining sites.
const site_names = ["CRZ", ...Object.keys(CP_SITES).filter((site) => site !== "CRZ")];
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
            opt.textContent = site; // Use the site name directly for the select options

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
            btn.textContent = site; // Use the site name directly for the button text

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

// Observing the container rather than the window catches width changes no
// window resize accompanies — a tab or accordion revealing a chart, a scrollbar
// appearing, a late webfont reflowing the column.

function addResizeHandler(el, onResize, onBreakpoint) {

    if (!el) return;
    let lastW = el.clientWidth, lastMobile = window.innerWidth < 768, timer;

    const observer = new ResizeObserver(() => {

        const w = el.clientWidth;
        // The select/button swap is a viewport question, not a container one.
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

    // lastW is seeded above, so the callback ResizeObserver fires on observe()
    // is a no-op rather than a redundant re-render on page load.

    observer.observe(el);

    return observer;
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
// shared chart data
// ----------------------------------------------------------------------- //

// A spec that names a URL is fetched again on every embed — Vega caches nothing
// between views. Two charts on this page read the same file, and embedFitted
// draws a second time whenever it has to re-fit, so the post-period air-quality
// data was being downloaded three times on load. Fetch and parse it once here
// and hand the specs values instead.

const CP_AQ_POST_URL = "data/AQ_Post.csv";

const CP_CSV_CACHE = new Map();

// parse: "auto" reproduces what Vega's own url loader does with a bare csv —
// without it every field arrives as a string and the CI arithmetic silently
// compares numbers as text.

function loadCsv(url) {

    if (!CP_CSV_CACHE.has(url)) {
        CP_CSV_CACHE.set(
            url,
            vega.loader().load(url).then((raw) => vega.read(raw, { type: "csv", parse: "auto" }))
        );
    }

    return CP_CSV_CACHE.get(url);
}

// Vega tags ingested row objects with its own tuple id, so two views sharing
// one array would overwrite each other's bookkeeping. Hand out a fresh shallow
// copy per embed instead; the file is 32 rows, so the copy is not worth
// optimizing away.

function csvRows(rows) {

    return rows.map((row) => ({ ...row }));

}


// ----------------------------------------------------------------------- //
// chart title wrapping
// ----------------------------------------------------------------------- //

// Vega-Lite renders each element of a title array as its own line, and has no
// auto-wrap of its own. A long single-line title stretches the whole canvas
// wider than its container no matter how narrow the plotting panels are, so
// the text has to be broken up before the spec is handed over.

// Measured rather than estimated from an average glyph width: the title sets a
// floor under the rendered chart width (confirmed by sweeping panel widths and
// watching svg width stay pinned), so a bad estimate either wraps too eagerly
// and wastes vertical space, or under-wraps and overflows the container.

const cpTextMetrics = document.createElement("canvas").getContext("2d");

// The weight matters as much as the size: Vega's own defaults render a chart
// title bold ("group-title") and a subtitle normal ("group-subtitle"), and
// measuring bold text with a regular font packs too many words onto a line.

function measureTextWidth(text, fontSize, fontFamily, fontWeight) {

    cpTextMetrics.font = `${fontWeight || "normal"} ${fontSize}px ${fontFamily || "Helvetica"}`;

    return cpTextMetrics.measureText(text).width;

}

// Word-wrap a string to fit `maxPx`, returning one array element per line.

function wrapText(text, maxPx, fontSize, fontFamily, fontWeight) {

    const lines = [];

    let line = "";

    for (const word of text.split(" ")) {

        const candidate = line ? line + " " + word : word;

        if (line && measureTextWidth(candidate, fontSize, fontFamily, fontWeight) > maxPx) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }

    if (line) lines.push(line);

    return lines;
}

// Wrap a spec's title + subtitle to the container width. On a wide container
// the text already fits on one line, so the spec comes back unchanged.

function wrapTitle(spec, avail) {

    if (!spec.title) return;

    const tw = avail - 10;

    if (typeof spec.title.text === "string") {
        spec.title.text = wrapText(
            spec.title.text, tw,
            spec.title.fontSize || 14, spec.title.font, spec.title.fontWeight ?? "bold");
    }

    if (spec.title.subtitle != null) {

        const sub = Array.isArray(spec.title.subtitle) ? spec.title.subtitle : [spec.title.subtitle];
        const out = [];

        sub.forEach((s) => s
            ? out.push(...wrapText(
                s, tw,
                spec.title.subtitleFontSize || 12, spec.title.subtitleFont, spec.title.subtitleFontWeight))
            : out.push(""));

        spec.title.subtitle = out;

    }
}


// ----------------------------------------------------------------------- //
// faceted chart sizing
// ----------------------------------------------------------------------- //

// Vega-Lite's width:"container" and autosize:"fit" only work on single and
// layered views — the compiler warns and falls back to "pad" for facet and
// concat specs — so every chart on this page sizes its own panels.

// One descriptor per chart. `cap` is the authored panel width: it binds on wide
// layouts, keeping desktop rendering as drawn, and stops binding once the
// container is too narrow to hold it. `shrink` is the starting allowance for
// everything Vega draws outside the panel — axis labels, legend, header text —
// and is a first-paint estimate only: fitRendered() replaces it with a measured
// value on the first render that overflows. Do not hand-tune these.

// A chart with no authored width to preserve passes cap: Infinity — it should
// simply fill whatever it is given at every width.

const CP_FIT = {
    ej:      { key: "ej",      wideCols: 4, narrowCols: 2, cap: 125,      min: 60,  fallback: 600, shrink: { wide: 28, narrow: 28 } },
    aq:      { key: "aq",      wideCols: 4, narrowCols: 2, cap: 125,      min: 30,  fallback: 600, shrink: { wide: 0,  narrow: 17 } },
    tod:     { key: "tod",     wideCols: 2, narrowCols: 1, cap: 300,      min: 120, fallback: 700, shrink: { wide: 70, narrow: 38 } },
    crz:     { key: "crz",     wideCols: 3, narrowCols: 3, cap: 200,      min: 40,  fallback: 700, shrink: { wide: 41, narrow: 41 } },
    explain: { key: "explain", wideCols: 1, narrowCols: 1, cap: Infinity, min: 120, fallback: 600, shrink: { wide: 0,  narrow: 0 } }
};

// Below Bootstrap's sm breakpoint the authored gutter (tuned for a 4-column
// desktop row) becomes one wide gap that strands the width it was meant to fill.
const CP_NARROW_SPACING = 20;

const CP_FIT_TOLERANCE = 2;
const CP_EMBED_OPTS = { actions: false, renderer: "svg" };

const CP_SHRINK = new Map();        // "ej:2" -> measured allowance per panel
const CP_FLOOR_BOUND = new Set();   // "tod:1" -> text sets the width; trimming panels can't help

function cpRenderedWidth(el) {

    const svg = el && el.querySelector("svg");

    return svg ? svg.getBoundingClientRect().width : 0;

}

// Size a spec's panels to its container. `apply` writes the computed geometry
// into whichever shape the spec uses (facet, hconcat of facets, plain hconcat).
// `paneOverride` forces a panel width, used to keep two stacked charts aligned.

function fitChart(spec, el, cfg, apply, paneOverride) {

    const avail = (el && el.clientWidth) || cfg.fallback;
    const cols = avail < 576 ? cfg.narrowCols : cfg.wideCols;
    const wide = cols === cfg.wideCols;

    const spacing = wide ? (spec.spacing ?? CP_NARROW_SPACING) : CP_NARROW_SPACING;

    const key = cfg.key + ":" + cols;
    const shrink = CP_SHRINK.get(key) ?? (wide ? cfg.shrink.wide : cfg.shrink.narrow);

    // The cap only binds while the layout is wide. Once reflowed, holding the
    // authored width would leave the row half empty, which is the whole point
    // of reflowing — so the narrow branch is free to grow past it.

    const room = Math.floor((avail - spacing * (cols - 1)) / cols) - shrink;
    const pane = paneOverride ?? Math.max(cfg.min, wide ? Math.min(room, cfg.cap) : room);

    apply(spec, { cols, spacing, pane });
    wrapTitle(spec, avail);

    return { cols, spacing, pane, avail, key, shrink, overridden: paneOverride != null };
}

// Render, then check what actually came out. Only ever trims: a chart whose cap
// is binding renders narrower than its container by design, and growing it to
// fill would change the authored desktop layout.

// Returns the layout actually used, so a caller can align a second chart to it.

async function embedFitted(el, buildSpec, cfg, apply, paneOverride) {

    const spec = buildSpec();
    let layout = fitChart(spec, el, cfg, apply, paneOverride);

    await vegaEmbed(el, spec, CP_EMBED_OPTS);

    if (layout.overridden || CP_FLOOR_BOUND.has(layout.key)) return layout;

    const rendered = cpRenderedWidth(el);
    const overflow = rendered - el.clientWidth;

    if (overflow <= CP_FIT_TOLERANCE) return layout;

    // Trim each panel by its share of the overflow and draw once more. A fresh
    // spec is required because vegaEmbed mutates the object it is handed.

    const { key, shrink } = layout;

    CP_SHRINK.set(key, shrink + Math.ceil(overflow / layout.cols));

    const retry = buildSpec();
    layout = fitChart(retry, el, cfg, apply, paneOverride);

    await vegaEmbed(el, retry, CP_EMBED_OPTS);

    // If the width didn't move, the panels were never what set it — the title
    // or the facet header labels did. Record that, restore the starting
    // allowance, and stop paying for a second render on every later draw.

    if (rendered - cpRenderedWidth(el) <= CP_FIT_TOLERANCE) {
        CP_FLOOR_BOUND.add(key);
        CP_SHRINK.set(key, shrink);
    }

    return layout;
}


// ----------------------------------------------------------------------- //
// regional map
// ----------------------------------------------------------------------- //

// NY/NJ/CT colors for the regional comparison — single source for the
// regional Leaflet map and the CRZ chart's six color scales. The derived
// domain/range arrays keep the Vega scale order aligned to this map.
// map-regional.js looks colors up by name, so it is unaffected by the order.

const CP_STATE_COLORS = { "New York": "#2b6cb0", "New Jersey": "#276749", "Connecticut": "#9b2c2c" };

// Sorted so the chart legend reads alphabetically; the range is derived from
// the sorted domain rather than from CP_STATE_COLORS directly, so each state
// keeps its own color no matter what order the object above is written in.

const CP_STATE_DOMAIN = Object.keys(CP_STATE_COLORS).sort();
const CP_STATE_RANGE = CP_STATE_DOMAIN.map(state => CP_STATE_COLORS[state]);

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
