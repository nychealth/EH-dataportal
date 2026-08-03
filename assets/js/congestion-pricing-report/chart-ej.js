// ======================================================================= //
// chart-ej.js
// ======================================================================= //

// Renders the EJ air-quality chart (#cpVis, #aqChangeVis). Panel sizing, title
// wrapping, and the shared post-period CSV all come from shared.js.

// ----------------------------------------------------------------------- //
// top scope variables
// ----------------------------------------------------------------------- //

// IDs of the two chart containers and the site-description text container;
// referenced throughout for rendering and clearing

const cp_container_id = "cpVis";
const aq_container_id = "aqChangeVis";
const text_container_id = "EJ_text"

// Updates the preposition and site name spans in the heading. The control
// site (Van Wyck) isn't asking "did congestion pricing affect air quality"
// of itself, so its heading collapses to just the site name.
function updateSiteHeading(site) {
    const isControl = CP_SITES[site].isControlSite === true;

    const prefixEl = document.getElementById("site-question-prefix");
    if (prefixEl) prefixEl.style.display = isControl ? "none" : "";

    const prepWrapEl = document.getElementById("site-prep-wrap");
    if (prepWrapEl) prepWrapEl.style.display = isControl ? "none" : "";

    const prepEl = document.getElementById("site-prep");
    if (prepEl) prepEl.textContent = CP_SITES[site].preposition;

    const nameEl = document.getElementById("site-name");
    if (nameEl) nameEl.textContent = getSiteDisplayName(site);

    const suffixEl = document.getElementById("site-question-suffix");
    if (suffixEl) suffixEl.style.display = isControl ? "none" : "";
}

// Default selection
let currentSite = "CRZ";

// ----------------------------------------------------------------------- //
// base Vega-Lite specs
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// baseSpec: the multi-pollutant faceted comparison chart (#cpVis)
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

const baseSpec = {
    
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
        "text": "Change in air quality after congestion pricing",
        "subtitle": ["Comparing observed values to projected values, which estimate air quality if congestion pricing didn't happen.", ""],
        "fontWeight": "bold",
        "anchor": "start",
        "fontSize": 14,
        "baseline": "top",
        "subtitlePadding": 10,
        "subtitleLineHeight": 14,
        "subtitleFontSize": 12,
        "font": "Helvetica",
        "subtitleFont": "Helvetica",
        "subtitleColor": "#585858",
    },
    "config": {
        "header": {
            "labelAlign": "left",
            "labelAnchor": "start",
            "labelFont": "Helvetica",
            "labelFontWeight": "bold",
            "labelFontSize": 12,
            "labelPadding": 20
        },
        "view": { "stroke": null },
        "axisX": { "labelAngle": 0, "domain": false },
        "axisY": {
            "domain": false,
            "ticks": false,
            "tickCount": 3,
            "orient": "left",
            "title": null
        },
        "legend": {
            "orient": "bottom",
            "title": "",
            "symbolOpacity": 1,
            "labelFontSize": 14,
            "labelFontWeight": "bold",
            "labelColor": {
                "expr": "datum.value === 'Observed' ? 'blue' : '#DF7B00'"
            }
        }
    },
    "data": {
        "url": "data/EJ_pollutants_CF_P_1_noCFbar.csv"
    },
    "resolve": { "scale": { "y": "independent" } },
    "transform": [
        { "filter": "datum.Site === 'Mott Haven'" },
        { "calculate": "datum.pred_type === 'predicted' ? 'Observed' : 'Projected'", "as": "language" },
        {
            "calculate": "replace(replace(datum.Unit, '3', '³'), 'mc', 'µ')",
            "as": "UnitFmt"
        },
        {
            "calculate": "datum.pollutant + ' (' + datum.UnitFmt + ')'",
            "as": "ParameterWithUnit"
        },
        {
            "calculate": "datum.LC != null && datum.UC != null && datum.LC !== '' && datum.UC !== '' ? datum.average + ' ' + datum.UnitFmt + ' (' + datum.LC + ', ' + datum.UC + ')' : datum.average + ' ' + datum.UnitFmt",
            "as": "ValueWithUnit"
        },
        {
            "calculate": "datum.time === 'Pre' ? '2024' : datum.time === 'Post' ? '2025' : datum.time",
            "as": "TimeLabel"
        },
        {
            "calculate": "datum.time === 'Pre' ? 'Before congestion pricing' : datum.time === 'Post' && datum.language === 'Observed' ? 'With congestion pricing' : 'If no congestion pricing'",
            "as": "Note"
        }
    ],
    "facet": { "field": "ParameterWithUnit", "title": null },
    "spec": {
        "width": 125,
        "height": 175,
        "encoding": {
            "x": {
                "field": "TimeLabel",
                "type": "nominal",
                "sort": "ascending",
                "title": null
            },
            "color": {
                "field": "language",
                "scale": {
                    "domain": ["Observed", "Projected"],
                    "range": ["blue", "#DF7B00"]
                }
            }
        },
        "layer": [
            {
                "transform": [{ "filter": { "field": "pred_type", "equal": "predicted" } }],
                "mark": {
                    "type": "rule",
                    "strokeWidth": 6,
                    "color": "black",
                    "opacity": 0.2,
                    "strokeCap": "round"
                },
                "encoding": {
                    "y": { "field": "UC", "type": "quantitative" },
                    "y2": { "field": "LC", "type": "quantitative" }
                }
            },
            {
                "mark": { "type": "line", "strokeDash": [2, 2] },
                "encoding": {
                    "y": { "field": "average", "type": "quantitative" }
                }
            },
            {
                "mark": { "type": "circle", "size": 150, "opacity": 1 },
                "encoding": {
                    "y": {
                        "field": "average",
                        "type": "quantitative",
                        "scale": { "domainMin": 0, "nice": false }
                    },
                    "tooltip": [
                        { "field": "Site", "title": "Site", "type": "nominal" },
                        { "field": "pollutant", "title": "Pollutant", "type": "nominal" },
                        { "field": "TimeLabel", "title": "Period", "type": "nominal" },
                        { "field": "language", "title": "Type", "type": "nominal" },
                        { "field": "Note", "title": "Note", "type": "nominal" },
                        { "field": "ValueWithUnit", "title": "Average", "type": "nominal" }
                    ]
                }
            }
        ]
    },
    "columns": 4,
    "spacing": 50
};


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// secondSpec: the Post-only confidence-interval chart (#aqChangeVis)
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

const secondSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
        "text": "Difference between Projected and Observed air quality measurements after implementation",
        "subtitle": [
            "If the confidence interval crosses the zero line, the difference is not statistically significant and the levels of pollution were not different than they would have been if the program never happened.",
            ""
        ],
        "fontSize": 14,
        "baseline": "top",
        "subtitlePadding": 10,
        "subtitleLineHeight": 14,
        "subtitleFontSize": 12,
        "font": "Helvetica",
        "subtitleFont": "Helvetica",
        "subtitleColor": "#585858"
    },
    "config": {
        "header": {
            "labelAlign": "left",
            "labelAnchor": "start",
            "labelFont": "Helvetica",
            "labelFontWeight": "bold",
            "labelFontSize": 12
        },
        "view": {"stroke": null},
        "axisX": {"labelAngle": 0, "domain": false, "ticks": false, "tickCount": 3},
        "axisY": {"domain": false, "orient": "left", "title": null}
    },
    "data": {"values": []},
    "spacing": 35,
    "transform": [
        {
            "calculate": "datum.pollutant === 'PM25' ? 'PM2.5' : datum.pollutant",
            "as": "pollutant"
        }
    ],
    "hconcat": [
        {
            "transform": [
                {"filter": "datum.Site === 'BQE'"},
                {"filter": "datum.pollutant === 'BC'"},
                {
                    "calculate": "datum.lower > 0 || datum.upper < 0 ? 'Significant' : ''",
                    "as": "Significance"
                },
                {
                    "calculate": "datum.lower > 0 || datum.upper < 0 ? 'Significant: change is greater than 0' : 'Not Significant: no change'",
                    "as": "TooltipSignificance"
                },
                {
                    "calculate": "datum.pollutant + (datum.Significance ? ' (' + datum.Significance + ')' : '')",
                    "as": "longTitle"
                }
            ],
            "facet": {"field": "longTitle", "title": null},
            "spec": {
                "width": 125,
                "height": 35,
                "encoding": {
                    "x": {"field": "estimate", "type": "quantitative", "title": null}
                },
                "layer": [
                    {
                        "mark": {
                            "type": "rule",
                            "strokeWidth": 6,
                            "opacity": 0.3,
                            "strokeCap": "round",
                            "color": "purple"
                        },
                        "encoding": {
                            "x": {"field": "lower", "type": "quantitative"},
                            "x2": {"field": "upper", "type": "quantitative"}
                        }
                    },
                    {
                        "mark": {
                            "type": "rule",
                            "color": "#888",
                            "strokeWidth": 2,
                            "strokeDash": [2, 2]
                        },
                        "encoding": {"x": {"datum": 0, "type": "quantitative"}}
                    },
                    {
                        "mark": {"type": "circle", "size": 150, "opacity": 1, "color": "purple"},
                        "encoding": {
                            "x": {
                                "field": "estimate",
                                "type": "quantitative",
                                "scale": {"nice": false}
                            },
                            "tooltip": [
                                {"field": "Site", "title": "Site", "type": "nominal"},
                                {"field": "pollutant", "title": "Pollutant", "type": "nominal"},
                                {"field": "Estimate (95% CI)", "title": "Difference", "type": "nominal"},
                                {"field": "TooltipSignificance", "title": "Significance", "type": "nominal"}
                            ]
                        }
                    }
                ]
            }
        },
        {
            "transform": [
                {"filter": "datum.Site === 'BQE'"},
                {"filter": "datum.pollutant === 'NO'"},
                {
                    "calculate": "datum.lower > 0 || datum.upper < 0 ? 'Significant' : ''",
                    "as": "Significance"
                },
                {
                    "calculate": "datum.lower > 0 || datum.upper < 0 ? 'Significant: change is greater than 0' : 'Not Significant: no change'",
                    "as": "TooltipSignificance"
                },
                {
                    "calculate": "datum.pollutant + (datum.Significance ? ' (' + datum.Significance + ')' : '')",
                    "as": "longTitle"
                }
            ],
            "facet": {"field": "longTitle", "title": null},
            "spec": {
                "width": 125,
                "height": 35,
                "encoding": {
                    "x": {
                        "field": "estimate",
                        "type": "quantitative",
                        "title": null,
                        "scale": {"domain": [-5.25, 8.25]}
                    }
                },
                "layer": [
                    {
                        "mark": {
                            "type": "rule",
                            "strokeWidth": 6,
                            "opacity": 0.3,
                            "strokeCap": "round",
                            "color": "purple"
                        },
                        "encoding": {
                            "x": {"field": "lower", "type": "quantitative"},
                            "x2": {"field": "upper", "type": "quantitative"}
                        }
                    },
                    {
                        "mark": {
                            "type": "rule",
                            "color": "#888",
                            "strokeWidth": 2,
                            "strokeDash": [2, 2]
                        },
                        "encoding": {"x": {"datum": 0, "type": "quantitative"}}
                    },
                    {
                        "mark": {"type": "circle", "size": 150, "opacity": 1, "color": "purple"},
                        "encoding": {
                            "x": {
                                "field": "estimate",
                                "type": "quantitative",
                                "scale": {"domain": [-5.25, 8.25], "nice": false}
                            },
                            "tooltip": [
                                {"field": "Site", "title": "Site", "type": "nominal"},
                                {"field": "pollutant", "title": "Pollutant", "type": "nominal"},
                                {"field": "Estimate (95% CI)", "title": "Difference", "type": "nominal"},
                                {"field": "TooltipSignificance", "title": "Significance", "type": "nominal"}
                            ]
                        }
                    }
                ]
            }
        },
        {
            "transform": [
                {"filter": "datum.Site === 'BQE'"},
                {"filter": "datum.pollutant === 'NO2'"},
                {
                    "calculate": "datum.lower > 0 || datum.upper < 0 ? 'Significant' : ''",
                    "as": "Significance"
                },
                {
                    "calculate": "datum.lower > 0 || datum.upper < 0 ? 'Significant: change is greater than 0' : 'Not Significant: no change'",
                    "as": "TooltipSignificance"
                },
                {
                    "calculate": "datum.pollutant + (datum.Significance ? ' (' + datum.Significance + ')' : '')",
                    "as": "longTitle"
                }
            ],
            "facet": {"field": "longTitle", "title": null},
            "spec": {
                "width": 125,
                "height": 35,
                "encoding": {
                    "x": {
                        "field": "estimate",
                        "type": "quantitative",
                        "title": null,
                        "scale": {"domain": [-5.25, 8.25]}
                    }
                },
                "layer": [
                    {
                        "mark": {
                            "type": "rule",
                            "strokeWidth": 6,
                            "opacity": 0.3,
                            "strokeCap": "round",
                            "color": "purple"
                        },
                        "encoding": {
                            "x": {"field": "lower", "type": "quantitative"},
                            "x2": {"field": "upper", "type": "quantitative"}
                        }
                    },
                    {
                        "mark": {
                            "type": "rule",
                            "color": "#888",
                            "strokeWidth": 2,
                            "strokeDash": [2, 2]
                        },
                        "encoding": {"x": {"datum": 0, "type": "quantitative"}}
                    },
                    {
                        "mark": {"type": "circle", "size": 150, "opacity": 1, "color": "purple"},
                        "encoding": {
                            "x": {
                                "field": "estimate",
                                "type": "quantitative",
                                "scale": {"domain": [-5.25, 8.25], "nice": false}
                            },
                            "tooltip": [
                                {"field": "Site", "title": "Site", "type": "nominal"},
                                {"field": "pollutant", "title": "Pollutant", "type": "nominal"},
                                {"field": "Estimate (95% CI)", "title": "Difference", "type": "nominal"},
                                {"field": "TooltipSignificance", "title": "Significance", "type": "nominal"}
                            ]
                        }
                    }
                ]
            }
        },
        {
            "transform": [
                {"filter": "datum.Site === 'BQE'"},
                {"filter": "datum.pollutant === 'PM2.5'"},
                {
                    "calculate": "datum.lower > 0 || datum.upper < 0 ? 'Significant' : ''",
                    "as": "Significance"
                },
                {
                    "calculate": "datum.lower > 0 || datum.upper < 0 ? 'Significant: change is greater than 0' : 'Not Significant: no change'",
                    "as": "TooltipSignificance"
                },
                {
                    "calculate": "datum.pollutant + (datum.Significance ? ' (' + datum.Significance + ')' : '')",
                    "as": "longTitle"
                }
            ],
            "facet": {"field": "longTitle", "title": null},
            "spec": {
                "width": 125,
                "height": 35,
                "encoding": {
                    "x": {
                        "field": "estimate",
                        "type": "quantitative",
                        "title": null,
                        "scale": {"domain": [-5.25, 8.25]}
                    }
                },
                "layer": [
                    {
                        "mark": {
                            "type": "rule",
                            "strokeWidth": 6,
                            "opacity": 0.3,
                            "strokeCap": "round",
                            "color": "purple"
                        },
                        "encoding": {
                            "x": {"field": "lower", "type": "quantitative"},
                            "x2": {"field": "upper", "type": "quantitative"}
                        }
                    },
                    {
                        "mark": {
                            "type": "rule",
                            "color": "#888",
                            "strokeWidth": 2,
                            "strokeDash": [2, 2]
                        },
                        "encoding": {"x": {"datum": 0, "type": "quantitative"}}
                    },
                    {
                        "mark": {"type": "circle", "size": 150, "opacity": 1, "color": "purple"},
                        "encoding": {
                            "x": {
                                "field": "estimate",
                                "type": "quantitative",
                                "scale": {"domain": [-5.25, 8.25], "nice": false}
                            },
                            "tooltip": [
                                {"field": "Site", "title": "Site", "type": "nominal"},
                                {"field": "pollutant", "title": "Pollutant", "type": "nominal"},
                                {"field": "Estimate (95% CI)", "title": "Difference", "type": "nominal"},
                                {"field": "TooltipSignificance", "title": "Significance", "type": "nominal"}
                            ]
                        }
                    }
                ]
            }
        }
    ]
}


