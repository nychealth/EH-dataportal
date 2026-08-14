// ======================================================================= //
// chart-tod.js
// ======================================================================= //

// Renders the time-of-day traffic and PM2.5 chart (#cpVisTOD).

// ----------------------------------------------------------------------- //
// top scope variables
// ----------------------------------------------------------------------- //

// ID of the chart container div; referenced throughout for rendering and clearing

const TOD_CONTAINER_ID = "cpVisTOD";

// Traffic monitor labels differ from the broader site names used elsewhere in the report.
const trafficMonitoringLocations = {
    "FDR": "FDR at Houston St",
    "SI Expwy": "I-278 Staten Island Expressway",
};

// The traffic facet header is the anchor for its monitor-specific footnote.
const TRAFFIC_PANEL_TITLE = "Traffic (vehicles per hour)";

// tod_site_names is derived from CP_SITES (hasTOD), defined in shared.js
// Tracks the currently selected site; updated on each button click

let todCurrentSite = "Major Deegan";


// ----------------------------------------------------------------------- //
// base Vega-Lite spec
// ----------------------------------------------------------------------- //

// The filter in transform[0] is a placeholder — specForTODSite() patches it
// before each render so we never mutate this object directly.

const todBaseSpec = {
    
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",

    // Global chart styling — fonts, axis appearance, legend placement, color palette
    config: {
        header: {
            labelAlign: "left",
            labelAnchor: "start",
            labelFont: "Helvetica",
            labelFontWeight: "bold",
            labelFontSize: 12,
        },

        view: { stroke: null },
        axisX: { labelAngle: 0, domain: false },
        axisY: {
            domain: false,
            ticks: false,
            tickCount: 3,
            orient: "left",
            title: null,
        },

        legend: { orient: "right", title: "" },

        range: {
            category: ['#35b779','#0096FA','#9c179e','#545454'],
        },
    },

    // CSV data source (served as a Hugo static asset)
    data: {
        url: "data/rtpm_traffic.csv",
    },

    // Each facet panel gets its own y-axis scale so panels with different units are readable
    resolve: { scale: { y: "independent" } },

    // Data transformations applied before encoding — filtering, calculated fields, label mapping
    transform: [
        // Placeholder — replaced by specForTODSite() before each render
        { filter: "datum.Site === 'BQE'" },
        {
            calculate: "datum.Value + ' (' + datum.Units + ')'",
            as: "ValueWithUnits",
        },
        {
            calculate: "datum.Measure + ' (' + datum.Units + ')'",
            as: "ParamWithUnit",
        },
        {
            // Expand terse Time codes into readable labels for the x-axis
            calculate: "datum.Time === 'Pre' ? 'Before congestion pricing' : datum.Time === 'Post' ? 'With congestion pricing' : datum.Time",
            as: "TimeLabel",
        },
    ],

    // One panel per measure (e.g. Traffic, PM2.5), laid out as a row of small multiples
    facet: {
        field: "ParamWithUnit",
        title: null,
        // Put traffic volume first; remaining panels sort alphabetically
        sort: [TRAFFIC_PANEL_TITLE],
    },

    // The repeated chart spec applied to each facet panel
    spec: {
        width: 300,
        height: 200,
        encoding: {
            x: {
                field: "TimeLabel",
                type: "nominal",
                sort: "ascending",
                title: null,
            },
        },
        layer: [
            // Layer 1: lines connecting Pre → Post for each TOD period
            {
                mark: { type: "line", strokeDash: [0, 0], opacity: 1 },

                encoding: {
                    y: { field: "Value", type: "quantitative" },

                    color: {
                        field: "TOD",

                        scale: {
                            domain: [
                                "Morning rush",
                                "Midday",
                                "Evening rush",
                                "Overnight",
                            ],

                            range: ['#35b779','#0096FA','#9c179e','#545454'],
                        },
                    },
                },
            },

            // Layer 2: dots at each data point, with tooltip
            {
                mark: { type: "circle", size: 150, opacity: 1 },

                encoding: {
                    y: {
                        field: "Value",
                        type: "quantitative",
                        // Force y-axis to start at 0 so differences are proportional
                        scale: { domainMin: 0, nice: false },
                    },

                    color: {
                        field: "TOD",

                        scale: {
                            domain: [
                                "Morning rush",
                                "Midday",
                                "Evening rush",
                                "Overnight",
                            ],

                            range: ['#35b779','#0096FA','#9c179e','#545454'],
                        },
                    },

                    tooltip: [
                        { field: "Site", title: "Site", type: "nominal" },
                        { field: "TOD", title: "Time of day", type: "nominal" },
                        { field: "TimeLabel", title: "Period", type: "nominal" },
                        { field: "Measure", title: "Measure", type: "nominal" },
                        { field: "ValueWithUnits", title: "Value", type: "nominal" },
                    ],
                },
            },
        ],
    },
};


