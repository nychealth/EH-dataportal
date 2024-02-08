var map = L.map('map').setView([40.715554, -74.0026642], 11); // [Lat, Long], Zoom
var lastMapState = {
    lat: null,
    lng: null,
    zoom: null,
    layers: [ ]
};

// set the popup content separately to handle intersecting layers
var popup = null;
var popupContent = "";
var layerGroup = L.layerGroup();
var storyMarkerLayerGroup = L.layerGroup();
var layerMouseOver = null;
var featureMouseOver = null;
var legendControl = null;
var legendPropertiesByLayer = {};
var layersExclusive = new Set();
var indicators = [];
var mapElement = document.getElementById("wholeMap")

// add this field to the layer options to keep a custom id
const CUSTOM_ID_FIELD = '_custom_id';

// array of (pretty) geotypes in georank order
const geoTypes = [
    "Citywide",
    "Borough",
    "NYCKIDS",
    "UHF34",
    "UHF42",
    "Subboro",
    "CD",
    "CDTA",
    "NTA"
]

L.TopoJSON = L.GeoJSON.extend({
    addData: function (data) {
        var geojson, key;
        if (data.type === "Topology") {
            for (key in data.objects) {
                if (data.objects.hasOwnProperty(key)) {
                    geojson = topojson.feature(data, data.objects[key]);
                    L.GeoJSON.prototype.addData.call(this, geojson);
                }
            }
            return this;
        }
        L.GeoJSON.prototype.addData.call(this, data);
        return this;
    }
});

L.topoJson = function (data, options) {
    return new L.TopoJSON(data, options);
};

function init() {
    addLayerButtons();
    drawAccordion();
    setupMap();
    addListeners();
    createLegend();
    loadIndicators().catch(console.log);
}

function getLayerConfigById(layerId) {
    const layersFromConfig = config.layers;
    return layersFromConfig.find((layer) => layer.property?.id == layerId);
}

/*
 * Setup the map with the base map and the neighborhoods
 */

function setupMap() {
    L.tileLayer(
        'https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=dwIJ8hO2KsTMegUfEpYE',{
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    }).addTo(map);
    
    layerGroup.addTo(map);
    
    const url = window.BaseURL + "geojson/neighborhoods.geojson";
    fetch(url).then(response => {
        if (!response.ok) {
            return null;
        }
        return response.json();
    }).then(data => {
        const neighborhoodsLayer = L.geoJSON(
            data,
            {
                name: "Neighborhood",
                style: { color: 'black', fillOpacity: 0, weight: 1 },
                displayProperties: {
                    displayPropertyArgs: [{
                        "id": "NTAName",
                        "displayName": "Neightborhood"
                    }]
                },
                _custom_id: '__neighborhood',
                sortOrder: 1,
            });
            layerGroup.addLayer(neighborhoodsLayer);
        });
        // add the markers to the story
        const stories = config.stories;
        for (let i = 0; i < stories.length; i++) {
            const story = stories[i];
            if (!story.marker) {
                continue;
            }
            const marker = L.marker([story.marker.lat, story.marker.lng]);
            storyMarkerLayerGroup.addLayer(marker);
        }
        storyMarkerLayerGroup.addTo(map);
    }

var buttonHolderBase = document.getElementById('buttonHolderBase')
var buttonHolderAdditional = document.getElementById('buttonHolderAdditional')
function addLayerButtons() {
    const layers = config.layers;
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const color = layer.property?.args?.color ?? "grey";
        const button = `
            <button type="button" id="${layer.property.id}" class="mb-1 ml-1 layer-button btn btn-sm btn-outline-secondary no-underline">
                <span style="color: ${color};">
                    <i class="fas fa-square mr-1"></i>
                </span>
                ${layer.property.name}
            </button>`
        if (layer.property?.exclusive === true) {
            buttonHolderBase.innerHTML += button;
            layersExclusive.add(layer.property.id);
        } else {
            buttonHolderAdditional.innerHTML += button;
        }
    };
}

/*
 * Draw the layer buttons and accordions
 */
function drawAccordion() {
    const holderAccordion = document.getElementById('story-accordion')
    const stories = config.stories;
    // console.log(config.stories)
    for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        const storyCard = `
            <div class="card">
                <a class="card-header collapse collapsed font-weight-bold accordion-button" id="${story.id}"
                    data-toggle="collapse" href="#panel-acc-button-${i}" role="tab"
                    aria-expanded="false" aria-controls="panel-acc-button-${i}">
                    <span class="title" role="heading" aria-level="3">${story.title}</span>
                </a>
                <div class="collapse" id="panel-acc-button-${i}" role="tabpanel"
                    aria-labelledby="acc-button-01">
                    <div class="card-body">
                        <p>${story.content}</p>
                    </div>
                </div>
            </div>`;
            // holderAccordion.innerHTML += storyCard;
    }

    const storyCards = document.getElementById('story-cards')
    for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        // we can put an image in the story definition
        const storyCard = `
            <div class="col-4 hide story-card" id="story-card-${i}">
                <div class="card content-card" style="width: 28rem;">
                <div class="card-content">
                    <div class="story-card-button-container">
                        <button class="story-card-button btn-sm btn-outline-secondary" value=${story.id}>Show On Map</button>
                    </div>
                    <div class="card-body story-card-content">
                        <h5 class="card-title">${story.title}</h5>
                        <blockquote class="blockquote mb-0">
                        <p class="card-text">${story.content}</p>
                        <footer class="blockquote-footer">Person Name <cite title="Source Title">
                    </blockquote>
                        <footer class="card-footer text-muted"> Washington Heights, Manhattan </div>
                    </div>
                    </div>
            </div>
        `;
        storyCards.innerHTML += storyCard;
    }
}

