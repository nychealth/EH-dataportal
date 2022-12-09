// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// function to create the dataset for the disparities chart
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// need to filter for relevant disparities geo (current = GeoType, future += GeoEntity)

const loadDisparitiyData = async (disparityMetadata, disparityIndicatorId) => {

    // extract disparity metadata

    const disparityMeasureId      = disparityMetadata[0].MeasureID
    const aqDisparityMeasureTimes = aq.from(disparityMetadata[0].AvailableTimes)

    // create primary data

    const aqPrimaryData = 
        aq.from(fullDataLinksObjects) // fullDataTrendObjects is created by the joinData function
        .select("GeoType", "GeoRank", "GeoID", "Time", "end_period", "Value", "DisplayValue")
        .reify()

    // aqPrimaryData.print()

    let maxGeoRank = Math.max(aqPrimaryData.objects()[0].GeoRank);
    // console.log("maxGeoRank", maxGeoRank);
    let filteredPrimaryData = aqPrimaryData.filter(`obj => obj.GeoRank == ${maxGeoRank}`)

    // filteredPrimaryData.print({limit: Infinity})
    
    // get disparity data
    
    await fetch(`${data_repo}${data_branch}/indicators/data/${disparityIndicatorId}.json`)
        .then(response => response.json())
        .then(data => {

            // create disparities data
            
            const aqDisparityData = aq.from(data)

                // filter for disparity measure

                .filter(`d => d.MeasureID === ${disparityMeasureId}`)

                // join with disparity measure times

                .join(aqDisparityMeasureTimes, ["Time", "TimeDescription"])

                // create tertile column

                .derive({
                    bin: aq.bin('Value', { maxbins: 3 }),
                })
                .derive({
                    Tertile: aq.escape( d => d.bin === 0 && 'low' || d.bin === 20 && 'med' || d.bin === 40 && 'hi')
                })

                // pare down columns

                .select("GeoType", "GeoID", "Time", "end_period", "bin", "Tertile")
                .reify()
            
            
            // (inner) join with primary data

            disparitiyData = 
                filteredPrimaryData
                .join(aqDisparityData, [["GeoType", "GeoID", "end_period"], ["GeoType", "GeoID", "end_period"]])

                // summarize by  grouping
                .groupby("Time_1", "Tertile", "GeoType")
                .rollup({median: d => op.median(d.Value)})

                // turn into JavaScript object

                .objects()
            
        })
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// function to render the disparities chart
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// this function is called when the "Show Disparities" button is clicked. it
//  in turn calls "loadDisparitiyData".

const renderDisparities = async (primaryMetadata, disparityMeasureId) => {

    console.log("** renderDisparities");
    
    // remove disparities event listeners
    $(btnShowDisparities).off()

    // add trend event listener
    $(btnShowDisparities).on("click", e => showTrend(e));

    // switch button text
    btnShowDisparities.innerText = "Show Trend";


    // extract primary metadata

    let primaryIndicatorName   = indicatorName
    let primaryMeasurementType = primaryMetadata[0].MeasurementType;
    let primaryDisplay         = primaryMetadata[0].DisplayType;
    let primaryAbout           = primaryMetadata[0]?.how_calculated;
    let primarySources         = primaryMetadata[0].Sources;

    // get disparities poverty indicator metadata - "indicators" is a global object created by loadIndicator

    const disparityIndicator = indicators.filter(indicator =>
        indicator.Measures.some(m =>
            m.MeasureID === disparityMeasureId
        )
    );

    const disparityMetadata = disparityIndicator[0].Measures.filter(
        m => m.MeasureID === disparityMeasureId
    );

    // put metadata into fields

    const disparityIndicatorId     = disparityIndicator[0].IndicatorID
    const disparityIndicatorName   = disparityIndicator[0].IndicatorName
    const disparityMeasurementType = disparityMetadata[0].MeasurementType
    const disparitySources         = disparityMetadata[0].Sources
    const disparitysAbout          = disparityMetadata[0].how_calculated

    // load disparities measure data (creates `disparitiyData`)

    await loadDisparitiyData(disparityMetadata, disparityIndicatorId)
    
    // get min value for adjusting axis
    
    let aqData = aq.from(disparitiyData);
    let median = aqData.array("median");
    let medianMin = Math.min.apply(null, median);

    // created combined about and sources info

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

    
    // get unique unreliability notes (dropping empty)

    const comb_unreliability = data.map(d => d.Note_1).concat(data.map(d => d.Note_2))
    const disp_unreliability = [...new Set(comb_unreliability)].filter(d => !d == "");

    // console.log("disp_unreliability", disp_unreliability);

    document.querySelector("#trend-unreliability").innerHTML = ""; // blank to start

    for (let i = 0; i < disp_unreliability.length; i++) {
        
        document.querySelector("#trend-unreliability").innerHTML += "<div class='fs-sm text-muted'>" + disp_unreliability[i] + "</div>" ;
        
    }
    
    
    // define spec
    
    setTimeout(() => {
        
        let disspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "config": {
                "background": "#FFFFFF",
                "axisX": {
                    "labelAngle": 0,
                    "labelOverlap": "parity",
                    "labelFontSize": 11,
                    "titleFontSize": 13,
                    "titleFont": "sans-serif"
                },
                
                "axisY": {
                    "labelAngle": 0,
                    "labelFontSize": 11,
                    "titleFontSize": 13
                },
                "legend": {
                    "labelFontSize": 14,
                    "titleFontSize": 14,
                    "symbolSize": 140,
                    "titlePadding": 10
                },
                "lineBreak": "\n",
                
                "view": { "stroke": "transparent" },
                
                "range": {
                    "category": [
                        "#FFC425",
                        "#21918c",
                        "#440154"
                    ]
                },
                
                "line": { "color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 3 },
                
                
                "point": { "filled": true },
                "text": {
                    "color": "#1696d2",
                    "fontSize": 11,
                    "fontWeight": 400,
                    "size": 11
                }
            },
            "data": {
                "values": disparitiyData,
            },
            "width": "container",
            "height": 500,
            "title": { 
                "anchor": "start", 
                "fontSize": 13, 
                "font": "sans-serif",
                "baseline": "top",
                "text": `${primaryMeasurementType} ${primaryDisplay && `(${primaryDisplay})`}`,
                "dy": -10
            },
            "encoding": {
                "x": {
                    "field": "Time_1",
                    "type": "nominal",
                    "title": null
                }
            },
            "layer": [
                {
                    "encoding": {
                        "color": {
                            "field": "Tertile",
                            "type": "nominal",
                            "legend": {
                                "orient": "right",
                                // "title": `${disparityIndicatorName}, ${disparityMeasurementType}`
                                "title": "Neighborhood \n poverty level",
                                "values": ["hi", "med", "low"]
                            }
                        },
                        "y": {
                            "field": "median",
                            "type": "quantitative",
                            "title": null,
                            "scale": {"domainMin": medianMin, "nice": true}
                        }
                    },
                    "layer": [
                        {
                            "mark": {
                                "type": "line",
                                "point": { "filled": false, "fill": "white" }
                            }
                            
                        },
                        {
                            "transform": [
                                {
                                    "filter": {
                                        "param": "hover",
                                        "empty": false
                                    }
                                }
                            ],
                            "mark": "point"
                        }
                    ]
                },
                {
                    "transform": [
                        {
                            "pivot": "Tertile",
                            "value": "median",
                            "groupby": [
                                "Time_1"
                            ]
                        }
                    ],
                    "mark": "rule",
                    "encoding": {
                        "opacity": {
                            "condition": {
                                "value": 0.3,
                                "param": "hover",
                                "empty": false
                            },
                            "value": 0
                        },
                        "tooltip": [
                            {
                                "title": "Time",
                                "field": "Time_1",
                                "type": "nominal"
                            },
                            {
                                "field": "hi",
                                "type": "quantitative",
                                "format": ",.1f"
                            },
                            {
                                "field": "med",
                                "type": "quantitative",
                                "format": ",.1f"
                            },
                            {
                                "field": "low",
                                "type": "quantitative",
                                "format": ",.1f"
                            },
                        ]
                    },
                    "params": [
                        {
                            "name": "hover",
                            "select": {
                                "type": "point",
                                "fields": [
                                    "Time_1"
                                ],
                                "nearest": true,
                                "on": "mouseover",
                                "clear": "mouseout"
                            }
                        }
                    ]
                }
            ]
        }
        
        vegaEmbed("#trend", disspec);
        
    }, 300)

}