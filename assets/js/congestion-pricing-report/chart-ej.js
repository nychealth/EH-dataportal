// ======================================================================= //
// chart-ej.js
// ======================================================================= //

// Renders the EJ air-quality chart (#cpVis, #aqChangeVis); also defines
// wrapText/wrapTitle, used by chart-crz.js.

// ----------------------------------------------------------------------- //
// top scope variables
// ----------------------------------------------------------------------- //

// IDs of the two chart containers and the site-description text container;
// referenced throughout for rendering and clearing

const cp_container_id = "cpVis";
const aq_container_id = "aqChangeVis";
const text_container_id = "EJ_text"

// Updates both the preposition span and the site name span in the heading
function updateSiteHeading(site) {
    const prepEl = document.getElementById("site-prep");
    if (prepEl) prepEl.textContent = CP_SITES[site].preposition;

    const nameEl = document.getElementById("site-name");
    if (nameEl) nameEl.textContent = getSiteDisplayName(site);
}

// Default selection
let currentSite = "Deegan";

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
                "expr": "datum.value === 'Observed' ? 'blue' : 'darkorange'"
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
                    "range": ["blue", "darkorange"]
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
    "text": [
      "Difference between Projected and Observed air quality measurements after implementation"
    ],
    "subtitle": [
      "If the confidence interval crosses zero, the difference is not statistically significant and congestion pricing didn't",
      "cause air quality changes.",
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
  "data": {"url": "data/AQ_Post.csv"},
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
                {"field": "Significance", "title": "Significance", "type": "nominal"}
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
                {"field": "Significance", "title": "Significance", "type": "nominal"}
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
                {"field": "Significance", "title": "Significance", "type": "nominal"}
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
                {"field": "Significance", "title": "Significance", "type": "nominal"}
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

// Clones both base specs and patches in the Site filter for the given site

function specForSite(site) {

    const spec = cloneSpec(baseSpec);
    const spec2 = cloneSpec(secondSpec);
    const isVanWyck = (site || currentSite) === "Van Wyck";

    spec.transform[0].filter = `datum.Site === '${site}'`;
    spec2.hconcat?.forEach((chartSpec) => {
        if (Array.isArray(chartSpec.transform) && chartSpec.transform[0]) {
            chartSpec.transform[0].filter = `datum.Site === '${site}'`;
        }
    });
    spec.spec.encoding.color.legend = !isVanWyck;

    return { spec, spec2 };
}


// Word-wrap a string to fit `maxPx` at the given font size, returning an array
// of lines (Vega-Lite renders each array element as its own title line). A long
// single-line title/subtitle otherwise stretches the whole canvas wider than
// its container, regardless of how narrow the plotting panels are. The 0.6
// factor is a conservative average glyph width (em) for sans-serif.

function wrapText(text, maxPx, fontSize) {

    const charsPerLine = Math.max(8, Math.floor(maxPx / (fontSize * 0.6)));
    const lines = [];

    let line = "";

    for (const word of text.split(" ")) {

        const candidate = line ? line + " " + word : word;

        if (candidate.length > charsPerLine && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }

    if (line) lines.push(line);

    return lines;
}

// Wrap a spec's title + subtitle text to the container width. On a wide
// (desktop) container the text fits on one line, so the spec is unchanged.

function wrapTitle(spec, avail) {

    if (!spec.title) return;

    const tw = avail - 10;

    if (typeof spec.title.text === "string") {
        spec.title.text = wrapText(spec.title.text, tw, spec.title.fontSize || 14);
    }

    if (spec.title.subtitle != null) {

        const sub = Array.isArray(spec.title.subtitle) ? spec.title.subtitle : [spec.title.subtitle];
        const out = [];
        sub.forEach((s) => s ? out.push(...wrapText(s, tw, spec.title.subtitleFontSize || 12)) : out.push(""));
        spec.title.subtitle = out;

    }
}

// Vega-Lite's width:"container" doesn't work on faceted charts, so size the
// panels ourselves. Only ever shrinks below the authored width (125) and drops
// 4 columns to 2 below Bootstrap's sm breakpoint (576px) — so wide/desktop
// layouts are unchanged while narrow screens reflow to a 2-column grid.

// Approximate width (px) of the y-axis label gutter in baseSpec's facets.
// Tune this by comparing rendered widths in devtools — start around 26–30.
const AXIS_LABEL_RESERVE = 28;

function fitFacet(spec, el, widthOverride, axisReserve = 0) {

    const avail = (el && el.clientWidth) || 600;
    const cols = avail < 576 ? 2 : 4;
    const spacing = spec.spacing || 0;
    const w = Math.floor((avail - spacing * (cols - 1)) / cols);
    const panelWidth = widthOverride ?? Math.max(60, Math.min(w, 125));

    if (spec) spec.columns = cols;

    if (spec?.spec?.width != null) {
        // shrink the plot area to make room for the y-axis gutter,
        // so total column width (axis + plot) == panelWidth
        spec.spec.width = Math.max(30, panelWidth - axisReserve);
    }

    if (Array.isArray(spec?.hconcat)) {
        spec.hconcat.forEach((chartSpec) => {
            if (chartSpec?.spec?.width != null) {
                // no axis here, so plot width == full panelWidth
                chartSpec.spec.width = panelWidth;
            }
        });
    }

    wrapTitle(spec, avail);

    return panelWidth; // raw pane width, pre-axis-reserve — pass to the paired chart
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

    const { spec, spec2 } = specForSite(site);

    // Size both faceted charts to their containers before embedding
    const panelWidth = fitFacet(spec, cpEl, undefined, AXIS_LABEL_RESERVE);
    fitFacet(spec2, aqEl, panelWidth);

    try {

        await vegaEmbed(cpEl, spec, {
            actions: false,
            renderer: "canvas",
        });
        
        cpEl.style.minHeight = "";

    } catch (err) {

        console.error("CP Vega render failed:", err);
        cpEl.innerHTML = "<pre style='white-space:pre-wrap'>Chart failed to render. See console.</pre>";

    }

    if (CP_SITES[site].showCI !== false) {

        aqEl.style.display = "";

        try {
            await vegaEmbed(aqEl, spec2, {
                actions: false,
                renderer: "canvas",
            });
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