/*
 * The redlined layer comes from a series of JS files. See the red lined HOLC map for details
 * This function pulls those files and creates a custom layer. It is a categorical layer, so
 * colors are based on category, not a continuous line.
 */
async function createRedlinedLayer({ id, name, urls, args, displayProperties }) {
    const data = {}
    for (const [name, url] of Object.entries(urls)) {
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        let responseText = await response.text(); 
        try {
            // assume the file is in the format var something = {[ json ]}
            // parse using regex
            const groups = /var [\w\d_]+ = (?<json>.*);?/.exec(responseText).groups
            if (groups == null || groups.json == null) {
                console.log(`Could not parse ${name} as valid json. Please check ${url}`);
            }
            data[name] = JSON.parse(groups.json);
        } catch (error) {
            console.log(`Could not parse ${name} as valid json. Please check ${url}`);
        }
    }

    const onStyle = (feature) => {
        const fillColor = args?.colorMap != null
            ? args.colorMap[feature.properties[args.colorFeatureProperty]]
            : args?.defaultColor;

        const colors = ({
            ...(fillColor != null && { fillColor: fillColor }),
            ...(args?.color != null && { color: args.color }),
            ...(args?.opacity != null && { opacity: args.opacity }),
            ...(args?.opacity != null && fillColor != null && { fillOpacity: args.opacity * args.opacity }),
        });
        return {
            ...colors,
        };
    }
    const layer = L.geoJSON(
        Object.values(data),
        {
            style: onStyle,
            onEachFeature: function(feature, layer) {
                layer.on('mouseover', function(event) {
                    layerMouseOver = layer;
                    featureMouseOver = feature;
                    layerMouseOver[layer.options[CUSTOM_ID_FIELD]] = true;
                    updatePopup(event.latlng);
                });
                layer.on('mouseout', function() {
                    if (layer.options[CUSTOM_ID_FIELD] == layerMouseOver.options._custom_id) {
                        layerMouseOver = null;
                        featureMouseOver = null;
                    }
                });
            },
            _custom_id: id,
            displayProperties,
            name,
        });

    const legendFunc = () => {
        if (!args?.colorMap) {
            return '';
        }

        const colorMapEntries = Object.entries(args.colorMap).sort();
        let gradients = [];
        let labels = [];
        // split into even parts
        // see an example https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_images/Using_CSS_gradients#creating_color_bands_stripes
        const percent = 100 / colorMapEntries.length;
        for (let i = 0; i < colorMapEntries.length; i++) {
            const [value, color] = colorMapEntries[i];
            if (i > 0) {
                gradients.push(`${color} ${i * percent}%`);
            }
            gradients.push(`${color} ${(i + 1) * percent}%`);
            labels.push(`<div style="float: left; width: ${percent}%; text-align: center;">${value}</div>`);
        }
        const backgroundCss = `background: linear-gradient(to right, ${gradients.join(', ')});`
        var legend = name + '<span style="'
            + backgroundCss
            + 'height: 20px; width: 100%;'
            + 'display: block; background-repeat: no-repeat;'
            + '"></span>'
            + "<style> .redlined-row:after { content: \"\"; display: table; clear: both; } </style>"
            + '<div class="redlined-row">'
            + labels.join('')
            + '</div>';
        return legend;
    }

    layer.options.legendFunc = legendFunc;
    return layer;
}

/*
 * Create a layer based on the measures data from DoH
 */