// ----------------------------------------------------------------------- //
// spec derivation + sizing
// ----------------------------------------------------------------------- //

// Returns a deep clone of todBaseSpec with the Site filter patched in.
// Cloning is required because vegaEmbed may mutate the spec object it receives,
// and we need todBaseSpec to remain pristine for subsequent site switches.

function specForTODSite(site) {

    const spec = cloneSpec(todBaseSpec);
    spec.transform[0].filter = `datum.Site === '${site}'`;

    // Only the sites in trafficMonitoringLocations get a footnote, so the "*"
    // marker is added to the facet header here rather than baked into the
    // ParamWithUnit transform — otherwise unlisted sites show a marker
    // pointing at a footnote that never renders.

    if (trafficMonitoringLocations[site]) {

        spec.facet.header = {
            labelExpr: `datum.value === '${TRAFFIC_PANEL_TITLE}' ? datum.value + '*' : datum.value`,
        };

    }

    return spec;

}


// Write the computed geometry into the facet spec. Below Bootstrap's sm
// breakpoint the panels stack into one column and the right-hand legend moves
// underneath, since a side legend costs width the narrow layout needs. That
// also changes how much width sits outside the panels, which is why the
// measured allowance in shared.js is cached per column count.

function applyTODFacet(spec, { cols, pane }) {

    spec.columns = cols;
    spec.spec.width = pane;

    if (cols === 1 && spec.config && spec.config.legend) {
        spec.config.legend.orient = "bottom";
    }

}


// ----------------------------------------------------------------------- //
// render
// ----------------------------------------------------------------------- //

// Clears the container and re-renders the chart for the given site.

async function renderTODChart(site) {
    const el = document.getElementById(TOD_CONTAINER_ID);
    if (!el) return;

    // Lock the container's current height before clearing so the page doesn't
    // jump when innerHTML empties the element momentarily

    el.style.minHeight = el.offsetHeight + "px";
    el.innerHTML = "";

    // Sites without a listed monitor get an empty footnote, which also clears
    // the previous site's note when switching between them.

    const footnoteEl = document.getElementById("todTrafficFootnote");
    const trafficMonitor = trafficMonitoringLocations[site];

    if (footnoteEl) {
        footnoteEl.textContent = trafficMonitor
            ? `*Traffic data comes from ${trafficMonitor}`
            : "";
    }

    try {
        await embedFitted(el, () => specForTODSite(site), CP_FIT.tod, applyTODFacet);
        // Release the lock now that the new chart is in place
        el.style.minHeight = "";
    } catch (err) {
        // Release the lock even if the chart fails to render
        console.error("TOD Traffic Vega render failed:", err);
        el.innerHTML =
            "<pre style='white-space:pre-wrap'>Chart failed to render. See console.</pre>";

    }
}


// ----------------------------------------------------------------------- //
// site selector UI + change handling
// ----------------------------------------------------------------------- //

// Shared handler for both button click and select change

async function handleTODSiteChange(site) {

    todCurrentSite = site;
    const todSiteTitleEl = document.getElementById("tod-site-name");
    if (todSiteTitleEl) todSiteTitleEl.textContent = getSiteDisplayName(site);
    await renderTODChart(site);
    
}

// IDs are prefixed "tod-" to avoid collisions with #cpSiteButtons on the
// same page (both selectors share createSiteSelector).

function renderTODButtons() {

    createSiteSelector({

        wrapId: "todSiteButtons",
        sites: tod_site_names,
        idPrefix: "tod-",
        getCurrent: () => todCurrentSite,
        onChange: handleTODSiteChange,

    });

}


// ----------------------------------------------------------------------- //
// initialization
// ----------------------------------------------------------------------- //

// Waits for DOM so #todSiteButtons and #cpVisTOD exist before rendering

document.addEventListener("DOMContentLoaded", async () => {

    renderTODButtons();
    await renderTODChart(todCurrentSite);

    // Re-render the chart on width changes; swap the select/button selector
    // when crossing the 768px breakpoint.

    addResizeHandler(document.getElementById(TOD_CONTAINER_ID),
        () => renderTODChart(todCurrentSite), renderTODButtons);
});