// ----------------------------------------------------------------------- //
// spec derivation + sizing
// ----------------------------------------------------------------------- //

// Clone a base spec and patch in the Site filter. Two factories rather than one
// call returning both, because a chart that overflows and has to be re-fitted
// needs a fresh spec of its own — vegaEmbed mutates whatever it is handed.

function buildCpSpec(site) {

    const spec = cloneSpec(baseSpec);

    spec.transform[0].filter = `datum.Site === '${site}'`;

    // The control site is the baseline the others are projected from, so there
    // is no Observed/Projected distinction to label.
    spec.spec.encoding.color.legend = (site || currentSite) !== "Van Wyck";

    return spec;
}

// The rows are attached after cloning, so the deep clone never copies the
// dataset — only the authored placeholder.

function buildAqSpec(site, rows) {

    const spec = cloneSpec(secondSpec);

    spec.data = { values: csvRows(rows) };

    spec.hconcat?.forEach((chartSpec) => {
        if (Array.isArray(chartSpec.transform) && chartSpec.transform[0]) {
            chartSpec.transform[0].filter = `datum.Site === '${site}'`;
        }
    });

    return spec;
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// panel geometry
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// #cpVis is a plain facet — the width goes on the repeated panel spec.

function applyFacet(spec, { cols, spacing, pane }) {

    spec.columns = cols;

    if (spec.spacing != null) spec.spacing = spacing;
    if (spec.spec?.width != null) spec.spec.width = pane;

}

// #aqChangeVis is an hconcat of four single-pollutant facets. `columns` is not
// in the JSON schema for hconcat, but the compiler passes it straight through
// to the Vega layout, so the four panes do reflow to a 2x2 grid — checked
// against the compiled output. Don't "fix" this into a concat.

function applyHconcatFacet(spec, { cols, spacing, pane }) {

    spec.columns = cols;

    if (spec.spacing != null) spec.spacing = spacing;

    spec.hconcat?.forEach((chartSpec) => {
        if (chartSpec?.spec?.width != null) chartSpec.spec.width = pane;
    });

}


// ----------------------------------------------------------------------- //
// render
// ----------------------------------------------------------------------- //

// Draws both faceted charts for the given site

async function draw(site) {
    
    const cpEl = document.getElementById(cp_container_id);
    const aqEl = document.getElementById(aq_container_id);
    
    if (!cpEl || !aqEl) return;
    
    // Lock heights before clearing so the page doesn't jump while containers
    // are momentarily empty between renders
    
    cpEl.style.minHeight = cpEl.offsetHeight + "px";
    if (aqEl.offsetHeight > 0) aqEl.style.minHeight = aqEl.offsetHeight + "px";
    
    cpEl.innerHTML = "";
    aqEl.innerHTML = "";
    
    // Unhide before measuring: a container left display:none by a previous
    // no-CI site reports clientWidth 0, so the panels and the wrapped title
    // would be sized against fitChart's fallback width instead of the real one.

    const showCI = CP_SITES[site].showCI !== false;

    if (showCI) aqEl.style.display = "";

    let cpLayout;

    try {

        cpLayout = await embedFitted(cpEl, () => buildCpSpec(site), CP_FIT.ej, applyFacet);

        cpEl.style.minHeight = "";

    } catch (err) {

        console.error("CP Vega render failed:", err);
        cpEl.innerHTML = "<pre style='white-space:pre-wrap'>Chart failed to render. See console.</pre>";

    }

    if (showCI) {

        // Side by side on desktop the two charts share a panel width so their
        // columns line up. Once reflowed, the AQ chart sizes from its own
        // container instead, so the narrow row fills rather than inheriting
        // a gap sized for a different grid.

        const aqAvail = aqEl.clientWidth || cpEl.clientWidth;
        const aligned = aqAvail >= 576 ? cpLayout?.pane : undefined;

        try {
            const rows = await loadCsv(CP_AQ_POST_URL);
            await embedFitted(aqEl, () => buildAqSpec(site, rows), CP_FIT.aq, applyHconcatFacet, aligned);
            aqEl.style.minHeight = "";
        } catch (err) {
            console.error("AQ change Vega render failed:", err);
            aqEl.innerHTML = "<pre style='white-space:pre-wrap'>Chart failed to render. See console.</pre>";
        }

    } else {

        aqEl.style.display = "none";
        aqEl.style.minHeight = "";

    }
}


// ----------------------------------------------------------------------- //
// site selector UI + change handling
// ----------------------------------------------------------------------- //

// Shared handler called by both the button click and the select change event

async function handleSiteChange(site) {
    
    currentSite = site;
    
    const textElement = document.getElementById(text_container_id);
    
    if (textElement && CP_SITES[site].text) textElement.innerHTML = CP_SITES[site].text;
    
    updateSiteHeading(site);
    
    await draw(site);
    
}

function renderButtons() {
    
    createSiteSelector({
        
        wrapId: "cpSiteButtons",
        sites: site_names,
        idPrefix: "",
        
        getCurrent: () => currentSite,
        onChange: handleSiteChange,
        
    });
    
}


// ----------------------------------------------------------------------- //
// initialization
// ----------------------------------------------------------------------- //

document.addEventListener("DOMContentLoaded", async () => {
    
    // --- guard: required elements + vegaEmbed must be present --- //
    
    const el = document.getElementById(cp_container_id);
    if (!el) return;
    
    const info = document.getElementById(text_container_id);
    if (!info) return;
    
    if (typeof vegaEmbed !== "function") {
        console.error("vegaEmbed not available. Are the Vega scripts loaded above this script?");
        return;
    }
    
    // --- set initial text + heading for the default site --- //
    
    if (info && CP_SITES[currentSite].text) {
        info.innerHTML = CP_SITES[currentSite].text;
    }
    
    renderButtons();
    updateSiteHeading(currentSite);
    
    // --- draw the initial chart and wire up resize handling --- //
    
    await draw(currentSite);
    
    // Re-render the chart on width changes; swap the select/button selector
    // when crossing the 768px breakpoint.
    
    addResizeHandler(el, () => draw(currentSite), renderButtons);
    
});