async function createMeasuresLayer({ id, name, measureInfo, args, displayProperties }) {
    const { indicatorID, measureID, geoType, time } = measureInfo;
    const data = await loadIndicator(indicatorID, measureID, geoType, time);

    const values = data.features.map(f => f.properties.Value)
        .filter(x => x != null && !isNaN(x));
    const colorChroma = chroma.scale([args?.minColor ?? '#fff', args?.maxColor ?? '#000'])
        .domain([Math.min(...values), Math.max(...values)]);;
    const onStyle = (feature) => {
        const fillColor = colorChroma(feature.properties.Value);

        const colors = ({
            ...(fillColor != null && { fillColor: fillColor }),
            ...(args?.color != null && { color: args.color }),
            ...(args?.opacity != null && { opacity: args.opacity }),
            ...(args?.opacity != null && fillColor != null && { fillOpacity: args.opacity * args.opacity }),
        });
        return {
            ...colors,
        };
    }
    // All metrics have an Id of value. Add that to 
    const updatedDisplayProperties = {...displayProperties, 
        displayPropertyArgs: displayProperties.displayPropertyArgs
            ? displayProperties.displayPropertyArgs.map(x => { return {...x, id: "Value"}})
            : [{ "id": "Value", }]
    };
    const layer = L.geoJSON(
        data,
        {
            style: onStyle,
            onEachFeature: function(feature, layer) {
                //layer.bindPopup("Hello popup", {});
                layer.on('mouseover', function(event) {
                    layerMouseOver = layer;
                    featureMouseOver = feature;
                    layerMouseOver[layer.options[CUSTOM_ID_FIELD]] = true;
                    updatePopup(event.latlng);
                });
                layer.on('mouseout', function() {
                    if (layer.options[CUSTOM_ID_FIELD] == layerMouseOver.options._custom_id) {
                        layerMouseOver = null;
                        featureMouseOver = null;
                    }
                });
            },
            _custom_id: id,
            displayProperties: updatedDisplayProperties,
            name,
        });

    const legendFunc = () => {
        if (!args?.fillColor && !args?.color && !args?.minColor && !args?.maxColor) {
            return '';
        }

        const background = args?.fillColor
            ? `background: ${args.fillColor};`
            : args?.legendColor
            ? `background: ${args.legendColor};`
            : '';
        const borderColor = args?.color ? `border-width: 2px; border-color: ${args?.color}; border-style: solid;` : '';
        const backgroundCss = (args.colorFeatureProperty != null
                && args?.minColor != null && args?.maxColor != null)
            ? `background-image: linear-gradient(to right, ${args.minColor}, ${args?.maxColor});`
            : ('' + background + borderColor);
        var legend = name + '<span style="'
            + backgroundCss
            + 'height: 20px; width: 100%;'
            + 'display: block; background-repeat: no-repeat;'
            + '"></span>'
        if (args.colorFeatureProperty) {
            const values = layer.getLayers()
                .map(x => x.feature.properties.Value)
                .filter(x => x != null && !isNaN(x));
            legend += '<div style="display: block; width: 100%;">'
                + `<div style="float: left;">${Math.min(...values)}</div>`
                + `<div style="float: right;">${Math.max(...values)}</div></div>`;
        }
        if (args.legendDescription) {
            const collapseId = `${id}LegendCollapse`;
            legend += `<br /><div style="display: block; width: 100%; max-width: 250px;"><a data-toggle="collapse" href="#${collapseId}" role="button" aria-expanded="false" aria-controls="${collapseId}">More Info About ${name}</a>`
                + `<div class="collapse" id="${collapseId}">${args.legendDescription}</div></div>`;
        }
        return legend;
    }

    layer.options.legendFunc = legendFunc;
    return layer;
}


/*
 * Create a geojson layer using a url with proper geojson data
 */
async function createGeoJsonLayer({ id, name, url, args, displayProperties }) {
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }
    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        console.log(error);
    }
    let colorChroma = null;
    if (args?.colorFeatureProperty != null) {
      const values = data.features.map(f => f.properties[args.colorFeatureProperty])
          .filter(x => x != null && !isNaN(x));
      colorChroma = chroma.scale([args?.minColor ?? '#fff', args?.maxColor ?? '#000'])
        .domain([Math.min(...values), Math.max(...values)]);;
    }
    const onStyle = (feature) => {
        const fillColor = args?.colorFeatureProperty != null
            ? colorChroma(feature.properties[args.colorFeatureProperty])
            : args?.fillColor;

        const colors = ({
            ...(fillColor != null && { fillColor: fillColor }),
            ...(args?.color != null && { color: args.color }),
            ...(args?.opacity != null && { opacity: args.opacity }),
            ...(args?.opacity != null && fillColor != null && { fillOpacity: args.opacity * args.opacity }),
        });
        return {
            ...colors,
        };
    }
    const layer = L.geoJSON(
        data,
        {
            style: onStyle,
            onEachFeature: function(feature, layer) {
                layer.on('mouseover', function(event) {
                    layerMouseOver = layer;
                    featureMouseOver = feature;
                    layerMouseOver[layer.options[CUSTOM_ID_FIELD]] = true;
                    updatePopup(event.latlng);
                });
                layer.on('mouseout', function() {
                    if (layer.options[CUSTOM_ID_FIELD] == layerMouseOver.options._custom_id) {
                        layerMouseOver = null;
                        featureMouseOver = null;
                    }
                });
            },
            _custom_id: id,
            displayProperties,
            name,
        });

    const legendFunc = () => {
        if (!args?.fillColor && !args?.color && !args?.minColor && !args?.maxColor) {
            return '';
        }

        const background = args?.fillColor
            ? `background: ${args.fillColor};`
            : args?.legendColor
            ? `background: ${args.legendColor};`
            : '';
        const borderColor = args?.color ? `border-width: 2px; border-color: ${args?.color}; border-style: solid;` : '';
        const backgroundCss = (args.colorFeatureProperty != null
                && args?.minColor != null && args?.maxColor != null)
            ? `background-image: linear-gradient(to right, ${args.minColor}, ${args?.maxColor});`
            : ('' + background + borderColor);
        var legend = name + '<span style="'
            + backgroundCss
            + 'height: 20px; width: 100%;'
            + 'display: block; background-repeat: no-repeat;'
            + '"></span>'
        if (args?.colorFeatureProperty) {
            const values = layer.getLayers()
                .map(x => x.feature.properties[args.colorFeatureProperty])
                .filter(x => x != null && !isNaN(x));
            legend += '<div style="display: block; width: 100%;">'
                + `<div style="float: left;">${Math.min(...values)}</div>`
                + `<div style="float: right;">${Math.max(...values)}</div></div>`;
        }
        return legend;
    }

    layer.options.legendFunc = legendFunc;
    return layer;
}

