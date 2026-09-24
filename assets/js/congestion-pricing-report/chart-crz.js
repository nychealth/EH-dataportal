// ======================================================================= //
// chart-crz.js
// ======================================================================= //

// Renders the CRZ chart (#cpVis2); consumes CP_STATE_DOMAIN/RANGE and the
// panel-sizing helpers from shared.js.

// ----------------------------------------------------------------------- //
// top scope variables
// ----------------------------------------------------------------------- //

// ID of the chart container div; referenced throughout for rendering and clearing

const CP_CONTAINER2_ID = "cpVis2";


// ----------------------------------------------------------------------- //
// base Vega-Lite spec
// ----------------------------------------------------------------------- //

// hconcat holds one panel per pollutant (PM2.5, NO2, Ozone) — see the
// sub-group markers below. State color scales reference CP_STATE_DOMAIN/
// RANGE from shared.js. All six color encodings share one State scale, and
// resolve.legend hoists them into a single chart-level legend rather than
// one per panel — so none of them may set "legend": null.

const baseSpec_1 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
        "text": "How does Q3 2025 air quality around the region compare to historical ranges?",
        "subtitle": ["Dot: Average (Q3 2025)", "Bar: Range (Q3 2022-2024)", ""],
        "anchor": "start",
        "font": "Helvetica",
        "subtitleFont": "Helvetica",
        "fontSize": 18,
        "subtitlePadding": 10,
        "subtitleLineHeight": 16,
        "subtitleFontSize": 13,
        "subtitleColor": "#585858"
    },
    "config": {
        "view": { "stroke": null },
        "legend": {
            "orient": "bottom",
            "direction": "horizontal",
            // The shared legend inherits the range rule's 0.5 opacity, which
            // washes out the swatches; pin them to match the solid dot marks.
            "symbolOpacity": 1,
            "symbolType": "circle"
        },
        "axisX": {
            "labelAngle": 0,
            "domain": true,
            "grid": true,
            "gridDash": [4, 2]
        },
        "axisY": {
            "domain": false,
            "ticks": false,
            "title": null,
            "grid": false,
            "gridColor": "#e0e0e0"
        }
    },
    "data": {
        "name": "source",
        "url": "data/regional.csv"
    },
    "resolve": { "scale": { "color": "shared" }, "legend": { "color": "shared" } },
    "transform": [
        {
            "calculate": "{'Connecticut': '1', 'New Jersey': '2', 'New York': '3'}[datum.State] + ': ' + datum['Site Name']",
            "as": "SortKey"
        },
        {
            "calculate": "datum.State + ': ' + datum['Site Name']",
            "as": "StateAndSite"
        },
        {
            "calculate": "datum.Parameter === 'PM2.5' ? 'μg/m3' : 'ppb'",
            "as": "Units"
        },
        {
            "calculate": "datum['Arithmetic Mean'] + ' ' + datum.Units",
            "as": "valuePlusUnits"
        }
    ],

    "hconcat": [

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
        // PM2.5 panel
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

        {
            "title": {
                "text": "PM2.5",
                "anchor": "center",
                "dx": -15,
                "font": "Helvetica",
                "fontWeight": "bold",
                "fontSize": 12
            },
            "transform": [{ "filter": "datum.Parameter === 'PM2.5'" }],
            "width": 200,
            "height": { "step": 22 },
            "layer": [
                {
                    "mark": { "type": "rule", "strokeWidth": 6, "strokeCap": "round" },
                    "encoding": {
                        "color": {
                            "field": "State",
                            "type": "nominal",
                            "scale": {
                                "domain": CP_STATE_DOMAIN,
                                "range": CP_STATE_RANGE
                            }
                        },
                        "x": {
                            "field": "HistoricalMin",
                            "type": "quantitative",
                            "title": null
                        },
                        "x2": { "field": "HistoricalMax" },
                        "opacity": { "value": 0.5 },
                        "tooltip": [
                            { "field": "Site Name", "type": "nominal" },
                            {
                                "field": "valuePlusUnits",
                                "title": "Average, June-Sept 2025",
                                "type": "nominal"
                            },
                            {
                                "field": "HistoricalMin",
                                "title": "Historic min",
                                "type": "quantitative"
                            },
                            {
                                "field": "HistoricalMax",
                                "title": "Historic max",
                                "type": "quantitative"
                            }
                        ]
                    }
                },
                {
                    "mark": { "type": "point", "filled": true, "size": 150 },
                    "encoding": {
                        "x": {
                            "field": "Arithmetic Mean",
                            "type": "quantitative",
                            "title": null
                        },
                        "color": {
                            "field": "State",
                            "type": "nominal",
                            "scale": {
                                "domain": CP_STATE_DOMAIN,
                                "range": CP_STATE_RANGE
                            }
                        },
                        "opacity": { "value": 1 },
                        "stroke": {
                            "condition": {
                                "test": "datum['Site Name'] === 'Bayonne'",
                                "value": "black"
                            },
                            "value": null
                        },
                        "strokeWidth": {
                            "condition": {
                                "test": "datum['Site Name'] === 'Bayonne'",
                                "value": 0
                            },
                            "value": 0
                        },
                        "tooltip": [
                            { "field": "Site Name", "type": "nominal" },
                            {
                                "field": "valuePlusUnits",
                                "title": "Average, June-Sept 2025",
                                "type": "nominal"
                            },
                            {
                                "field": "HistoricalMin",
                                "title": "Historic min",
                                "type": "quantitative"
                            },
                            {
                                "field": "HistoricalMax",
                                "title": "Historic max",
                                "type": "quantitative"
                            }
                        ]
                    }
                },
                {
                    "data": {
                        "values": [{ "Site Name": "Leonia" }, { "Site Name": "Mt Ninham" }]
                    },
                    "mark": { "type": "rule", "yOffset": -11 },
                    "encoding": {
                        "color": { "value": "gray" },
                        "y": {
                            "field": "Site Name",
                            "type": "nominal",
                            "scale": {
                                "domain": { "data": "source", "field": "Site Name" },
                                "bandPosition": 0
                            }
                        }
                    }
                }
            ],
            "encoding": {
                "y": {
                    "field": "Site Name",
                    "type": "nominal",
                    "title": null,
                    "sort": { "field": "SortKey" },
                    "scale": { "domain": { "data": "source", "field": "Site Name" } },
                    "axis": { "labelLimit": 220, "labelPadding": 10 }
                }
            }
        },

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
        // NO2 panel
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

        {
            "title": {
                "text": "NO2",
                "anchor": "start",
                "font": "Helvetica",
                "fontWeight": "bold",
                "fontSize": 12
            },
            "transform": [{ "filter": "datum.Parameter === 'NO2'" }],
            "width": 200,
            "height": { "step": 22 },
            "layer": [
                {
                    "mark": { "type": "rule", "strokeWidth": 6, "strokeCap": "round" },
                    "encoding": {
                        "color": {
                            "field": "State",
                            "type": "nominal",
                            "scale": {
                                "domain": CP_STATE_DOMAIN,
                                "range": CP_STATE_RANGE
                            }
                        },
                        "opacity": { "value": 0.5 },
                        "x": {
                            "field": "HistoricalMin",
                            "type": "quantitative",
                            "title": null
                        },
                        "x2": { "field": "HistoricalMax" },
                        "tooltip": [
                            { "field": "Site Name", "type": "nominal" },
                            {
                                "field": "valuePlusUnits",
                                "title": "Average, June-Sept 2025",
                                "type": "nominal"
                            },
                            {
                                "field": "HistoricalMin",
                                "title": "Historic min",
                                "type": "quantitative"
                            },
                            {
                                "field": "HistoricalMax",
                                "title": "Historic max",
                                "type": "quantitative"
                            }
                        ]
                    }
                },
                {
                    "mark": { "type": "point", "filled": true, "size": 150 },
                    "encoding": {
                        "x": {
                            "field": "Arithmetic Mean",
                            "type": "quantitative",
                            "title": null
                        },
                        "color": {
                            "field": "State",
                            "type": "nominal",
                            "scale": {
                                "domain": CP_STATE_DOMAIN,
                                "range": CP_STATE_RANGE
                            }
                        },
                        "opacity": { "value": 1 },
                        "stroke": {
                            "condition": {
                                "test": "datum['Site Name'] === 'Bayonne'",
                                "value": "black"
                            },
                            "value": null
                        },
                        "strokeWidth": {
                            "condition": {
                                "test": "datum['Site Name'] === 'Bayonne'",
                                "value": 0
                            },
                            "value": 0
                        },
                        "tooltip": [
                            { "field": "Site Name", "type": "nominal" },
                            {
                                "field": "valuePlusUnits",
                                "title": "Average, June-Sept 2025",
                                "type": "nominal"
                            },
                            {
                                "field": "HistoricalMin",
                                "title": "Historic min",
                                "type": "quantitative"
                            },
                            {
                                "field": "HistoricalMax",
                                "title": "Historic max",
                                "type": "quantitative"
                            }
                        ]
                    }
                },
                {
                    "data": {
                        "values": [{ "Site Name": "Leonia" }, { "Site Name": "Mt Ninham" }]
                    },
                    "mark": { "type": "rule", "yOffset": -11 },
                    "encoding": {
                        "color": { "value": "gray" },
                        "y": {
                            "field": "Site Name",
                            "type": "nominal",
                            "scale": {
                                "domain": { "data": "source", "field": "Site Name" },
                                "bandPosition": 0
                            }
                        }
                    }
                }
            ],
            "encoding": {
                "y": {
                    "field": "Site Name",
                    "type": "nominal",
                    "title": null,
                    "sort": { "field": "SortKey" },
                    "scale": {
                        "domain": { "data": "source", "field": "Site Name" },
                        "bandPosition": 1
                    },
                    "axis": null
                }
            }
        },

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
        // Ozone panel
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

        {
            "title": {
                "text": "Ozone",
                "anchor": "start",
                "font": "Helvetica",
                "fontWeight": "bold",
                "fontSize": 12
            },
            "transform": [{ "filter": "datum.Parameter === 'Ozone'" }],
            "width": 200,
            "height": { "step": 22 },
            "layer": [
                {
                    "mark": { "type": "rule", "strokeWidth": 6, "strokeCap": "round" },
                    "encoding": {
                        "color": {
                            "field": "State",
                            "type": "nominal",
                            "scale": {
                                "domain": CP_STATE_DOMAIN,
                                "range": CP_STATE_RANGE
                            }
                        },
                        "opacity": { "value": 0.5 },
                        "x": {
                            "field": "HistoricalMin",
                            "type": "quantitative",
                            "title": null
                        },
                        "x2": { "field": "HistoricalMax" },
                        "tooltip": [
                            { "field": "Site Name", "type": "nominal" },
                            {
                                "field": "valuePlusUnits",
                                "title": "Average, June-Sept 2025",
                                "type": "nominal"
                            },
                            {
                                "field": "HistoricalMin",
                                "title": "Historic min",
                                "type": "quantitative"
                            },
                            {
                                "field": "HistoricalMax",
                                "title": "Historic max",
                                "type": "quantitative"
                            }
                        ]
                    }
                },
                {
                    "mark": { "type": "point", "filled": true, "size": 150 },
                    "encoding": {
                        "x": {
                            "field": "Arithmetic Mean",
                            "type": "quantitative",
                            "title": null
                        },
                        "color": {
                            "field": "State",
                            "type": "nominal",
                            "scale": {
                                "domain": CP_STATE_DOMAIN,
                                "range": CP_STATE_RANGE
                            }
                        },
                        "opacity": { "value": 1 },
                        "stroke": {
                            "condition": {
                                "test": "datum['Site Name'] === 'Bayonne'",
                                "value": "black"
                            },
                            "value": null
                        },
                        "strokeWidth": {
                            "condition": {
                                "test": "datum['Site Name'] === 'Bayonne'",
                                "value": 0
                            },
                            "value": 0
                        },
                        "tooltip": [
                            { "field": "Site Name", "type": "nominal" },
                            {
                                "field": "valuePlusUnits",
                                "title": "Average, June-Sept 2025",
                                "type": "nominal"
                            },
                            {
                                "field": "HistoricalMin",
                                "title": "Historic min",
                                "type": "quantitative"
                            },
                            {
                                "field": "HistoricalMax",
                                "title": "Historic max",
                                "type": "quantitative"
                            }
                        ]
                    }
                },
                {
                    "data": {
                        "values": [{ "Site Name": "Leonia" }, { "Site Name": "Mt Ninham" }]
                    },
                    "mark": { "type": "rule", "yOffset": -11 },
                    "encoding": {
                        "color": { "value": "gray" },
                        "y": {
                            "field": "Site Name",
                            "type": "nominal",
                            "scale": {
                                "domain": { "data": "source", "field": "Site Name" },
                                "bandPosition": 0
                            }
                        }
                    }
                }
            ],
            "encoding": {
                "y": {
                    "field": "Site Name",
                    "type": "nominal",
                    "title": null,
                    "sort": { "field": "SortKey" },
                    "scale": {
                        "domain": { "data": "source", "field": "Site Name" },
                        "bandPosition": 1
                    },
                    "axis": null
                }
            }
        }
    ],
    "spacing": 40
};


