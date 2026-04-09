// ======================================================================= //
// bar.js
// ======================================================================= //

/*
    STATUS:
        - Geo is not filtered, in data. We need something like 'selected Geography' coming in from Map; we can filter in this spec.

*/

// console.log(">> bar.js");

const renderBar = (
    data, 
    metadata,
    geography,
    timePeriod
) => {

    console.log("** renderBar");

    // // document.getElementById('viewDescription').innerHTML = 'Hover over the map or chart for more information.'

    // // console.log("data [renderBar]", data);
    // // console.log("metadata [renderBar]", metadata);
    // // console.log("geo [renderBar]", geography);

    // // ----------------------------------------------------------------------- //
    // // get unique time in data
    // // ----------------------------------------------------------------------- //
    
    // const barTimes =  [...new Set(data.map(item => item.TimePeriod))];

    // // console.log("barTimes [bar.js]", barTimes);

    // // ----------------------------------------------------------------------- //
    // // set metadata
    // // ----------------------------------------------------------------------- //

    // let barGeoType            = data[0]?.GeoType;
    // let barMeasurementType    = metadata[0]?.MeasurementType;
    // let barTime = barTimes[0];
    // let displayType;
    // let subtitle;
    // let isPercent;
    // let topoFile = '';

    // const hasCI = data.some(d => /\(.*\)/.test(d.CI)); // looks to see if there are parentheses in the CI field, if yes, true
    // // console.log('has CI?', hasCI)



    // // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // // use some conditionals
    // // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // if (barMeasurementType.includes('Percent') || barMeasurementType.includes('percent') && !barMeasurementType.includes('percentile')) {
    //     isPercent = true;
    //     displayType = '%';
    //     subtitle = barMeasurementType;
        
    // } else {
    //     isPercent = false;
    //     displayType = metadata[0]?.DisplayType;
    //     subtitle = barMeasurementType + `${displayType ? ` (${displayType})` : ''}`;
    // }


    // /* ----------------------------------------------------------------------- //
    // // modify bar spec:
    //     - If the measurement Type is a mean, then give it a dot with a gray bar. Dots better represent Means.
    //     - if the data has CIs, then, give a gray CI bar
    //     - Else, just give a standard bar
    // // -----------------------------------------------------------------------  */

    // let barDisplay
    
    // if (barMeasurementType.includes('Mean') || barMeasurementType.includes('mean') ) {

    //             barDisplay = [
    //         {
    //                 "mark": {"type": "bar", "tooltip": true},
    //                 "encoding": {
    //                     "x": {
    //                         "field": "Value",
    //                         "type": "quantitative",
    //                         "title": null,
    //                         "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3}
    //                     },
    //                     "tooltip": [
    //                         {
    //                             "field": "Geography", 
    //                             "title": "Neighborhood"
    //                         },
    //                         {
    //                             "field": "TimePeriod",
    //                             "title": "Time period"
    //                         }
    //                     ],
    //                     "y": {"field": "GeoID", "sort": "-x", "axis": null},
    //                     "color": {"value": "#f1f1f1"}
    //                 }
    //         },
    //         {
    //             "mark": {
    //                 "type": "circle",
    //                 "size": 100,
    //                 "tooltip": true,
    //                 "stroke": "#161616"
    //             },
    //             "params": [
    //                 {
    //                     "name": "highlight",
    //                     "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}
    //                 }
    //             ],
    //             "encoding": {
    //                 "x": {
    //                     "field": "Value",
    //                     "type": "quantitative",
    //                     "title": null,
    //                     "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3}
    //                 },
    //                 "tooltip": [
    //                     {"field": "Geography", "title": "Neighborhood"},
    //                     {"field": "valueLabel", "title": metadata[0].MeasureName},
    //                     {"field": "TimePeriodID", "title": 'TimePeriodID'}
    //                 ],
    //                 "y": {"field": "GeoID", "sort": "-x", "axis": null},
    //                 "color": {
    //                     "bin": false,
    //                     "field": "Value",
    //                     "type": "quantitative",
    //                     "scale": {"scheme": {"name": "viridis", "extent": [1, 0]}},
    //                     "legend": false
    //                 },
    //                 // "stroke": {
    //                 //     "value": "transparent"
    //                 // },
    //                 "stroke": {
    //                     "condition": [
    //                         {"param": "highlight", "empty": false, "value": "black"},
    //                         {
    //                             "test": "datum.GeoID == selectedGeo",
    //                             "value": "black"
    //                         }
    //                     ],
    //                     "value": "transparent"
    //                 },
    //                 "strokeWidth": {
    //                     "value": 2
    //                 }
    //             }
    //         },
    //         /*
    //         {

    //         }
    //         */
    //         /*
    //         {
    //         "description": "This layer was a rule that's triggered on map hover. Commented out in favor of keeping the stroke instead; we could use this to trigger a text label instead of using a Tooltip."
    //         "mark": {
    //         "type": "rule",
    //         "xOffset": 15,
    //         "strokeWidth": 1
    //         },
    //         "encoding": {
    //         "y": {"field": "GeoID", "sort": "-x"},
    //         "x": {"field": "Value", "type": "quantitative"},
    //         "color": {
    //         "condition": {
    //         "test": "datum.GeoID == selectedGeo",
    //         "value": "black"
    //         },
    //         "value": "transparent"
    //         }
    //         }
    //         }
    //         */
    //     ]  

 

    // } else if (hasCI == true) {

    //     barDisplay = null
    // }
    
    // else {
      
    //     barDisplay = [
    //         {
    //             "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
    //             "params": [
    //                 {
    //                     "name": "highlight",
    //                     "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}
    //                 }
    //             ],
    //             "encoding": {
    //                 "x": {
    //                     "field": "Value",
    //                     "type": "quantitative",
    //                     "title": null,
    //                     "axis": {"labelAngle": 0, "labelFontSize": 11, "tickCount": 3}
    //                 },
    //                 "tooltip": [
    //                     {"field": "Geography", "title": "Neighborhood"},
    //                     {"field": "valueLabel", "title": metadata[0].MeasureName},
    //                     {"field": "TimePeriodID", "title": 'TimePeriodID'}
    //                 ],
    //                 "y": {"field": "GeoID", "sort": "x", "axis": null},
    //                 "color": {
    //                     "bin": false,
    //                     "field": "Value",
    //                     "type": "quantitative",
    //                     "scale": {"scheme": {"name": "viridis", "extent": [1, 0]}},
    //                     "legend": false
    //                 },
    //                 // "stroke": {
    //                 //     "value": "transparent"
    //                 // },
    //                 "stroke": {
    //                     "condition": [
    //                         {"param": "highlight", "empty": false, "value": "black"},
    //                         {
    //                             "test": "datum.GeoID == selectedGeo",
    //                             "value": "black"
    //                         }
    //                     ],
    //                     "value": "transparent"
    //                 },
    //                 "strokeWidth": {
    //                     "value": 2
    //                 }
    //             }
    //         },
    //         /*
    //         {
    //         "description": "This layer was a rule that's triggered on map hover. Commented out in favor of keeping the stroke instead; we could use this to trigger a text label instead of using a Tooltip."
    //         "mark": {
    //         "type": "rule",
    //         "xOffset": 15,
    //         "strokeWidth": 1
    //         },
    //         "encoding": {
    //         "y": {"field": "GeoID", "sort": "-x"},
    //         "x": {"field": "Value", "type": "quantitative"},
    //         "color": {
    //         "condition": {
    //         "test": "datum.GeoID == selectedGeo",
    //         "value": "black"
    //         },
    //         "value": "transparent"
    //         }
    //         }
    //         }
    //         */
    //     ]   

    // }


    // // ----------------------------------------------------------------------- //
    // // define spec
    // // ----------------------------------------------------------------------- //
    
    // var barSpec = {
    //     "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    //     "title": {
    //         "text": "Indicator name",
    //         "subtitlePadding": 10,
    //         "fontWeight": "normal",
    //         "anchor": "start",
    //         "fontSize": 0,
    //         "font": "sans-serif",
    //         "baseline": "top",
    //         "subtitle": metadata[0].MeasureName,
    //         "subtitleFontSize": 10
    //     },
    //     "data": {
    //         "values": data,
    //         "format": {"parse": {"Value": "number"}}
    //     },
    //     "config": {
    //         "view": {"stroke": "transparent"},
    //         "axisY": {"domain": false, "ticks": false, "labelBaseline": "bottom"},
    //         "axisX": {"domain": false, "ticks": false},
    //         "legend": {"disable": true},
    //         "scale": {"invalid": {"color": {"value": "#808080"}}}
    //     },
    //     "autosize": {"type": "fit", "contains": "padding"},
    //     "transform": [
    //         {"filter": `datum.GeoType === '${geography}'`},
    //         {"calculate": `datum.DisplayValue + ' ${displayType}'`, "as": "valueLabel"},
    //         {
    //             "calculate": "datum.CI && datum.CI !== '' ? split(replace(datum.CI, /[()]/g, ''), ', ')[0] : datum.Value * .95", // hard set for test
    //             "as": "ciLow"
    //         },
    //         {
    //             "calculate": "datum.CI && datum.CI !== '' ? split(replace(datum.CI, /[()]/g, ''), ', ')[1] : datum.Value * 1.05", // hard set for test
    //             "as": "ciHigh"
    //         },
    //         {
    //         "calculate": "datum.CI ? replace(replace(datum.CI, /[()]/g, ''), /, /, ' to ') : null",
    //         "as": "CInoParens"
    //         }
    //     ],
    //     "height": 500,
    //     "width": "container",
    //     "layer": barDisplay
    // }

    
    // // ----------------------------------------------------------------------- //
    // // render chart
    // // ----------------------------------------------------------------------- //

    // // console.log('vega-lite spec:')
    // // console.log(barSpec)

    // const vegaSpec = vegaLite.compile(barSpec).spec;

    // // console.log("vegaSpec", vegaSpec);
    
    // const geoSignal = {
    //     "name": "selectedGeo",
    //     "value": null
    // }
    
    // vegaSpec.signals.push(geoSignal)
    
    
    // vegaEmbed("#barHolder", vegaSpec, {

    //     actions: {
    //         export: { png: false, svg: false },
    //         source: false,
    //         compiled: false,
    //         editor: true 
    //     }
        
    // }).then(result => {
        
    //     window.myVegaView = result.view; // store the vega view globally
        
    //     let lastHighlightedLayer = null;

    //     result.view.addEventListener('mouseover', (event, item) => {
    //         if (item && item.datum && item.datum.GeoID) {
    //             const geoID = item.datum.GeoID;

    //             const mapAPI = window.mapInterop;
    //             if (!mapAPI) return; // map not ready yet

    //             const layer = mapAPI.geoIDtoLayer[geoID];

    //             if (layer && layer !== lastHighlightedLayer) {

    //                 // Reset previous
    //                 if (lastHighlightedLayer) {
    //                     mapAPI.resetHighlight(lastHighlightedLayer);
    //                 }

    //                 // Highlight new
    //                 mapAPI.highlightFeature({ target: layer });
    //                 lastHighlightedLayer = layer;

    //                 mapAPI.updateHoverUI(layer.feature.properties);
    //             }
    //         }
    //     });

    //     result.view.addEventListener('mouseout', () => {
    //         const mapAPI = window.mapInterop;
    //         if (!mapAPI) return;

    //         if (lastHighlightedLayer) {
    //             mapAPI.resetHighlight(lastHighlightedLayer);
    //             lastHighlightedLayer = null;
    //         }

    //         mapAPI.clearHoverUI();
    //     });
        
    // });

    // // send info for printing
    // vizYear = barTime;
    // vizGeography = barGeoType;
    // // vizSource = metadata[0].Sources;
    // // printSpec = barspec;
    // chartType = 'bar';

    // // console.log(barspec);

    // // ----------------------------------------------------------------------- //
    // // Send chart data to download
    // // ----------------------------------------------------------------------- //

    // // let dataForDownload = [...barspec.data.values] // create a copy

    // // let downloadTable = aq.from(dataForDownload)
    // //     .derive({Indicator: `'${indicatorName}: ${barMeasurementType}${displayType && ` (${displayType})`}'`}) // add indicator name and type column
    // //     .select(aq.not('GeoRank', "end_period", "start_period", "ban_summary_flag", "GeoTypeShortDesc", "MeasureID", "DisplayValue")) // remove excess columns
    
    // // console.log("downloadTable [renderBar]");
    // // downloadTable.print()

    // // CSVforDownload = downloadTable.toCSV()

}