/*
 * Create a layer based on the measures data from DoH
 */
async function createMeasuresLayer({ id, name, measureInfo, args, displayProperties }) {
    const { indicatorID, measureID, geoType, time } = measureInfo;
    const data = await loadIndicator(indicatorID, measureID, geoType, time);

    const values = data.features.map(f => f.properties.Value)
        .filter(x => x != null && !isNaN(x));
    const colorChroma = chroma.scale([args?.minColor ?? '#fff', args?.maxColor ?? '#000'])
        .domain([Math.min(...values), Math.max(...values)]);;
    const onStyle = (feature) => {
        const fillColor = colorChroma(feature.properties.Value);

        const colors = ({
            ...(fillColor != null && { fillColor: fillColor }),
            ...(args?.color != null && { color: args.color }),
            ...(args?.opacity != null && { opacity: args.opacity }),
            ...(args?.opacity != null && fillColor != null && { fillOpacity: args.opacity * args.opacity }),
        });
        return {
            ...colors,
        };
    }
    // All metrics have an Id of value. Add that to 
    const updatedDisplayProperties = {...displayProperties, 
        displayPropertyArgs: displayProperties.displayPropertyArgs
            ? displayProperties.displayPropertyArgs.map(x => { return {...x, id: "Value"}})
            : [{ "id": "Value", }]
    };
    const layer = L.geoJSON(
        data,
        {
            style: onStyle,
            onEachFeature: function(feature, layer) {
                layer.on('mouseover', function(event) {
                    layerMouseOver = layer;
                    featureMouseOver = feature;
                    layerMouseOver[layer.options[CUSTOM_ID_FIELD]] = true;
                    updatePopup(event.latlng);
                });
                layer.on('mouseout', function() {
                    if (layer.options[CUSTOM_ID_FIELD] == layerMouseOver.options._custom_id) {
                        layerMouseOver = null;
                        featureMouseOver = null;
                    }
                });
            },
            _custom_id: id,
            displayProperties: updatedDisplayProperties,
            name,
        });

    const legendFunc = () => {
        if (!args?.fillColor && !args?.color && !args?.minColor && !args?.maxColor) {
            return '';
        }

        const background = args?.fillColor
            ? `background: ${args.fillColor};`
            : args?.legendColor
            ? `background: ${args.legendColor};`
            : '';
        const borderColor = args?.color ? `border-width: 2px; border-color: ${args?.color}; border-style: solid;` : '';
        const backgroundCss = (args.colorFeatureProperty != null
                && args?.minColor != null && args?.maxColor != null)
            ? `background-image: linear-gradient(to right, ${args.minColor}, ${args?.maxColor});`
            : ('' + background + borderColor);
        var legend = name + '<span style="'
            + backgroundCss
            + 'height: 20px; width: 100%;'
            + 'display: block; background-repeat: no-repeat;'
            + '"></span>'
        if (args.colorFeatureProperty) {
            const values = layer.getLayers()
                .map(x => x.feature.properties.Value)
                .filter(x => x != null && !isNaN(x));
            legend += '<div style="display: block; width: 100%;">'
                + `<div style="float: left;">${Math.min(...values)}</div>`
                + `<div style="float: right;">${Math.max(...values)}</div></div>`;
        }
        return legend;
    }

    layer.options.legendFunc = legendFunc;
    return layer;
}

/*
 * Create a layer from geotiff file using a 3rd party library.
 * Geotiff files are images. This is good for heatmap and continuous data.
 */
