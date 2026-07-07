// ======================================================================= //
// sticky-header.js
// ======================================================================= //

// Sticky header behavior, badge clicks (calls window.cpReportZoomToSite),
// and drawExplainChart (#explainChart, #explainChart2).

// ----------------------------------------------------------------------- //
// sticky header positioning
// ----------------------------------------------------------------------- //

$(function () {
    var $window = $(window);
    var $headers = $('.cp-sticky-header');

    if (!$headers.length) return;

    // --- wrap each header to preserve layout height when it goes fixed --- //

    $headers.each(function () {
        var $h = $(this);
        $h.wrap('<div class="cp-follow-wrap" />');
        $h.parent().height($h.outerHeight());
    });

    // --- measure natural (non-fixed) header positions --- //

    function recordPositions() {

        // Measure each header in its natural (non-fixed) geometry. A stuck
        // header carries cp-is-fixed, which shrinks it (smaller font/padding),
        // so reading outerHeight() while fixed records a wrong origHeight and
        // shifts the push-up handoff. Clear the fixed state first, re-sync the
        // placeholder height in case the header reflowed across a breakpoint,
        // then let update() re-apply the fixed state from these fresh numbers.

        $headers.removeClass('cp-is-fixed').css('top', '');
        $headers.each(function () {
            var $h = $(this);
            var natH = $h.outerHeight();
            $h.parent().height(natH);
            $h.data('origTop', $h.parent().offset().top)
                .data('origHeight', natH);
        });
    }

    // --- initial measurement + re-measure triggers --- //

    // Initial measurement

    recordPositions();

    // Re-measure after full page load and after async charts (Vega) have rendered

    $(window).on('load', function () {
        recordPositions();
        update();
        setTimeout(function () { recordPositions(); update(); }, 1000);
    });

    // Re-measure on resize, debounced — resize fires rapidly during a drag
    // and recordPositions() reads layout per header (200ms matches the
    // addResizeHandler debounce used by the chart blocks above).

    var resizeTimer;
    $(window).on('resize.cp-sticky', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            recordPositions();
            update();
        }, 200);
    });

    // --- apply fixed/unfixed state on scroll --- //

    function update() {
        var scrollTop = $window.scrollTop();

        $headers.each(function (i) {
            var $h = $(this);
            var origTop = $h.data('origTop');
            var h = $h.data('origHeight');

            if (scrollTop < origTop) {
                $h.removeClass('cp-is-fixed').css('top', '');
            } else {
                var fixedTop = 0;
                var $next = $headers.eq(i + 1);

                if ($next.length) {
                    var nextOrigTop = $next.data('origTop');
                    if (scrollTop > nextOrigTop - h) {
                        // Next header is displacing this one
                        fixedTop = -(scrollTop - (nextOrigTop - h));
                    }
                }

                $h.addClass('cp-is-fixed').css('top', fixedTop + 'px');
            }
        });
    }

    $window.on('scroll.cp-sticky', update);
    update();

});


// ----------------------------------------------------------------------- //
// badge click handlers
// ----------------------------------------------------------------------- //

$(function () {

    $('.site-badge').on('click', function () {

        var siteKey = $(this).data('site');
        var siteName = CP_BADGE_TO_SITE[siteKey];
        var info = (siteName && CP_SITES[siteName].badgeInfo) || 'No information available for this site.';
        $('#site-info-box').text(info);

        // Highlight the clicked badge
        $('.site-badge').removeClass('active');
        $(this).addClass('active');

        // Zoom to site on the map
        if (siteName && typeof window.cpReportZoomToSite === 'function') {
            window.cpReportZoomToSite(siteName);
        }

    });

});


// ----------------------------------------------------------------------- //
// explainer charts (#explainChart, #explainChart2)
// ----------------------------------------------------------------------- //

// Renders the two static example charts used to explain the observed-vs-
// hypothetical methodology; spec is a fixed, illustrative dataset (not
// live site data).

