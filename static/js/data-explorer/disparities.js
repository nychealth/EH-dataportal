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
        .select("GeoType", "GeoID", "Time", "end_period", "Value", "DisplayValue")
        .reify()
    
    
    // get disparity data
    
    await fetch(data_repo + "/" + data_branch + `/indicators/data/${disparityIndicatorId}.json`)
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
            
            
            // join with primary data

            disparitiyData = 
                aqPrimaryData
                .join(aqDisparityData, [["GeoType", "GeoID", "end_period"], ["GeoType", "GeoID", "end_period"]])

                // drop citywide and boro rows

                .filter(d => d.GeoType !== 'Citywide')

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

const renderDisparities = (primaryMetadata, disparityMeasureId) => {

    console.log("** renderDisparities");

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

    const disparityIndicatorId   = disparityIndicator[0].IndicatorID
    const disparityIndicatorName = disparityIndicator[0].IndicatorName
    const disparityMeasureType   = disparityMetadata[0].MeasurementType
    const disparitySources       = disparityMetadata[0].Sources
    const disparitysAbout        = disparityMetadata[0].how_calculated

    // load disparities measure data

    loadDisparitiyData(disparityMetadata, disparityIndicatorId)

    // created combined about and sources info

    const combinedAbout = 
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primaryAbout}</p>
        <h6>${disparityIndicatorName} - ${disparityMeasureType}</h6>
        <p>${disparitysAbout}</p>`;

    const combinedSources = 
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primarySources}</p>
        <h6>${disparityIndicatorName} - ${disparityMeasureType}</h6>
        <p>${disparitySources}</p>`;

    // render combined info

    renderAboutSources(combinedAbout, combinedSources);
    
    // define spec
    
    setTimeout(() => {
        
        var disspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "config": {
                "background": "#FFFFFF",
                // "title": {"anchor": "start", "fontSize": 18, "font": "Calibri"},
                "axisX": {
                    // "domain": true,
                    // "domainColor": "#000000",
                    // "domainWidth": 1,
                    // "grid": false,
                    // "labelFontSize": 12,
                    "labelAngle": 0,
                    // "tickColor": "#000000",
                    // "tickSize": 5,
                    // "titleFontSize": 12,
                    // "titlePadding": 10
                },
                
                "axisY": {
                    // "domain": false,
                    // "domainWidth": 1,
                    // "grid": true,
                    // "gridColor": "#DEDDDD",
                    // "gridWidth": 1,
                    // "labelFontSize": 12,
                    // "labelPadding": 8,
                    // "ticks": false,
                    // "titleFontSize": 12,
                    // "titlePadding": 10,
                    // "titleFont": "Lato",
                    // "titleAngle": 0,
                    // "titleY": -10,
                    // "titleX": 18
                },
                
                
                "view": { "stroke": "transparent" },
                
                "range": {
                    "category": [
                        "#1696d2",
                        "#000000",
                        "#fdbf11",
                        "#ec008b",
                        "#d2d2d2",
                        "#55b748"
                    ]
                },
                
                "line": { "color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 3 },
                
                
                "point": { "filled": true },
                "text": {
                    "color": "#1696d2",
                    "fontSize": 11,
                    "align": "center",
                    "fontWeight": 400,
                    "size": 11
                }
            },
            "data": {
                "values": disparitiyData,
            },
            "width": "container",
            "height": 550,
            "encoding": {
                "x": {
                    "field": "Time_1",
                    "type": "nominal",
                    "title": `${disparityIndicatorName} - ${disparityMeasureType}`
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
                                "title": null
                            }
                        },
                        "y": {
                            "field": "median",
                            "type": "quantitative",
                            "title": `${primaryMeasurementType} ${primaryDisplay && `(${primaryDisplay})`} (Median of Neighborhood)`
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
                                "title": "Year",
                                "field": "Time_1",
                                "type": "nominal"
                            },
                            {
                                "field": "hi",
                                "type": "nominal"
                            },
                            {
                                "field": "med",
                                "type": "nominal"
                            },
                            {
                                "field": "low",
                                "type": "nominal"
                            },
                        ]
                    },
                    "params": [
                        {
                            "name": "hover",
                            "select": {
                                "type": "point",
                                "fields": [
                                    "Time_1",
                                    "Tertile"
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