async function createGeotiffLayer({ id, url, args, name }) {
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    data = await parseGeoraster(arrayBuffer);

    const colorStart = args?.colorStart || '#0f0';
    const colorStop = args?.colorStop || '#f00';
    const colorChroma = chroma.scale([colorStart, colorStop]).domain([data.mins[0], data.maxs[0]]);
    const legendFunc = () => {
        const colorStart = args?.colorStart || '#0f0';
        const colorStop = args?.colorStop || '#f00';
        const legend = name + '<span style="'
            + `background-image: linear-gradient(to right, ${colorStart}, ${colorStop});`
            + 'height: 20px; width: 100%;'
            + 'display: block; background-repeat: no-repeat;'
            + '"></span>'
            + '<div style="display: block; width: 100%;">'
            + ((data.mins && data.mins[0]) ? `<div style="float: left">${data.mins[0].toFixed(1)}</div>` : '')
            + ((data.maxs && data.maxs[0]) ? `<div style="float: right">${data.maxs[0].toFixed(1)}</div>` : '')
            + '</div>';
        return legend;
    }
    const layer = new GeoRasterLayer({
          georaster: data,
          opacity: 0.7,
          resolution: args?.resolution || 64,
          pixelValuesToColorFn: values => {
              return values[0] > 0.0001 ? colorChroma(values[0]) : null;
          },
          legendFunc,
          _custom_id: id,
      });
    return layer;
}


let layers = {};
/*
 * Create a layer using the layer configs.
 * The layers are created by type using all their arguments.
 */
async function createLayer(layerId) {
    const layerConfig = config.layers.find(l => l.property.id == layerId);
    if (layerConfig == null) {
        console.log(`Could not find layer ${layerId} in config`);
        return;
    }

    const properties = layerConfig.property;
    let layer = null;
    switch (properties.type) {
        case 'geojson':
            layer = await createGeoJsonLayer(properties);
            break;
        case 'measureData':
            layer = await createMeasuresLayer(properties);
            break;
        case 'raster':
            layer = await createGeotiffLayer(properties);
            break;
        case 'redlined':
            layer = await createRedlinedLayer(properties);
            break;
        default:
            console.log(`Could not create layer of type ${properties.type}`);
    }
    if (layer == null) {
        return null;
    }

    layers[layerId] = layer;
    return layer;
}

/*
 * Get a layer from the layer cache. If it does not exist, create it.
 */
async function getOrCreateLayer(layerId) {
    let layer;
    if (!(layerId in layers)) {
        layer = await createLayer(layerId);
    } else {
        layer = layers[layerId];
    }
    return layer;
}

/*
 * Add a layer to the map. If it does not exist in the cache, create it.
 * If the layer is already on the map, ignore it.
 */
async function addLayerToMap(layerId) {
    const layer = await getOrCreateLayer(layerId);
    if (layer != null && !map.hasLayer(layer)) {
        layerGroup.addLayer(layer);

        // only one active one at a time
        if ( layersExclusive.has(layerId) ) {
            for (_layerId in layersVisible) {
                // this only applies to exclusive layers
                if (!layersExclusive.has(_layerId)) {
                    continue;
                }
                const isVisible = layersVisible[_layerId];
                if ( isVisible === true && _layerId !== layerId ) {
                    removeLayerFromMap(_layerId);
                }
            }
        }

        layersVisible[layerId] = true;
        const button = document.querySelector(`#${layerId}`)
        if (button != null) {
            button.classList.add("active");
        }
    }
}

/*
 * Remove layer from the map. Update the layer button
 */
function removeLayerFromMap(layerId) {
    if (layerId in layers) {
        const layer = layers[layerId];
        layerGroup.removeLayer(layer);
        delete layersVisible[layerId];
        const button = document.querySelector(`#${layerId}`)
        if (button != null) {
            button.classList.remove("active");
        }
    }
}

let layersVisible = {};
/*
 * If a layer is on the map, take it off. If it is not on the map, add it.
 */
async function toggleLayerOnMap(layerId, button) {
    // FIXME disable while waiting
    try {
        button.disabled = true;
        if (!(layerId in layersVisible)) {
            // FIXME make this a set
            await addLayerToMap(layerId);
        } else {
            removeLayerFromMap(layerId);
        }
    } catch (error) {
    } finally {
        button.disabled = false;
    }
}

/*
 * Keep track of the current map state.
 * Stores the lat, lng, zoom and visible layers
 */
function saveCurrentMapState() {
    const { lat, lng } = map.getCenter();
    const zoom = map.getZoom();
    lastMapState.lat = lat;
    lastMapState.lng = lng;
    lastMapState.zoom = zoom;

    var layersVisible = []
    layerGroup.eachLayer(l => layersVisible.push(l.options[CUSTOM_ID_FIELD]));
    lastMapState.layers = layersVisible.filter(x => x);
}

/**
 * Update the map state to show a story.
 * @param {*} storyId 
 * @returns 
 */
