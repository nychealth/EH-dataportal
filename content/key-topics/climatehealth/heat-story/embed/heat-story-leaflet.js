var map = L.map('map').setView([40.715554,-74.0026642],11); // [Lat,Long],Zoom
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

const assignGeoRank = (GeoType) => {
    switch (GeoType) {
        case 'Citywide':
            return 0;
        case 'Borough':
            return 1;
        case 'NYCKIDS2017':
            return 2;
        case 'NYCKIDS2019':
            return 2;
        case 'UHF34':
            return 3;
        case 'UHF42':
            return 4;
        case 'Subboro':
            return 5;
        case 'CD':
            return 6;
        case 'CDTA2020':
            return 7;
        case 'NTA2010':
            return 8;
        case 'NTA2020':
            return 9;
    }
}

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
    //$('[data-toggle="tooltip"]').tooltip();
}

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
          }
        });
      //neighborhoodsLayer.addTo(map);
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

function drawAccordion() {
    const holderAccordion = document.getElementById('story-accordion')
    const stories = config.stories;
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
        holderAccordion.innerHTML += storyCard;
    }

    const storyCards = document.getElementById('story-cards')
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      // we can put an image in the story definition
      const storyCard = `
        <div class="col-4 story-card" id="story-card-${i}">
          <div class="card content-card" style="width: 28rem;">
          <div class="card-content">
            <img src="https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/no-shade-trees/1.jpg" class="card-img-top" alt="...">
            <div class="story-card-button-container">
              <button class="story-card-button" value=${story.id}>Show On Map</button>
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

async function createGeoJsonLayer({ id, name, url, args, displayProperties }) {
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    let colorChrome = null;
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
                //layer.bindPopup("Hello popup", {});
                layer.on('mouseover', function(event) {
                    layerMouseOver = layer;
                    featureMouseOver = feature;
                    layerMouseOver[layer.options._custom_id] = true;
                    updatePopup(event.latlng);
                });
                layer.on('mouseout', function() {
                    if (layer.options._custom_id == layerMouseOver.options._custom_id) {
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
        if (args?.legendDescription) {
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
 * Create a layer based on the measures data from DoH
 */
async function createMeasuresLayer({ id, name, measureInfo, args, displayProperties }) {
    const { indicatorName, measureName, geoType, time } = measureInfo;
    const data = await loadIndicator(indicatorName, measureName, geoType, time);

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
    const updatedDisplayProperties = {...displayProperties, 
      displayPropertyArgs: [{
        "id": "Value",
        "displayName": measureName,
      }]
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
                    layerMouseOver[layer.options._custom_id] = true;
                    updatePopup(event.latlng);
                });
                layer.on('mouseout', function() {
                    if (layer.options._custom_id == layerMouseOver.options._custom_id) {
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

async function createTopoJsonLayer({ id, name, url, args, displayProperties }) {
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    const values = data.features.map(f => f.properties[args.colorFeatureProperty])
        .filter(x => x != null && !isNaN(x));
    const colorChroma = chroma.scale([args?.minColor ?? '#fff', args?.maxColor ?? '#000'])
        .domain([Math.min(...values), Math.max(...values)]);;
    const onStyle = (feature) => {
        const fillColor = args.colorFeatureProperty != null
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
                //layer.bindPopup("Hello popup", {});
                layer.on('mouseover', function(event) {
                    layerMouseOver = layer;
                    featureMouseOver = feature;
                    layerMouseOver[layer.options._custom_id] = true;
                    updatePopup(event.latlng);
                });
                layer.on('mouseout', function() {
                    if (layer.options._custom_id == layerMouseOver.options._custom_id) {
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
        if (args.colorFeatureProperty) {
            const values = layer.getLayers()
                .map(x => x.feature.properties[args.colorFeatureProperty])
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

let layers = {};
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
        default:
            console.log(`Could not create layer of type ${properties.type}`);
    }
    if (layer == null) {
        return null;
    }

    layers[layerId] = layer;
    return layer;
}

async function getOrCreateLayer(layerId) {
    if (!(layerId in layers)) {
        layer = await createLayer(layerId);
    } else {
        layer = layers[layerId];
    }
    return layer;
}

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

function saveCurrentMapState() {
    const { lat, lng } = map.getCenter();
    const zoom = map.getZoom();
    lastMapState.lat = lat;
    lastMapState.lng = lng;
    lastMapState.zoom = zoom;

    var layersVisible = []
    layerGroup.eachLayer(l => layersVisible.push(l.options._custom_id));
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
    layerGroup.eachLayer(l => layersVisible.push(l.options._custom_id));
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

function formatValue(value, type) {
    // FIXME handle NaN
    if (type == null || value == null) return value;

    switch(type) {
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

function featureInfoToHtml(feature, layer) {
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
        .map(x => [displayPropertyArgs[x[0]]?.displayName ?? x[0], formatValue(x[1], displayPropertyArgs[x[0]]?.type)])
        .reduce((m, [k, v]) => {m[k] = v ?? m[k]; return m;}, {});

    // then create that into a table
    const featureTable = Object.entries(featureMap)
        .map(x => `<tr><td>${x[0]}</td><td>${x[1] ?? missingDisplay}</td></tr>`);

    if (!featureTable.length || !featureTable.length) {
        return missingDisplay != null
            ? `<h3>${layer.options.name}</h3>${missingDisplay}`
            : '';
    }
    return `<h3>${layer.options.name}</h3><table>${featureTable.join('')}</table>`;
}

function formatPopup(features) {
    const updates = features
        //.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
        .map(({ feature, layer }) => featureInfoToHtml(feature, layer))
        .filter(x => x != "")
        .join("<br />");
    return updates == "" ? null : updates;
}

function updatePopup({ lat, lng }) {
    const visibleLayers = Object.keys(layerGroup._layers).length;
    if (Object.keys(layerGroup._layers).length == 0
        || featureMouseOver == null) {
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

          // this is our main layer, so we are good
          if (layerMouseOver.options._custom_id == _layer.options._custom_id) {
              return;
          }

          let intersection = [];
          try {
            intersection = leafletPip.pointInLayer({ lat, lng }, _layer);
          } catch(err) {
            console.log(err);
            //intersections 
          }
          if (intersection.length > 0) {
              features.push({feature: intersection[0].feature, layer: _layer});
          }
      });
    }

    const content = formatPopup(features);
    if (popup == null && content != null) {
        popup = L.popup({autoPan: false}).setLatLng({ lat, lng }).setContent(content).openOn(map);
        popupContent = content;
    } else if ( popup != null && content != null) {
        popup.setLatLng({ lat, lng });
        if (content != popupContent) {
            popupContent = content;
            popup.setContent(content);
        }
    } else if (content == null && popup != null) {
        popup.removeFrom(map);
        popup = null;
    }
}

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
            if (layer.options?.legendFunc == null) {
                return;
            }
            const html = layer.options.legendFunc();
            if (html === '') {
                return;
            }
            htmls.push(html);
        })

        if (!htmls.length) {
            return L.DomUtil.create('div', '');
        }

        var div = L.DomUtil.create('div', 'info legend');
        L.DomUtil.addClass(div, 'leaflet-control-layers-expanded');
        const innerHtml = '<fieldset><h4>Legend</h4><table>' + htmls.join('<br />') + '</table></fieldset>';
        div.innerHTML = innerHtml;
        return div;
    }
});

L.control.legend = function (overlays, options) {
    return new L.Control.Legend(overlays, options);
};

function createLegend() {
  // .legend(layerGroup, { label: 'Legend', properties: layers.map(l => l.layerConfig.property) })
  if (legendControl != null) {
      map.removeControl(legendControl);
  }
  legendControl = L.control
      .legend(layerGroup, { label: 'Legend', properties: {} });
  legendControl.addTo(map);
}

async function resetMapState() {
    const { lat, lng, zoom, layers } = lastMapState;
    if ( lat != null && lng != null && zoom != null ) {
        map.flyTo([lat, lng], zoom);
    }

    var layersVisible = []
    layerGroup.eachLayer(l => layersVisible.push(l.options._custom_id));

    layers.filter(l => !(l in layersVisible)).forEach(async l => {
        await addLayerToMap(l);
    });
    // remove
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

    map.on('layeradd', createLegend);
    map.on('layerremove', createLegend);
}

async function loadIndicators() {
  const response = await fetch(data_repo + data_branch + '/indicators/indicators.json');
  indicators = await response.json();
  console.log(indicators);
}

async function loadIndicator(indicatorName, measureName, geoType, time) {
  //const indicator = data[0];
  // indicators have measures. we want to search both
  /*
  const sampleIndicatorName = "Black carbon";
  const sampleMeasureName = "Black carbon, Mean";
  const geoType = 'UHF42';
  const time = 'Summer 2021';
  */
  const indicator = indicators.filter(x => x.IndicatorName == indicatorName)[0];
  const measure = indicator.Measures.filter(x => x.MeasureName == measureName)[0]; 

  const data = await loadData(indicator);
  const filteredData = data.filter(d => d.MeasureID == measure.MeasureID && d.GeoType == geoType && d.Time == time);
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

const loadData = async (indicator) => {
    const response = await fetch(data_repo + data_branch + `/indicators/data/${indicator.IndicatorID}.json`)
    const data = await response.json()
    return data;
}

// ----------------------------------------------------------------------- //
// function to load geographic data
// ----------------------------------------------------------------------- //

const renderMap = (
    data,
    metadata
    ) => {
        let mapGeoType            = data[0].GeoType;
            metadata.AvailableGeographyTypes.filter(
                gt => gt.GeoType === mapGeoType
            )[0].GeoTypeDescription;

        let topoFile = '';

        // ----------------------------------------------------------------------- //
        // set geo file based on geo type
        // ----------------------------------------------------------------------- //

        // console.log("mapGeoType [renderMap]", mapGeoType);

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
        return {url: `${data_repo}${data_branch}/geography/${topoFile}`,}
    }

init();
