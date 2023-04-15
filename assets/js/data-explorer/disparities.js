// ======================================================================= //
// disparities.js
// ======================================================================= //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// function to render the disparities chart
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// this function is called when the "Show Disparities" button is clicked. it
//  in turn calls "loaddisparityData".

const renderDisparities = async (primaryMetadata, disparityMeasureId) => {

    console.log("** renderDisparities");

    // ----------------------------------------------------------------------- //
    // toggle button
    // ----------------------------------------------------------------------- //

    let btnLinksMeasures = $("#dropdownLinksMeasures")

    // disable links measures dropdown
    $(btnLinksMeasures).addClass("disabled");
    $(btnLinksMeasures).attr('aria-disabled', true);

    // switch button text
    btnShowDisparities.innerText = "Show Links";

    // remove disparities event listeners
    $(btnShowDisparities).off()

    // add links event listener
    $(btnShowDisparities).on("click", e => {

        showLinks(e)
        // reenable links measures dropdown
        $(btnLinksMeasures).removeClass("disabled");
        $(btnLinksMeasures).attr('aria-disabled', false);

        // switch button text
        btnShowDisparities.innerText = "Show Disparities";

        $(btnShowDisparities).on("click", () => renderDisparities(primaryMetadata, disparityMeasureId))

    });


    // ----------------------------------------------------------------------- //
    // extract primary metadata
    // ----------------------------------------------------------------------- //

    const primaryIndicatorName   = indicatorName
    const primaryMeasurementType = primaryMetadata[0].MeasurementType;
    const primaryMeasureId       = primaryMetadata[0].MeasureID;
    const primaryMeasureName     = primaryMetadata[0].MeasureName;
    const primaryAbout           = primaryMetadata[0]?.how_calculated;
    const primarySources         = primaryMetadata[0].Sources;
    const primaryDisplay         = primaryMetadata[0].DisplayType;

    // get disparities poverty indicator metadata - "indicators" is a global object created by loadIndicator

    const disparityIndicator = indicators.filter(indicator =>
        indicator.Measures.some(m =>
            m.MeasureID === disparityMeasureId
        )
    );

    const disparityMetadata = disparityIndicator[0].Measures.filter(
        m => m.MeasureID === disparityMeasureId
    );

    // ----------------------------------------------------------------------- //
    // put metadata into fields
    // ----------------------------------------------------------------------- //

    const disparityIndicatorId     = disparityIndicator[0].IndicatorID
    const disparityIndicatorName   = disparityIndicator[0].IndicatorName

    const disparityMeasurementType = disparityMetadata[0].MeasurementType
    const disparityMeasureName     = disparityMetadata[0].MeasureName
    // const disparityMeasureId       = disparityMetadata[0].MeasureID
    const disparityDisplay         = disparityMetadata[0].DisplayType;

    const disparitySources         = disparityMetadata[0].Sources
    const disparitysAbout          = disparityMetadata[0].how_calculated


    // ----------------------------------------------------------------------- //
    // load disparities measure data (creates `disparityData`)
    // ----------------------------------------------------------------------- //
    
    // use a seeded RNG to add a random offset to the categorical x-axis. Using
    //  primaryMeasureId as the seed means that the disparity chart for this measure
    //  will be the same every time

    const myrng = new Math.seedrandom(primaryMeasureId)

    // await loaddisparityData(disparityMetadata, disparityIndicatorId)
    let aqDisparityData = await createJoinedLinksData(primaryMeasureId, disparityMeasureId)
        .then(data => {

            let dispData = data
                .derive({ PovRank: d => (d.Value_2 > 30 ? 4 : (d.Value_2 > 20 ? 3 : ( d.Value_2 > 10 ? 2 : 1))) })
                .derive({ randomOffsetX: aq.escape(d => d.PovRank + (myrng()*2 - 1)) })

            // console.log("dispData");
            // dispData.print()

            return dispData;
        })

    disparityData = aqDisparityData.objects()

    console.log(">> disparityData [renderDisparities]", disparityData);

    // debugger;

    const primaryTime   = disparityData[0].Time_1;
    const disparityTime = disparityData[0].Time_2;
    const geoTypeShortDesc = disparityData[0].GeoTypeShortDesc_1;

    // ----------------------------------------------------------------------- //
    // get min value for adjusting axis
    // ----------------------------------------------------------------------- //

    // let aqData = aq.from(disparityData);
    // let median = aqData.array("median");
    // let medianMin = Math.min.apply(null, median);


    // ----------------------------------------------------------------------- //
    // created combined about and sources info
    // ----------------------------------------------------------------------- //

    const combinedAbout =
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primaryAbout}</p>
        <h6>${disparityIndicatorName} - ${disparityMeasurementType}</h6>
        <p>${disparitysAbout}</p>`;

    const combinedSources =
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primarySources}</p>
        <h6>${disparityIndicatorName} - ${disparityMeasurementType}</h6>
        <p>${disparitySources}</p>`;

    // render combined info

    renderAboutSources(combinedAbout, combinedSources);

    // ----------------------------------------------------------------------- //
    // set chart properties
    // ----------------------------------------------------------------------- //
    
    let bubbleSize = window.innerWidth < 576 ? 100 : 200;
    let height = window.innerWidth < 576 ? 350 : 500;


    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    const comb_unreliability = disparityData.map(d => d.Note_1).concat(disparityData.map(d => d.Note_2))
    const disp_unreliability = [...new Set(comb_unreliability)].filter(d => !d == "");

    // console.log("disp_unreliability", disp_unreliability);

    document.querySelector("#links-unreliability").innerHTML = ""; // blank to start

    disp_unreliability.forEach(element => {

        document.querySelector("#links-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + element + "</div>";

    });

    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //

    setTimeout(() => {

        let disspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": `${primaryIndicatorName} ${primaryMeasurementType} and poverty scatterplot`,
            "title": {
                "text": [`${primaryIndicatorName && `${primaryIndicatorName}`}`, `${primaryMeasurementType && `${primaryMeasurementType}`} ${primaryDisplay && `${primaryDisplay}`} (${primaryTime})`],
                "align": "left", 
                "anchor": "start", 
                "fontSize": 15, 
                "fontWeight": "normal",
                "font": "sans-serif",
                "baseline": "top",
                "dy": -10,
                "limit": 1000
            },
            "width": "container",
            "height": height,
            "config": {
                "background": "#FFFFFF",
                "axisX": {
                    "labelFontSize": 11,
                    "titleFontSize": 15,
                    "titleFont": "sans-serif",
                    "titlePadding": 10,
                    "titleFontWeight": "normal"
                },
                "axisY": {
                    "labelFontSize": 11,
                    "titleFontSize": 0, // to turn off axis title
                    "labelAngle": 0,
                    "titlePadding": 10,
                    "titleFont": "sans-serif",
                    "tickMinStep": 1
                },
                "view": { "stroke": "transparent" },
                "text": {
                    "color": "#1696d2",
                    "fontSize": 11,
                    "align": "center",
                    "fontWeight": 400,
                    "size": 11
                }
            },
            "data": {
                "values": disparityData
            },
            "transform": [
            {
                "calculate": "(datum.Value_2 > 30 ? 'Very high (> 30%)' : (datum.Value_2 > 20  ? 'High (20-30%)' : ( datum.Value_2 > 2  ? 'Moderate (10-20%)' : 'Low (0-10%)')))",
                "as": "PovCat"
            } // gives us labels
            ],
            "layer": [
            {
                "mark": {
                    "type": "circle",
                    "filled": true,
                    "size": bubbleSize,
                    "stroke": "#7C7C7C",
                    "strokeWidth": 2
                },
                "params": [
                {
                    "name": "hover",
                    "value": "#7C7C7C",
                    "select": {"type": "point", "on": "mouseover"}
                }
                ],
                "encoding": {
                    "y": {
                        "field": "Value_1",
                        "type": "quantitative",
                        "axis": {
                            "tickCount": 4
                        },
                    },
                    "x": {
                        "title": [`${disparityIndicatorName && `${disparityIndicatorName}`}`, `${disparityMeasurementType} ${disparityDisplay && `(${disparityDisplay})`} (${disparityTime})`],
                        "field": "PovRank", // Changed
                        "type": "ordinal",
                        "axis": { // added
                            "labelExpr": "(datum.label == 4 ? 'Very high (> 30%)' : (datum.label == 3  ? 'High (20-30%)' : ( datum.label == 2  ? 'Moderate (10-20%)' : 'Low (0-10%)')))",
                            "labelAlign": "center",
                            "labelAngle": 0
                        }
                    },
                    "xOffset": {"field": "randomOffsetX", "type": "quantitative"}, // Jitter
                    "tooltip": [
                    {
                        "title": "Borough", 
                        "field": "Borough", 
                        "type": "nominal"
                    },
                    {
                        "title": geoTypeShortDesc, 
                        "field": "Geography_1", 
                        "type": "nominal"
                    },
                    {
                        "title": "Time", 
                        "field": "Time_2", 
                        "type": "nominal"
                    },
                    {
                        "title": primaryMeasureName,
                        "field": "Value_1",
                        "type": "quantitative",
                        "format": ",.1~f"
                    },
                    {
                        "title": disparityMeasureName,
                        "field": "Value_2",
                        "type": "quantitative",
                        "format": ",.1~f"
                    },
                    {
                        "title": disparityIndicatorName,
                        "field": "PovCat",
                        "type": "nominal"
                    }
                    ],
                    "fill": {
                        "title": "PovCat", 
                        "field": "PovRank", 
                        "type": "nominal", 
                        "legend": null,
                        "scale": {
                            "range": [
                                "#1696d2", 
                                "#ffa500", 
                                "#ec008b", 
                                "#55b748"
                            ]
                        },
                    },
                    "stroke": {
                        "condition": {
                            "param": "hover", 
                            "empty": false, 
                            "value": "#7C7C7C"
                        },
                        "value": null
                    }
                }
            }
            ]
        }
        vegaEmbed("#links", disspec);

    }, 300)

}