async function updateMapStateForStory(storyId) {
    const storyConfig = config.stories.find(s => s.id == storyId);
    if (storyConfig == null) {
        console.log(`Could not find story ${storyId} in config`);
        return;
    }

    const mapState = storyConfig.mapState;
    const { lat, lng, zoom } = mapState;
    if ( lat != null && lng != null && zoom != null ) {
        saveCurrentMapState();
        map.flyTo([lat, lng], zoom);
    }

    const layers = mapState.layers;

    var layersVisible = []
    layerGroup.eachLayer(l => layersVisible.push(l.options[CUSTOM_ID_FIELD]));
    // add the layers that are not in the visible layer
    layers.filter(l => !(l in layersVisible)).forEach(async l => {
        await addLayerToMap(l);
    });
    // remove
    layersVisible.filter(l => !(l in layers)).forEach(async l => {
        removeLayerFromMap(l)
    });

    // clear out the layer markers
    map.removeLayer(storyMarkerLayerGroup);
    $("#refreshButton").css("visibility", "visible");
}

/*
 * Format the value based on a type.
 * Types can be
 *    float       - float with two decimal places
 *    percentage  - two decimal places with a percentage sign
 *    currency    - only USD, includes $xxx.xx
 */
function formatValue(value, type) {
    // FIXME handle NaN
    if (type == null || value == null) return value;

    switch(type) {
    case 'float':
        return `${(value * 100).toFixed(2)}`;
    case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
    case 'currency':
        // code block
        return value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        });
    default:
        return value;
    }
}

/*
 * Create the HTML to display in the tooltip.
 * The html is based on displayProperties and displayPropertyArgs
 * from the config that then get put into the layer.
 */
function featureInfoToHtmlForPopup(feature, layer) {
    const displayProperties = layer.options.displayProperties;
    if (displayProperties == null || displayProperties?.displayPropertyArgs == null) {
        return '';
    }

    // convert our list of arguments in the format of { id, value } to { id: { id, value } }
    const displayPropertyArgs = displayProperties?.displayPropertyArgs?.reduce((m, x) => {
        m[x.id] = x;
        return m;
    }, {});

    const missingDisplay = displayProperties.missingDisplay || '';

    // create a map of unique keys to values
    const featureMap = Object.entries(feature.properties)
        .filter(x => x[0] in displayPropertyArgs)
        .map(x => [displayPropertyArgs[x[0]]?.displayName ?? x[0], formatValue(x[1], displayPropertyArgs[x[0]]?.format)])
        .reduce((m, [k, v]) => {m[k] = v ?? m[k]; return m;}, {});

    // then create that into an html table
    const featureTable = Object.entries(featureMap)
        .map(x => `<tr><td>${x[0]}</td><td>${x[1] ?? missingDisplay}</td></tr>`);

    if (!featureTable.length || !featureTable.length) {
        return missingDisplay != null
            ? `<h3>${layer.options.name}</h3>${missingDisplay}`
            : '';
    }
    return `<h3>${layer.options.name}</h3><table class="popup-table">${featureTable.join('')}</table>`;
}

/*
 * Format the popup (tooltip)
 * Iterate over each feature in the popup and turn it into html
 */
function formatPopup(features) {
    const updates = features
        .sort((a, b) => (a?.layer?.options?.sortOrder ?? 999) - (b?.layer?.options?.sortOrder ?? 999))
        .map(({ feature, layer }) => featureInfoToHtmlForPopup(feature, layer))
        .filter(x => x != "")
        .join("<br />");
    return updates == "" ? null : updates;
}

/*
 * Update the popup (or tooltip)
 * This function looks at the visible layers in the layer group,
 * grabs the data for each layer, foramts the data, then displays it.
 *
 * The point-in-polygon algorithm is used to find overlapping layers.
 * This functionality is not native to leaflet, so we used a third party library.
 */
function updatePopup({ lat, lng }) {
    const visibleLayers = Object.keys(layerGroup._layers).length;

    // if there are no layers, then we don't need a popup
    if (Object.keys(layerGroup._layers).length == 0 || featureMouseOver == null) {
        if (popup != null) {
            popup.removeFrom(map);
            popup = null;
        }
        popupContent = null;
        return;
    }

    var features = [{ feature: featureMouseOver, layer: layerMouseOver }];
    if (visibleLayers > 1) {
        // check intersections
        layerGroup.eachLayer(_layer => {
            // only check intersections if we are going to display something
            if (_layer.options.displayProperties == null) {
                return;
            }

            // this is our main layer. we know we overlap here because we are in this function, so ignore it.
            if (layerMouseOver.options[CUSTOM_ID_FIELD] == _layer.options._custom_id) {
                return;
            }

            let intersection = [];
            try {
                intersection = leafletPip.pointInLayer({ lat, lng }, _layer);
            } catch(err) {
                console.log(err);
            }

            // keep track of the intersections
            if (intersection.length > 0) {
                features.push({feature: intersection[0].feature, layer: _layer});
            }
        });
    }

    const content = formatPopup(features);
    // new popup
    if (popup == null && content != null) {
        popup = L.popup({autoPan: false}).setLatLng({ lat, lng }).setContent(content).openOn(map);
        popupContent = content;
    // change the content of an existing popup
    } else if ( popup != null && content != null) {
        popup.setLatLng({ lat, lng });
        if (content != popupContent) {
            popupContent = content;
            popup.setContent(content);
        }
    // popup should be removed
    } else if (content == null && popup != null) {
        popup.removeFrom(map);
        popup = null;
    }
}

