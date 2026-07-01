// ======================================================================= //
// chart-crz.js
// ======================================================================= //

// Renders the CRZ chart (#cpVis2); consumes CP_STATE_DOMAIN/RANGE from
// shared.js and wrapTitle from chart-ej.js (guarded, must load after both).

    const CP_CONTAINER2_ID = "cpVis2";

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
                                "legend": null,
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
                                "legend": null,
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
                                "legend": null,
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
                                "legend": null,
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
                                "legend": null,
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
                                "legend": null,
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

    // Size the three hconcat panels to the container on mobile only. The first
    // panel carries a wide site-label axis; subtract an allowance for it, divide
    // the rest among the panels, shrink the label limit, and wrap the long title
    // (a long single-line title otherwise stretches the canvas). On desktop the
    // authored spec is left untouched.
    function fitCRZ(spec, el) {
        const avail = (el && el.clientWidth) || 700;
        if (avail >= 576) return; // desktop: leave the authored spec unchanged
        const spacing = spec.spacing || 40;
        const labelAllow = 100; // y-label column on the first panel
        const margin = 24;      // slack for per-panel x-axis label overhang
        const panels = spec.hconcat.length;
        const w = Math.floor((avail - labelAllow - spacing * (panels - 1) - margin) / panels);
        const panelW = Math.max(40, Math.min(w, 200));
        spec.hconcat.forEach((p) => { p.width = panelW; });

        const firstAxis = spec.hconcat[0].encoding?.y?.axis;
        if (firstAxis) firstAxis.labelLimit = 80;

        // wrapTitle is defined in the EJ chart block earlier on this page;
        // skip gracefully if it isn't present.
        if (typeof wrapTitle === "function") wrapTitle(spec, avail);
    }

    async function draw_crz() {
        const el = document.getElementById(CP_CONTAINER2_ID);
        if (!el) return;

        el.innerHTML = "";

        // Clone so the base spec stays pristine across resize re-renders
        const spec = cloneSpec(baseSpec_1);
        fitCRZ(spec, el);

        try {
            await vegaEmbed(el, spec, {
                actions: false,
                renderer: "canvas",
            });
        } catch (err) {
            console.error("CP Vega render failed:", err);
            el.innerHTML =
                "<pre style='white-space:pre-wrap'>Chart failed to render. See console.</pre>";
        }
    }

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