// ----------------------------------------------------------------------- //
// spec sizing
// ----------------------------------------------------------------------- //

// Write the computed geometry into the three hconcat panels. These are plain
// specs rather than facets, so the width goes directly on each entry.

// The panels always sit in one row, so the authored 200 acts purely as a cap:
// it holds wide layouts at the size they were drawn, and gives way once the
// container is narrower than the row needs. There is deliberately no
// "desktop, leave it alone" branch — the authored row renders 835px wide, so
// every container between 576px and 835px used to overflow.

function applyCRZ(spec, { pane }) {

    spec.hconcat.forEach((p) => { p.width = pane; });

    // The first panel carries the site-label axis; cap it so one long
    // neighborhood name can't push the row past its container.

    const firstAxis = spec.hconcat[0].encoding?.y?.axis;

    if (firstAxis) firstAxis.labelLimit = 80;

}


// ----------------------------------------------------------------------- //
// render
// ----------------------------------------------------------------------- //

async function draw_crz() {

    const el = document.getElementById(CP_CONTAINER2_ID);

    if (!el) return;

    el.innerHTML = "";

    try {

        // Cloning per render keeps the base spec pristine across resizes, and
        // gives embedFitted a fresh spec if it has to re-fit.

        await embedFitted(el, () => cloneSpec(baseSpec_1), CP_FIT.crz, applyCRZ);

    } catch (err) {

        console.error("CP Vega render failed:", err);
        el.innerHTML = "<pre style='white-space:pre-wrap'>Chart failed to render. See console.</pre>";

    }
}


// ----------------------------------------------------------------------- //
// initialization
// ----------------------------------------------------------------------- //

document.addEventListener("DOMContentLoaded", async () => {

    if (typeof vegaEmbed !== "function") {
        console.error(
            "vegaEmbed not available. Are the Vega scripts loaded above this script?",
        );
        return;
    }

    await draw_crz();

    // Re-fit the chart on width changes (no selector to swap).
    
    addResizeHandler(document.getElementById(CP_CONTAINER2_ID), draw_crz);

});