/*
 * Create a custom legend control for leaflet.
 * This example can be found in the docs.
 */
L.Control.Legend = L.Control.extend({
    options: {
        collapsed: false,
        position: 'bottomright',
        label: null,
    },
    initialize: function (layerGroup, options) {
        L.Util.setOptions(this, options);
    },
    onAdd: function (map) {
        const htmls = [];
        layerGroup.eachLayer(layer => {
            const layerEventHash = this.options?.properties?.layerEventHash;
            // the layer may exist on the map if we remove it (async code, in the process of removing)
            // check the last layer hash to see if this layer shouldn't be in the legend
            if (layerEventHash?.type == 'layerremove' && layerEventHash?.id == layer.options[CUSTOM_ID_FIELD]) {
                return;
            }

            if (layer.options?.legendFunc == null) {
                return;
            }
            const html = layer.options.legendFunc();
            if (html === '') {
                return;
            }
            htmls.push(html);
        });

        if (!htmls.length) {
            return L.DomUtil.create('div', '');
        }

        var div = L.DomUtil.create('div', 'info legend');
        L.DomUtil.addClass(div, 'leaflet-control-layers-expanded');
        const innerHtml = '<fieldset><h6></h6><table>' + htmls.join('<br />') + '</table></fieldset>';
        div.innerHTML = innerHtml;
        return div;
    }
});

L.control.legend = function (overlays, options) {
    return new L.Control.Legend(overlays, options);
};

// layer events happen waaay too often.
// keep track of the last one to skip if a duplicate.
// the duplicate happens because each layer has multiple little sub layers
let lastLayerEventHash = {id: null, type: null};

/*
 * Create the legend. The legend comes from the legendDescription
 * and gets added below the map in a separate div
 */
function createLegend(layerEvent) {
    const layerEventHash = {
        id: layerEvent?.layer?.options[CUSTOM_ID_FIELD],
        type: layerEvent?.type
    };

    // compare to prior event to see if we need to continue making the legend
    if (layerEventHash.id == lastLayerEventHash.id && layerEventHash.type == lastLayerEventHash.type) {
        return;
    }

    let legendDescriptions = [];
    layerGroup.eachLayer(_layer => {
        const config = getLayerConfigById(_layer.options[CUSTOM_ID_FIELD]);
        if (config == null || config?.property?.args?.legendDescription == null) {
            return;
        }
        // layers get added and removed for all their sub-layers, which means we may still see the layer in this
        // function while removing it. this line makes sure that layer does not make a legend
        if (layerEvent.type == 'layerremove' && _layer.options[CUSTOM_ID_FIELD] == layerEvent?.layer?.options[CUSTOM_ID_FIELD]) {
            return;
        }
        legendDescriptions.push(config?.property?.args?.legendDescription);
    });

    // combine descriptions and add to the div
    const legendDescriptionsDiv = document.getElementById("legendDescriptions");
    legendDescriptionsDiv.innerHTML = legendDescriptions.join('<br />');
    if (legendControl != null) {
        map.removeControl(legendControl);
    }
    legendControl = L.control
        .legend(layerGroup, { label: 'Legend', properties: { layerEventHash } });
    legendControl.addTo(map);

    lastLayerEventHash = layerEventHash;
}

/*
 * Reset the map config based on the last known map state.
 */
async function resetMapState() {
    const { lat, lng, zoom, layers } = lastMapState;
    if ( lat != null && lng != null && zoom != null ) {
        map.flyTo([lat, lng], zoom);
    }

    var layersVisible = []
    layerGroup.eachLayer(l => layersVisible.push(l.options[CUSTOM_ID_FIELD]));

    // find the difference between what is visible now and what should be visible.
    // add and remove accordingly
    layers.filter(l => !(l in layersVisible)).forEach(async l => {
        await addLayerToMap(l);
    });
    layersVisible.filter(l => !(l in layers)).forEach(async l => {
        removeLayerFromMap(l)
    });

    lastMapState = {
        lat: null,
        lng: null,
        zoom: null,
        layers: [ ]
    };

    map.addLayer(storyMarkerLayerGroup);
    $("#refreshButton").css("visibility", "hidden");
}

/*
 * Add listeners to all our various buttons.
 * The listeners add / remove layers.
 * This function also adds the layeradd hooks for creating the legend.
 *
 */