function drawExplainChart() {

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // spec: the observed-vs-hypothetical PM2.5 explainer chart (#explainChart)
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": "container",
        "height": 225,
        "config": {
            "header": {
                "labelAlign": "left",
                "labelAnchor": "start",
                "labelFont": "Helvetica",
                "labelFontWeight": "bold",
                "labelFontSize": 12
            },
            "view": { "stroke": null },
            "axisX": { "labelAngle": 0, "domain": false },
            "axisY": {
                "domain": false,
                "ticks": false,
                "tickCount": 4,
                "orient": "left",
                "title": null
            }
        },
        "data": {
            "values": [
                {
                    "Var": "Hypothetical",
                    "Parameter": "PM2.5",
                    "Time": "2024",
                    "Value": 7.97,
                    "Unit": "mcg/m3"
                },
                {
                    "Var": "Observed",
                    "Parameter": "PM2.5",
                    "Time": "2024",
                    "Value": 7.97,
                    "LC": 7.24,
                    "UC": 8.66,
                    "Unit": "mcg/m3"
                },

                {
                    "Var": "Hypothetical",
                    "Parameter": "PM2.5",
                    "Time": "2025",
                    "Value": 7.27,
                    "Unit": "mcg/m3"
                },
                {
                    "Var": "Observed",
                    "Parameter": "PM2.5",
                    "Time": "2025",
                    "Value": 7.86,
                    "LC": 7.24,
                    "UC": 8.49,
                    "Unit": "mcg/m3"
                }
            ]
        },
        "resolve": { "scale": { "y": "shared" } },
        "transform": [
            {
                "calculate": "replace(replace(datum.Unit, '3', '³'), 'mc', 'µ')",
                "as": "UnitFmt"
            },
            {
                "calculate": "datum.Parameter + ' (' + datum.UnitFmt + ')'",
                "as": "ParameterWithUnit"
            },
            {
                "calculate": "datum.LC != null && datum.UC != null && datum.LC !== '' && datum.UC !== '' ? datum.Value + ' ' + datum.UnitFmt + ' (' + datum.LC + ', ' + datum.UC + ')' : datum.Value + ' ' + datum.UnitFmt",
                "as": "ValueWithUnit"
            },
            {
                "calculate": "datum.Time === '2024' ? 'Before congestion pricing' : datum.Time === '2025' ? 'With congestion pricing' : datum.Time",
                "as": "TimeLabel"
            },
            {
                "calculate": "datum.Time === '2024' ? 'Before congestion pricing' : datum.Time === '2025' && datum.Var === 'Observed' ? 'With congestion pricing' : 'If no congestion pricing'",
                "as": "Note"
            }
        ],
        "encoding": {
            "x": {
                "field": "Time",
                "type": "nominal",
                "sort": ["Before congestion pricing", "With congestion pricing"],
                "title": null
            }
        },
        "layer": [
            {
                "mark": {
                    "type": "rule",
                    "strokeWidth": 8,
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
                    "y": { "field": "Value", "type": "quantitative" },
                    "color": {
                        "field": "Var",
                        "legend": {
                            "orient": "top",
                            "title": "",
                            "labelFontSize": 14,
                            "labelFontWeight": "bold",
                            "labelColor": {
                                "expr": "datum.value === 'Observed' ? 'blue' : 'darkorange'"
                            }
                        },
                        "scale": {
                            "domain": ["Observed", "Hypothetical"],
                            "range": ["blue", "darkorange"]
                        }
                    }
                }
            },
            {
                "mark": { "type": "circle", "size": 200 },
                "encoding": {
                    "y": {
                        "field": "Value",
                        "type": "quantitative",
                        "scale": { "domainMin": 0, "nice": false }
                    },
                    "color": { "field": "Var" },
                    "tooltip": [
                        { "field": "Parameter", "title": "Pollutant", "type": "nominal" },
                        { "field": "Time", "title": "Time", "type": "nominal" },
                        { "field": "Var", "title": "Type", "type": "nominal" },
                        { "field": "Note", "title": "Note", "type": "nominal" },
                        { "field": "ValueWithUnit", "title": "Average", "type": "nominal" }
                    ]
                }
            }
        ]
    };
    vegaEmbed('#explainChart', spec, { actions: false, renderer: 'canvas' });

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // spec2: the confidence-interval explainer chart (#explainChart2)
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const spec2 = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "config": {
            "view": { "stroke": null },
            "axisX": { "labelAngle": 0, "domain": false, "ticks": false, "tickCount": 3 },
            "axisY": { "domain": false, "orient": "left", "title": null }
        },
        "data": {
            "url": "data/AQ_Post.csv"
        },
        "transform": [
            { "filter": "datum.Site === 'Deegan'" },
            { "filter": "datum.pollutant === 'PM25'" },
            {"calculate": "datum.pollutant === 'PM25' ? 'PM2.5' : datum.pollutant", "as": "pollutant"},
            { "calculate": "datum.lower > 0 || datum.upper < 0 ? 'Significant' : 'Not significant'", "as": "Significance" }
        ],
        "width": "container",
        "height": 35,
        "encoding": {
            "x": { "field": "estimate", "type": "quantitative", "title": null },
            "color": { "value": "purple" }
        },
        "layer": [
            {
                "mark": {
                    "type": "rule",
                    "strokeWidth": 6,
                    "opacity": 0.3,
                    "strokeCap": "round"
                },
                "encoding": {
                    "x": { "field": "lower", "type": "quantitative" },
                    "x2": { "field": "upper", "type": "quantitative" }
                }
            },
            {
                "mark": {
                    "type": "rule",
                    "color": "#888",
                    "strokeWidth": 2,
                    "strokeDash": [2, 2]
                },
                "encoding": { "x": { "datum": 0, "type": "quantitative" } }
            },
            {
                "mark": { "type": "circle", "size": 150, "opacity": 1 },
                "encoding": {
                    "x": {
                        "field": "estimate",
                        "type": "quantitative",
                        "scale": { "nice": false }
                    },
                    "tooltip": [
                        { "field": "Site", "title": "Site", "type": "nominal" },
                        {"field": "pollutant", "title": "Pollutant", "type": "nominal" },
                        {
                            "field": "Estimate (95% CI)",
                            "title": "Difference",
                            "type": "nominal"
                        },
                                                {
                            "field": "Significance",
                            "title": "Significance",
                            "type": "nominal"
                        }
                    ]
                }
            }
        ]
    }

    vegaEmbed('#explainChart2', spec2, { actions: false, renderer: 'canvas' });

}


// ----------------------------------------------------------------------- //
// initialization
// ----------------------------------------------------------------------- //

document.addEventListener("DOMContentLoaded", () => {
    if (typeof vegaEmbed !== "function") {
        console.error("vegaEmbed not available. Are the Vega scripts loaded above this script?");
        return;
    }

    drawExplainChart();
});
