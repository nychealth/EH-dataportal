// ======================================================================= //
// map.js
// ======================================================================= //

// console.log(">> map.js");

const renderMap = (
    data, 
    metadata
) => {

    console.log("** renderMap");

    // document.getElementById('viewDescription').innerHTML = 'Hover over the map or chart for more information.'

    // console.log("data [renderMap]", data);
    // console.log("metadata [renderMap]", metadata);

    // ----------------------------------------------------------------------- //
    // get unique time in data
    // ----------------------------------------------------------------------- //
    
    const mapTimes =  [...new Set(data.map(item => item.TimePeriod))];

    // console.log("mapTimes [map.js]", mapTimes);

    // ----------------------------------------------------------------------- //
    // set metadata
    // ----------------------------------------------------------------------- //

    let mapGeoType            = data[0]?.GeoType;
    // let mapMeasurementType    = metadata[0]?.MeasurementType;
    let mapTime = mapTimes[0];
    let displayType;
    let subtitle;
    let isPercent;
    let topoFile = '';
    // let geojson;

    const hasCI = data.some(d => /\(.*\)/.test(d.CI)); // looks to see if there are parentheses in the CI field, if yes, true
    // console.log('has CI?', hasCI)



    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // use some conditionals
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // if (mapMeasurementType.includes('Percent') || mapMeasurementType.includes('percent') && !mapMeasurementType.includes('percentile')) {
    //     isPercent = true;
    //     displayType = '%';
    //     subtitle = mapMeasurementType;
        
    // } else {
    //     isPercent = false;
    //     displayType = metadata[0]?.DisplayType;
    //     subtitle = mapMeasurementType + `${displayType ? ` (${displayType})` : ''}`;
    // }


    // ----------------------------------------------------------------------- //
    // bubble map for non-rates (counts/numbers)
    // ----------------------------------------------------------------------- //

    // let markType = 'geoshape'  
    // let encode = {"shape": {"field": "geo", "type": "geojson"}}
    // let strokeWidth = 1.25
    // let legend;

    // if (mapMeasurementType.includes('Number') ||
    //     mapMeasurementType.includes('number') || 
    //     mapMeasurementType.includes('Total population')
    // ) {
    //     // circle
    // } else {
    //     // choro
    // }


    // --- Create a lookup for data and attributes ---
    const dataLookup = {};
    data.forEach(item => {
        dataLookup[item.GeoID] = item;  // store the full record
    });


    // ----------------------------------------------------------------------- //
    // get unique unreliability notes (dropping empty)
    // ----------------------------------------------------------------------- //

    // const map_unreliability = [...new Set(data.map(d => d.Note))].filter(d => !d == "");

    // document.querySelector("#map-unreliability").innerHTML = "<span class='fs-xs'><strong>Notes:</strong></span> "; // blank to start
    // document.getElementById("map-unreliability").classList.add('hide')  // blank to start


    // map_unreliability.forEach(element => {

    //     document.querySelector("#map-unreliability").innerHTML += "<div class='fs-xs'>" + element + "</div>" ;
    //     document.getElementById('map-unreliability').classList.remove('hide')

    // });

    // ----------------------------------------------------------------------- //
    // set geo file based on geo type, and render bar filtering for geotype
    // ----------------------------------------------------------------------- //

    // console.log("mapGeoType [renderMap]", mapGeoType);

    topoFile = getGeoFile(mapGeoType)

    renderBar(data, metadata, mapGeoType)

    // ----------------------------------------------------------------------- //
    // define spec
    // ----------------------------------------------------------------------- //
    
    // Initialize the map

    const map = L.map('map', {
        zoomControl: false
    }).setView([40.700142, -73.921546], 11);


    // Add a basemap

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
        attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 0
    }).addTo(map);


    fetch(`${data_repo}${data_branch}/geography/${topoFile}`)
        .then(response => response.json())
        .then(topology => {
            
            // --- Convert TopoJSON to GeoJSON ---

            let geojson = topojson.feature(topology, topology.objects.collection);

            // console.log("geojson [renderMap fetch]", geojson);

            // --- Attach data to each feature ---

            geojson.features.forEach((feature, i) => {

                if (i == 0) {
                    // console.log("***** properties", feature.properties)
                }

                const geoID = feature.properties.GEOCODE;
                const matchedData = dataLookup[geoID];

                if (matchedData) {

                    feature.properties = {
                        ...feature.properties,  // keep original properties (like GEOCODE, GEONAME, etc)
                        ...matchedData          // add all fields from matchedData
                    };

                } else {
                    feature.properties.dataValue = null;  // mark as missing data
                }
            });

            return geojson;
            
            
        })
        .then(geojson => {
            
            // --------------------------------------------------------------------------- //
            // Lookup to match GeoID → Leaflet layer
            // --------------------------------------------------------------------------- //
            const geoIDtoLayer = {};   
            // --------------------------------------------------------------------------- //

            // --- Add the GeoJSON to the map ---

            // console.log("geojson [renderMap]", geojson);

            const geojsonLayer = L.geoJson(geojson, {

                style: styleFeature,
                onEachFeature: (feature, layer) => {

                    // console.log(">>> feature", feature.properties);
                    // console.log(">>> layer", layer);
                    
                    // Store reference so we can highlight later using GeoID from chart
                    
                    const geoID = feature.properties.GeoID || feature.properties.GEOCODE;
                    if (geoID) {
                        geoIDtoLayer[geoID] = layer;
                    }
                    
                    // ----------------------------------------------------------------------- //
                    
                    layer.bindPopup(createPopupContent(feature.properties));
                    
                    layer.on('click', (e) => {
                        const props = feature.properties;

                        console.log("** click", feature.properties);

                        if (window.myVegaView) {
                            window.myVegaView.signal("selectedGeo", props.GeoID).run();
                        }
                        
                    });

                    let currentlyHighlighted = null
                    
                    layer.on('mouseover', (e) => {
                        const props = feature.properties;

                        // 🔥 HARD RESET: clear ALL highlights
                        geojsonLayer.eachLayer((l) => {
                            geojsonLayer.resetStyle(l);
                        });

                        // Apply highlight to current
                        highlightFeature(e);

                        updateHoverUI(props);

                        if (window.myVegaView) {
                            window.myVegaView.signal("selectedGeo", props.GeoID).run();
                        }
                    });
                    
                    layer.on('mouseout', (e) => {
                        geojsonLayer.resetStyle(e.target);

                        clearHoverUI();

                        if (window.myVegaView) {
                            window.myVegaView.signal("selectedGeo", null).run();
                        }
                    });
                    
                }
            }).addTo(map);

            window.mapInterop = {
                geoIDtoLayer,
                geojsonLayer,
                highlightFeature,
                resetHighlight: (layer) => geojsonLayer.resetStyle(layer),
                updateHoverUI,
                clearHoverUI
            };



        })


    // --- Find the min and max values in your dataset ---

    const values = data.map(d => d.Value).filter(v => v != null);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    document.getElementById('minVal').innerHTML = minValue
    document.getElementById('maxVal').innerHTML = maxValue


    // --- Create the color scale ---

    const colorScale = d3.scaleSequential()
        .domain([maxValue, minValue]) 
        .interpolator(d3.interpolateViridis);


    // --- Define style functions ---

    const styleFeature = (feature) => {

        // console.log("* styleFeature");

        const value = feature.properties.Value;

        return {
            fillColor: value != null ? colorScale(value) : '#ccc',  // gray if no data
            weight: 0.35,
            color: 'black',
            fillOpacity: 0.8
        };

    }


    const highlightFeature = (e) => {

        // console.log("* highlightFeature");

        const layer = e.target;
        layer.setStyle({
            weight: 3,
            color: '#000',
            fillOpacity: 0.9
        });
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }

    }

    const resetHighlight = (layer, e) => {

        // console.log("* resetHighlight");

        layer.resetStyle(e.target);

    }

    // --- Create popup content ---

    // add parameters for names

    const createPopupContent = (properties) => {

        // console.log("* createPopupContent");
        // console.log("properties [createPopupContent]", properties);

        if (properties.GeoRank) {
            
            return `
            <div class="popup-content">
            <strong>${properties.Geography}</strong>
            <hr class="my-1">
            <em>${indicator.IndicatorName}</em>: <strong>${properties.Value}</strong> ${metadata[0].DisplayType.toLowerCase()} (${properties.TimePeriod || 'Unknown'})
            <span style="font-size:12px">${properties.Note.length > 1 ? `<hr><em>Note:</em> ${properties.Note}` : ''}</span>
            </div>
        `;

        } else {
            return;
        }
    }

    const updateHoverUI = (props) => {

        // console.log("* updateHoverUI");

        // Update legend text
        document.getElementById('hoveredGeo').textContent = props.Geography || 'Unknown';
        document.getElementById('hoveredValue').textContent = props.Value ?? '—';
        document.getElementById('hoveredUnits').textContent = metadata[0].DisplayType.toLowerCase();
        
        // Show legend tick
        document.getElementById('legend-tick').style.display = 'block';
        
        // Move the legend tick
        const percentage = calculatePercent(props.Value);
        document.querySelector('.viridis-tick').style.left = percentage + '%';

    }

    const clearHoverUI = () => {

        // console.log("* clearHoverUI");
        
        document.getElementById('hoveredGeo').textContent = 'Hover for details';
        document.getElementById('hoveredValue').textContent = '';
        document.getElementById('hoveredUnits').textContent = '';
        document.getElementById('legend-tick').style.display = 'none';

    }

    const calculatePercent = (x) => {
        const range = maxValue - minValue;
        const placement = x - minValue;
        const calculation = 100 * placement / range;
        return calculation;
    }


    // send info for printing
    vizYear = mapTime;
    vizGeography = mapGeoType;
    // vizSource = metadata[0].Sources
    // printSpec = mapspec;
    chartType = 'map'

    // console.log(mapspec)

    // ----------------------------------------------------------------------- //
    // Send chart data to download
    // ----------------------------------------------------------------------- //

    // let dataForDownload = [...mapspec.data.values] // create a copy

    // let downloadTable = aq.from(dataForDownload)
    //     .derive({Indicator: `'${indicatorName}: ${mapMeasurementType}${displayType && ` (${displayType})`}'`}) // add indicator name and type column
    //     .select(aq.not('GeoRank', "end_period", "start_period", "ban_summary_flag", "GeoTypeShortDesc", "MeasureID", "DisplayValue")) // remove excess columns
    
    // console.log("downloadTable [renderMap]");
    // downloadTable.print()

    // CSVforDownload = downloadTable.toCSV()

}