function addListeners() {
    const layerButtons = document.querySelectorAll('.layer-button')
    layerButtons.forEach(button => {
        button.addEventListener('click', async () => {
            await toggleLayerOnMap(button.id, button)
        });
    });

    const accordions = document.querySelectorAll('.accordion-button')
    accordions.forEach(a => {
        a.addEventListener('click', async () => {
            if (a.classList.contains("collapsed")) {
                await updateMapStateForStory(a.id);
            } else {
                await resetMapState();
            }
        });
    });

    // this is where we'd add behavior to update the main card with each story's card content.
    const storyCards = document.querySelectorAll('.story-card-button')
    storyCards.forEach(s => {
        s.addEventListener('click', async () => {
            mapElement.scrollIntoView({ behavior: "smooth" });
            await updateMapStateForStory(s.value);
        });
    });

    map.addEventListener('mousemove', (event) => {
        updatePopup(event.latlng);
    });

    document.querySelector('#refreshButton').addEventListener('click', async () => {
        await resetMapState();
    });

    // FIXME this gets called a lot. can we have it called less? or at least do less
    map.on('layeradd', createLegend);
    map.on('layerremove', createLegend);
}

/*
 * Load all the indicators from indicator.json
 * Save these for later use.
 */
async function loadIndicators() {
    const response = await fetch(data_repo + data_branch + '/indicators/indicators.json');
    indicators = await response.json();
    console.log(indicators);
}

/*
 * Load a particular indicator given the indicatorID, measureID, geoType and time
 */
async function loadIndicator(indicatorID, measureID, geoType, time) {
    // indicators have measures. we want to search both
    /*
    const sampleIndicatorID = 2024; // Black carbon
    const sampleMeasureID = 370; // Black carbon, Mean
    const geoType = 'UHF42';
    const time = 'Summer 2021';
    */
    const indicator = indicators.filter(x => x.IndicatorID == indicatorID)[0];
    if (indicator == null) {
        console.log(`ERROR: No indicator found with indicatorID ${indicatorID}`);
    }
    const measure = indicator.Measures.filter(x => x.MeasureID == measureID)[0]; 
    if (measure == null) {
        console.log(`ERROR: No data found with indicatorID ${indicatorID}, measureID ${measureID}. Missing measure.`);
    }
    
    const data = await loadData(indicator);
    const filteredData = data.filter(d => d.MeasureID == measure.MeasureID && d.GeoType == geoType && d.Time == time);
    if (filteredData == null) {
        console.log(`ERROR: No data found with indicator ${indicatorID}, measureID ${indicatorID}, GeoType ${geoType}, time ${time}`);
    }
    
    // the below is taken from other parts of the code.
    // this grabs all the data and joins the geodata to the features to create geojson
    const filteredDataMap = filteredData.reduce((x, y) => {x[y.GeoID] = y; return x}, {})
    const renderedMap = renderMap(filteredData, measure);
    const responseTopo = await fetch(renderedMap.url);
    const topoData = await responseTopo.json();
    const geoJsonData = topojson.feature(topoData, topoData.objects.collection)
    
    geoJsonData.features = geoJsonData.features.map(feature => {
        const properties = {...feature.properties, ...(filteredDataMap[feature.properties.GEOCODE] ?? {})};
        return {...feature, properties};
    });
    
    return geoJsonData;
}

/*
 * Load one indicator by ID
 */
const loadData = async (indicator) => {
    const response = await fetch(data_repo + data_branch + `/indicators/data/${indicator.IndicatorID}.json`)
    const data = await response.json()
    return data;
}

/*
 * function to load geographic data
 */
const renderMap = ( data, metadata ) => {
    let mapGeoType = data[0].GeoType;
        metadata.AvailableGeographyTypes.filter(
            gt => gt.GeoType === mapGeoType
        )[0].GeoTypeDescription;

    let topoFile = '';

    // set geo file based on geo type
    if (mapGeoType === "NTA2010") {
        topoFile = 'NTA_2010.topo.json';
    } else if (mapGeoType === "NTA2020") {
        topoFile = 'NTA_2020.topo.json';
    } else if (mapGeoType === "CD") {
        topoFile = 'CD.topo.json';
    } else if (mapGeoType === "CDTA2020") {
        topoFile = 'CDTA_2020.topo.json';
    } else if (mapGeoType === "PUMA") {
        topoFile = 'PUMA_or_Subborough.topo.json';
    } else if (mapGeoType === "Subboro") {
        topoFile = 'PUMA_or_Subborough.topo.json';
    } else if (mapGeoType === "UHF42") {
        topoFile = 'UHF42.topo.json';
    } else if (mapGeoType === "UHF34") {
        topoFile = 'UHF34.topo.json';
    } else if (mapGeoType === "NYCKIDS2017") {
        topoFile = 'NYCKids_2017.topo.json';
    } else if (mapGeoType === "NYCKIDS2019") {
        topoFile = 'NYCKids_2019.topo.json';
    } else if (mapGeoType === "Borough") {
        topoFile = 'borough.topo.json';
    }
    return {url: `${data_repo}${data_branch}/geography/${topoFile}`}
}

init();
